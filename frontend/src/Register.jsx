import React, { useState } from 'react';
import './Login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');

    // Calculate password strength
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    setPasswordStrength(strength);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.studentId || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 2) {
      setError('Password is too weak. Use at least 8 characters with uppercase, lowercase, and numbers.');
      setIsLoading(false);
      return;
    }

    if (!formData.agreeTerms) {
      setError('You must agree to the terms and conditions');
      setIsLoading(false);
      return;
    }

    try {
      // API call would go here
      console.log('Registration attempt:', formData);
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Handle success
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = () => {
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e'];
    return colors[passwordStrength - 1] || '#e5e7eb';
  };

  const getStrengthText = () => {
    const texts = ['Weak', 'Fair', 'Good', 'Strong'];
    return texts[passwordStrength - 1] || '';
  };

  return (
    <div className="login-container">
      <div className="login-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="logo-container">
            <div className="logo-icon">🏥</div>
          </div>
          <h1 className="system-title">PDMHS Student Medical System</h1>
          <p className="system-subtitle">Create your student account</p>
          <div className="security-badge">
            <span className="lock-icon">🔒</span>
            <span>Secure Registration</span>
          </div>
        </div>
      </div>

      <div className="login-content">
        <div className="login-form-container" style={{ maxWidth: '500px' }}>
          <a href="/login" className="back-button">← Back to Login</a>
          
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Student Registration</h2>
            
            {error && (
              <div className="error-message" role="alert">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Juan"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Dela Cruz"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="studentId">Student ID *</label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                placeholder="2024-12345"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="student@pdmhs.edu"
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
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
              {formData.password && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ 
                    height: '4px', 
                    background: '#e5e7eb', 
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${(passwordStrength / 4) * 100}%`,
                      background: getStrengthColor(),
                      transition: 'all 0.3s'
                    }}></div>
                  </div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: getStrengthColor(),
                    marginTop: '0.25rem',
                    fontWeight: '500'
                  }}>
                    {getStrengthText()}
                  </p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label" style={{ marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
                <span style={{ fontSize: '0.875rem' }}>
                  I agree to the <a href="/terms" style={{ color: '#3b82f6' }}>Terms of Service</a> and{' '}
                  <a href="/privacy" style={{ color: '#3b82f6' }}>Privacy Policy</a>
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>Already have an account? <a href="/login">Sign In</a></p>
          </div>
        </div>

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

export default Register;
