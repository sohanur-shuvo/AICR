import React, { useState } from 'react';
import axios from 'axios';
import { buildUrl } from '../api';
import './Auth.css';

function SignUp({ onSignUp, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(buildUrl('/auth/signup'), {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      if (response.data.success) {
        setSuccess(true);
        // Auto-login after successful signup
        setTimeout(() => {
          localStorage.setItem('aicr_token', response.data.token);
          localStorage.setItem('aicr_user', JSON.stringify(response.data.user));
          onSignUp(response.data.user);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-header">
        <div className="auth-logo">AICR</div>
        <p className="auth-subtitle">Device Detection Platform</p>
        <h2 style={{ marginTop: '20px', color: '#333' }}>Create Account</h2>
      </div>

          {success ? (
            <div className="auth-success">
              Success: Account created successfully! Redirecting...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="auth-error">{error}</div>}

              <div className="auth-form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="auth-input"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="auth-input"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="auth-input"
                  placeholder="Create a password (min. 6 chars)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="auth-input"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
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
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>
          )}

      <div className="auth-toggle">
        Already have an account?{' '}
        <span className="auth-toggle-link" onClick={onSwitchToLogin}>
          Sign In
        </span>
      </div>
    </>
  );
}

export default SignUp;

