# AICR Device Detection API - Customer Documentation

## Overview

AICR (AI Router/Server Detection) provides an API service similar to OpenAI for network device detection. Upload images and get detailed device information using AI.

## Base URL

```
https://your-domain.com  # Your hosted API
```

## Authentication

All API requests require an API key in the Authorization header:

```
Authorization: aicr_your_customer_api_key_here
```

Or with Bearer prefix:

```
Authorization: Bearer aicr_your_customer_api_key_here
```

## Endpoints

### 1. Detect Devices

Detect network devices (routers, switches, servers) in an uploaded image.

**Endpoint:** `POST /v1/detect`

**Request Headers:**
```
Authorization: aicr_your_api_key
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "base64_encoded_image_string",
  "detection_mode": "openai",  // "openai" or "yolo"
  "enable_ocr": true  // OCR only works with OpenAI mode
}
```

**Response:**
```json
{
  "success": true,
  "devices": [
    {
      "device_type": "Router",
      "brand": "Cisco",
      "model": "ISR 4331",
      "serial": "FCW1234X567",
      "port_count": "4 ports",
      "confidence": "High",
      "features": "4x GE WAN ports",
      "description": "Enterprise-grade router..."
    }
  ],
  "ocr_data": {
    "brand": "Cisco",
    "model": "ISR 4331",
    "serial": "FCW1234X567",
    "port_count": "4 ports",
    "extracted_text": "Full text from device labels"
  },
  "device_count": 1
}
```

### 2. List Available Models

Get list of available detection models.

**Endpoint:** `GET /v1/models`

**Request Headers:**
```
Authorization: aicr_your_api_key
```

**Response:**
```json
{
  "models": [
    {
      "id": "openai",
      "name": "OpenAI Vision",
      "description": "GPT-4 Vision API"
    },
    {
      "id": "yolo",
      "name": "YOLO Custom",
      "description": "Custom trained YOLO model"
    }
  ]
}
```

## Usage Examples

### Python Example

```python
import requests
import base64

# Your API key
API_KEY = "aicr_your_customer_api_key_here"
API_BASE = "https://your-domain.com"

# Read and encode image
with open("router.jpg", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode()

# Make request
response = requests.post(
    f"{API_BASE}/v1/detect",
    headers={
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    },
    json={
        "image": image_base64,
        "detection_mode": "openai",
        "enable_ocr": True
    }
)

result = response.json()
print(f"Detected {result['device_count']} device(s)")
for device in result['devices']:
    print(f"- {device['brand']} {device['model']}")
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');
const fs = require('fs');

const API_KEY = 'aicr_your_customer_api_key_here';
const API_BASE = 'https://your-domain.com';

// Read and encode image
const imageBuffer = fs.readFileSync('router.jpg');
const imageBase64 = imageBuffer.toString('base64');

// Make request
axios.post(
  `${API_BASE}/v1/detect`,
  {
    image: imageBase64,
    detection_mode: 'openai',
    enable_ocr: true
  },
  {
    headers: {
      'Authorization': API_KEY,
      'Content-Type': 'application/json'
    }
  }
).then(response => {
  console.log(`Detected ${response.data.device_count} device(s)`);
  response.data.devices.forEach(device => {
    console.log(`- ${device.brand} ${device.model}`);
  });
});
```

### cURL Example

```bash
# Encode image to base64
IMAGE_B64=$(base64 -i router.jpg)

# Make request
curl -X POST https://your-domain.com/v1/detect \
  -H "Authorization: aicr_your_customer_api_key_here" \
  -H "Content-Type: application/json" \
  -d "{
    \"image\": \"$IMAGE_B64\",
    \"detection_mode\": \"openai\",
    \"enable_ocr\": true
  }"
```

## Detection Modes

### OpenAI Mode (Recommended)
- **Mode ID:** `"openai"`
- **Best for:** General device detection, any device type
- **Features:** OCR, brand/model extraction, detailed descriptions
- **Accuracy:** High
- **Speed:** 2-5 seconds per image

### YOLO Mode
- **Mode ID:** `"yolo"`
- **Best for:** Fast detection of trained device types
- **Features:** Fast inference, custom trained models
- **Accuracy:** Depends on training data
- **Speed:** < 1 second per image

## Error Handling

### 401 Unauthorized
```json
{
  "detail": "Invalid or inactive API key"
}
```

### 400 Bad Request
```json
{
  "detail": "Invalid request format"
}
```

### 503 Service Unavailable
```json
{
  "detail": "OpenAI service not configured"
}
```
or
```json
{
  "detail": "YOLO model not available"
}
```

## Rate Limits

Currently no rate limits, but usage is tracked per customer for monitoring.

## Support

For API issues or questions, contact your API provider.

---

**API Version:** 1.0
**Last Updated:** 2024

