import React, { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import './ImageUpload.css';

function ImageUpload({ onImageUpload, onBatchUpload, imagePreview, imagePreviews, onDetect, detecting, disabled, uploadMode, setUploadMode }) {
  const fileInputRef = useRef(null);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        if (uploadMode === 'single') {
          onImageUpload(acceptedFiles[0]);
        } else {
          // Batch mode
          onBatchUpload(acceptedFiles);
        }
      }
    },
    [onImageUpload, onBatchUpload, uploadMode]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.bmp', '.jfif']
    },
    multiple: uploadMode === 'batch',
    disabled: disabled,
    noClick: false,
    noKeyboard: false
  });

  const handleModeChange = (mode) => {
    setUploadMode(mode);
    // Clear previous uploads when switching modes
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (uploadMode === 'single') {
        onImageUpload(files[0]);
      } else {
        onBatchUpload(Array.from(files));
      }
    }
  };

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    window.location.reload();
  };

  return (
    <div className="image-upload-container">
      <div className="upload-section">
        <div className="upload-header">
          <h2>📷 Upload Image{uploadMode === 'batch' ? 's' : ''}</h2>

          {/* Upload Mode Toggle */}
          <div className="upload-mode-toggle">
            <button
              className={`mode-btn ${uploadMode === 'single' ? 'active' : ''}`}
              onClick={() => handleModeChange('single')}
              disabled={detecting}
            >
              📄 Single Image
            </button>
            <button
              className={`mode-btn ${uploadMode === 'batch' ? 'active' : ''}`}
              onClick={() => handleModeChange('batch')}
              disabled={detecting}
            >
              Batch Upload
            </button>
          </div>
        </div>

        {uploadMode === 'single' ? (
          // Single Image Upload
          !imagePreview ? (
            <div>
              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
              >
                <input {...getInputProps()} />
                <div className="dropzone-content">
                  <div className="upload-icon">📤</div>
                  {isDragActive ? (
                    <p>Drop the image here...</p>
                  ) : (
                    <>
                      <p>Drag & drop an image here, or click to select</p>
                      <small>Supported formats: JPG, JPEG, PNG, BMP, JFIF</small>
                    </>
                  )}
                </div>
              </div>

              {/* Alternative file input */}
              <div className="alternative-upload">
                <label htmlFor="file-input-single" className="file-input-label">
                  Or browse files
                </label>
                <input
                  id="file-input-single"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.bmp,.jfif"
                  onChange={handleFileInputChange}
                  disabled={disabled}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          ) : (
            <div className="preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <div className="image-actions">
                <button
                  onClick={onDetect}
                  disabled={detecting || disabled}
                  className="btn-detect"
                >
                  {detecting ? (
                    <>
                      <span className="spinner"></span>
                      Analyzing...
                    </>
                  ) : (
                    <>Detect Device</>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  className="btn-clear"
                  disabled={detecting}
                >
                  Clear Image
                </button>
              </div>
            </div>
          )
        ) : (
          // Batch Upload Mode
          <div>
            {(!imagePreviews || imagePreviews.length === 0) ? (
              <div>
                <div
                  {...getRootProps()}
                  className={`dropzone batch-dropzone ${isDragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                >
                  <input {...getInputProps()} />
                  <div className="dropzone-content">
                    <div className="upload-icon">Upload</div>
                    {isDragActive ? (
                      <p>Drop the images here...</p>
                    ) : (
                      <>
                        <p>Drag & drop multiple images here, or click to select</p>
                        <small>You can select multiple images at once</small>
                        <small>Supported formats: JPG, JPEG, PNG, BMP, JFIF</small>
                      </>
                    )}
                  </div>
                </div>

                {/* Alternative file input for batch */}
                <div className="alternative-upload">
                  <label htmlFor="file-input-batch" className="file-input-label">
                    Or browse multiple files
                  </label>
                  <input
                    id="file-input-batch"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.bmp,.jfif"
                    multiple
                    onChange={handleFileInputChange}
                    disabled={disabled}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            ) : (
              <div className="batch-preview-container">
                <div className="batch-info">
                  <h3>{imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''} selected</h3>
                  <p>Ready to process in batch mode</p>
                </div>

                <div className="batch-preview-grid">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="batch-preview-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <span className="preview-label">Image {index + 1}</span>
                    </div>
                  ))}
                </div>

                <div className="image-actions">
                  <button
                    onClick={onDetect}
                    disabled={detecting || disabled}
                    className="btn-detect"
                  >
                    {detecting ? (
                      <>
                        <span className="spinner"></span>
                        Processing {imagePreviews.length} images...
                      </>
                    ) : (
                      <>Detect All Devices ({imagePreviews.length} images)</>
                    )}
                  </button>
                  <button
                    onClick={handleClear}
                    className="btn-clear"
                    disabled={detecting}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {disabled && (
          <div className="disabled-message">
            Warning: Please configure a detection method in the sidebar first
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUpload;
