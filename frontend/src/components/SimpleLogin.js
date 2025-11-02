import React, { useState } from 'react';
import axios from 'axios';
import { buildUrl } from '../api';
import './SimpleLogin.css';

function SimpleLogin({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(buildUrl('/auth/login'), formData);
      
      if (response.data.success) {
        // Store auth token
        localStorage.setItem('aicr_token', response.data.token);
        localStorage.setItem('aicr_user', JSON.stringify(response.data.user));
        onLogin();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-login-container">
      <div className="simple-login-card">
        <div className="simple-login-header">
          <h1>AICR</h1>
          <p>Device Detection Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="simple-login-form">
          {error && <div className="simple-login-error">{error}</div>}

          <div className="simple-login-field">
            <label>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          <div className="simple-login-field">
            <label>Password</label>
            <div className="simple-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="simple-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="simple-login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SimpleLogin;

