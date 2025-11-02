import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import ImageUpload from './components/ImageUpload';
import DetectionResults from './components/DetectionResults';
import Header from './components/Header';
import AdminPanel from './components/AdminPanel';
import axios from 'axios';
import { buildUrl } from './api';

function App() {
  const [systemStatus, setSystemStatus] = useState({
    has_yolo_model: false,
    has_openai: false,
    detection_mode: null
  });

  const [apiKey, setApiKey] = useState('');
  const [apiKeyValid, setApiKeyValid] = useState(false);
  const [detectionMode, setDetectionMode] = useState('openai');
  const [enableOcr, setEnableOcr] = useState(true);
  const [confThreshold, setConfThreshold] = useState(0.25);

  // Upload mode: 'single' or 'batch'
  const [uploadMode, setUploadMode] = useState('single');

  // Single image state
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Batch images state
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [detecting, setDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'admin'

  // Fetch system status on mount
  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await axios.get(buildUrl('/status'));
      setSystemStatus(response.data);

      // Set detection mode based on availability
      if (response.data.detection_mode === 'openai') {
        setDetectionMode('openai');
        setApiKeyValid(true);
      } else if (response.data.detection_mode === 'yolo') {
        setDetectionMode('yolo');
      } else if (response.data.detection_mode === 'both') {
        setDetectionMode('openai');
        setApiKeyValid(true);
      }
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    }
  };

  const validateApiKey = async (key) => {
    try {
      const response = await axios.post(buildUrl('/validate-api-key'), {
        api_key: key
      });
      setApiKeyValid(response.data.valid);
      if (response.data.valid) {
        setApiKey(key);
      }
      return response.data.valid;
    } catch (err) {
      console.error('API key validation failed:', err);
      setApiKeyValid(false);
      return false;
    }
  };

  const handleImageUpload = (file) => {
    setUploadedImage(file);
    setDetectionResults(null);
    setBatchResults(null);
    setOcrData(null);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleBatchUpload = (files) => {
    setUploadedImages(files);
    setDetectionResults(null);
    setBatchResults(null);
    setOcrData(null);
    setError(null);

    // Create previews for all files
    const previews = [];
    let loadedCount = 0;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews[index] = reader.result;
        loadedCount++;

        if (loadedCount === files.length) {
          setImagePreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDetection = async () => {
    if (uploadMode === 'single') {
      await handleSingleDetection();
    } else {
      await handleBatchDetection();
    }
  };

  const handleSingleDetection = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    if (detectionMode === 'openai' && !apiKeyValid && !systemStatus.has_openai) {
      setError('Please configure OpenAI API key');
      return;
    }

    setDetecting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedImage);
      formData.append('detection_mode', detectionMode);
      formData.append('enable_ocr', enableOcr);

      if (apiKey && detectionMode === 'openai') {
        formData.append('api_key', apiKey);
      }

      const response = await axios.post(buildUrl('/detect'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setDetectionResults(response.data.devices);
      setOcrData(response.data.ocr_data);

    } catch (err) {
      setError(err.response?.data?.detail || 'Detection failed. Please try again.');
      console.error('Detection error:', err);
    } finally {
      setDetecting(false);
    }
  };

  const handleBatchDetection = async () => {
    if (!uploadedImages || uploadedImages.length === 0) {
      setError('Please upload images first');
      return;
    }

    if (detectionMode === 'openai' && !apiKeyValid && !systemStatus.has_openai) {
      setError('Please configure OpenAI API key');
      return;
    }

    setDetecting(true);
    setError(null);

    try {
      const formData = new FormData();

      // Append all files
      Array.from(uploadedImages).forEach((file) => {
        formData.append('files', file);
      });

      formData.append('detection_mode', detectionMode);
      formData.append('enable_ocr', enableOcr);

      if (apiKey && detectionMode === 'openai') {
        formData.append('api_key', apiKey);
      }

      const response = await axios.post(buildUrl('/detect-batch'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setBatchResults(response.data.batch_results);

    } catch (err) {
      setError(err.response?.data?.detail || 'Batch detection failed. Please try again.');
      console.error('Batch detection error:', err);
    } finally {
      setDetecting(false);
    }
  };

  const handleExportExcel = async () => {
    let allDevices = [];
    let allOcrData = ocrData;

    if (uploadMode === 'single' && detectionResults && detectionResults.length > 0) {
      allDevices = detectionResults;
    } else if (uploadMode === 'batch' && batchResults) {
      // Flatten all devices from batch results
      batchResults.forEach((result) => {
        if (result.devices) {
          result.devices.forEach((device) => {
            allDevices.push({
              ...device,
              source_image: result.image_name
            });
          });
        }
      });
    }

    if (allDevices.length === 0) {
      setError('No detection results to export');
      return;
    }

    try {
      const response = await axios.post(
        buildUrl('/export-excel'),
        {
          devices: allDevices,
          ocr_data: allOcrData
        },
        {
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `device_detection_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      setError('Failed to export Excel file');
      console.error('Export error:', err);
    }
  };

  // Show admin panel if view is admin
  if (currentView === 'admin') {
    return (
      <div className="App">
        <div className="main-content" style={{ marginLeft: 0 }}>
          <div style={{ marginBottom: '1rem', padding: '1rem' }}>
            <button
              onClick={() => setCurrentView('main')}
              style={{
                padding: '0.5rem 1rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ← Back to Detection
            </button>
          </div>
          <AdminPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Sidebar
        systemStatus={systemStatus}
        detectionMode={detectionMode}
        setDetectionMode={setDetectionMode}
        enableOcr={enableOcr}
        setEnableOcr={setEnableOcr}
        confThreshold={confThreshold}
        setConfThreshold={setConfThreshold}
        apiKey={apiKey}
        setApiKey={setApiKey}
        apiKeyValid={apiKeyValid}
        validateApiKey={validateApiKey}
      />

      <div className="main-content">
        <Header 
          onNavigateAdmin={() => setCurrentView('admin')}
        />

        <div className="content-container">
          {systemStatus.detection_mode === null && (
            <div className="warning-banner">
              ⚠️ No detection method available! Please configure OpenAI API key or train a YOLO model.
            </div>
          )}

          <div className="mode-indicator" data-mode={detectionMode}>
            {detectionMode === 'yolo' ? '🎯 Mode: Custom YOLO Model' : '🤖 Mode: OpenAI Vision API'}
          </div>

          {error && (
            <div className="error-banner">
              ❌ {error}
            </div>
          )}

          <ImageUpload
            onImageUpload={handleImageUpload}
            onBatchUpload={handleBatchUpload}
            imagePreview={imagePreview}
            imagePreviews={imagePreviews}
            onDetect={handleDetection}
            detecting={detecting}
            disabled={systemStatus.detection_mode === null}
            uploadMode={uploadMode}
            setUploadMode={setUploadMode}
          />

          {uploadMode === 'single' && detectionResults && (
            <DetectionResults
              results={detectionResults}
              ocrData={ocrData}
              imagePreview={imagePreview}
              onExportExcel={handleExportExcel}
              mode="single"
            />
          )}

          {uploadMode === 'batch' && batchResults && (
            <DetectionResults
              results={null}
              batchResults={batchResults}
              imagePreviews={imagePreviews}
              onExportExcel={handleExportExcel}
              mode="batch"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
