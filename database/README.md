# Database Management

Database schemas, test data, and backups.

## Folders

### migrations/
SQL migration files for table schemas and updates.

### seeders/
Sample data for testing and development.

### backups/
Automated daily backups (scheduled at 2 AM).
- Naming format: `studentcare_YYYY-MM-DD.sql`
- Retention policy: (To be defined)

## Backup Schedule
Daily automated backups run at 2:00 AM via cron job or Laravel scheduler.
