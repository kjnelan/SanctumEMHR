# MINDLINE Authentication System - Setup Guide

**Date**: 2026-01-16
**Status**: Phase 1 Complete - Authentication Foundation

---

## What Has Been Completed

### ✅ Core Foundation Classes

1. **Database Abstraction Layer** (`/custom/lib/Database/Database.php`)
   - Replaces all OpenEMR database functions (sqlQuery, sqlStatement, sqlInsert, etc.)
   - PDO-based with prepared statements
   - Singleton pattern
   - Transaction support
   - Connection management

2. **Custom Authentication** (`/custom/lib/Auth/CustomAuth.php`)
   - Replaces OpenEMR\Common\Auth\AuthUtils
   - Password verification with Argon2ID
   - Account lockout protection (5 attempts, 30-minute lockout)
   - Password strength validation
   - Audit logging
   - User creation and management

3. **Session Manager** (`/custom/lib/Session/SessionManager.php`)
   - Replaces OpenEMR\Common\Session\SessionUtil
   - Database-backed session storage
   - Secure session handling
   - Session regeneration on login
   - Multi-session management per user

4. **User Service** (`/custom/lib/Services/UserService.php`)
   - Replaces OpenEMR\Services\UserService
   - User CRUD operations
   - Provider queries
   - Supervisor relationships
   - User search functionality

### ✅ Updated API Endpoints

1. **`/custom/api/login.php`**
   - Uses new CustomAuth for authentication
   - SessionManager for session handling
   - Returns user details with proper structure

2. **`/custom/api/session_user.php`**
   - Checks session authentication
   - Returns current user details
   - No longer depends on OpenEMR

3. **`/custom/api/session_logout.php`**
   - Uses SessionManager to destroy sessions
   - Proper cleanup and logging

---

## Database Configuration

The system tries to load database credentials in this order:

1. **Environment Variables** (Recommended)
   ```bash
   export DB_HOST=localhost
   export DB_PORT=3306
   export DB_NAME=mindline
   export DB_USER=your_db_user
   export DB_PASS=your_db_password
   ```

2. **Legacy sqlconf.php** (Fallback)
   - Will read from `/sqlconf.php` if environment variables not set
   - Useful for backward compatibility during migration

---

## Testing the Authentication System

### Prerequisites

1. **Database must be set up with mindline.sql**
   ```bash
   mysql -u root -p < /path/to/database/mindline.sql
   ```

2. **Create a test user** (run this SQL):
   ```sql
   INSERT INTO users (
       username,
       email,
       password_hash,
       first_name,
       last_name,
       user_type,
       is_active,
       is_provider
   ) VALUES (
       'admin',
       'admin@mindline.test',
       '$argon2id$v=19$m=65536,t=4,p=1$YOURSALTHERE',  -- Replace with actual hash
       'Admin',
       'User',
       'admin',
       1,
       0
   );
   ```

3. **Generate password hash** (run this PHP script):
   ```php
   <?php
   echo password_hash('your_password', PASSWORD_ARGON2ID);
   ```

### Manual Testing

1. **Test Login**
   ```bash
   curl -X POST http://your-server/custom/api/login.php \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"your_password"}' \
     -c cookies.txt
   ```

   Expected response:
   ```json
   {
     "success": true,
     "user": {
       "id": 1,
       "username": "admin",
       "email": "admin@mindline.test",
       "firstName": "Admin",
       "lastName": "User",
       "fullName": "Admin User",
       "userType": "admin",
       "isProvider": false,
       "isAdmin": true
     }
   }
   ```

2. **Test Session Check**
   ```bash
   curl -X GET http://your-server/custom/api/session_user.php \
     -b cookies.txt
   ```

3. **Test Logout**
   ```bash
   curl -X POST http://your-server/custom/api/session_logout.php \
     -b cookies.txt
   ```

---

## Security Features

### ✅ Implemented

- **Password Hashing**: Argon2ID (strongest available)
- **Account Lockout**: 5 failed attempts = 30-minute lockout
- **Secure Sessions**: HTTP-only, secure cookies with database storage
- **Audit Logging**: All auth events logged to `audit_logs` table
- **Session Regeneration**: New session ID on login (prevents fixation)
- **Password Strength**: Minimum 8 chars, uppercase, lowercase, number, special char
- **Prepared Statements**: All queries use PDO prepared statements (SQL injection protection)

### 🔒 To Add Later

- Two-factor authentication (2FA)
- Password reset via email
- Session timeout warnings
- IP-based access restrictions
- Role-based access control (RBAC) - basic structure exists

---

## Next Steps

### Phase 2: Update Remaining API Endpoints

The following API files still use OpenEMR functions and need to be updated:

#### High Priority (Core Functionality)

1. **Client Management** (6 files)
   - `client_list.php` - List all clients
   - `client_detail.php` - Get client details
   - `create_client.php` - Create new client
   - `update_demographics.php` - Update client demographics
   - `client_demographics.php` - Get client demographics
   - `patient_search.php` - Search clients

2. **Appointment Management** (4 files)
   - `get_appointments.php` - Get appointments
   - `create_appointment.php` - Create appointment
   - `update_appointment.php` - Update appointment
   - `delete_appointment.php` - Delete appointment

3. **User/Provider Management** (2 files)
   - `users.php` - Get/manage users
   - `get_providers.php` - Get provider list

#### Medium Priority (Clinical)

4. **Clinical Notes** (2 files)
   - `clinical_notes.php` - Clinical note CRUD
   - `encounter_detail.php` - Encounter details

5. **Documents** (2 files)
   - `client_documents.php` - Document management
   - `document_categories.php` - Document categories

#### Lower Priority (Administrative)

6. **Billing** (2 files)
   - `billing.php` - Billing operations
   - `update_insurance.php` - Insurance updates

7. **Reference Data** (5 files)
   - `facilities.php` - Facility list
   - `get_list_options.php` - List options
   - `get_appointment_categories.php` - Appointment categories
   - `get_insurance_companies.php` - Insurance companies
   - `search_codes.php` - ICD/CPT code search

---

## Migration Strategy

For each API endpoint, follow this pattern:

### Before (OpenEMR):
```php
<?php
require_once dirname(__FILE__, 3) . "/interface/globals.php";
use OpenEMR\Services\UserService;

$userService = new UserService();
$users = $userService->getAll();
```

### After (MINDLINE):
```php
<?php
require_once dirname(__FILE__, 3) . "/vendor/autoload.php";
require_once dirname(__FILE__, 2) . "/lib/Database/Database.php";
require_once dirname(__FILE__, 2) . "/lib/Services/UserService.php";

use Custom\Lib\Database\Database;
use Custom\Lib\Services\UserService;

$db = Database::getInstance();
$userService = new UserService($db);
$users = $userService->getUsers();
```

### Common Replacements:

| Old (OpenEMR) | New (MINDLINE) |
|--------------|----------------|
| `sqlQuery()` | `$db->query()` |
| `sqlStatement()` | `$db->queryAll()` |
| `sqlInsert()` | `$db->insert()` |
| `sqlUpdate()` | `$db->execute()` or `$db->updateArray()` |
| `AuthUtils::confirmPassword()` | `$auth->authenticate()` |
| `SessionUtil::coreSessionStart()` | `$session->start()` |
| `UserService::getUser()` | `$userService->getUser()` |

---

## Troubleshooting

### Database Connection Errors

**Problem**: "Database connection failed"

**Solutions**:
1. Check database credentials in environment variables or sqlconf.php
2. Verify database exists: `mysql -u root -p -e "SHOW DATABASES LIKE 'mindline';"`
3. Check user permissions: `GRANT ALL ON mindline.* TO 'user'@'localhost';`
4. Verify MySQL is running: `systemctl status mysql`

### Session Issues

**Problem**: "Not authenticated" even after login

**Solutions**:
1. Check that `sessions` table exists in database
2. Verify session cookie is being set (check browser dev tools)
3. Check PHP session settings: `session.cookie_httponly`, `session.cookie_secure`
4. Ensure CORS headers allow credentials

### Authentication Failures

**Problem**: "Invalid username or password" with correct credentials

**Solutions**:
1. Verify password hash is Argon2ID: `SELECT password_hash FROM users WHERE username='admin';`
2. Check user is active: `SELECT is_active FROM users WHERE username='admin';`
3. Check for account lockout: `SELECT locked_until FROM users WHERE username='admin';`
4. Review audit logs: `SELECT * FROM audit_logs WHERE event_type LIKE 'login%' ORDER BY created_at DESC LIMIT 10;`

---

## File Structure

```
/custom/
├── lib/
│   ├── Database/
│   │   └── Database.php          # PDO wrapper, replaces OpenEMR DB functions
│   ├── Auth/
│   │   └── CustomAuth.php        # Authentication, replaces AuthUtils
│   ├── Session/
│   │   └── SessionManager.php    # Session handling, replaces SessionUtil
│   └── Services/
│       └── UserService.php       # User operations, replaces OpenEMR UserService
└── api/
    ├── login.php                 # ✅ UPDATED - Login endpoint
    ├── session_user.php          # ✅ UPDATED - Get current user
    ├── session_logout.php        # ✅ UPDATED - Logout
    ├── client_list.php           # ⏳ TODO - Still uses OpenEMR
    ├── client_detail.php         # ⏳ TODO - Still uses OpenEMR
    └── ... (50+ more files)      # ⏳ TODO - Still uses OpenEMR
```

---

## Database Schema Reference

See `/database/mindline.sql` and `DATABASE_SCHEMA.md` for complete schema documentation.

Key tables for authentication:
- `users` - User accounts
- `sessions` - Active sessions (database-backed)
- `audit_logs` - Security and activity logging
- `user_roles` - Role definitions
- `user_role_assignments` - User-role mappings

---

## Performance Considerations

- **Database Connection**: Singleton pattern ensures single connection per request
- **Session Storage**: Database-backed sessions allow horizontal scaling
- **Prepared Statements**: All queries cached by PDO for performance
- **Indexes**: All foreign keys and commonly queried fields are indexed

---

## Development Guidelines

### When Creating New Services

1. Create in `/custom/lib/Services/`
2. Inject Database and other dependencies
3. Follow naming convention: `{Entity}Service.php`
4. Include audit logging for important actions
5. Return consistent response format: `['success' => bool, 'message' => string]`

### When Updating API Endpoints

1. Remove OpenEMR `require_once` statements
2. Add custom class `require_once` statements
3. Replace OpenEMR service calls with custom services
4. Update error handling
5. Test thoroughly before committing

### Code Style

- Use PSR-4 autoloading structure
- Type hints for all method parameters
- Return type declarations
- PHPDoc comments for all public methods
- Consistent error logging with `error_log()`

---

## Support & Questions

For issues or questions about this authentication system:

1. Check this document first
2. Review code comments in `/custom/lib/` classes
3. Check audit logs for security-related issues
4. Review React frontend console for API errors

---

## Changelog

### 2026-01-16 - Phase 1 Complete
- ✅ Created Database abstraction layer
- ✅ Created CustomAuth authentication system
- ✅ Created SessionManager for session handling
- ✅ Created UserService for user operations
- ✅ Updated login.php, session_user.php, session_logout.php
- ✅ Documented setup and testing procedures

### Next: Phase 2 - Client & Appointment APIs
- Update client management endpoints
- Update appointment management endpoints
- Create additional service classes as needed
