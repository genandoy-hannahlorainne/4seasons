-- Fix admin password to Admin@123
UPDATE users SET password_hash = '$2y$10$VRKSez9gbIAB7fyx695fPeaHPg8Qo.VmabPGUBrRWquZYLV5Epd6W' WHERE username = 'admin';
