# StudentCare+ Project Structure

## Root Directory
```
4seasons/
├── documents/              # All capstone documentation
│   ├── capstone-paper/    # Chapter 1-5, final paper
│   ├── research-instruments/  # Surveys, interview guides
│   ├── validation/        # Validation forms and results
│   └── presentations/     # Defense slides, demos
│
├── backend/               # PHP Laravel backend
│   ├── app/              # Controllers, Models, Services
│   ├── routes/           # API routes
│   ├── database/         # Migrations, seeders
│   └── config/           # Laravel config files
│
├── frontend/             # React frontend
│   ├── src/             # Components, pages, hooks
│   └── public/          # Static assets
│
├── database/            # Database management
│   ├── migrations/      # Schema migrations
│   ├── seeders/         # Test data
│   └── backups/         # Automated backups (2 AM daily)
│
├── assets/              # Media and resources
│   ├── images/          # UI images, logos
│   └── qr-codes/        # Generated QR codes
│
├── tests/               # Testing files
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
│
├── config/              # Configuration files
│   └── deployment/     # Server deployment configs
│
├── README.md           # Project overview
└── 4seasons.sql        # Database schema
```

## Key Folders Explained

### documents/
Store all research-related files:
- Chapter 1-5 drafts and finals
- Survey questionnaires
- Interview transcripts
- Validation certificates
- Defense presentations

### backend/
Laravel PHP backend for:
- Medical records API
- QR code generation
- SMS alerts (Twilio/Globe)
- Role-based authentication
- Backup automation

### frontend/
React + Bootstrap UI for:
- Student dashboard
- Clinic staff interface
- Adviser portal
- Admin panel

### database/
- migrations: Table schemas
- seeders: Sample data for testing
- backups: Daily automated backups (2 AM)

### assets/
- images: Logos, UI graphics
- qr-codes: Student QR codes

### tests/
Unit and integration tests for system validation
