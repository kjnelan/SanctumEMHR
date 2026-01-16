# OpenEMR Decoupling Analysis
**Date**: 2026-01-16
**Status**: Planning Phase

## Executive Summary

**Decision**: Decouple from OpenEMR infrastructure to create fully independent application.

**Current State**:
- `/src` directory: **21MB of OpenEMR core PHP classes**
- **STATUS: CURRENTLY REQUIRED** - Cannot remove yet
- Custom API code depends on 6 core OpenEMR classes from `/src`

---

## /src Directory - What Is It?

The `/src` directory contains OpenEMR's modern PHP source code (PSR-4 namespaced classes).

**Size**: 21MB
**Purpose**: Core OpenEMR services, utilities, and business logic
**Namespace**: `OpenEMR\*`

### Major Components:
```
/src
├── Billing/          - Billing services
├── Common/           - Shared utilities (Auth, Sessions, CSRF, ACL, Logging)
├── Controllers/      - REST controllers
├── Core/             - Core functionality
├── Events/           - Event system
├── FHIR/             - FHIR API implementation
├── Services/         - Business logic services (User, Patient, Facility, etc.)
├── RestControllers/  - REST API controllers
└── [18 more directories]
```

---

## Current Dependencies on /src

### Classes Used in /custom/api/ (React Backend)

Your custom API code (that the React frontend calls) uses **6 OpenEMR classes**:

| Class | Usage Count | Location | Purpose |
|-------|-------------|----------|---------|
| `SessionUtil` | 5 | `/src/Common/Session/SessionUtil.php` | Session management, tracking |
| `UserService` | 3 | `/src/Services/UserService.php` | User data queries, validation |
| `EventAuditLogger` | 3 | `/src/Common/Logging/EventAuditLogger.php` | Audit trail logging |
| `CsrfUtils` | 2 | `/src/Common/Csrf/CsrfUtils.php` | CSRF token validation |
| `AuthUtils` | 2 | `/src/Common/Auth/AuthUtils.php` | Authentication checks |
| `AclMain` | 1 | `/src/Common/Acl/AclMain.php` | Access control checks |

### Files Using These Classes

**Critical API Files** (used by React frontend):
- `login.php` - Uses AuthUtils, EventAuditLogger, UserService
- `session_login.php` - Uses SessionUtil, AuthUtils, CsrfUtils, EventAuditLogger, UserService
- `session_logout.php` - Uses SessionUtil, EventAuditLogger
- `session_user.php` - Uses SessionUtil, UserService
- `facilities.php` - Uses CsrfUtils, AclMain

**Total**: ~5-6 critical authentication/session management files depend on /src classes.

---

## Can We Remove /src Now?

### Answer: **NO - Not Yet**

If we remove `/src` right now:
- ❌ **ALL authentication would break** (AuthUtils, SessionUtil)
- ❌ **User management would fail** (UserService)
- ❌ **Session tracking would stop** (SessionUtil)
- ❌ **Security would be compromised** (CsrfUtils, AclMain)
- ❌ **Audit logging would fail** (EventAuditLogger)

### What Would Happen:
```
React App Login → /custom/api/login.php → use OpenEMR\Common\Auth\AuthUtils
                                           ↓
                                        ERROR: Class not found
                                           ↓
                                        Authentication fails
```

---

## Decoupling Roadmap

To remove the `/src` dependency, we must replace these 6 classes with custom implementations.

### Phase 1: Authentication & Sessions (Weeks 1-4)
**Goal**: Replace OpenEMR authentication with custom auth system

**Tasks**:
1. **Create custom authentication class** to replace `AuthUtils`
   - Password verification
   - Login attempt tracking
   - Session creation
   - File: `/custom/lib/Auth/CustomAuth.php`

2. **Create custom session management** to replace `SessionUtil`
   - Session initialization
   - Session tracking
   - Session validation
   - File: `/custom/lib/Session/SessionManager.php`

3. **Create custom user service** to replace `UserService`
   - User queries
   - User validation
   - User permissions
   - File: `/custom/lib/Services/UserService.php`

4. **Update API files**:
   - Replace `use OpenEMR\Common\Auth\AuthUtils` with `use Custom\Auth\CustomAuth`
   - Replace `use OpenEMR\Common\Session\SessionUtil` with `use Custom\Session\SessionManager`
   - Replace `use OpenEMR\Services\UserService` with `use Custom\Services\UserService`

**Dependencies to Replace**:
- OpenEMR's session handling
- OpenEMR's password hashing (likely uses PHP's built-in functions, easy)
- OpenEMR's user table queries

**Estimated Effort**: 80-120 hours (2-3 weeks)

---

### Phase 2: Security & Access Control (Weeks 5-6)
**Goal**: Replace OpenEMR security utilities

**Tasks**:
1. **Create custom CSRF protection** to replace `CsrfUtils`
   - Token generation
   - Token validation
   - Session-based token storage
   - File: `/custom/lib/Security/CsrfProtection.php`

2. **Create custom ACL system** to replace `AclMain`
   - Permission checks
   - Role-based access
   - Resource authorization
   - File: `/custom/lib/Security/AccessControl.php`

3. **Update API files**:
   - Replace CSRF checks
   - Replace ACL checks

**Estimated Effort**: 40-60 hours (1-1.5 weeks)

---

### Phase 3: Logging & Auditing (Week 7)
**Goal**: Replace OpenEMR audit logging

**Tasks**:
1. **Create custom audit logger** to replace `EventAuditLogger`
   - Log authentication events
   - Log data access
   - Log modifications
   - File: `/custom/lib/Logging/AuditLogger.php`

2. **Create audit log table** (if not using existing OpenEMR log table)
   - `audit_logs` table
   - Store event type, user, timestamp, details

3. **Update API files**:
   - Replace audit logging calls

**Estimated Effort**: 20-30 hours (3-5 days)

---

### Phase 4: Database Layer (Weeks 8-20) - MAJOR EFFORT
**Goal**: Replace OpenEMR database functions

**Current Dependencies**:
- 56 custom files use OpenEMR's `sqlQuery()`, `sqlStatement()`, `sqlInsert()`, etc.
- 30+ OpenEMR database tables

**Tasks**:
1. **Choose database abstraction layer**:
   - Option A: PDO wrapper (lightweight)
   - Option B: Doctrine DBAL (full-featured)
   - Option C: Laravel's Eloquent (ORM)

2. **Create custom database class**
   - Connection management
   - Query execution
   - Prepared statements
   - Transaction support
   - File: `/custom/lib/Database/Database.php`

3. **Replace database calls in all 56+ files**:
   - Replace `sqlQuery()` with `$db->query()`
   - Replace `sqlStatement()` with `$db->execute()`
   - Replace `sqlInsert()` with `$db->insert()`
   - Replace `sqlFetchArray()` with `$db->fetch()`

4. **Migrate/document table schemas**:
   - Document 30+ OpenEMR tables we use
   - Create migration scripts for schema
   - Decide: Keep OpenEMR tables or create new schema?

**Estimated Effort**: 200-300 hours (5-8 weeks)

---

### Phase 5: Testing & Validation (Weeks 21-24)
**Goal**: Ensure everything works without OpenEMR dependencies

**Tasks**:
1. **Unit tests** for custom classes
2. **Integration tests** for API endpoints
3. **End-to-end tests** with React frontend
4. **Security audit** of custom auth/session code
5. **Performance testing**
6. **Bug fixes and refinements**

**Estimated Effort**: 120-160 hours (3-4 weeks)

---

### Phase 6: Remove OpenEMR Dependencies (Week 25)
**Goal**: Delete /src and other OpenEMR directories

**Tasks**:
1. **Remove `/src` directory** (21MB saved)
2. **Remove `/library` directory** (if no longer needed)
3. **Remove `/interface` directory** (if no longer needed)
4. **Remove `globals.php` and OpenEMR bootstrap**
5. **Update composer.json** to remove OpenEMR dependencies
6. **Create custom bootstrap file** (`/custom/bootstrap.php`)

**Final Cleanup**:
```bash
# These directories could potentially be removed:
rm -rf src/          # 21MB
rm -rf library/      # ~5MB
rm -rf interface/    # ~10MB
rm -rf templates/    # ~1MB
rm -rf public/       # Keep only if needed for assets
rm -rf vendor/       # Rebuild with only needed dependencies
```

**Estimated Effort**: 20-30 hours (3-5 days)

---

## Total Effort Estimate

| Phase | Effort | Calendar Time |
|-------|--------|---------------|
| Phase 1: Auth & Sessions | 80-120 hrs | 2-3 weeks |
| Phase 2: Security & ACL | 40-60 hrs | 1-1.5 weeks |
| Phase 3: Logging | 20-30 hrs | 3-5 days |
| Phase 4: Database Layer | 200-300 hrs | 5-8 weeks |
| Phase 5: Testing | 120-160 hrs | 3-4 weeks |
| Phase 6: Cleanup | 20-30 hrs | 3-5 days |
| **TOTAL** | **480-700 hrs** | **~4-6 months** |

**Cost Estimate** (at $150/hr): **$72,000 - $105,000**

---

## Alternative: Hybrid Approach

Instead of full decoupling, consider a **hybrid approach**:

### Keep Using OpenEMR For:
- ✅ Database abstraction layer (keep `sqlQuery()`, etc.)
- ✅ Authentication (keep `AuthUtils`)
- ✅ Session management (keep `SessionUtil`)

### Replace Only:
- ❌ OpenEMR UI/frontend (already done with React)
- ❌ OpenEMR forms (already done with custom components)
- ❌ Billing/insurance (if not needed)

**This would:**
- Keep the GPL license requirement
- Save $50k-80k in development costs
- Focus on custom features vs infrastructure
- Still deliver your custom mental health EHR

---

## Decision Point

### Option A: Full Decoupling
**Pros**:
- Own all code
- No licensing restrictions
- Can sell proprietary version
- Full control over architecture

**Cons**:
- 4-6 months development
- $72k-$105k cost
- Security risk (custom auth code)
- Maintenance burden

### Option B: Stay with OpenEMR + Custom Layer
**Pros**:
- Leverage battle-tested infrastructure
- Save $70k-$100k
- Focus on features
- Faster to market

**Cons**:
- Must keep GPL license
- Must provide source code to customers
- Cannot prevent redistribution
- Tied to OpenEMR updates

### Option C: Gradual Decoupling
**Pros**:
- Ship features now
- Decouple later if needed
- Validate business model first
- Reduce upfront risk

**Cons**:
- Eventual refactoring needed
- Technical debt accumulates
- Two rounds of testing

---

## Recommendation

**Start with Option C: Gradual Decoupling**

1. **Now (Months 1-3)**:
   - Keep OpenEMR infrastructure
   - Focus on custom features
   - Ship MVP to customers
   - Validate business model

2. **Later (Months 6-12)**:
   - If business model validated
   - If proprietary licensing needed
   - Begin phased decoupling
   - Replace components one by one

3. **Benefits**:
   - Get to market faster
   - Validate demand before $100k investment
   - Learn what infrastructure you actually need
   - Make informed architectural decisions

---

## Next Steps

**If proceeding with decoupling**, the first step should be:

1. **Week 1**: Create `/custom/lib/` directory structure
2. **Week 1**: Build custom authentication class
3. **Week 2**: Build custom session manager
4. **Week 2**: Build custom user service
5. **Week 3**: Replace auth/session calls in 5-6 API files
6. **Week 3**: Test authentication flow end-to-end
7. **Week 4**: Continue to Phase 2...

**Shall we begin Phase 1, or would you like to discuss the strategy first?**
