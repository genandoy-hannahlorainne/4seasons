# PHPUnit Test Fixes - Final Solution

## Problem
Tests were failing with foreign key constraint violations:
- `users.role_id` referencing non-existent `roles.role_id`
- `students.user_id` referencing non-existent `users.user_id`

## Root Cause
Tests using `RefreshDatabase` trait were creating Users and Students without ensuring the required Roles existed in the test database first.

## Solution

### 1. Seed RoleSeeder in All Test setUp Methods
Added `$this->seed(\Database\Seeders\RoleSeeder::class);` to setUp() in all SHDF test classes.

The RoleSeeder creates these roles:
- role_id 1: Admin
- role_id 2: Student  
- role_id 3: Adviser
- role_id 4: Clinic Staff
- role_id 5: Parent

### 2. Update UserFactory to Use Seeded Roles
Changed UserFactory to default to role_id 2 (Student) which is guaranteed to exist after seeding.

**Before:**
```php
'role_id' => Role::factory(),  // Creates random role, may conflict
```

**After:**
```php
'role_id' => 2,  // Student role from RoleSeeder
```

### 3. Fix SHDF Test Data Types
- `menarche_age`: Changed from integer `12` to string `'12'`
- `mrtd_consent`: Changed from `'yes'` to `'oo'`
- `wifa_consent`: Changed from `'yes'` to `'oo'`

## Files Modified

1. **backend-laravel/database/factories/UserFactory.php**
   - Default role_id to 2 (Student)
   - Admin state uses role_id 1

2. **backend-laravel/tests/Feature/SHDF/SHDFAccessControlTest.php**
   - Added RoleSeeder to setUp()

3. **backend-laravel/tests/Feature/SHDF/SHDFFileUploadTest.php**
   - Added RoleSeeder to setUp()
   - Removed manual role creation
   - Fixed test data types

4. **backend-laravel/tests/Feature/SHDF/SHDFValidationTest.php**
   - Added RoleSeeder to setUp()

5. **backend-laravel/tests/Feature/SHDF/SHDFSubmissionTest.php**
   - Added RoleSeeder to setUp()

6. **backend-laravel/tests/Feature/SHDF/SHDFTransactionTest.php**
   - Added RoleSeeder to setUp()

7. **backend-laravel/tests/Feature/SHDF/SHDFPropertyTest.php**
   - Added RoleSeeder to setUp()
   - Removed manual role creation

## How It Works

1. **Test starts** → `RefreshDatabase` clears database
2. **setUp() runs** → `RoleSeeder` creates roles with IDs 1-5
3. **Test creates User** → Uses role_id 2 (Student) by default, or test can override
4. **No foreign key errors** → Role exists before User is created

## Test Execution Flow

```php
class SomeTest extends TestCase
{
    use RefreshDatabase;
    
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);  // ← Roles now exist
    }
    
    public function test_something()
    {
        // This works because role_id 2 exists
        $user = User::factory()->create();
        
        // This also works - override with existing role
        $admin = User::factory()->create(['role_id' => 1]);
    }
}
```

## Expected Results

- All 20 previously failing tests should now pass
- No more foreign key constraint violations
- Tests can still override role_id when needed

## Commit Message

```
fix: Add RoleSeeder to SHDF tests and update UserFactory defaults

- Seed RoleSeeder in setUp() for all SHDF test classes to ensure
  roles exist before creating users
- Update UserFactory to default to role_id 2 (Student) from RoleSeeder
  instead of creating random roles
- Fix SHDF test data types (menarche_age, consent values)
- Resolves 20 test failures with foreign key constraint violations

Tests now follow proper setup order: seed roles → create users → run tests
```
