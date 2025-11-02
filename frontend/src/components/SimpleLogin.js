import React, { useState } from 'react';
import axios from 'axios';
import { buildUrl } from '../api';
import './SimpleLogin.css';

function SimpleLogin({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        onLogin(response.data.user);
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
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="simple-login-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
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

