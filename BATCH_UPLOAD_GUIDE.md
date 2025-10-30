# Batch Upload Feature Guide

## ✅ Successfully Implemented!

The React application now supports both **Single Image Upload** and **Batch Upload** modes with full functionality.

---

## 🎯 Features

### 1. Upload Mode Toggle
- **Single Image Mode**: Process one image at a time
- **Batch Upload Mode**: Process multiple images simultaneously

### 2. Multiple Upload Methods
Each mode supports **three ways** to upload:

#### For Single Image Mode:
1. **Drag & Drop**: Drag an image onto the dropzone
2. **Click Dropzone**: Click the dropzone area to open file browser
3. **Browse Button**: Click "Or browse files" button below dropzone

#### For Batch Mode:
1. **Drag & Drop**: Drag multiple images onto the dropzone
2. **Click Dropzone**: Click to select multiple files at once
3. **Browse Button**: Click "Or browse multiple files" button

---

## 🚀 How to Use

### Access the Application:
- **Local**: http://localhost:3000
- **Network**: http://192.168.1.194:3000

### Step-by-Step Guide:

#### Single Image Mode (Default):

1. **Open the app** at http://localhost:3000
2. **Configure API Key** (if needed):
   - Enter your OpenAI API key in the sidebar
   - Click "Connect to OpenAI"
   - Wait for "✅ Connected successfully!"

3. **Upload an image** using any method:
   - **Method A**: Drag & drop an image
   - **Method B**: Click the blue dropzone area
   - **Method C**: Click "Or browse files" button

4. **View the preview** of your uploaded image

5. **Click "🔍 Detect Device"** button

6. **View results**:
   - Device information
   - OCR extracted text
   - Port count
   - Device specifications

7. **Export to Excel**:
   - Click "📊 Download Excel Report"

#### Batch Upload Mode:

1. **Switch to Batch Mode**:
   - Click "📚 Batch Upload" button at the top

2. **Upload multiple images** using any method:
   - **Method A**: Drag & drop multiple images
   - **Method B**: Click the dropzone and select multiple files
   - **Method C**: Click "Or browse multiple files" button

3. **View preview grid**:
   - See thumbnails of all selected images
   - Image count displayed
   - "Ready to process" message

4. **Click "🔍 Detect All Devices (X images)"**

5. **Wait for processing**:
   - Progress indicator shows
   - All images processed sequentially

6. **View batch results**:
   - Summary statistics
     - Total images processed
     - Success/failure count
     - Total devices detected
   - Individual results for each image:
     - Image thumbnail
     - Devices detected
     - OCR results
     - Success/error status

7. **Export comprehensive report**:
   - Click "📊 Download Complete Excel Report"
   - Get Excel file with all devices from all images

---

## 💡 Usage Tips

### Single Image Mode - Best For:
- ✅ Quick device identification
- ✅ Testing detection accuracy
- ✅ Detailed analysis of one device
- ✅ Learning how the system works

### Batch Mode - Best For:
- ✅ Processing multiple devices at once
- ✅ Inventory documentation
- ✅ Network equipment audit
- ✅ Bulk device cataloging
- ✅ Time-efficient processing

---

## 📊 Expected Results

### Single Image Detection:
```
Input: 1 image of a router
Output:
  - Device Type: Router
  - Brand: Cisco
  - Model: ISR 4331
  - Port Count: 4 ports
  - Confidence: High
  - Description: Enterprise-grade router...
  - OCR: Brand, model, serial number extracted
```

### Batch Detection:
```
Input: 5 images (3 routers, 2 switches)
Output:
  Summary:
    - Total Images: 5
    - Success: 5
    - Total Devices: 5

  Results per image:
    Image 1: 1 router detected
    Image 2: 1 router detected
    Image 3: 1 router detected
    Image 4: 1 switch detected
    Image 5: 1 switch detected
```

---

## 🔧 Troubleshooting

### Problem: Can't upload images

**Solutions:**

1. **Check if API key is configured**:
   - Enter API key in sidebar
   - Click "Connect to OpenAI"

2. **Try alternative upload method**:
   - If drag & drop doesn't work, use "Or browse files" button
   - Button is located below the dropzone

3. **Check file format**:
   - Supported: JPG, JPEG, PNG, BMP, JFIF
   - File size: Under 10MB recommended

4. **Check browser console**:
   - Press F12 to open developer tools
   - Look for errors in Console tab

5. **Refresh the page**:
   - Press F5 or Ctrl+R
   - Try uploading again

### Problem: Images upload but detection fails

**Solutions:**

1. **Verify API key is valid**:
   - Check OpenAI account has credits
   - Key should start with `sk-`

2. **Check network connection**:
   - Backend must be running on port 8000
   - Frontend must be running on port 3000

3. **Check image quality**:
   - Image should be clear and not blurry
   - Device should be visible in the image

### Problem: Batch mode not working

**Solutions:**

1. **Ensure multiple file selection**:
   - When using file browser, hold Ctrl (Windows) or Cmd (Mac) to select multiple files
   - Or use "Select All" after opening file browser

2. **Check each image individually**:
   - Switch to Single Image mode
   - Test each image one by one

3. **Reduce batch size**:
   - Try with 2-3 images first
   - Increase gradually

---

## 🎨 UI Features

### Visual Indicators:
- 🟢 **Active button**: Blue background (selected mode)
- ⚪ **Inactive button**: Gray background
- 🔵 **Dropzone hover**: Blue border when dragging
- ✅ **Success badge**: Green for high confidence
- ⚠️ **Warning badge**: Orange for medium confidence
- ❌ **Error badge**: Red for low confidence or failure

### Loading States:
- 🔄 **Spinner**: Animated during detection
- 📊 **Progress text**: "Analyzing..." or "Processing X images..."
- 🔒 **Disabled buttons**: Gray out during processing

### Preview Display:
- **Single**: Full-size preview before detection
- **Batch**: Grid of thumbnails with labels
- **Results**: Cards with device information

---

## 📁 File Outputs

### Excel Report Structure:

**Single Image:**
- Sheet 1: Device_Detections
  - Detection_ID
  - Device_Type
  - Brand
  - Model
  - Port_Count
  - Confidence
  - Features
  - Description
  - Detection_Time

- Sheet 2: OCR_Results
  - Brand, Model, Serial, Port_Count

- Sheet 3: Summary
  - Total devices, confidence breakdown, date/time

**Batch Images:**
- All devices from all images
- Additional column: source_image
- Aggregated summary statistics

---

## 🔌 API Endpoints Used

### Single Detection:
```
POST http://localhost:8000/detect
- file: image file
- detection_mode: "openai" or "yolo"
- enable_ocr: true/false
- api_key: (optional)
```

### Batch Detection:
```
POST http://localhost:8000/detect-batch
- files: multiple image files
- detection_mode: "openai" or "yolo"
- enable_ocr: true/false
- api_key: (optional)
```

### Excel Export:
```
POST http://localhost:8000/export-excel
- devices: array of device objects
- ocr_data: OCR results
```

---

## 🎯 Best Practices

### For Best Detection Results:

1. **Image Quality**:
   - Use well-lit photos
   - Avoid shadows and glare
   - Keep camera steady (no blur)

2. **Device Positioning**:
   - Capture front panel clearly
   - Include all ports if possible
   - Avoid extreme angles

3. **Image Framing**:
   - Device should fill most of frame
   - Avoid too much background
   - Include device labels

4. **Batch Processing**:
   - Use consistent lighting across images
   - Similar framing for all images
   - Process related devices together

### For Optimal Performance:

1. **Single Mode**:
   - Best for immediate feedback
   - Use when learning the system

2. **Batch Mode**:
   - Process 5-10 images at once
   - Larger batches may take longer
   - Use when efficiency is priority

---

## 📈 Performance

### Processing Times (Approximate):

**Single Image Mode**:
- OpenAI Vision: 2-5 seconds per image
- YOLO Model: < 1 second per image
- OCR: + 1-2 seconds if enabled

**Batch Mode**:
- 5 images: ~10-25 seconds (OpenAI)
- 10 images: ~20-50 seconds (OpenAI)
- 20 images: ~40-100 seconds (OpenAI)

*YOLO mode is significantly faster but requires trained model*

---

## ✅ System Status

### Check System Health:
1. Open http://localhost:3000
2. Look at sidebar "System Status" section
3. Check indicators:
   - ✅ YOLO Model: Available/Not Available
   - ✅ OpenAI API: Connected/Not Connected

### Both Available:
- You can choose between YOLO and OpenAI mode
- Toggle in sidebar

### Only OpenAI Available:
- Use OpenAI Vision mode (default)
- No YOLO model training required

### Only YOLO Available:
- Must have trained model at `models/best.pt`
- Faster but limited to trained devices

---

## 🎓 Examples

### Example 1: Single Router Detection
```
1. Upload: router_cisco_isr4331.jpg
2. Detect
3. Results:
   - Type: Router
   - Brand: Cisco
   - Model: ISR 4331
   - Ports: 4x GE WAN
   - Confidence: High
4. Export to Excel
```

### Example 2: Batch Network Equipment
```
1. Switch to Batch Mode
2. Upload:
   - router1.jpg
   - router2.jpg
   - switch1.jpg
   - switch2.jpg
   - server1.jpg
3. Detect All
4. View Results:
   - 2 routers detected
   - 2 switches detected
   - 1 server detected
5. Export comprehensive report
```

---

## 📞 Support

### If you encounter issues:

1. **Check this guide** first
2. **Verify system requirements**:
   - Python 3.8+
   - Node.js 16+
   - OpenAI API key
3. **Check console logs**:
   - Backend: Terminal running `python api.py`
   - Frontend: Browser Developer Tools (F12)
4. **Restart services**:
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Start both again

---

## 🎉 Success!

The batch upload feature is fully functional! Both single and batch modes work seamlessly with:
- ✅ Three upload methods each
- ✅ Preview functionality
- ✅ Real-time detection
- ✅ Comprehensive results
- ✅ Excel export

**Open http://localhost:3000 and start detecting devices!** 🚀
