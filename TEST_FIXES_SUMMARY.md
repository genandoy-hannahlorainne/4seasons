# PHPUnit Test Fixes Summary

## Issues Fixed

### 1. UserFactory Role ID Issue ✅
**Problem:** UserFactory was creating users with `role_id => 0` causing foreign key constraint violations.

**Root Cause:** Using `Role::create(['role_name' => 'Admin'])` without providing `role_id`, which doesn't have a default value.

**Fix:** Changed to use `Role::factory()->create(['role_name' => 'Admin'])` which properly generates a `role_id`.

**Files Modified:**
- `backend-laravel/database/factories/UserFactory.php`

### 2. File Upload Test Data Type Issues ✅
**Problem:** Tests failing with validation errors:
- `menarche_age` must be a string (was sending integer `12`)
- `wifa_consent` invalid value (was sending `'yes'` instead of `'oo'`)
- `mrtd_consent` invalid value (was sending `'yes'` instead of `'oo'`)

**Valid Values:**
- `mrtd_consent`: `'oo'`, `'hindi'`, `'not_applicable'`
- `wifa_consent`: `'oo'`, `'hindi'`, `'not_applicable'`
- `menarche_age`: string (e.g., `'12'`)

**Fix:** Updated `validPayload()` method in test files to use correct data types and values.

**Files Modified:**
- `backend-laravel/tests/Feature/SHDF/SHDFFileUploadTest.php`

### 3. PHPUnit Deprecation Warnings ⚠️
**Problem:** Using `/** @test */` doc-comments which are deprecated in PHPUnit 11 and will be removed in PHPUnit 12.

**Solution:** Convert all test methods to use PHP 8 attributes instead:

**Before:**
```php
/** @test */
public function it_accepts_valid_pdf_upload()
{
    // test code
}
```

**After:**
```php
#[Test]
public function it_accepts_valid_pdf_upload()
{
    // test code
}
```

**Files Needing Update:**
- `backend-laravel/tests/Feature/SHDF/SHDFAccessControlTest.php`
- `backend-laravel/tests/Feature/SHDF/SHDFFileUploadTest.php`
- `backend-laravel/tests/Feature/SHDF/SHDFPropertyTest.php`
- `backend-laravel/tests/Feature/SHDF/SHDFSubmissionTest.php`
- `backend-laravel/tests/Feature/SHDF/SHDFTransactionTest.php`
- `backend-laravel/tests/Feature/SHDF/SHDFValidationTest.php`
- `backend-laravel/tests/Feature/SecurityTest.php`

**Note:** This is a warning, not an error. Tests will still run but should be updated for future compatibility.

## Remaining Test Failures

After the above fixes, the remaining failures should be significantly reduced. The main issues were:

1. ✅ Role ID foreign key constraints (FIXED)
2. ✅ File upload validation errors (FIXED)
3. ⚠️ PHPUnit deprecation warnings (NEEDS UPDATE - not blocking)

## Next Steps

1. Run tests again to verify fixes: `php artisan test`
2. Optionally update test methods to use PHP 8 attributes to remove warnings
3. Check for any remaining failures and address them individually

## Test Results Expected

- **Before fixes:** 22 failed, 32 passed
- **After fixes:** Should have significantly fewer failures (mostly related to role_id and validation issues should be resolved)
