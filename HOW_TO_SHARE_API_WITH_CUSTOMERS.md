# How to Share Your API with Customers

## Quick Steps

1. **Create API Key** - Go to Admin Panel (🔑 API Keys button) → Create New API Key
2. **Share the Key** - Copy the API key and code example shown
3. **Send Documentation** - Send `CUSTOMER_QUICK_START.md` to your customer

## What to Send to Your Customer

When you create an API key for a customer, send them:

### 1. Their API Key
```
aicr_xxxxxxxxxxxxxxxxxxxxx
```

### 2. Your API Base URL
```
http://localhost:8000  # For local testing
# OR
https://api.yourdomain.com  # For production
```

### 3. Code Example
Copy the Python/JavaScript/cURL example from the admin panel when the key is created.

### 4. Quick Start Guide
Send them the file: `CUSTOMER_QUICK_START.md`

## Example Email Template

```
Subject: Your AICR API Key is Ready!

Hi [Customer Name],

Your API key for the AICR Device Detection API has been created:

📋 API Key: aicr_xxxxxxxxxxxxxxxxxxxxx
🌐 API Base URL: http://localhost:8000

To get started, see the attached quick start guide or use this Python example:

```python
import requests
import base64

API_KEY = "aicr_xxxxxxxxxxxxxxxxxxxxx"
API_URL = "http://localhost:8000/v1/detect"

with open("router.jpg", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode()

response = requests.post(
    API_URL,
    headers={"Authorization": API_KEY},
    json={
        "image": image_base64,
        "detection_mode": "openai",
        "enable_ocr": True
    }
)

result = response.json()
print(f"Detected {result['device_count']} device(s)")
```

For full documentation, see: CUSTOMER_QUICK_START.md

Best regards,
[Your Name]
```

## Testing Customer Access

Before sending, test the key works:

```bash
# Test API key
curl http://localhost:8000/v1/models \
  -H "Authorization: aicr_customer_api_key_here"
```

If you get a JSON response, the key works! ✅

## Customer Support

Your customers can:
1. Test their key: `GET /v1/models`
2. Detect devices: `POST /v1/detect`
3. See usage stats in admin panel

---

**That's it!** Your customers can now integrate the API into their applications. 🚀

