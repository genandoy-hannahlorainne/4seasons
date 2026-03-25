# PHPUnit Test Fixes - Complete Solution

## Problem Summary
Tests were failing with:
1. Foreign key constraint violations (`role_id => 0`)
2. "Attempt to read property role_id on null" errors
3. Authorization failures (403 instead of 422)

## Root Causes

### 1. Role Names Mismatch
**RoleSeeder creates:**
- 'Admin' (role_id 1)
- 'Student' (role_id 2)
- 'Adviser' (role_id 3)
- 'Clinic Staff' (role_id 4) ← Note: Capital letters with space
- 'Parent' (role_id 5)

**Tests were looking for:**
- 'clinic_staff' ← lowercase with underscore (NOT FOUND!)
- 'student' ← lowercase (NOT FOUND!)
- 'adviser' ← lowercase (NOT FOUND!)

When `Role::where('role_name', 'clinic_staff')->first()` returns `null`, accessing `->role_id` causes the error.

### 2. Authorization vs Validation
Validation tests were using Student role, but students can only submit their own SHDF. This caused 403 (Forbidden) before validation could run and return 422.

## Solutions Applied

### 1. Seed RoleSeeder in All Tests ✅
Added to setUp() in all SHDF test classes:
```php
$this->seed(\Database\Seeders\RoleSeeder::class);
```

### 2. Fix Role Name References ✅
Changed all test files to use correct role names from RoleSeeder:

**SHDFAccessControlTest.php:**
- `'clinic_staff'` → `'Clinic Staff'`
- `'student'` → `'Student'`
- `'adviser'` → `'Adviser'`

**SHDFPropertyTest.php:**
- `'clinic_staff'` → `'Clinic Staff'` (all 9 instances)

**SHDFValidationTest.php:**
- Changed to use Clinic Staff role instead of Student role
- Clinic Staff can submit for any student, avoiding authorization issues

### 3. Update UserFactory ✅
```php
public function definition(): array
{
    return [
        'role_id' => 2,  // Student role from RoleSeeder
        // ...
    ];
}
```

### 4. Fix Test Data Types ✅
- `menarche_age`: `'12'` (string)
- `mrtd_consent`: `'oo'` (not 'yes')
- `wifa_consent`: `'oo'` (not 'yes')

## Files Modified

1. **backend-laravel/database/factories/UserFactory.php**
   - Default role_id to 2 (Student)

2. **backend-laravel/tests/Feature/SHDF/SHDFAccessControlTest.php**
   - Added RoleSeeder to setUp()
   - Fixed role names: 'Clinic Staff', 'Student', 'Adviser'

3. **backend-laravel/tests/Feature/SHDF/SHDFFileUploadTest.php**
   - Added RoleSeeder to setUp()
   - Fixed test data types

4. **backend-laravel/tests/Feature/SHDF/SHDFValidationTest.php**
   - Added RoleSeeder to setUp()
   - Changed to use Clinic Staff role for validation tests

5. **backend-laravel/tests/Feature/SHDF/SHDFSubmissionTest.php**
   - Added RoleSeeder to setUp()

6. **backend-laravel/tests/Feature/SHDF/SHDFTransactionTest.php**
   - Added RoleSeeder to setUp()

7. **backend-laravel/tests/Feature/SHDF/SHDFPropertyTest.php**
   - Added RoleSeeder to setUp()
   - Fixed all role names to 'Clinic Staff'

## Expected Results

All tests should now pass:
- ✅ Roles exist before users are created
- ✅ Role names match RoleSeeder exactly
- ✅ Authorization works correctly (Clinic Staff for validation tests)
- ✅ No more foreign key constraint violations
- ✅ No more "property on null" errors

## Key Lessons

1. **Always match seeder data exactly** - Case and spacing matter!
2. **Seed required data in setUp()** - Don't assume data exists
3. **Use appropriate roles for tests** - Clinic Staff for validation, specific roles for authorization
4. **Check authorization before validation** - 403 vs 422 errors

## Commit Message

```
fix: Correct role names in SHDF tests to match RoleSeeder

- Fix role name references to match RoleSeeder exactly:
  'clinic_staff' → 'Clinic Staff'
  'student' → 'Student'  
  'adviser' → 'Adviser'
- Change validation tests to use Clinic Staff role to avoid authorization issues
- Add RoleSeeder to setUp() in all SHDF test classes
- Update UserFactory to default to role_id 2 (Student)
- Fix SHDF test data types (menarche_age, consent values)

Resolves all foreign key constraint violations and "property on null" errors
caused by role name mismatches between tests and RoleSeeder.
```
