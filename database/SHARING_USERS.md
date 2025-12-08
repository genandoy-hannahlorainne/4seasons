# Sharing User Accounts Across Team Devices

## Problem
Kapag nag-clone ng repo sa ibang device, ang database data (users) ay **HINDI kasama** - kailangan i-import manually.

## Solution: Export at Import Users

### Para sa Device na may Users (Export)

1. **Export current users:**
   ```bash
   export-users.bat
   ```
   - Ito ay mag-create ng `database/users-data.sql` file

2. **Push to Git:**
   ```bash
   git add database/users-data.sql
   git commit -m "Export user accounts"
   git push
   ```

### Para sa Bagong Device (Import)

1. **Pull latest code:**
   ```bash
   git pull
   ```

2. **Make sure Docker is running:**
   ```bash
   docker-compose up
   ```

3. **Import users:**
   ```bash
   import-users.bat
   ```

4. **Login using shared accounts!** ✅

## Current Test Account

After importing, you can use this test account:
- **Username:** `testuser`
- **Password:** `password123`

## Other Existing Users

Check `database/users-data.sql` for all exported users. Note: Passwords are hashed, so you need to know the original password used during registration.

## Important Notes

⚠️ **Database data is NOT tracked by Git by default** - only the schema is.

✅ **To share users:** Export → Commit → Push → Pull → Import

🔄 **Update users regularly:** Run `export-users.bat` whenever new users are registered and you want to share them.
