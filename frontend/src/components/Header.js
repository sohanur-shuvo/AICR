import React from 'react';
import './Header.css';

function Header({ onNavigateAdmin, user, onLogout }) {
  return (
    <header className="header">
      <div className="header-content">
        <div>
          <h1 className="main-header">🌐 Router, Switch & Server Detector</h1>
          <p className="sub-header">AI-Powered Network Device & Server Identification</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              padding: '8px 15px',
              background: 'rgba(102, 126, 234, 0.1)',
              borderRadius: '20px'
            }}>
              <span style={{ fontSize: '20px' }}>👤</span>
              <span style={{ fontWeight: '600', color: '#333' }}>{user.name}</span>
            </div>
          )}
          {onNavigateAdmin && (
            <button
              className="admin-panel-button"
              onClick={onNavigateAdmin}
              title="API Key Management"
            >
              🔑 API Keys
            </button>
          )}
          {onLogout && (
            <button
              className="admin-panel-button"
              onClick={onLogout}
              title="Logout"
              style={{ background: '#dc3545' }}
            >
              🚪 Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
