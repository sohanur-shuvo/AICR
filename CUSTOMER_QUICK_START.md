# How to Use Your AICR API Key - Quick Start Guide

## What You Got

When you received your API key, you got:
- **API Key**: `aicr_xxxxxxxxxxxxxxxxxxxxx` (save this securely!)
- **API Base URL**: `http://localhost:8000` (or your provider's domain)
- **Endpoint**: `/v1/detect`

## Step 1: Test Your API Key

**Quick Test with cURL:**
```bash
curl -X GET http://localhost:8000/v1/models \
  -H "Authorization: aicr_your_api_key_here"
```

If you get a JSON response with models list, your key works! ✅

## Step 2: Detect Devices in an Image

### Python Example (Recommended)

```python
import requests
import base64

# Your API key
API_KEY = "aicr_your_api_key_here"
API_URL = "http://localhost:8000/v1/detect"

# Read and encode image
with open("router.jpg", "rb") as image_file:
    image_base64 = base64.b64encode(image_file.read()).decode('utf-8')

# Make API request
response = requests.post(
    API_URL,
    headers={
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    },
    json={
        "image": image_base64,
        "detection_mode": "openai",  # Use "openai" or "yolo"
        "enable_ocr": True
    }
)

# Check response
if response.status_code == 200:
    result = response.json()
    print(f"✅ Detected {result['device_count']} device(s)")
    
    for device in result['devices']:
        print(f"\n🔌 Device: {device['brand']} {device['model']}")
        print(f"   Type: {device['device_type']}")
        print(f"   Ports: {device['port_count']}")
        print(f"   Confidence: {device['confidence']}")
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');
const fs = require('fs');

const API_KEY = 'aicr_your_api_key_here';
const API_URL = 'http://localhost:8000/v1/detect';

// Read and encode image
const imageBuffer = fs.readFileSync('router.jpg');
const imageBase64 = imageBuffer.toString('base64');

// Make API request
axios.post(API_URL, {
    image: imageBase64,
    detection_mode: 'openai',
    enable_ocr: true
}, {
    headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log(`✅ Detected ${response.data.device_count} device(s)`);
    response.data.devices.forEach(device => {
        console.log(`\n🔌 Device: ${device.brand} ${device.model}`);
        console.log(`   Type: ${device.device_type}`);
        console.log(`   Ports: ${device.port_count}`);
    });
})
.catch(error => {
    console.error('❌ Error:', error.response?.data || error.message);
});
```

### JavaScript (Browser/Frontend) Example

```javascript
// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove data:image/jpeg;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// Use the API
async function detectDevice(imageFile) {
    const API_KEY = 'aicr_your_api_key_here';
    const API_URL = 'http://localhost:8000/v1/detect';
    
    try {
        const imageBase64 = await fileToBase64(imageFile);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageBase64,
                detection_mode: 'openai',
                enable_ocr: true
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ Detected ${result.device_count} device(s)`);
            return result;
        } else {
            throw new Error('Detection failed');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

// Usage with HTML file input
document.getElementById('imageInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const result = await detectDevice(file);
        console.log('Devices:', result.devices);
    }
});
```

## Step 3: Understanding the Response

```json
{
  "success": true,
  "devices": [
    {
      "device_type": "Router",        // Router, Switch, Server, etc.
      "brand": "Cisco",               // Brand name
      "model": "ISR 4331",            // Model number
      "serial": "FCW1234X567",        // Serial number (if detected)
      "port_count": "4 ports",        // Number of ports
      "confidence": "High",           // High, Medium, or Low
      "features": "4x GE WAN ports",  // Key features
      "description": "Enterprise-grade router..."  // Description
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

## Detection Modes

### OpenAI Mode (Recommended)
- **Mode**: `"openai"`
- **Best for**: Any device type, highest accuracy
- **Features**: OCR, brand/model extraction, detailed descriptions
- **Speed**: 2-5 seconds per image

### YOLO Mode
- **Mode**: `"yolo"`
- **Best for**: Fast detection of trained device types
- **Features**: Very fast inference
- **Speed**: < 1 second per image

## Common Errors

### 401 Unauthorized
```json
{"detail": "Invalid or inactive API key"}
```
**Fix**: Check your API key is correct and active

### 503 Service Unavailable
```json
{"detail": "OpenAI service not configured"}
```
**Fix**: Provider needs to configure OpenAI API key

### 400 Bad Request
**Fix**: Check your request format:
- Image must be base64 encoded string
- `detection_mode` must be "openai" or "yolo"
- `enable_ocr` must be boolean (true/false)

## Integration Tips

1. **Store API key securely**: Use environment variables, not hardcode
   ```python
   import os
   API_KEY = os.getenv('AICR_API_KEY')
   ```

2. **Handle errors gracefully**: Check status codes before processing

3. **Image size**: Recommended max 5MB per image

4. **Batch processing**: Make multiple requests for multiple images

5. **Rate limiting**: Currently none, but monitor your usage

## Support

For issues or questions:
- Contact your API provider
- Check full documentation: `CUSTOMER_API_DOCS.md`
- Test your key: `GET /v1/models`

---

**Happy detecting! 🚀**

