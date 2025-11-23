import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { id: 'student', label: 'Student', icon: '🎓' },
    { id: 'adviser', label: 'Adviser', icon: '👨‍🏫' },
    { id: 'staff', label: 'Staff', icon: '⚕️' },
    { id: 'admin', label: 'Admin', icon: '⚙️' }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      // API call would go here
      // const response = await fetch('/api/login', { ... });
      console.log('Login attempt:', { ...formData, role: selectedRole });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Handle success/error
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setFormData({ email: '', password: '', rememberMe: false });
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content"></div>   <div className="logo-container">
            <div className="logo-icon">🏥</div>
          </div>
          <h1 className="system-title">PDMHS Student Medical System</h1>
          <p className="system-subtitle">
            {selectedRole ? `Sign in as ${selectedRole}` : 'Sign in to start your session'}
          </p>
          <div className="security-badge">
            <span className="lock-icon">🔒</span>
            <span>Secure Connection</span>
          </div>
        </div>
      </div>

      <div className="login-content">
        {!selectedRole ? (
          <div className="role-selection">
            <h2>Select Your Role</h2>
            <div className="role-grid">
              {roles.map(role => (
                <button
                  key={role.id}
                  className="role-button"
                  onClick={() => handleRoleSelect(role.id)}
                  aria-label={`Login as ${role.label}`}
                >
                  <span className="role-icon">{role.icon}</span>
                  <span className="role-label">{role.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="login-form-container">
            <button className="back-button" onClick={handleBack} aria-label="Go back">
              ← Back
            </button>
            
            <form className="login-form" onSubmit={handleSubmit}>
              <h2>Welcome Back</h2>
              
              {error && (
                <div className="error-message" role="alert">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@pdmhs.edu"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <span>Remember me</span>
                </label>
                <a href="/forgot-password" className="forgot-link">
                  Forgot password?
                </a>
              </div>

              <button 
                type="submit" 
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>Need help? <a href="/support">Contact Support</a></p>
            </div>
          </div>
        )}

        <footer className="login-footer">
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <span>•</span>
            <a href="/terms">Terms of Service</a>
            <span>•</span>
            <a href="/help">Help Center</a>
          </div>
          <p className="footer-text">© 2025 PDMHS. All rights reserved. v1.0.0</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
