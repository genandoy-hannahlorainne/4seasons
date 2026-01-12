# Create Admin User for Backup & Recovery Testing

## Step 1: Create Admin User

Run this command sa backend directory:

```bash
cd backend
php create-admin-user.php
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@pdmhs.edu.ph`

## Step 2: Login to Admin Portal

1. Go to: `http://localhost:4200/admin/login`
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`

## Step 3: Access Backup & Recovery

After login, navigate to:
- Admin Dashboard → Backup & Recovery
- Or directly: `http://localhost:4200/dashboard/admin/backup-recovery`

## Step 4: Test Backup Features

### Test 1: Create Backup
1. Click "Create Backup" button
2. Wait for success message
3. Check if backup appears in list

### Test 2: Download Backup
1. Click download icon on any backup
2. File should download to your Downloads folder

### Test 3: Delete Backup
1. Click delete icon
2. Confirm deletion
3. Backup should be removed from list

## Troubleshooting

### Error: "mysqldump command not found"

**If using Docker:**
```bash
docker exec -it 4seasons-laravel bash
apt-get update && apt-get install -y mysql-client
```

**If using XAMPP (Windows):**
Add to PATH: `C:\xampp\mysql\bin`

### Error: "Permission denied"

Create backups folder:
```bash
mkdir backend/backups
chmod 755 backend/backups
```

### Error: "gzip not found"

**Docker:**
```bash
docker exec -it 4seasons-laravel bash
apt-get install -y gzip
```

**Windows:** Backup will stay as .sql (uncompressed) - this is okay!

## Verify Backup Files

Check if backups are created:
```bash
# Windows
dir backend\backups

# Linux/Mac
ls -lh backend/backups
```

You should see files like:
- `db_backup_2026-01-13_120000.sql.gz`
- `db_backup_2026-01-13_130000.sql.gz`

## Notes

- Backups are stored in `backend/backups/` folder
- Backups are compressed with gzip (.gz extension)
- Each backup includes timestamp in filename
- Only Admin users can create/download/delete backups
