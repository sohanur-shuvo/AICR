import React from 'react';
import './Header.css';

function Header({ onNavigateAdmin, onLogout }) {
  return (
    <header className="header">
      <div className="header-content">
        <div>
          <h1 className="main-header">Router, Switch & Server Detector</h1>
          <p className="sub-header">AI-Powered Network Device & Server Identification</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onNavigateAdmin && (
            <button
              className="admin-panel-button"
              onClick={onNavigateAdmin}
              title="API Key Management"
            >
              API Keys
            </button>
          )}
          {onLogout && (
            <button
              className="admin-panel-button"
              onClick={onLogout}
              title="Sign Out"
              style={{
                background: '#dc3545',
                color: 'white'
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
