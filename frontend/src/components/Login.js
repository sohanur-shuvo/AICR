import React, { useState } from 'react';
import axios from 'axios';
import { buildUrl } from '../api';
import './Auth.css';

function Login({ onLogin, onSwitchToSignUp }) {
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
    <>
      <div className="auth-header">
        <div className="auth-logo">AICR</div>
        <p className="auth-subtitle">AI-Powered Device Detection Platform</p>
        <h2>Welcome Back</h2>
        <p style={{ marginTop: '8px', color: '#64748b', fontSize: '14px' }}>
          Sign in to continue to your dashboard
        </p>
      </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-form-group">
              <label htmlFor="email">📧 Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="auth-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="password">🔒 Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="auth-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

      <div className="auth-toggle">
        Don't have an account?{' '}
        <span className="auth-toggle-link" onClick={onSwitchToSignUp}>
          Sign Up
        </span>
      </div>
    </>
  );
}

export default Login;

