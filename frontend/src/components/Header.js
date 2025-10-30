import React from 'react';
import './Header.css';

function Header({ onNavigateAdmin }) {
  return (
    <header className="header">
      <div className="header-content">
        <div>
          <h1 className="main-header">🌐 Router, Switch & Server Detector</h1>
          <p className="sub-header">AI-Powered Network Device & Server Identification</p>
        </div>
        {onNavigateAdmin && (
          <button
            className="admin-panel-button"
            onClick={onNavigateAdmin}
            title="API Key Management"
          >
            🔑 API Keys
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
