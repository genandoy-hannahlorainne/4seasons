# StudentCare+ Frontend

Angular frontend application for the StudentCare+ medical records management system.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Core functionality
│   │   │   ├── guards/              # Route guards
│   │   │   ├── interceptors/        # HTTP interceptors
│   │   │   ├── models/              # Data models
│   │   │   └── services/            # API services
│   │   ├── features/                # Feature modules
│   │   │   ├── auth/                # Authentication
│   │   │   ├── dashboard/           # Main dashboard
│   │   │   ├── students/            # Student management
│   │   │   └── medical-visits/      # Medical visit management
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── environments/                # Environment configs
│   └── styles.scss                  # Global styles
└── angular.json

```

## Features

- **Authentication**: Login with JWT token support
- **Dashboard**: Overview of system statistics
- **Student Management**: View and manage student records
- **Medical Visits**: Track clinic visits and medical records
- **Role-based Access**: Different views for students, staff, advisers, and parents

## Development

Run the development server:
```bash
cd frontend
ng serve
```

Navigate to `http://localhost:4200/`

## Build

Build for production:
```bash
ng build --configuration production
```

## API Configuration

Update the API URL in `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

## Next Steps

1. Connect to your backend API
2. Implement additional features (QR code scanning, notifications, etc.)
3. Add more components for clinic staff, advisers, and parents
4. Implement data visualization for medical records
