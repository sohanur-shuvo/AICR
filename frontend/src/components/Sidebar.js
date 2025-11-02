import React, { useState } from 'react';
import './Sidebar.css';
import { buildUrl } from '../api';

function Sidebar({
  systemStatus,
  detectionMode,
  setDetectionMode,
  enableOcr,
  setEnableOcr,
  confThreshold,
  setConfThreshold,
  apiKey,
  setApiKey,
  apiKeyValid,
  validateApiKey,
  onRefreshStatus
}) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [modelUploading, setModelUploading] = useState(false);
  const [modelMessage, setModelMessage] = useState('');

  const handleConnect = async () => {
    if (!apiKeyInput || !apiKeyInput.startsWith('sk-')) {
      setMessage('Please enter a valid API key (starts with sk-)');
      return;
    }

    setConnecting(true);
    setMessage('');

    const isValid = await validateApiKey(apiKeyInput);

    if (isValid) {
      try {
        // Persist key to backend .env
        const res = await fetch(buildUrl('/save-api-key'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: apiKeyInput })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to save API key');
        }
        setMessage('✅ API key saved. You will not need to enter it again.');
        setApiKey(apiKeyInput);
      } catch (e) {
        setMessage(`❌ ${e.message}`);
      }
    } else {
      setMessage('❌ Invalid API key or connection failed');
    }

    setConnecting(false);
  };

  const handleClearApiKey = () => {
    setApiKeyInput('');
    setApiKey('');
    setMessage('');
  };

  const handleModelUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pt')) {
      setModelMessage('Please select a .pt model file');
      return;
    }

    try {
      setModelUploading(true);
      setModelMessage('');
      const formData = new FormData();
      formData.append('model_file', file);

      const res = await fetch(buildUrl('/upload-model'), {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Upload failed');
      }

      setModelMessage('✅ Model uploaded. Switched to YOLO detection.');
      setDetectionMode('yolo');
    } catch (err) {
      setModelMessage(`❌ ${err.message}`);
    } finally {
      setModelUploading(false);
      // Optionally refresh status on parent by reloading window or provide a callback
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>⚙️ Configuration</h2>
      </div>

      <div className="sidebar-section">
        <h3>🔑 OpenAI API Key</h3>

        {systemStatus.has_openai && apiKeyValid ? (
          <div className="api-key-status">
            <div className="success-message">✅ API Key loaded</div>
            <small>Key: {apiKey.substring(0, 7)}...{apiKey.substring(apiKey.length - 4)}</small>
          </div>
        ) : (
          <>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="api-key-input"
            />
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="btn-primary"
            >
              {connecting ? 'Connecting...' : '🔗 Connect to OpenAI'}
            </button>
            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
            <small className="help-text">
              💡 Get your API key from{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                OpenAI Platform
              </a>
            </small>
          </>
        )}

        {apiKey && (
          <button onClick={handleClearApiKey} className="btn-secondary">
            🗑️ Clear API Key
          </button>
        )}
      </div>

      <div className="divider"></div>

      {(systemStatus.has_yolo_model && systemStatus.has_openai) && (
        <>
          <div className="sidebar-section">
            <h3>Detection Mode</h3>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="yolo"
                  checked={detectionMode === 'yolo'}
                  onChange={(e) => setDetectionMode(e.target.value)}
                />
                <span>YOLO Model</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="openai"
                  checked={detectionMode === 'openai'}
                  onChange={(e) => setDetectionMode(e.target.value)}
                />
                <span>OpenAI Vision</span>
              </label>
            </div>
          </div>
          <div className="divider"></div>
        </>
      )}

      <div className="sidebar-section">
        <h3>🔍 OCR Settings</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={enableOcr}
            onChange={(e) => setEnableOcr(e.target.checked)}
          />
          <span>Enable OCR/Text Extraction (OpenAI Vision only)</span>
        </label>
        <small className="help-text">Text extraction runs in OpenAI mode; disabled for YOLO</small>
      </div>

      {detectionMode === 'yolo' && (
        <>
          <div className="divider"></div>
          <div className="sidebar-section">
            <h3>Confidence Threshold</h3>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={confThreshold}
              onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
              className="slider"
            />
            <div className="threshold-value">{(confThreshold * 100).toFixed(0)}%</div>
          </div>
        </>
      )}

      <div className="divider"></div>

      <div className="sidebar-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3>📊 System Status</h3>
          {onRefreshStatus && (
            <button
              onClick={onRefreshStatus}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(102, 126, 234, 0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
              title="Refresh Status"
            >
              🔄
            </button>
          )}
        </div>
        <div className="status-item">
          <span className={systemStatus.has_yolo_model ? 'status-success' : 'status-warning'}>
            {systemStatus.has_yolo_model ? '✅' : '⚠️'} YOLO Model
          </span>
        </div>
        <div className="status-item">
          <span className={systemStatus.has_openai || apiKeyValid ? 'status-success' : 'status-warning'}>
            {systemStatus.has_openai || apiKeyValid ? '✅' : '⚠️'} OpenAI API
          </span>
          {!systemStatus.has_openai && !apiKeyValid && (
            <small>Enter API key above or set OPENAI_API_KEY in Railway</small>
          )}
        </div>
        {/* YOLO model upload */}
        <div className="status-item">
          <label className="api-key-input" style={{ display: 'block', cursor: 'pointer' }}>
            Upload YOLO .pt file
            <input
              type="file"
              accept=".pt"
              onChange={handleModelUpload}
              disabled={modelUploading}
              style={{ display: 'block', marginTop: 8 }}
            />
          </label>
          {modelUploading && <small>Uploading model...</small>}
          {modelMessage && (
            <div className={`message ${modelMessage.startsWith('✅') ? 'success' : 'error'}`}>
              {modelMessage}
            </div>
          )}
        </div>
      </div>

      <div className="divider"></div>

      <div className="sidebar-section">
        <h3>ℹ️ About</h3>
        {detectionMode === 'yolo' ? (
          <p className="info-text">
            Using custom-trained YOLO model for fast, accurate detection of specific device models.
          </p>
        ) : (
          <p className="info-text">
            Using OpenAI Vision API to identify any network device, even without custom training.
          </p>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
