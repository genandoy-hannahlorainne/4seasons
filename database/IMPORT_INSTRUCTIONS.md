# Paano Mag-import ng Database Backup

May tatlong paraan para i-import ang backup file sa 4seasons database:

## Option 1: Gamit ang Batch Script (Pinakamadali)

1. I-download muna yung backup file kung nasa browser pa
2. I-run ang script:
   ```cmd
   cd database
   import-backup.bat "C:\Users\pc\Downloads\db_backup_2026-01-12_200418.sql"
   ```
3. I-type ang MySQL username (default: root)
4. I-type ang MySQL password
5. Tapos na!

## Option 2: Manual MySQL Command

1. Buksan ang Command Prompt
2. I-run ang command:
   ```cmd
   mysql -u root -p 4seasons < "C:\Users\pc\Downloads\db_backup_2026-01-12_200418.sql"
   ```
3. I-type ang password
4. Tapos na!

## Option 3: Gamit ang phpMyAdmin

1. Buksan ang phpMyAdmin sa browser (http://localhost/phpmyadmin)
2. I-select ang `4seasons` database sa left sidebar
3. I-click ang **Import** tab
4. I-click ang **Choose File** button
5. I-select ang backup file (db_backup_2026-01-12_200418.sql)
6. I-click ang **Go** button sa bottom
7. Hintayin lang na matapos ang import
8. Tapos na!

## Important Notes

- Siguruhing naka-running ang MySQL server
- Ang backup file ay mag-o-overwrite ng existing data sa database
- Recommended na gumawa muna ng backup ng current database bago mag-import
- Kung may error, check kung tama ang MySQL credentials at kung accessible ang database

## Troubleshooting

**Error: "mysql is not recognized"**
- I-add ang MySQL sa system PATH o gamitin ang full path:
  ```cmd
  "C:\xampp\mysql\bin\mysql.exe" -u root -p 4seasons < backup.sql
  ```

**Error: "Access denied"**
- Check kung tama ang username at password
- Siguruhing may permission ang user sa 4seasons database

**Error: "Unknown database '4seasons'"**
- Gumawa muna ng database:
  ```sql
  CREATE DATABASE 4seasons;
  ```
