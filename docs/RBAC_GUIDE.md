# SanctumEMHR Role-Based Access Control (RBAC) - Phase 1.1

**Version:** 1.1
**Last Updated:** 2026-02-14
**Status:** ✅ Complete

---

## Overview

SanctumEMHR implements a **professional, hardcoded RBAC system** with role-based permissions enforced at the API level. This ensures security, compliance, and appropriate data access for all user types.

---

## Roles

### 1. **Administrator**
- **Database:** `user_type='admin'` OR `calendar=1`
- **Access:** Full system access
- **Permissions:**
  - ✅ View/edit all clients
  - ✅ Manage users and settings
  - ✅ Access billing and reports
  - ✅ Create/edit/delete all records
  - ✅ Unlock user accounts
  - ✅ Manage reference lists and system configuration

### 2. **Provider/Clinician**
- **Database:** `is_provider=1`
- **Access:** Clinical access to assigned clients
- **Permissions:**
  - ✅ View assigned clients only
  - ✅ Create and sign clinical notes
  - ✅ Edit demographics for assigned clients
  - ✅ Schedule appointments
  - ✅ Create new clients
  - ✅ View clinical reports
  - ❌ Cannot access billing
  - ❌ Cannot manage settings

### 3. **Supervisor**
- **Database:** `is_supervisor=1`
- **Access:** Oversight of supervisees and their clients
- **Permissions:**
  - ✅ View own clients + supervisees' clients
  - ✅ Review and sign supervisee notes
  - ✅ All provider permissions
  - ✅ View supervisee reports
  - ✅ Pending reviews dashboard widget
  - ❌ Cannot manage users or settings

### 4. **Social Worker**
- **Database:** `is_social_worker=1`
- **Access:** Case management with limited clinical access
- **Permissions:**
  - ✅ View assigned clients
  - ✅ Create case management notes
  - ✅ Edit demographics
  - ✅ Schedule appointments
  - ✅ Create new clients
  - ❌ **Cannot view clinical notes** from providers
  - ❌ Cannot create clinical notes
  - ❌ Cannot access billing

### 5. **Intern** ⭐ *NEW*
- **Database:** `is_intern=1` (also requires `is_provider=1`)
- **Access:** Supervised clinical practice
- **Permissions:**
  - ✅ View assigned clients
  - ✅ Create clinical notes
  - ✅ Edit demographics
  - ✅ Schedule appointments
  - ⚠️ **Requires supervisor approval** for note finalization
  - ❌ Cannot self-sign notes
  - ❌ Cannot access billing

### 6. **Front Desk** ⭐ *NEW*
- **Database:** `user_type='staff'`
- **Access:** Scheduling and client intake only
- **Permissions:**
  - ✅ View all clients (for scheduling)
  - ✅ Create new clients
  - ✅ Schedule appointments
  - ✅ Edit basic demographics
  - ❌ **Cannot view clinical notes**
  - ❌ Cannot create notes
  - ❌ Cannot access billing
  - ❌ Cannot view reports

### 7. **Biller** ⭐ *NEW*
- **Database:** `user_type='billing'`
- **Access:** Billing and financial data only
- **Permissions:**
  - ✅ View all billing data
  - ✅ Create invoices and process payments
  - ✅ View billing reports
  - ✅ Manage insurance providers
  - ❌ **Cannot view clinical notes**
  - ❌ Cannot schedule appointments
  - ❌ Cannot edit client demographics

### 8. **Client** (Portal User)
- **Database:** `portal_user=1`
- **Access:** Client portal (separate authentication system)
- **Note:** Not part of staff RBAC - uses separate hardcoded permissions

---

## Permission Matrix

| Feature | Admin | Provider | Supervisor | Social Worker | Intern | Front Desk | Biller |
|---------|-------|----------|------------|---------------|--------|------------|--------|
| View Assigned Clients | ✅ All | ✅ | ✅ + Supervisees | ✅ | ✅ | ✅ All | ❌ |
| Create Clients | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Demographics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Basic | ❌ |
| View Clinical Notes | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Create Clinical Notes | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Sign Notes | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Case Notes | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Schedule Appointments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View Calendar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Access Billing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Reports | ✅ | ✅ Clinical | ✅ Supervisee | ❌ | ✅ Clinical | ❌ | ✅ Billing |
| Manage Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## API Protection

### Protected Endpoints

**Billing Endpoints:**
- `/custom/api/billing.php` - Requires `canAccessBilling()`
- `/custom/api/billing_modifiers.php` - Admin only

**Reports:**
- `/custom/api/reports.php` - Requires `canViewReports()`

**Settings:**
- `/custom/api/settings.php` - Admin only
- `/custom/api/reference_lists.php` - Admin only
- `/custom/api/users.php` - Admin only

**Client Access:**
- All client detail endpoints check `canAccessClient($clientId)`
- Clinical notes check `canViewClinicalNotes($clientId)`

---

## PermissionChecker Methods

### Role Checking
```php
$checker->isAdmin()           // Administrator
$checker->isProvider()        // Clinical provider
$checker->isSupervisor()      // Supervisor
$checker->isSocialWorker()    // Social worker
$checker->isIntern()          // Intern (supervised provider)
$checker->isFrontDesk()       // Front desk staff
$checker->isBiller()          // Biller
```

### Permission Checking
```php
$checker->canAccessClient($clientId)          // Client access
$checker->canViewClinicalNotes($clientId)     // Clinical notes
$checker->canCreateClinicalNotes($clientId)   // Create notes
$checker->canEditDemographics($clientId)      // Demographics
$checker->canScheduleAppointments()           // Scheduling
$checker->canCreateClients()                  // Client creation
$checker->canAccessBilling()                  // Billing access
$checker->canViewReports()                    // Reports access
$checker->canManageSettings()                 // Settings
$checker->canManageUsers()                    // User management
$checker->canSelfSignNotes()                  // Note signing
$checker->requiresSupervisorApproval()        // Intern check
```

---

## Implementation Details

### Database Schema
```sql
-- Users table (relevant fields)
users.user_type ENUM('admin', 'provider', 'social_worker', 'staff', 'billing')
users.is_provider TINYINT(1)      -- Clinical provider flag
users.is_supervisor TINYINT(1)    -- Supervisor flag
users.is_social_worker TINYINT(1) -- Social worker flag
users.is_intern TINYINT(1)        -- Intern flag (NEW)
users.calendar TINYINT(1)         -- Admin access flag

-- Client-Provider assignments
client_providers.provider_id
client_providers.client_id
client_providers.role ENUM('primary_clinician', 'clinician', 'social_worker', 'supervisor', 'intern')
client_providers.ended_at       -- NULL = active assignment

-- Supervision relationships
user_supervisors.user_id        -- Supervisee
user_supervisors.supervisor_id  -- Supervisor
user_supervisors.ended_at       -- NULL = active relationship
```

### Audit Logging
New audit_log table tracks:
- User actions (view_client, edit_demographics, delete_note)
- Resource type and ID
- Timestamp and IP address
- Use for HIPAA compliance and security monitoring

---

## Setting Up Users

### Admin Panel: Organization > Users

1. **Create User**
   - Enter credentials and contact info
   - Select role checkboxes (can have multiple)
   - Assign supervisors if needed
   - Set calendar color for providers

2. **Role Combinations**
   - Provider + Supervisor = Clinical supervisor
   - Provider + Intern = Supervised provider
   - Social Worker alone = Case management only
   - Front Desk = Staff with scheduling only
   - Biller = Billing staff only
   - Admin = Full access

3. **Best Practices**
   - Front desk should NOT be providers
   - Billers should NOT be providers
   - Interns should ALWAYS have supervisors assigned
   - Social workers can be providers (full clinical access)

---

## Calendar Settings

### "Providers See Entire Calendar"
- **Location:** Admin > Calendar Settings > General
- **Default:** Enabled (true)
- **When Enabled:** Providers see all appointments
- **When Disabled:** Providers see only their own appointments
- **Note:** Admins always see all appointments

---

## Security Notes

1. **All permissions are hardcoded** - no user customization
2. **API-level enforcement** - frontend cannot bypass
3. **Session-based authentication** - CSRF protection enabled
4. **Client access filtering** via client_providers table
5. **No direct SQL injection** - parameterized queries only
6. **Audit logging ready** for HIPAA compliance
7. **Social workers blocked** from clinical notes at API level
8. **Interns require supervision** - cannot self-sign

---

## Future Enhancements (Not in Phase 1.1)

- [ ] Per-user permission overrides (database-driven)
- [ ] Permission management UI in admin panel
- [ ] Granular note visibility controls
- [ ] Time-limited access grants
- [ ] Automated audit reporting
- [ ] Two-factor authentication integration
- [ ] Role templates for quick setup

---

## Migration Instructions

1. **Run SQL Migration:**
   ```bash
   mysql sanctumEMHR < sql/migrations/add_complete_rbac_roles.sql
   ```

2. **Update Existing Users:**
   - Front desk staff: Set `user_type='staff'`
   - Billers: Set `user_type='billing'`
   - Interns: Set `is_intern=1` and `is_provider=1`

3. **Verify Permissions:**
   - Test each role can access appropriate features
   - Verify social workers cannot see clinical notes
   - Confirm interns require supervisor approval
   - Check billing is restricted to admin + biller

---

## Support

For questions about RBAC implementation:
- Check `custom/Lib/Auth/PermissionChecker.php` for permission logic
- Review `react-frontend/src/components/admin/UserManagement.jsx` for UI
- See API endpoints for enforcement examples

**RBAC Phase 1.1 is production-ready!** ✅
