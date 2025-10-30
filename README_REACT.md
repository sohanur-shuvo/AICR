# 🌐 Router, Switch & Server Detection - React Edition

> Note: Model training features have been removed from this project. Use OpenAI Vision mode or supply a pre-trained YOLO model at `models/best.pt` if you wish to use YOLO inference.

> **Modern React + FastAPI implementation of the AI-Powered Network Device Detection System**

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AI-powered device identification using custom YOLO models and OpenAI Vision API. Detect and classify routers, switches, servers, and access points from images with comprehensive specifications including port count detection and ChatGPT web search integration.

## ✨ Features

- 🎯 **Dual Detection Modes**: Custom YOLO or OpenAI Vision API
- 🤖 **AI-Powered Analysis**: GPT-4 Vision for device identification
- 🔍 **OCR Integration**: Extract text from device labels (Tesseract)
- 📊 **Excel Export**: Comprehensive detection reports
- 📱 **Mobile Responsive**: Works on desktop, tablet, and mobile
- ⚡ **Fast & Scalable**: Separate frontend and backend
- 🔌 **REST API**: Full API for integration with other apps
- 🖼️ **Drag & Drop**: Intuitive image upload interface

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API key (optional)

### Installation

1. **Clone and setup:**
```bash
git clone <your-repo>
cd AICR
```

2. **Install backend dependencies:**
```bash
cd backend
pip install -r requirements.txt
cd ..
```

3. **Install frontend dependencies:**
```bash
cd frontend
npm install
cd ..
```

4. **Configure environment:**
```bash
# Your .env file is already configured with OpenAI API key
cat .env
```

### Run the Application

**Option A: Automated (Recommended)**

Windows:
```bash
start_app.bat
```

Mac/Linux:
```bash
chmod +x start_app.sh
./start_app.sh
```

**Option B: Manual**

Terminal 1 - Backend:
```bash
cd backend
python api.py
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

### Access

- **React App**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📸 Screenshots

### Main Interface
Modern, clean interface with drag-and-drop upload:
- Configuration sidebar with API key management
- Image upload with preview
- Real-time detection results
- OCR text extraction display

### Detection Results
Comprehensive device information:
- Device type, brand, model
- Port count and specifications
- Confidence levels (color-coded)
- Excel report export

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  React Frontend │◄────────│  FastAPI Backend │
│  (Port 3000)    │  HTTP   │  (Port 8000)     │
└─────────────────┘         └──────────────────┘
        │                            │
        │                            ├─► YOLO Model
        │                            ├─► OpenAI Vision API
        │                            ├─► Tesseract OCR
        │                            └─► Excel Generation
        │
        └─► React Components:
            ├─► Header
            ├─► Sidebar (Config)
            ├─► ImageUpload
            └─► DetectionResults
```

## 🔌 API Endpoints

### `GET /status`
Get system status (YOLO availability, OpenAI status)

### `POST /validate-api-key`
Validate OpenAI API key

### `POST /detect`
Detect devices in uploaded image

**Parameters:**
- `file`: Image file
- `detection_mode`: "yolo" | "openai"
- `enable_ocr`: boolean
- `api_key`: (optional) OpenAI key

### `POST /export-excel`
Generate Excel report from detection results

See full API documentation at: http://localhost:8000/docs

## 📁 Project Structure

```
AICR/
├── backend/
│   ├── api.py                 # FastAPI backend
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Header.js
│   │   │   ├── Sidebar.js
│   │   │   ├── ImageUpload.js
│   │   │   └── DetectionResults.js
│   │   ├── App.js            # Main app
│   │   └── index.js          # Entry point
│   └── package.json          # Node dependencies
├── .env                       # Environment variables
├── start_app.bat             # Windows startup
└── start_app.sh              # Mac/Linux startup
```

## 🎯 Usage Guide

### 1. Configure Detection Mode

**OpenAI Vision Mode** (No training required):
- Enter API key in sidebar
- Click "Connect to OpenAI"
- Ready to detect any device!

**YOLO Mode** (Custom trained):
- Train model: `python train.py`
- Place model at `models/best.pt`
- Select "YOLO Model" in sidebar

### 2. Upload Image

- Drag and drop image onto upload area
- Or click to browse and select
- Supported: JPG, PNG, BMP, JFIF

### 3. Detect Devices

- Click "Detect Device" button
- Wait for AI analysis (2-5 seconds)
- View comprehensive results

### 4. Export Results

- Review detection data
- Click "Download Excel Report"
- Get comprehensive Excel file with:
  - Device detections
  - OCR results
  - Summary statistics

## 🔧 Configuration

### API Key Setup

1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Enter in sidebar or add to `.env`:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

### Detection Settings

- **Detection Mode**: YOLO or OpenAI Vision
- **OCR**: Enable/disable text extraction
- **Confidence Threshold**: Adjust for YOLO mode (0-100%)

## 📱 Mobile Access

1. **Find your computer's IP:**
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. **Connect phone to same Wi-Fi**

3. **Access from mobile:**
   - `http://YOUR_IP:3000`

## 🚀 Deployment

### Frontend Deployment

1. Build for production:
```bash
cd frontend
npm run build
```

2. Deploy `build/` folder to:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Any static hosting

### Backend Deployment

1. Deploy to cloud:
   - AWS (EC2, Lambda, ECS)
   - Google Cloud Run
   - Azure Container Instances
   - Heroku

2. Set environment variables:
   - `OPENAI_API_KEY`

3. Use production server:
```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

### Docker Deployment

```dockerfile
# Backend
FROM python:3.10-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
EXPOSE 8000
CMD ["uvicorn", "api:app", "--host", "0.0.0.0"]
```

## 🔐 Security

### Production Checklist
- [ ] Restrict CORS to specific domains
- [ ] Add authentication (JWT, OAuth)
- [ ] Implement rate limiting
- [ ] Use HTTPS
- [ ] Store API keys securely
- [ ] Add request validation
- [ ] Set up logging and monitoring

## 🐛 Troubleshooting

### Backend Issues

**CORS Errors:**
```python
# In api.py, restrict origins for production:
allow_origins=["https://yourdomain.com"]
```

**OpenAI API Errors:**
- Verify API key is valid
- Check credits available
- Ensure key starts with `sk-`

**YOLO Model Not Found:**
- Train model: `python train.py`
- Or use OpenAI Vision mode

### Frontend Issues

**Can't connect to backend:**
- Check backend is running: http://localhost:8000
- Verify `REACT_APP_API_URL` in `.env`
- Check browser console for CORS errors

**Image upload fails:**
- Check file size (< 10MB recommended)
- Verify format: JPG, PNG, BMP, JFIF
- Check browser console for errors

## 📊 Performance

| Feature | Performance |
|---------|-------------|
| **Initial Load** | ~1s (production build) |
| **Detection Time** | 2-5s (depends on mode) |
| **Excel Export** | < 1s |
| **Mobile Response** | Excellent |
| **Concurrent Users** | Scalable (backend) |

## 🎓 Documentation

- **[QUICKSTART_REACT.md](QUICKSTART_REACT.md)** - Quick start guide
- **[REACT_SETUP.md](REACT_SETUP.md)** - Detailed setup instructions
- **[CONVERSION_SUMMARY.md](CONVERSION_SUMMARY.md)** - Conversion details
- **[API Docs](http://localhost:8000/docs)** - Interactive API documentation

## 🔄 Comparison: Streamlit vs React

| Feature | Streamlit | React + FastAPI |
|---------|-----------|-----------------|
| **Speed** | Good | Excellent |
| **Customization** | Limited | Full |
| **API** | N/A | Full REST API |
| **Mobile UX** | Good | Excellent |
| **Scalability** | Moderate | High |
| **Development** | Fast | Moderate |

## 🛣️ Roadmap

### Short Term
- [ ] User authentication
- [ ] Request caching (Redis)
- [ ] Rate limiting
- [ ] Unit tests
- [ ] Integration tests

### Long Term
- [ ] Batch image processing
- [ ] Real-time video detection
- [ ] Database integration
- [ ] Advanced search and filters
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Ultralytics** - YOLOv8 framework
- **OpenAI** - GPT-4 Vision API
- **FastAPI** - Modern Python web framework
- **React** - UI library
- **Tesseract** - OCR engine

## 📞 Support

Having issues?

1. Check [Troubleshooting](#-troubleshooting) section
2. Review [REACT_SETUP.md](REACT_SETUP.md)
3. Check [API Docs](http://localhost:8000/docs)
4. Create an issue on GitHub

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Made with ❤️ - Converted from Streamlit to React + FastAPI**

**Maintaining 100% of original functionality with a modern, scalable architecture**
