import React, { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import './Auth.css';

function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  const handleLogin = (user) => {
    onAuthSuccess(user);
  };

  const handleSignUp = (user) => {
    onAuthSuccess(user);
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      
      <div className={`auth-card-wrapper ${!isLogin ? 'flipped' : ''}`}>
        <div className="auth-card">
          <div className="auth-card-front">
            <Login 
              onLogin={handleLogin} 
              onSwitchToSignUp={() => setIsLogin(false)} 
            />
          </div>
          <div className="auth-card-back">
            <SignUp 
              onSignUp={handleSignUp} 
              onSwitchToLogin={() => setIsLogin(true)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;

