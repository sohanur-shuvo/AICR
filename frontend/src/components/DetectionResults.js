import React from 'react';
import './DetectionResults.css';

function DetectionResults({ results, batchResults, ocrData, imagePreview, imagePreviews, onExportExcel, mode }) {
  const getConfidenceClass = (confidence) => {
    if (confidence === 'High') return 'confidence-high';
    if (confidence === 'Medium') return 'confidence-medium';
    return 'confidence-low';
  };

  if (mode === 'batch') {
    // Batch Results Display
    const totalDevices = batchResults?.reduce((sum, result) => sum + result.device_count, 0) || 0;
    const successCount = batchResults?.filter(r => r.success).length || 0;
    const failCount = batchResults?.filter(r => !r.success).length || 0;

    return (
      <div className="detection-results-container">
        <div className="results-header">
          <h2>📋 Batch Detection Results</h2>
          <div className="batch-summary">
            <span className="summary-item">
              📊 Total Images: <strong>{batchResults?.length || 0}</strong>
            </span>
            <span className="summary-item success">
              ✅ Success: <strong>{successCount}</strong>
            </span>
            {failCount > 0 && (
              <span className="summary-item error">
                ❌ Failed: <strong>{failCount}</strong>
              </span>
            )}
            <span className="summary-item">
              🔌 Total Devices: <strong>{totalDevices}</strong>
            </span>
          </div>
        </div>

        {/* Batch Results List */}
        <div className="batch-results-list">
          {batchResults && batchResults.map((result, index) => (
            <div key={index} className={`batch-result-card ${result.success ? 'success' : 'error'}`}>
              <div className="batch-result-header">
                <div className="result-title">
                  <h3>
                    {result.success ? '✅' : '❌'} Image {result.image_index}: {result.image_name}
                  </h3>
                  <span className="device-count-badge">
                    {result.device_count} device{result.device_count !== 1 ? 's' : ''}
                  </span>
                </div>
                {imagePreviews && imagePreviews[index] && (
                  <img
                    src={imagePreviews[index]}
                    alt={`Preview ${index + 1}`}
                    className="batch-result-thumbnail"
                  />
                )}
              </div>

              {result.success ? (
                <>
                  {result.devices && result.devices.length > 0 ? (
                    <div className="devices-list">
                      {result.devices.map((device, deviceIndex) => (
                        <div key={deviceIndex} className="device-card mini">
                          <div className="device-info-compact">
                            <div className="info-row">
                              <span className="info-label">Type:</span>
                              <span className="info-value">{device.device_type}</span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Brand:</span>
                              <span className="info-value">{device.brand}</span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Model:</span>
                              <span className="info-value">{device.model}</span>
                            </div>
                            {device.serial && device.serial !== 'Unknown' && (
                              <div className="info-row">
                                <span className="info-label">Serial:</span>
                                <span className="info-value">{device.serial}</span>
                              </div>
                            )}
                            <div className="info-row">
                              <span className="info-label">Ports:</span>
                              <span className="info-value">{device.port_count}</span>
                            </div>
                            <span className={`confidence-badge mini ${getConfidenceClass(device.confidence)}`}>
                              {device.confidence}
                            </span>
                          </div>
                          {device.text_on_device && device.text_on_device !== 'Unknown' && device.text_on_device.trim() && (
                            <div className="device-description-mini">
                              <strong>📝 Text from device:</strong> {device.text_on_device}
                            </div>
                          )}
                          {device.description && (
                            <p className="device-description-mini">{device.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-devices">No devices detected in this image</p>
                  )}

                  {result.ocr_data && result.ocr_data.extracted_text && result.ocr_data.extracted_text !== 'No text detected' && (
                    <details className="ocr-details">
                      <summary>📝 OCR Results</summary>
                      <div className="ocr-grid-mini">
                        <div><strong>Brand:</strong> {result.ocr_data.brand}</div>
                        <div><strong>Model:</strong> {result.ocr_data.model}</div>
                        <div><strong>Serial:</strong> {result.ocr_data.serial}</div>
                        <div><strong>Ports:</strong> {result.ocr_data.port_count}</div>
                      </div>
                    </details>
                  )}
                </>
              ) : (
                <div className="error-message">
                  ⚠️ Error: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Export Section */}
        <div className="export-section">
          <button onClick={onExportExcel} className="btn-export">
            📊 Download Complete Excel Report ({totalDevices} devices)
          </button>
          <div className="export-info">
            <small>
              💡 Excel Report includes:
              <ul>
                <li>All {batchResults?.length || 0} images processed</li>
                <li>All {totalDevices} devices detected</li>
                <li>OCR results for each image</li>
                <li>Summary statistics</li>
              </ul>
            </small>
          </div>
        </div>
      </div>
    );
  }

  // Single Image Results Display
  return (
    <div className="detection-results-container">
      <div className="results-header">
        <h2>📋 Detection Results</h2>
        <p className="results-count">
          {results?.length || 0} device{results?.length !== 1 ? 's' : ''} detected
        </p>
      </div>

      {/* OCR Results */}
      {ocrData && ocrData.extracted_text && ocrData.extracted_text !== 'No text detected' && (
        <div className="ocr-section">
          <h3>📝 OCR Extracted Information</h3>
          <div className="ocr-grid">
            <div className="ocr-item">
              <span className="ocr-label">Brand:</span>
              <span className="ocr-value">{ocrData.brand}</span>
            </div>
            <div className="ocr-item">
              <span className="ocr-label">Model:</span>
              <span className="ocr-value">{ocrData.model}</span>
            </div>
            <div className="ocr-item">
              <span className="ocr-label">Serial:</span>
              <span className="ocr-value">{ocrData.serial}</span>
            </div>
            <div className="ocr-item">
              <span className="ocr-label">Port Count:</span>
              <span className="ocr-value">{ocrData.port_count}</span>
            </div>
          </div>
          <details className="extracted-text">
            <summary>View Extracted Text</summary>
            <pre>{ocrData.extracted_text}</pre>
          </details>
        </div>
      )}

      {/* Device Detection Results */}
      <div className="devices-list">
        {results && results.map((device, index) => (
          <div key={index} className="device-card">
            <div className="device-header">
              <div className="device-title">
                <h3>🔌 Device #{index + 1}</h3>
                <span className={`confidence-badge ${getConfidenceClass(device.confidence)}`}>
                  {device.confidence} Confidence
                </span>
              </div>
            </div>

            <div className="device-info">
              <div className="info-row">
                <span className="info-label">Type:</span>
                <span className="info-value">{device.device_type}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Brand:</span>
                <span className="info-value">{device.brand}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Model:</span>
                <span className="info-value">{device.model}</span>
              </div>
              {device.serial && device.serial !== 'Unknown' && (
                <div className="info-row">
                  <span className="info-label">Serial:</span>
                  <span className="info-value">{device.serial}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Port Count:</span>
                <span className="info-value">
                  {device.port_count}
                  {device.port_count === 'Unknown' && (
                    <span className="port-warning"> ⚠️ Not detected</span>
                  )}
                </span>
              </div>
            </div>

            {device.text_on_device && device.text_on_device !== 'Unknown' && device.text_on_device.trim() && (
              <div className="device-features">
                <h4>📝 Text Read from Device (OpenAI Vision):</h4>
                <p>{device.text_on_device}</p>
              </div>
            )}

            {device.features && (
              <div className="device-features">
                <h4>🔍 Visible Features:</h4>
                <p>{device.features}</p>
              </div>
            )}

            {device.description && (
              <div className="device-description">
                <h4>📝 Description:</h4>
                <p>{device.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Export Section */}
      <div className="export-section">
        <button onClick={onExportExcel} className="btn-export">
          📊 Download Excel Report
        </button>
        <div className="export-info">
          <small>
            💡 Excel Report includes:
            <ul>
              <li>Device detections</li>
              <li>OCR results</li>
              <li>Summary statistics</li>
              <li>Device specifications</li>
            </ul>
          </small>
        </div>
      </div>
    </div>
  );
}

export default DetectionResults;
