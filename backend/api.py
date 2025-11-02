#!/usr/bin/env python3
"""
FastAPI Backend for Router/Switch/Server Detection
Extracted from Streamlit app - all functionality preserved
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import cv2
import numpy as np
from PIL import Image
import os
from pathlib import Path
from dotenv import load_dotenv
import io
import base64
import requests
from requests.exceptions import Timeout, RequestException
from bs4 import BeautifulSoup
import urllib.parse
import time
import pandas as pd
from datetime import datetime
import json
import secrets
import hashlib
from fastapi import Header, Depends, Security
from fastapi.security import APIKeyHeader
import logging
from logging.handlers import RotatingFileHandler

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('aicr.log', maxBytes=10485760, backupCount=5),  # 10MB per file, 5 backups
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables - prioritize Railway/system env vars over .env file
# Get the backend directory path
backend_dir = Path(__file__).resolve().parent
# Get the project root (parent of backend)
project_root = backend_dir.parent

# First, load system environment variables (Railway sets these directly)
# Then load .env file if it exists (for local development only)
# Railway variables take precedence
env_path = project_root / '.env'
if env_path.exists():
    load_dotenv(env_path, override=False)  # Don't override existing env vars (Railway vars)
else:
    load_dotenv()  # Try default locations, but don't override system vars

app = FastAPI(title="Device Detection API", version="1.0.0")

# CORS middleware - secure configuration
allowed_origins_str = os.getenv('ALLOWED_ORIGINS', '*')
if allowed_origins_str == '*' and os.getenv('RAILWAY_ENVIRONMENT'):
    # Production default: allow common frontend origins
    allowed_origins = ["*"]  # Keep permissive for Railway, restrict in production
else:
    allowed_origins = [origin.strip() for origin in allowed_origins_str.split(',') if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global variables for model caching
yolo_model = None
openai_client = None


# Pydantic models
class APIKeyRequest(BaseModel):
    api_key: str


class DetectionResponse(BaseModel):
    success: bool
    devices: List[dict]
    ocr_data: Optional[dict]
    message: Optional[str]


class SystemStatus(BaseModel):
    has_yolo_model: bool
    has_openai: bool
    detection_mode: Optional[str]


# ===== HELPER FUNCTIONS (Extracted from app.py) =====

def load_yolo_model(model_path: Optional[str] = None):
    """Load YOLO model from persisted location.

    Priority order:
    1) project_root/models/best.pt
    2) backend_dir/models/best.pt (legacy)
    3) provided model_path if explicitly passed
    """
    global yolo_model
    if yolo_model is not None:
        return yolo_model

    try:
        from ultralytics import YOLO

        # Compute default locations
        project_models = project_root / 'models' / 'best.pt'
        backend_models = backend_dir / 'models' / 'best.pt'

        # Resolve model path
        resolved_path = None
        if project_models.exists():
            resolved_path = str(project_models)
        elif backend_models.exists():
            resolved_path = str(backend_models)
        elif model_path is not None:
            resolved_path = model_path

        if not resolved_path:
            print("Could not find YOLO model at expected locations.")
            yolo_model = None
            return yolo_model

        yolo_model = YOLO(resolved_path)
    except Exception as e:
        print(f"Could not load YOLO model: {e}")
        yolo_model = None

    return yolo_model


def save_uploaded_model(file_bytes: bytes, filename: str = "best.pt"):
    """Save uploaded YOLO model into models/ directory and reset cached model"""
    global yolo_model
    models_dir = project_root / 'models'
    models_dir.mkdir(parents=True, exist_ok=True)
    target_path = models_dir / filename
    try:
        with open(target_path, 'wb') as f:
            f.write(file_bytes)
        # Reset cached model so next prediction reloads the new weights
        yolo_model = None
        return str(target_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save model: {str(e)}")


def save_api_key_to_env(api_key: str):
    """Persist OPENAI_API_KEY to current process env (works in Railway via env vars)"""
    try:
        # Update current environment for this process
        # In Railway, this will use the environment variable set in the Railway dashboard
        os.environ['OPENAI_API_KEY'] = api_key
        
        # Only write to .env file in local development (not in Railway)
        if not os.getenv('RAILWAY_ENVIRONMENT'):
            env_file = project_root / '.env'
            lines = []
            if env_file.exists():
                with open(env_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()

            key_written = False
            new_lines = []
            for line in lines:
                if line.strip().startswith('OPENAI_API_KEY='):
                    new_lines.append(f"OPENAI_API_KEY={api_key}\n")
                    key_written = True
                else:
                    new_lines.append(line)

            if not key_written:
                new_lines.append(f"OPENAI_API_KEY={api_key}\n")

            with open(env_file, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            return str(env_file)
        else:
            return "Environment variable (Railway)"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save API key: {str(e)}")


def get_openai_client(api_key=None):
    """Initialize OpenAI client with complete isolation"""
    # Try to get API key from parameter first, then from environment
    if not api_key:
        # Always read fresh from system environment variables (Railway)
        api_key = os.environ.get('OPENAI_API_KEY')  # Use environ.get() for fresh reads
        
        # If not found in system env, try loading from .env file (local dev only)
        if not api_key:
            from pathlib import Path
            if os.path.exists('.env'):
                load_dotenv('.env', override=False)  # Don't override system vars
            elif os.path.exists('../.env'):
                load_dotenv('../.env', override=False)
            api_key = os.environ.get('OPENAI_API_KEY')

    if not api_key or api_key == 'your_openai_api_key_here':
        return None

    try:
        import requests

        class SimpleOpenAIClient:
            def __init__(self, api_key):
                self.api_key = api_key
                self.base_url = "https://api.openai.com/v1"
                self.headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                self.chat = ChatCompletions(self)
                # Configurable timeout (default 120 seconds for vision API)
                self.default_timeout = int(os.getenv('OPENAI_TIMEOUT', '120'))

            def chat_completions_create(self, model, messages, max_tokens=100, temperature=None, timeout=None):
                url = f"{self.base_url}/chat/completions"
                data = {
                    "model": model,
                    "messages": messages,
                    "max_tokens": max_tokens
                }

                if temperature is not None:
                    data["temperature"] = temperature

                # Use provided timeout or default (120 seconds for vision API requests)
                request_timeout = timeout if timeout is not None else self.default_timeout
                
                # Make request - exceptions will propagate to caller for retry handling
                response = requests.post(url, headers=self.headers, json=data, timeout=request_timeout)

                if response.status_code != 200:
                    raise Exception(f"API Error {response.status_code}: {response.text}")

                result = response.json()

                class MockChoice:
                    def __init__(self, message_content):
                        self.message = MockMessage(message_content)

                class MockMessage:
                    def __init__(self, content):
                        self.content = content

                class MockResponse:
                    def __init__(self, choices):
                        self.choices = choices

                return MockResponse([MockChoice(result['choices'][0]['message']['content'])])

        class ChatCompletions:
            def __init__(self, client):
                self.client = client
                self.completions = Completions(self.client)

            def create(self, model, messages, max_tokens=100, temperature=None):
                return self.client.chat_completions_create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )

        class Completions:
            def __init__(self, client):
                self.client = client

            def create(self, model, messages, max_tokens=100, temperature=None):
                return self.client.chat_completions_create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )

        client = SimpleOpenAIClient(api_key)

        # Test the client
        try:
            test_response = client.chat_completions_create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=5
            )
            return client
        except Exception as e:
            print(f"Client test failed: {e}")
            return None

    except Exception as e:
        print(f"Error creating SimpleOpenAIClient: {str(e)}")
        return None


def encode_image_to_base64(image):
    """Convert PIL Image to base64 string"""
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return img_str


def detect_with_openai_vision(client, image):
    """Use OpenAI Vision API to detect and identify network devices with retry logic"""
    img_base64 = encode_image_to_base64(image)
    logger.info(f"Making OpenAI Vision API request (image size: {len(img_base64)} chars)")

    prompt = """Analyze this image and identify ALL network equipment and servers you can see (routers, switches, access points, firewalls, servers, blade servers, rack servers, etc.).

CRITICAL INSTRUCTIONS:
1. READ ALL TEXT LABELS on the device - look for brand names, model numbers, serial numbers printed on stickers or the device body
2. COUNT the actual physical ports/connections visible on the device:
   - RJ45 Ethernet ports (rectangular connectors)
   - SFP/SFP+ ports (small square connectors)
   - Console/management ports
   - Power ports
   - Any other connection interfaces

For EACH device detected, provide:
1. Device type (router/switch/access point/firewall/server/blade server/rack server/etc.)
2. Brand - READ the text label on the device (Cisco, MikroTik, TP-Link, Ubiquiti, Netgear, Dell, HP, IBM, Lenovo, Supermicro, etc.)
3. Model number - READ the exact model number from labels/stickers on the device
4. Serial number - READ if visible on any label or sticker
5. Port count (COUNT the actual visible ports - e.g., "24 ports", "48 ports", "8 ports")
6. Confidence level (High/Medium/Low)
7. Text visible on device - quote ANY text you can read from labels, stickers, or printing on the device
8. Key identifying features (including port types like "24x RJ45 + 2x SFP")
9. Brief description (2-3 sentences) including typical use cases

Format your response for EACH device as:
===DEVICE_START===
DEVICE_TYPE: [type]
BRAND: [brand from label]
MODEL: [model number from label]
SERIAL: [serial number if visible]
PORT_COUNT: [actual count of visible ports]
CONFIDENCE: [High/Medium/Low]
TEXT_ON_DEVICE: [all readable text from labels/stickers]
FEATURES: [visible features including port details]
DESCRIPTION: [description]
===DEVICE_END===

If multiple devices are present, list them all with the above format.
If no network device is visible, state "NO_DEVICE_DETECTED"."""

    # Retry logic for timeout and transient errors
    max_retries = int(os.getenv('OPENAI_MAX_RETRIES', '3'))
    retry_delay = 1  # Start with 1 second delay
    response = None
    
    for attempt in range(max_retries):
        try:
            logger.info(f"OpenAI Vision API request attempt {attempt + 1}/{max_retries}")
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{img_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1500
            )
            break  # Success, exit retry loop
        except (Timeout, requests.exceptions.Timeout) as e:
            if attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                logger.warning(f"OpenAI API timeout on attempt {attempt + 1}, retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            else:
                logger.error(f"OpenAI Vision API timeout after {max_retries} attempts")
                raise HTTPException(
                    status_code=504,
                    detail=f"OpenAI API request timed out after {max_retries} attempts. The image may be too large or the service is slow. Please try again with a smaller image."
                )
        except (RequestException, requests.exceptions.RequestException) as e:
            if attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)
                logger.warning(f"OpenAI API error on attempt {attempt + 1}: {str(e)}, retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            else:
                logger.error(f"OpenAI Vision API error after {max_retries} attempts: {str(e)}")
                raise HTTPException(
                    status_code=503,
                    detail=f"OpenAI Vision API error: {str(e)}"
                )
        except HTTPException:
            # Re-raise HTTPExceptions immediately (they're already properly formatted)
            raise
        except Exception as e:
            # Check if it's a timeout-related error in the message
            error_str = str(e).lower()
            if 'timeout' in error_str or 'timed out' in error_str:
                if attempt < max_retries - 1:
                    wait_time = retry_delay * (2 ** attempt)
                    logger.warning(f"OpenAI API timeout error on attempt {attempt + 1}: {str(e)}, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    logger.error(f"OpenAI Vision API timeout after {max_retries} attempts: {str(e)}")
                    raise HTTPException(
                        status_code=504,
                        detail=f"OpenAI API request timed out. Please try again with a smaller image or check your network connection."
                    )
            else:
                # Non-retryable errors
                logger.error(f"OpenAI Vision API error: {str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=500,
                    detail=f"OpenAI Vision API error: {str(e)}"
                )
    
    if not response:
        raise HTTPException(
            status_code=500,
            detail="Failed to get response from OpenAI API after all retries"
        )
    
    try:

        result_text = response.choices[0].message.content
        logger.info("OpenAI Vision API request successful")

        if "NO_DEVICE_DETECTED" in result_text:
            logger.info("No devices detected in image")
            return []

        # Parse multiple devices
        devices = []
        device_blocks = result_text.split('===DEVICE_START===')

        for block in device_blocks:
            if '===DEVICE_END===' in block:
                device_text = block.split('===DEVICE_END===')[0]

                device = {
                    'device_type': 'Unknown',
                    'brand': 'Unknown',
                    'model': 'Unknown',
                    'serial': 'Unknown',
                    'port_count': 'Unknown',
                    'confidence': 'Unknown',
                    'text_on_device': '',
                    'features': '',
                    'description': ''
                }

                lines = device_text.split('\n')
                for line in lines:
                    if line.startswith('DEVICE_TYPE:'):
                        device['device_type'] = line.split(':', 1)[1].strip()
                    elif line.startswith('BRAND:'):
                        device['brand'] = line.split(':', 1)[1].strip()
                    elif line.startswith('MODEL:'):
                        device['model'] = line.split(':', 1)[1].strip()
                    elif line.startswith('SERIAL:'):
                        device['serial'] = line.split(':', 1)[1].strip()
                    elif line.startswith('PORT_COUNT:'):
                        device['port_count'] = line.split(':', 1)[1].strip()
                    elif line.startswith('CONFIDENCE:'):
                        device['confidence'] = line.split(':', 1)[1].strip()
                    elif line.startswith('TEXT_ON_DEVICE:'):
                        device['text_on_device'] = line.split(':', 1)[1].strip()
                    elif line.startswith('FEATURES:'):
                        device['features'] = line.split(':', 1)[1].strip()
                    elif line.startswith('DESCRIPTION:'):
                        device['description'] = line.split(':', 1)[1].strip()

                if device['device_type'] != 'Unknown':
                    devices.append(device)

        return devices

    except HTTPException:
        # Re-raise HTTPExceptions (they already have proper error messages)
        raise
    except requests.exceptions.Timeout as e:
        logger.error(f"OpenAI Vision API timeout: {str(e)}")
        raise HTTPException(
            status_code=504,
            detail=f"OpenAI API request timed out. Please try again with a smaller image or check your network connection."
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenAI Vision API request error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"OpenAI Vision API error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error in detect_with_openai_vision: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"OpenAI Vision API error: {str(e)}")


# Tesseract OCR functions removed - no longer used

# ===== CUSTOMER API KEY MANAGEMENT =====

CUSTOMER_KEYS_FILE = project_root / 'data' / 'customer_keys.json'

def ensure_customer_keys_file():
    """Ensure customer keys file exists"""
    CUSTOMER_KEYS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not CUSTOMER_KEYS_FILE.exists():
        with open(CUSTOMER_KEYS_FILE, 'w') as f:
            json.dump({"customers": {}}, f)

def load_customer_keys():
    """Load customer API keys from file"""
    ensure_customer_keys_file()
    with open(CUSTOMER_KEYS_FILE, 'r') as f:
        return json.load(f)

def save_customer_keys(data):
    """Save customer API keys to file"""
    ensure_customer_keys_file()
    with open(CUSTOMER_KEYS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def generate_customer_key():
    """Generate a new customer API key"""
    return f"aicr_{secrets.token_urlsafe(32)}"

def add_customer(name: str, email: str = ""):
    """Add a new customer and return their API key"""
    data = load_customer_keys()
    api_key = generate_customer_key()
    
    customer_id = f"customer_{len(data['customers']) + 1}"
    data['customers'][api_key] = {
        "customer_id": customer_id,
        "name": name,
        "email": email,
        "created_at": datetime.now().isoformat(),
        "active": True,
        "request_count": 0
    }
    
    save_customer_keys(data)
    return api_key

def get_customer_by_key(api_key: str):
    """Get customer info by API key"""
    data = load_customer_keys()
    return data.get('customers', {}).get(api_key)

def is_valid_customer_key(api_key: str) -> bool:
    """Check if customer API key is valid and active"""
    customer = get_customer_by_key(api_key)
    return customer is not None and customer.get('active', False)

def increment_customer_usage(api_key: str):
    """Increment request count for customer"""
    data = load_customer_keys()
    if api_key in data.get('customers', {}):
        data['customers'][api_key]['request_count'] = data['customers'][api_key].get('request_count', 0) + 1
        save_customer_keys(data)

def delete_customer(api_key: str):
    """Delete a customer by API key"""
    data = load_customer_keys()
    if api_key in data.get('customers', {}):
        del data['customers'][api_key]
        save_customer_keys(data)
        return True
    return False

# ===== USER AUTHENTICATION =====

USERS_FILE = project_root / 'data' / 'users.json'

def ensure_users_file():
    """Ensure users file exists"""
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not USERS_FILE.exists():
        with open(USERS_FILE, 'w') as f:
            json.dump({"users": {}}, f)

def load_users():
    """Load users from file"""
    ensure_users_file()
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def save_users(data):
    """Save users to file"""
    ensure_users_file()
    with open(USERS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def hash_password(password: str) -> str:
    """Hash password using bcrypt (more secure than SHA256)"""
    try:
        import bcrypt
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    except ImportError:
        # Fallback to SHA256 if bcrypt not installed (backward compatibility)
        logger.warning("bcrypt not installed, using SHA256 (less secure)")
        return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    try:
        import bcrypt
        # Try bcrypt first
        if password_hash.startswith('$2b$') or password_hash.startswith('$2a$'):
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        else:
            # Fallback for old SHA256 hashes
            return hashlib.sha256(password.encode()).hexdigest() == password_hash
    except (ImportError, ValueError):
        # Fallback to SHA256 if bcrypt not installed or invalid hash format
        return hashlib.sha256(password.encode()).hexdigest() == password_hash

def generate_auth_token() -> str:
    """Generate a secure authentication token"""
    return f"aicr_auth_{secrets.token_urlsafe(48)}"

def create_user(username: str, password: str, name: str, email: str = ""):
    """Create a new user"""
    data = load_users()
    # Check if username already exists
    for existing_key, existing_user in data.get('users', {}).items():
        if existing_key == username or existing_user.get('username') == username:
            raise HTTPException(status_code=400, detail="Username already exists")
    
    user_id = f"user_{len(data.get('users', {})) + 1}"
    token = generate_auth_token()
    
    # Use username as the key
    data['users'][username] = {
        "user_id": user_id,
        "name": name,
        "username": username,
        "email": email or username,
        "password_hash": hash_password(password),
        "token": token,
        "created_at": datetime.now().isoformat(),
        "last_login": None
    }
    
    save_users(data)
    return {
        "user_id": user_id,
        "name": name,
        "username": username,
        "email": email or username,
        "token": token
    }

def authenticate_user(username: str, password: str):
    """Authenticate user and return user data"""
    data = load_users()
    # Find user by username (stored as email key in JSON)
    # Support both username and email lookup
    user = None
    for email_key, user_data in data.get('users', {}).items():
        if email_key == username or user_data.get('username') == username:
            user = user_data
            break
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not verify_password(password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Update last login
    user['last_login'] = datetime.now().isoformat()
    save_users(data)
    
    return {
        "user_id": user["user_id"],
        "name": user["name"],
        "email": user.get("email", username),
        "token": user["token"]
    }

def get_user_by_token(token: str):
    """Get user by auth token"""
    data = load_users()
    for email, user in data.get('users', {}).items():
        if user.get('token') == token:
            return {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"]
            }
    return None

# API Key Header for authentication
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

async def verify_customer_api_key(authorization: str = Security(api_key_header)):
    """Verify customer API key from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing API key. Include 'Authorization: aicr_...' header")
    
    # Remove 'Bearer ' prefix if present
    api_key = authorization.replace('Bearer ', '').strip()
    
    if not is_valid_customer_key(api_key):
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")
    
    increment_customer_usage(api_key)
    return api_key


def generate_excel_report(devices_data, ocr_data=None, filename_prefix="device_detection"):
    """Generate Excel file with device detection results"""
    excel_buffer = io.BytesIO()

    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
        if devices_data:
            main_data = []
            for i, device in enumerate(devices_data):
                row = {
                    'Detection_ID': i + 1,
                    'Device_Type': device.get('device_type', 'Unknown'),
                    'Brand': device.get('brand', 'Unknown'),
                    'Model': device.get('model', 'Unknown'),
                    'Port_Count': device.get('port_count', 'Unknown'),
                    'Confidence': device.get('confidence', 'Unknown'),
                    'Features': device.get('features', ''),
                    'Description': device.get('description', ''),
                    'Detection_Time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
                main_data.append(row)

            df_main = pd.DataFrame(main_data)
            df_main.to_excel(writer, sheet_name='Device_Detections', index=False)

            summary_data = {
                'Metric': [
                    'Total Devices Detected',
                    'Unique Brands',
                    'Unique Models',
                    'High Confidence Detections',
                    'Medium Confidence Detections',
                    'Low Confidence Detections',
                    'Detection Date',
                    'Detection Time'
                ],
                'Value': [
                    len(devices_data),
                    len(set([d.get('brand', 'Unknown') for d in devices_data if d.get('brand') != 'Unknown'])),
                    len(set([d.get('model', 'Unknown') for d in devices_data if d.get('model') != 'Unknown'])),
                    len([d for d in devices_data if d.get('confidence') == 'High']),
                    len([d for d in devices_data if d.get('confidence') == 'Medium']),
                    len([d for d in devices_data if d.get('confidence') == 'Low']),
                    datetime.now().strftime('%Y-%m-%d'),
                    datetime.now().strftime('%H:%M:%S')
                ]
            }
            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, sheet_name='Summary', index=False)

        if ocr_data:
            ocr_data_list = [{
                'Field': 'Brand',
                'Value': ocr_data.get('brand', 'Unknown'),
                'Source': 'OCR Text Extraction'
            }, {
                'Field': 'Model',
                'Value': ocr_data.get('model', 'Unknown'),
                'Source': 'OCR Text Extraction'
            }, {
                'Field': 'Serial Number',
                'Value': ocr_data.get('serial', 'Unknown'),
                'Source': 'OCR Text Extraction'
            }, {
                'Field': 'Port Count',
                'Value': ocr_data.get('port_count', 'Unknown'),
                'Source': 'OCR Text Extraction'
            }]

            df_ocr = pd.DataFrame(ocr_data_list)
            df_ocr.to_excel(writer, sheet_name='OCR_Results', index=False)

    excel_buffer.seek(0)
    return excel_buffer


# ===== API ENDPOINTS =====

@app.get("/")
async def root():
    return {"message": "Device Detection API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {}
    }
    
    # Check YOLO model
    has_yolo = os.path.exists("models/best.pt") or os.path.exists("../models/best.pt")
    health_status["services"]["yolo_model"] = {
        "available": has_yolo,
        "status": "ok" if has_yolo else "not_found"
    }
    
    # Check OpenAI API
    api_key = os.environ.get('OPENAI_API_KEY')
    has_openai = api_key and len(api_key) > 20 and api_key != 'your_openai_api_key_here'
    health_status["services"]["openai"] = {
        "available": has_openai,
        "status": "ok" if has_openai else "not_configured"
    }
    
    # Check data directories
    data_dir_exists = os.path.exists("data") or os.path.exists("../data")
    models_dir_exists = os.path.exists("models") or os.path.exists("../models")
    
    health_status["services"]["directories"] = {
        "data": "ok" if data_dir_exists else "warning",
        "models": "ok" if models_dir_exists else "warning"
    }
    
    # Overall status
    if not has_yolo and not has_openai:
        health_status["status"] = "degraded"
    elif not has_yolo or not has_openai:
        health_status["status"] = "partial"
    
    return health_status


@app.get("/status", response_model=SystemStatus)
async def get_status():
    """Get system status - always reads fresh from environment"""
    has_yolo = os.path.exists("models/best.pt") or os.path.exists("../models/best.pt")

    # Always read fresh from environment (Railway sets these at runtime)
    # Check for OpenAI API key - prioritize system environment variables
    api_key = os.environ.get('OPENAI_API_KEY')  # Use environ.get() to always read current value
    
    # Validate the API key format
    has_openai = False
    if api_key:
        api_key = api_key.strip()
        # Check if it's a valid OpenAI key format (starts with sk- and has reasonable length)
        if (api_key.startswith('sk-') and len(api_key) > 20) or (len(api_key) > 20 and api_key != 'your_openai_api_key_here'):
            has_openai = True

    detection_mode = None
    if has_yolo and has_openai:
        detection_mode = "both"
    elif has_yolo:
        detection_mode = "yolo"
    elif has_openai:
        detection_mode = "openai"

    return {
        "has_yolo_model": has_yolo,
        "has_openai": has_openai,
        "detection_mode": detection_mode
    }


@app.post("/validate-api-key")
async def validate_api_key(request: APIKeyRequest):
    """Validate OpenAI API key"""
    client = get_openai_client(request.api_key)
    if client:
        return {"valid": True, "message": "API key is valid"}
    else:
        return {"valid": False, "message": "Invalid API key"}


# Configuration constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/jfif']
ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.jfif']

@app.post("/detect")
async def detect_device(
    file: UploadFile = File(...),
    detection_mode: str = Form("openai"),
    enable_ocr: bool = Form(True),
    api_key: Optional[str] = Form(None)
):
    """Detect devices in uploaded image with validation"""
    # Validate file size
    file_contents = await file.read()
    file_size = len(file_contents)
    
    if file_size > MAX_FILE_SIZE:
        logger.warning(f"File too large: {file_size} bytes from {file.filename}")
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.0f}MB"
        )
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")
    
    # Validate file type
    file_extension = Path(file.filename).suffix.lower() if file.filename else ''
    if file_extension not in ALLOWED_EXTENSIONS:
        logger.warning(f"Invalid file extension: {file_extension} from {file.filename}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Reset file pointer
    await file.seek(0)
    """
    Detect devices in uploaded image

    - **file**: Image file (JPG, PNG, etc.)
    - **detection_mode**: "yolo" or "openai"
    - **enable_ocr**: Enable OCR text extraction
    - **api_key**: OpenAI API key (optional if set in .env)
    """
    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Compress/resize large images for better performance
        MAX_IMAGE_DIMENSION = 2048  # Max width or height
        
        if image.size[0] > MAX_IMAGE_DIMENSION or image.size[1] > MAX_IMAGE_DIMENSION:
            logger.info(f"Resizing large image from {image.size} to max {MAX_IMAGE_DIMENSION}")
            image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)
        
        logger.info(f"Processing image: {file.filename}, size: {image.size}, mode: {detection_mode}")

        devices = []
        ocr_data = None

        # Detection based on mode
        if detection_mode == "openai":
            client = get_openai_client(api_key)
            if not client:
                raise HTTPException(status_code=400, detail="OpenAI API key not configured")

            devices = detect_with_openai_vision(client, image)

            # Use OpenAI Vision's extracted text for OCR data (much more accurate than Tesseract)
            if enable_ocr and devices and len(devices) > 0:
                first_device = devices[0]
                ocr_data = {
                    'brand': first_device.get('brand', 'Unknown'),
                    'model': first_device.get('model', 'Unknown'),
                    'serial': first_device.get('serial', 'Unknown'),
                    'port_count': first_device.get('port_count', 'Unknown'),
                    'extracted_text': first_device.get('text_on_device', 'No text detected')
                }

        elif detection_mode == "yolo":
            model = load_yolo_model()
            if not model:
                raise HTTPException(status_code=400, detail="YOLO model not available")

            results = model.predict(source=image, conf=0.25, verbose=False)

            for result in results:
                boxes = result.boxes
                for box in boxes:
                    class_id = int(box.cls[0])
                    class_name = result.names[class_id]
                    confidence = float(box.conf[0])

                    device_data = {
                        'device_type': class_name,
                        'brand': 'Unknown',
                        'model': class_name,
                        'port_count': 'Unknown',
                        'confidence': 'High' if confidence >= 0.8 else 'Medium' if confidence >= 0.5 else 'Low',
                        'features': f'YOLO Detection - Confidence: {confidence:.2%}',
                        'description': f'Detected using custom YOLO model with {confidence:.2%} confidence'
                    }
                    devices.append(device_data)

            # Tesseract OCR removed; no OCR data for YOLO mode

        return {
            "success": True,
            "devices": devices,
            "ocr_data": ocr_data,
            "message": f"Detected {len(devices)} device(s)",
            "image_name": file.filename
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect-batch")
async def detect_batch(
    files: List[UploadFile] = File(...),
    detection_mode: str = Form("openai"),
    enable_ocr: bool = Form(True),
    api_key: Optional[str] = Form(None)
):
    """
    Detect devices in multiple uploaded images (batch processing)

    - **files**: Multiple image files (JPG, PNG, etc.)
    - **detection_mode**: "yolo" or "openai"
    - **enable_ocr**: Enable OCR text extraction
    - **api_key**: OpenAI API key (optional if set in .env)
    """
    try:
        results = []
        total_devices = 0

        # Validate detection mode and client
        if detection_mode == "openai":
            client = get_openai_client(api_key)
            if not client:
                raise HTTPException(status_code=400, detail="OpenAI API key not configured")
        elif detection_mode == "yolo":
            model = load_yolo_model()
            if not model:
                raise HTTPException(status_code=400, detail="YOLO model not available")
        else:
            client = None
            model = None

        # Process each image
        for idx, file in enumerate(files):
            try:
                # Read and process image
                contents = await file.read()
                image = Image.open(io.BytesIO(contents))

                devices = []
                ocr_data = None

                # Detection based on mode
                if detection_mode == "openai":
                    devices = detect_with_openai_vision(client, image)

                    # Use OpenAI Vision's extracted text for OCR data
                    if enable_ocr and devices and len(devices) > 0:
                        first_device = devices[0]
                        ocr_data = {
                            'brand': first_device.get('brand', 'Unknown'),
                            'model': first_device.get('model', 'Unknown'),
                            'serial': first_device.get('serial', 'Unknown'),
                            'port_count': first_device.get('port_count', 'Unknown'),
                            'extracted_text': first_device.get('text_on_device', 'No text detected')
                        }

                elif detection_mode == "yolo":
                    yolo_results = model.predict(source=image, conf=0.25, verbose=False)

                    for result in yolo_results:
                        boxes = result.boxes
                        for box in boxes:
                            class_id = int(box.cls[0])
                            class_name = result.names[class_id]
                            confidence = float(box.conf[0])

                            device_data = {
                                'device_type': class_name,
                                'brand': 'Unknown',
                                'model': class_name,
                                'port_count': 'Unknown',
                                'confidence': 'High' if confidence >= 0.8 else 'Medium' if confidence >= 0.5 else 'Low',
                                'features': f'YOLO Detection - Confidence: {confidence:.2%}',
                                'description': f'Detected using custom YOLO model with {confidence:.2%} confidence'
                            }
                            devices.append(device_data)

                    # Tesseract OCR removed; no OCR data for YOLO mode

                total_devices += len(devices)

                results.append({
                    "image_index": idx + 1,
                    "image_name": file.filename,
                    "success": True,
                    "devices": devices,
                    "ocr_data": ocr_data,
                    "device_count": len(devices)
                })

            except Exception as e:
                results.append({
                    "image_index": idx + 1,
                    "image_name": file.filename,
                    "success": False,
                    "error": str(e),
                    "devices": [],
                    "device_count": 0
                })

        return {
            "success": True,
            "batch_results": results,
            "total_images": len(files),
            "total_devices": total_devices,
            "message": f"Processed {len(files)} image(s), detected {total_devices} device(s)"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/export-excel")
async def export_excel(
    devices: List[dict],
    ocr_data: Optional[dict] = None
):
    """Generate and download Excel report"""
    try:
        excel_buffer = generate_excel_report(devices, ocr_data)

        filename = f"device_detection_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-model")
async def upload_model(model_file: UploadFile = File(...)):
    """Upload YOLO model file with validation"""
    # Validate file size (models can be large, but set reasonable limit)
    MAX_MODEL_SIZE = 500 * 1024 * 1024  # 500MB
    
    file_contents = await model_file.read()
    file_size = len(file_contents)
    
    if file_size > MAX_MODEL_SIZE:
        logger.warning(f"Model file too large: {file_size} bytes")
        raise HTTPException(
            status_code=413,
            detail=f"Model file too large. Maximum size is {MAX_MODEL_SIZE / (1024*1024):.0f}MB"
        )
    
    # Validate file extension
    if not model_file.filename or not model_file.filename.lower().endswith('.pt'):
        logger.warning(f"Invalid model file extension: {model_file.filename}")
        raise HTTPException(status_code=400, detail="Model file must be a .pt file")
    
    # Reset file pointer
    await model_file.seek(0)
    """Upload a custom YOLO .pt file and make it the active model (models/best.pt)."""
    try:
        if not model_file.filename.lower().endswith('.pt'):
            raise HTTPException(status_code=400, detail="Only .pt model files are accepted")

        contents = await model_file.read()
        saved_path = save_uploaded_model(contents, filename="best.pt")

        return {
            "success": True,
            "message": "Model uploaded successfully",
            "path": saved_path
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/save-api-key")
async def save_api_key(request: APIKeyRequest):
    """Persist OpenAI API key to .env and process environment, after a quick validation."""
    try:
        # Quick validation call to ensure key works
        client = get_openai_client(request.api_key)
        if not client:
            raise HTTPException(status_code=400, detail="Invalid API key")

        path = save_api_key_to_env(request.api_key)
        return {"success": True, "message": "API key saved", "path": path}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== AUTHENTICATION ENDPOINTS =====

class LoginRequest(BaseModel):
    username: str
    password: str

class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str

class VerifyTokenRequest(BaseModel):
    token: str

@app.post("/auth/signup")
async def signup(request: SignUpRequest):
    """Create a new user account"""
    try:
        # Validate input
        if not request.name or len(request.name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
        
        if not request.email or '@' not in request.email:
            raise HTTPException(status_code=400, detail="Invalid email address")
        
        if not request.password or len(request.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        user = create_user(request.email, request.password, request.name)
        logger.info(f"New user created: {user['user_id']}")
        return {
            "success": True,
            "message": "Account created successfully",
            "user": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"]
            },
            "token": user["token"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
async def login(request: LoginRequest):
    """Login and get authentication token"""
    try:
        # Validate input
        if not request.username or not request.username.strip():
            raise HTTPException(status_code=400, detail="Username is required")
        
        if not request.password:
            raise HTTPException(status_code=400, detail="Password is required")
        
        user = authenticate_user(request.username, request.password)
        logger.info(f"User logged in: {request.username}")
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "user_id": user["user_id"],
                "name": user["name"],
                "username": user.get("username", request.username),
                "email": user["email"]
            },
            "token": user["token"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed for {request.username}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/verify")
async def verify_token(request: VerifyTokenRequest):
    """Verify authentication token and return user info"""
    user = get_user_by_token(request.token)
    if user:
        return {
            "success": True,
            "user": user
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ===== ADMIN ENDPOINTS (for managing customers) =====

class CreateCustomerRequest(BaseModel):
    name: str
    email: str = ""


@app.post("/admin/customers")
async def create_customer(request: CreateCustomerRequest):
    """
    Create a new customer and return their API key.
    Admin endpoint - protect this in production!
    """
    api_key = add_customer(request.name, request.email)
    customer = get_customer_by_key(api_key)
    
    return {
        "success": True,
        "api_key": api_key,
        "customer": {
            "customer_id": customer["customer_id"],
            "name": customer["name"],
            "email": customer["email"],
            "created_at": customer["created_at"]
        },
        "message": "Customer created successfully. Save the API key - it won't be shown again!"
    }


@app.get("/admin/customers")
async def list_customers():
    """
    List all customers with usage stats.
    Admin endpoint - protect this in production!
    """
    data = load_customer_keys()
    customers = []
    
    for api_key, customer_info in data.get('customers', {}).items():
        customers.append({
            "api_key": api_key,  # Full key for admin use (deletion, etc.)
            "customer_id": customer_info["customer_id"],
            "name": customer_info["name"],
            "email": customer_info["email"],
            "created_at": customer_info["created_at"],
            "active": customer_info["active"],
            "request_count": customer_info.get("request_count", 0),
            "api_key_prefix": f"{api_key[:10]}...{api_key[-4:]}"  # Partial key for display
        })
    
    return {"customers": customers, "total": len(customers)}


class DeleteCustomerRequest(BaseModel):
    api_key: str


@app.delete("/admin/customers")
async def delete_customer_endpoint(request: DeleteCustomerRequest):
    """
    Delete a customer by API key.
    Admin endpoint - protect this in production!
    """
    try:
        customer = get_customer_by_key(request.api_key)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        if delete_customer(request.api_key):
            return {
                "success": True,
                "message": f"Customer '{customer['name']}' deleted successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to delete customer")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/customers/delete")
async def delete_customer_endpoint_post(request: DeleteCustomerRequest):
    """
    Delete a customer by API key (POST variant for clients that disallow DELETE bodies).
    Admin endpoint - protect this in production!
    """
    try:
        customer = get_customer_by_key(request.api_key)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        if delete_customer(request.api_key):
            return {
                "success": True,
                "message": f"Customer '{customer['name']}' deleted successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to delete customer")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== CUSTOMER-FACING API ENDPOINTS (like OpenAI API) =====

class CustomerDetectionRequest(BaseModel):
    image: str  # base64 encoded image
    detection_mode: str = "openai"  # "openai" or "yolo"
    enable_ocr: bool = True


@app.post("/v1/detect")
async def customer_detect(
    request: CustomerDetectionRequest,
    api_key: str = Depends(verify_customer_api_key)
):
    """
    Customer-facing detection endpoint (like OpenAI API).
    
    Requires: Authorization: aicr_... header
    
    Request body:
    - image: base64 encoded image string
    - detection_mode: "openai" or "yolo" (default: "openai")
    - enable_ocr: enable OCR extraction (default: true, OpenAI only)
    
    Returns: Detection results with devices and OCR data
    """
    try:
        # Validate base64 image
        if not request.image or len(request.image) < 100:
            raise HTTPException(status_code=400, detail="Invalid or empty image data")
        
        # Decode to check validity
        try:
            image_data = base64.b64decode(request.image)
        except Exception as e:
            logger.warning(f"Invalid base64 encoding: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid base64 image encoding")
        
        if len(image_data) > MAX_FILE_SIZE:
            logger.warning(f"Base64 image too large: {len(image_data)} bytes")
            raise HTTPException(
                status_code=413,
                detail=f"Image too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.0f}MB"
            )
        
        # Validate it's a valid image
        try:
            image = Image.open(io.BytesIO(image_data))
            image.verify()
            # Reopen after verify (verify closes the image)
            image = Image.open(io.BytesIO(image_data))
        except Exception as e:
            logger.warning(f"Invalid image data: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Optimize large images
        MAX_IMAGE_DIMENSION = 2048
        if image.size[0] > MAX_IMAGE_DIMENSION or image.size[1] > MAX_IMAGE_DIMENSION:
            logger.info(f"Resizing large image from {image.size} to max {MAX_IMAGE_DIMENSION}")
            image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)
        
        logger.info(f"Customer API request: mode={request.detection_mode}, ocr={request.enable_ocr}")
        
        devices = []
        ocr_data = None
        
        if request.detection_mode == "openai":
            client = get_openai_client()  # Uses saved OpenAI key
            if not client:
                raise HTTPException(status_code=503, detail="OpenAI service not configured")
            
            devices = detect_with_openai_vision(client, image)
            
            if request.enable_ocr and devices and len(devices) > 0:
                first_device = devices[0]
                ocr_data = {
                    'brand': first_device.get('brand', 'Unknown'),
                    'model': first_device.get('model', 'Unknown'),
                    'serial': first_device.get('serial', 'Unknown'),
                    'port_count': first_device.get('port_count', 'Unknown'),
                    'extracted_text': first_device.get('text_on_device', 'No text detected')
                }
        
        elif request.detection_mode == "yolo":
            model = load_yolo_model()
            if not model:
                raise HTTPException(status_code=503, detail="YOLO model not available")
            
            results = model.predict(source=image, conf=0.25, verbose=False)
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    class_id = int(box.cls[0])
                    class_name = result.names[class_id]
                    confidence = float(box.conf[0])
                    
                    device_data = {
                        'device_type': class_name,
                        'brand': 'Unknown',
                        'model': class_name,
                        'port_count': 'Unknown',
                        'confidence': 'High' if confidence >= 0.8 else 'Medium' if confidence >= 0.5 else 'Low',
                        'features': f'YOLO Detection - Confidence: {confidence:.2%}',
                        'description': f'Detected using custom YOLO model with {confidence:.2%} confidence'
                    }
                    devices.append(device_data)
        
        return {
            "success": True,
            "devices": devices,
            "ocr_data": ocr_data,
            "device_count": len(devices)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/v1/models")
async def list_models(api_key: str = Depends(verify_customer_api_key)):
    """
    List available detection models.
    Customer-facing endpoint.
    """
    has_yolo = os.path.exists("models/best.pt") or os.path.exists("../models/best.pt")
    has_openai = os.getenv('OPENAI_API_KEY') is not None and len(os.getenv('OPENAI_API_KEY', '')) > 20
    
    models = []
    if has_openai:
        models.append({"id": "openai", "name": "OpenAI Vision", "description": "GPT-4 Vision API"})
    if has_yolo:
        models.append({"id": "yolo", "name": "YOLO Custom", "description": "Custom trained YOLO model"})
    
    return {"models": models}


# Create default admin user if no users exist
def ensure_default_user():
    """Create default admin user if no users exist"""
    data = load_users()
    if len(data.get('users', {})) == 0:
        try:
            default_user = create_user(
                username="lexdata",
                password="LexDataLabs2026",
                name="LexData Labs Admin",
                email="lexdata"
            )
            print(f"[SUCCESS] Default admin user created: lexdata")
            return default_user
        except Exception as e:
            print(f"[WARNING] Could not create default user: {e}")

# Initialize default user on startup
ensure_default_user()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
