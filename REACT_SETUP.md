# React Frontend Setup Guide

> Note: Training features are not included. The app supports OpenAI Vision out of the box and optional YOLO inference if a pre-trained model is placed at `models/best.pt`.

This project has been converted from Streamlit to React with a FastAPI backend. All functionality has been preserved.

## 📁 Project Structure

```
AICR/
├── backend/
│   ├── api.py              # FastAPI backend server
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js
│   │   │   ├── Sidebar.js
│   │   │   ├── ImageUpload.js
│   │   │   └── DetectionResults.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── .env.example
├── .env                    # Environment variables (OpenAI API Key)
└── app.py                  # Original Streamlit app (kept for reference)
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+ and npm
- OpenAI API key (recommended for OpenAI Vision mode)

### Step 1: Backend Setup

1. **Navigate to the backend directory:**
```bash
cd backend
```

2. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

3. **Make sure `.env` file exists in the root directory with your OpenAI API key:**
```bash
# In the AICR root directory
cat ../.env
```

Should contain:
```
OPENAI_API_KEY=sk-your-api-key-here
```

4. **Start the FastAPI backend:**
```bash
# From the backend directory
python api.py
```

Or using uvicorn directly:
```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be available at: `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### Step 2: Frontend Setup

1. **Navigate to the frontend directory:**
```bash
cd frontend
```

2. **Install npm dependencies:**
```bash
npm install
```

3. **Create `.env` file (optional):**
```bash
cp .env.example .env
```

Edit `.env` if you need to change the API URL:
```
REACT_APP_API_URL=http://localhost:8000
```

4. **Start the React development server:**
```bash
npm start
```

The React app will open at: `http://localhost:3000`

## 🎯 Features

All Streamlit functionality has been preserved:

### ✅ Dual Detection Modes
- **YOLO Model**: Custom-trained object detection
- **OpenAI Vision API**: GPT-4 Vision for device identification

### ✅ OCR Integration
- Tesseract OCR for text extraction from device labels
- Automatic extraction of brand, model, serial number, and port count

### ✅ Device Detection
- Routers, switches, access points, firewalls
- Servers, blade servers, rack servers
- Port count detection and specifications

### ✅ Excel Export
- Comprehensive detection reports
- OCR results
- Summary statistics
- Device specifications

### ✅ Configuration Options
- API key management
- Detection mode selection
- OCR enable/disable
- Confidence threshold adjustment (YOLO mode)

## 📡 API Endpoints

### GET `/status`
Get system status (YOLO model availability, OpenAI API status)

### POST `/validate-api-key`
Validate OpenAI API key

**Request Body:**
```json
{
  "api_key": "sk-..."
}
```

### POST `/detect`
Detect devices in uploaded image

**Form Data:**
- `file`: Image file (JPG, PNG, etc.)
- `detection_mode`: "yolo" or "openai"
- `enable_ocr`: true/false
- `api_key`: (optional) OpenAI API key

**Response:**
```json
{
  "success": true,
  "devices": [
    {
      "device_type": "Switch",
      "brand": "Cisco",
      "model": "Catalyst 2960",
      "port_count": "24 ports",
      "confidence": "High",
      "features": "24x RJ45 + 2x SFP",
      "description": "Enterprise-grade managed switch..."
    }
  ],
  "ocr_data": {
    "brand": "Cisco",
    "model": "2960",
    "serial": "Unknown",
    "port_count": "24 ports",
    "extracted_text": "..."
  },
  "message": "Detected 1 device(s)"
}
```

### POST `/export-excel`
Generate Excel report

**Request Body:**
```json
{
  "devices": [...],
  "ocr_data": {...}
}
```

**Response:** Excel file download

## 🔧 Development

### Backend Development

The backend is in `backend/api.py`. It uses FastAPI and includes all the functionality from the original Streamlit app:

- YOLO model loading
- OpenAI Vision API integration
- OCR text extraction
- Device information extraction
- Excel report generation

To run with auto-reload:
```bash
uvicorn api:app --reload
```

### Frontend Development

The React frontend is organized into components:

- **App.js**: Main application logic and state management
- **Header.js**: Page header
- **Sidebar.js**: Configuration sidebar (API key, detection mode, settings)
- **ImageUpload.js**: Drag-and-drop image upload
- **DetectionResults.js**: Display detection results and export

To build for production:
```bash
cd frontend
npm run build
```

## 🌐 Deployment

### Backend Deployment

1. **Using Docker:**
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
COPY .env .
EXPOSE 8000
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. **Manual deployment:**
- Deploy to any Python hosting service (AWS, Google Cloud, Azure, etc.)
- Make sure to set environment variables (OPENAI_API_KEY)
- Use a production ASGI server (uvicorn, gunicorn with uvicorn workers)

### Frontend Deployment

1. **Build the app:**
```bash
cd frontend
npm run build
```

2. **Deploy the `build/` folder to:**
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting service

3. **Update API URL:**
Make sure to set `REACT_APP_API_URL` to your deployed backend URL

## 🐛 Troubleshooting

### Backend Issues

**CORS Errors:**
- Check that the backend has CORS middleware configured
- The current setup allows all origins (`allow_origins=["*"]`)
- In production, restrict to specific domains

**OpenAI API Errors:**
- Verify API key is valid and has credits
- Check `.env` file is in the correct location
- API key should start with `sk-`

**YOLO Model Not Found:**
- Train a model using `python train.py` (see original README)
- Place trained model at `models/best.pt`
- Or use OpenAI Vision mode instead

### Frontend Issues

**Can't connect to backend:**
- Check backend is running on port 8000
- Verify `REACT_APP_API_URL` in `.env`
- Check browser console for CORS errors

**Image upload not working:**
- Check file size (large images may timeout)
- Verify file format is supported (JPG, PNG, BMP, JFIF)

**Detection fails:**
- Check API key is configured (for OpenAI mode)
- Check YOLO model exists (for YOLO mode)
- Check browser console and backend logs for errors

## 📱 Mobile Access

Both the backend and frontend can be accessed from mobile devices on your local network:

1. **Find your computer's IP address:**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

2. **Start backend with network access:**
```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

3. **Start frontend:**
```bash
npm start
```

4. **Access from mobile:**
- Backend API: `http://YOUR_IP:8000`
- React app: `http://YOUR_IP:3000`

## 🔐 Security Notes

- Never commit `.env` files with API keys
- Use environment variables in production
- Restrict CORS origins in production
- Add authentication for production deployments
- Set up HTTPS for production

## 📊 Comparison: Streamlit vs React

### Streamlit (Original)
✅ Quick to develop
✅ Single file application
❌ Limited customization
❌ Python-only frontend
❌ Limited state management

### React + FastAPI (New)
✅ Full customization
✅ Modern UI/UX
✅ Separate frontend/backend
✅ Better performance
✅ Production-ready
✅ API can be used by other applications

## 🎓 Next Steps

1. **Customize the UI:**
   - Modify CSS files in `frontend/src/components/`
   - Add new features to components
   - Customize color scheme

2. **Add Features:**
   - User authentication
   - Database integration
   - Batch processing
   - Real-time video detection

3. **Improve Backend:**
   - Add caching (Redis)
   - Add rate limiting
   - Add logging
   - Add monitoring

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend logs: `uvicorn api:app --log-level debug`
3. Check browser console for frontend errors
4. Review the original README.md for YOLO training instructions

---

**Made with ❤️ - Converted from Streamlit to React + FastAPI**
