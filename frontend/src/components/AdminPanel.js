import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function AdminPanel() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '' });
  const [createdKey, setCreatedKey] = useState(null);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [viewKey, setViewKey] = useState(null); // { name, api_key }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { customer, api_key }
  const [deleting, setDeleting] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('python');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/customers`);
      setCustomers(response.data.customers || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setError(null);
    setCreatedKey(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/admin/customers`, {
        name: newCustomer.name,
        email: newCustomer.email
      });

      setCreatedKey({
        api_key: response.data.api_key,
        customer: response.data.customer
      });
      setNewCustomer({ name: '', email: '' });
      await loadCustomers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create customer');
      console.error('Error creating customer:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDeleteCustomer = async () => {
    if (!deleteConfirm) return;

    try {
      setDeleting(true);
      setError(null);
      
      // Use POST variant to avoid browsers/servers that reject DELETE bodies
      await axios.post(`${API_BASE_URL}/admin/customers/delete`, {
        api_key: deleteConfirm.api_key
      });

      setDeleteConfirm(null);
      await loadCustomers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete customer');
      console.error('Error deleting customer:', err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const totalRequests = customers.reduce((sum, c) => sum + (c.request_count || 0), 0);
  const activeCustomers = customers.filter(c => c.active).length;
  const filteredCustomers = customers.filter(c => {
    const q = filterText.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.customer_id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🔑 API Key Management</h1>
        <p className="admin-subtitle">Manage customer API keys and monitor usage</p>
      </div>

      {error && (
        <div className="admin-error-banner">
          ❌ {error}
        </div>
      )}

      {copySuccess && (
        <div className="admin-success-banner">
          ✅ API Key copied to clipboard!
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-value">{customers.length}</div>
          <div className="stat-label">Total Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeCustomers}</div>
          <div className="stat-label">Active Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalRequests.toLocaleString()}</div>
          <div className="stat-label">Total API Requests</div>
        </div>
      </div>

      {/* Create Customer Button */}
      <div className="admin-actions">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon">🔎</span>
            <input
              type="text"
              placeholder="Search customers by name, email, or ID"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            {filterText && (
              <button className="btn-clear-search" onClick={() => setFilterText('')} title="Clear">
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="toolbar-right">
          <button
            className="btn-create-customer"
            onClick={() => {
              setShowCreateDialog(true);
              setCreatedKey(null);
              setError(null);
            }}
          >
            ➕ Create New API Key
          </button>
          <button className="btn-refresh" onClick={loadCustomers}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Create Customer Dialog */}
      {showCreateDialog && (
        <div className="admin-dialog-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <h2>Create New Customer API Key</h2>
              <button
                className="btn-close"
                onClick={() => {
                  setShowCreateDialog(false);
                  setCreatedKey(null);
                }}
              >
                ✕
              </button>
            </div>

            {createdKey ? (
              <div className="api-key-success">
                <div className="success-icon">✅</div>
                <h3>API Key Created Successfully!</h3>
                <p className="warning-text">
                  ⚠️ <strong>Save this API key now!</strong> You won't be able to see it again.
                </p>

                <div className="api-key-display">
                  <div className="api-key-label">Customer:</div>
                  <div className="api-key-value">{createdKey.customer.name}</div>
                  {createdKey.customer.email && (
                    <>
                      <div className="api-key-label">Email:</div>
                      <div className="api-key-value">{createdKey.customer.email}</div>
                    </>
                  )}

                  <div className="api-key-label">API Key:</div>
                  <div className="api-key-box">
                    <code className="api-key-text">{createdKey.api_key}</code>
                    <button
                      className="btn-copy"
                      onClick={() => copyToClipboard(createdKey.api_key)}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>

                <div className="api-key-usage">
                  <h4>How to Use - Send to Customer:</h4>
                  
                  <div className="code-tabs">
                    <div 
                      className={`code-tab ${activeCodeTab === 'python' ? 'active' : ''}`}
                      onClick={() => setActiveCodeTab('python')}
                    >
                      Python
                    </div>
                    <div 
                      className={`code-tab ${activeCodeTab === 'javascript' ? 'active' : ''}`}
                      onClick={() => setActiveCodeTab('javascript')}
                    >
                      JavaScript
                    </div>
                    <div 
                      className={`code-tab ${activeCodeTab === 'curl' ? 'active' : ''}`}
                      onClick={() => setActiveCodeTab('curl')}
                    >
                      cURL
                    </div>
                  </div>

                  <div className="code-examples">
                    <pre className={`code-example ${activeCodeTab === 'python' ? 'active' : ''}`}>
{`import requests
import base64

API_KEY = "${createdKey.api_key}"
API_URL = "${API_BASE_URL}/v1/detect"

# Read and encode image
with open("router.jpg", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode()

# Detect devices
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
print(f"Detected {result['device_count']} device(s)")`}
                    </pre>

                    <pre className={`code-example ${activeCodeTab === 'javascript' ? 'active' : ''}`}>
{`const axios = require('axios');
const fs = require('fs');

const API_KEY = '${createdKey.api_key}';
const API_URL = '${API_BASE_URL}/v1/detect';

// Read and encode image
const imageBase64 = fs.readFileSync('router.jpg', 'base64');

// Detect devices
axios.post(API_URL, {
    image: imageBase64,
    detection_mode: 'openai',
    enable_ocr: true
}, {
    headers: { 'Authorization': API_KEY }
})
.then(response => {
    console.log(\`Detected \${response.data.device_count} device(s)\`);
});`}
                    </pre>

                    <pre className={`code-example ${activeCodeTab === 'curl' ? 'active' : ''}`}>
{`curl -X POST ${API_BASE_URL}/v1/detect \\
  -H "Authorization: ${createdKey.api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{"image": "base64_image", "detection_mode": "openai"}'`}
                    </pre>
                  </div>

                  <div className="usage-note">
                    💡 <strong>Share this with your customer:</strong> Copy the code example above and send it along with their API key. 
                    They can use it immediately to integrate into their application.
                  </div>
                </div>

                <button
                  className="btn-done"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setCreatedKey(null);
                    setNewCustomer({ name: '', email: '' });
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateCustomer} className="admin-form">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="e.g., Acme Corporation"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Email (Optional)</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="customer@example.com"
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Create API Key
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon">📭</div>
            <h3>No customers yet</h3>
            <p>Create your first API key to get started</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon">🔎</div>
            <h3>No matches found</h3>
            <p>Try a different search term</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email</th>
                <th>API Key</th>
                <th>Created</th>
                <th>Requests</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer, index) => (
                <tr key={index}>
                  <td>
                    <strong>{customer.name || 'N/A'}</strong>
                    <br />
                    <small className="customer-id">{customer.customer_id}</small>
                  </td>
                  <td>{customer.email || '-'}</td>
                  <td>
                    <code className="api-key-preview">{customer.api_key_prefix}</code>
                    <button
                      className="btn-copy-small"
                      onClick={() => copyToClipboard(customer.api_key_prefix)}
                      title="Copy partial key"
                    >
                      📋
                    </button>
                    <button
                      className="btn-view-key"
                      title="View full key"
                      onClick={() => setViewKey({ name: customer.name || customer.customer_id, api_key: customer.api_key })}
                    >
                      👁 View
                    </button>
                  </td>
                  <td className="date-cell">{formatDate(customer.created_at)}</td>
                  <td>
                    <span className="request-count">{customer.request_count || 0}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${customer.active ? 'active' : 'inactive'}`}>
                      {customer.active ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => setDeleteConfirm({
                        customer: customer,
                        api_key: customer.api_key
                      })}
                      title="Delete API key"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="admin-dialog-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-dialog delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <h2>⚠️ Delete API Key</h2>
              <button
                className="btn-close"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                ✕
              </button>
            </div>

            <div className="delete-confirm-content">
              <p className="delete-warning">
                Are you sure you want to delete this API key? This action cannot be undone.
              </p>

              <div className="delete-customer-info">
                <div className="info-row">
                  <strong>Customer:</strong> {deleteConfirm.customer.name}
                </div>
                {deleteConfirm.customer.email && (
                  <div className="info-row">
                    <strong>Email:</strong> {deleteConfirm.customer.email}
                  </div>
                )}
                <div className="info-row">
                  <strong>API Key:</strong> <code className="api-key-small">{deleteConfirm.customer.api_key_prefix}</code>
                </div>
                <div className="info-row">
                  <strong>Total Requests:</strong> {deleteConfirm.customer.request_count || 0}
                </div>
              </div>

              <p className="delete-warning-red">
                ⚠️ Once deleted, this API key will immediately stop working. The customer will not be able to use it anymore.
              </p>

              <div className="form-actions">
                <button
                  className="btn-delete-confirm"
                  onClick={handleDeleteCustomer}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : '🗑️ Yes, Delete API Key'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Full API Key Dialog */}
      {viewKey && (
        <div className="admin-dialog-overlay" onClick={() => setViewKey(null)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <h2>🔑 API Key for {viewKey.name}</h2>
              <button className="btn-close" onClick={() => setViewKey(null)}>✕</button>
            </div>
            <div className="admin-form" style={{ paddingTop: 0 }}>
              <div className="api-key-display">
                <div className="api-key-label">Full API Key</div>
                <div className="api-key-box">
                  <code className="api-key-text">{viewKey.api_key}</code>
                  <button className="btn-copy" onClick={() => copyToClipboard(viewKey.api_key)}>📋 Copy</button>
                </div>
              </div>
              <div className="usage-note" style={{ marginTop: '1rem' }}>
                Use this key in the <strong>Authorization</strong> header. See <code>CUSTOMER_QUICK_START.md</code> for examples.
              </div>
              <div className="form-actions" style={{ marginTop: '1.25rem' }}>
                <button className="btn-secondary" onClick={() => setViewKey(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;

