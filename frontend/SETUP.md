# Frontend Setup Guide

## Installation

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open browser to: http://localhost:3000

## Features Implemented

### Login Page (Login.jsx)
- Role-based selection (Student, Adviser, Staff, Admin)
- Email/password authentication
- Password visibility toggle
- Remember me functionality
- Forgot password link
- Loading states
- Error handling
- Accessibility features (ARIA labels, keyboard navigation)
- Responsive design

### Register Page (Register.jsx)
- Student registration form
- Real-time password strength indicator
- Password confirmation validation
- Terms and conditions checkbox
- Form validation
- Loading states
- Responsive layout

### Security Features
- HTTPS badge indicator
- Secure connection messaging
- Password strength validation
- Input sanitization ready
- CSRF protection ready (backend integration needed)

### Accessibility
- WCAG AA compliant
- Keyboard navigation support
- Screen reader friendly
- Focus indicators
- Proper ARIA labels

## File Structure
```
frontend/
├── src/
│   ├── Login.jsx          # Login component
│   ├── Register.jsx       # Registration component
│   ├── Login.css          # Shared styles
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── public/
│   └── index.html         # HTML template
├── package.json           # Dependencies
└── vite.config.js         # Vite configuration
```

## Next Steps

1. Add React Router for navigation
2. Integrate with Laravel backend API
3. Add form validation library (e.g., Formik, React Hook Form)
4. Implement JWT token management
5. Add protected routes
6. Create dashboard components
7. Add unit tests

## Backend Integration

Update API endpoints in components:
```javascript
// Example API call
const response = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, role })
});
```

## Environment Variables

Create `.env` file:
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=StudentCare+
```
