# Quick Start Guide - React Version

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Configure OpenAI API Key

The `.env` file in the root directory already contains your API key. ✅

### Step 3: Start the Application

**Option A: Use the automated script (Windows)**
```bash
# Double-click or run:
start_app.bat
```

**Option B: Use the automated script (Mac/Linux)**
```bash
chmod +x start_app.sh
./start_app.sh
```

**Option C: Start manually**

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

## 🌐 Access the Application

- **React Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📱 Mobile Access

1. Find your computer's IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. Access from your phone (same Wi-Fi network):
   - React App: `http://YOUR_IP:3000`
   - API: `http://YOUR_IP:8000`

## ✨ Features Available

✅ **OpenAI Vision API** - Identify any device without training
✅ **Custom YOLO Model** - Fast detection of trained devices
✅ **OCR Text Extraction** - Extract text from device labels
✅ **Port Count Detection** - Automatically detect port specifications
✅ **Excel Reports** - Export comprehensive detection reports
✅ **Dual Modes** - Switch between YOLO and OpenAI Vision

## 🎯 Usage

1. **Configure API Key** (if not using .env):
   - Click on the sidebar
   - Enter your OpenAI API key
   - Click "Connect to OpenAI"

2. **Upload Image**:
   - Drag and drop an image
   - Or click to select a file

3. **Detect Device**:
   - Click "Detect Device"
   - Wait for analysis

4. **Export Results**:
   - Review detection results
   - Click "Download Excel Report"

## 📚 For More Information

See `REACT_SETUP.md` for detailed documentation.

---

**Enjoy your new React-powered Device Detector! 🎉**
