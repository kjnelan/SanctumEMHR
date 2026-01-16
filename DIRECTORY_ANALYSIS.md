# OpenEMR Directory Removal Analysis
## Custom Code Dependencies Report

**Analysis Date:** 2026-01-16  
**Custom Code Locations:**
- `/home/user/sacwan-openemr-mh/custom/` (613K)
- `/home/user/sacwan-openemr-mh/react-frontend/` (2.6M, builds to `/app`)

---

## SECTION 1: REQUIRED - Cannot Remove
**These directories have direct dependencies from custom code and MUST be kept.**

### 1. **vendor/** (Not Yet Installed)
- **Purpose:** Composer dependencies and third-party libraries
- **Why Required:** 
  - Required by `interface/globals.php` via `require_once $GLOBALS['vendor_dir'] . "/autoload.php"`
  - Autoloads all OpenEMR namespace classes (OpenEMR\*)
  - Provides ADODB database library, Twig templates, PSR libraries, etc.
  - Custom APIs explicitly include vendor/autoload.php
- **Risk if Removed:** **CRITICAL** - Complete system failure
- **Size:** ~200-400MB (typical after composer install)

### 2. **src/** (21MB)
- **Purpose:** OpenEMR namespace classes (PSR-4 autoloaded via composer)
- **Why Required:**
  - `OpenEMR\Common\Csrf\CsrfUtils` - CSRF protection (used in 10+ custom files)
  - `OpenEMR\Common\Auth\AuthUtils` - Authentication utilities
  - `OpenEMR\Common\Session\SessionUtil` - Session management
  - `OpenEMR\Common\Logging\EventAuditLogger` - Audit logging
  - `OpenEMR\Common\Acl\AclMain` - Access control
  - `OpenEMR\Common\Twig\TwigContainer` - Template rendering
  - `OpenEMR\Core\Header` - Page headers/assets
  - `OpenEMR\Services\UserService` - User management
  - `OpenEMR\Services\FacilityService` - Facility management
  - `OpenEMR\Events\Codes\ExternalCodesCreatedEvent` - Event system
- **Risk if Removed:** **CRITICAL** - All custom APIs will fail
- **Size:** 21MB

### 3. **library/** (7.2MB)
- **Purpose:** Core PHP library functions and classes
- **Why Required:**
  - `library/sql.inc.php` - Database functions (sqlQuery, sqlStatement, etc.) used in 56 custom files
  - `library/options.inc.php` - List/layout management functions
  - `library/patient.inc.php` - Patient data functions
  - `library/clinical_rules.php` - Clinical rules engine
  - `library/csv_like_join.php` - CSV utilities
  - `library/sqlconf.php` - Database configuration
  - `library/classes/` - Autoloaded classes
  - Auto-included files (via composer autoload):
    - `library/htmlspecialchars.inc.php` - Security functions
    - `library/formdata.inc.php` - Form sanitization
    - `library/sanitize.inc.php` - Data sanitization
    - `library/formatting.inc.php` - Formatting functions
    - `library/date_functions.php` - Date utilities
    - `library/validation/validate_core.php` - Validation
    - `library/translation.inc.php` - Translation/i18n
- **Risk if Removed:** **CRITICAL** - Database access fails, core functions missing
- **Size:** 7.2MB

### 4. **interface/** (66MB)
- **Purpose:** User interface files and main entry point
- **Why Required:**
  - `interface/globals.php` - Included by 50+ custom API files
  - Sets up all global variables, paths, and configuration
  - Loads vendor/autoload.php, establishes sessions, sets $GLOBALS
- **Risk if Removed:** **CRITICAL** - No custom APIs will function
- **Size:** 66MB
- **Note:** This is the largest directory but absolutely essential

### 5. **sites/** (1.5MB)
- **Purpose:** Site-specific configuration and data storage
- **Why Required:**
  - `sites/[site_id]/config.php` - Database credentials and site config (loaded by globals.php)
  - `sites/[site_id]/documents/` - Document storage referenced by custom code
  - `sites/[site_id]/documents/cqm_qrda/` - Used by QRDA export functions
  - Site directory path set via `$GLOBALS['OE_SITE_DIR']`
- **Risk if Removed:** **CRITICAL** - Cannot connect to database
- **Size:** 1.5MB

### 6. **ccr/** (757K)
- **Purpose:** Continuity of Care Record utilities
- **Why Required:**
  - `ccr/uuid.php` - UUID generation used by custom files:
    - `custom/ajax_download.php`
    - `custom/export_qrda_xml.php`
- **Risk if Removed:** **HIGH** - QRDA exports will fail
- **Size:** 757K

### 7. **public/** (4.3MB)
- **Purpose:** Static assets (images, CSS, JavaScript, themes)
- **Why Required:**
  - Referenced in globals.php via:
    - `$GLOBALS['assets_static_relative']` = "/public/assets"
    - `$GLOBALS['themes_static_relative']` = "/public/themes"
    - `$GLOBALS['images_static_relative']` = "/public/images"
  - Used in custom download pages for icons/images
  - Required for any UI rendering
- **Risk if Removed:** **HIGH** - UI breaks, missing assets
- **Size:** 4.3MB

### 8. **gacl/** (2.1MB)
- **Purpose:** Generic Access Control Library (phpGACL)
- **Why Required:**
  - ACL system used by OpenEMR\Common\Acl\AclMain
  - Used indirectly by custom code through ACL checks
  - Contains gacl.ini.php configuration
- **Risk if Removed:** **HIGH** - Access control fails
- **Size:** 2.1MB

### 9. **templates/** (1.3MB)
- **Purpose:** Twig template files
- **Why Required:**
  - Used by TwigContainer in custom/import_xml.php
  - Renders `core/unauthorized.html.twig`
  - Set via `$GLOBALS['template_dir']` in globals.php
- **Risk if Removed:** **MEDIUM** - Template rendering fails (only 1 custom file affected)
- **Size:** 1.3MB

### 10. **config/** (17K)
- **Purpose:** Application-level configuration files
- **Why Required:**
  - Contains config.yaml for system configuration
  - May contain environment-specific settings
- **Risk if Removed:** **MEDIUM** - Configuration missing, potential errors
- **Size:** 17K

### 11. **custom/** (613K)
- **Purpose:** Your custom code and API endpoints
- **Why Required:** This is your application!
- **Risk if Removed:** **CRITICAL** - Your entire custom application disappears
- **Size:** 613K

### 12. **app/** (2.2MB)
- **Purpose:** Built/compiled React frontend (served to users)
- **Why Required:**
  - Generated by `npm run build` from react-frontend/
  - Contains production-ready HTML/CSS/JS
  - This is what users access in their browsers
- **Risk if Removed:** **CRITICAL** - No frontend UI
- **Size:** 2.2MB

### 13. **apis/** (555K)
- **Purpose:** OpenEMR REST API endpoints (FHIR and default)
- **Why Required:**
  - React frontend makes calls to `/apis/default/api/*`
  - Used for standard OpenEMR API operations
  - Functions: `getTodaysAppointments()`, `getPatientCount()` in api.js
- **Risk if Removed:** **HIGH** - React frontend API calls fail
- **Size:** 555K

---

## SECTION 2: OPTIONAL - May Remove (with caution)
**These directories are not directly used by custom code but may be needed for OpenEMR functionality.**

### 14. **modules/** (274K)
- **Purpose:** OpenEMR modules/plugins
- **Why Optional:** Not directly referenced by custom code
- **Why Keep:** Contains 3 modules (era_manager, sms_email_reminder, sms_voipms) that may provide functionality
- **Risk if Removed:** **LOW-MEDIUM** - Module features unavailable
- **Size:** 274K
- **Recommendation:** Review if these modules are actively used

### 15. **sql/** (2.2MB)
- **Purpose:** Database schema and migration SQL scripts
- **Why Optional:** Only needed for initial setup or upgrades
- **Why Keep:** Required if you ever need to rebuild database or upgrade OpenEMR
- **Risk if Removed:** **LOW** - Cannot reinstall/upgrade database schema
- **Size:** 2.2MB
- **Recommendation:** Keep for maintenance purposes

### 16. **oauth2/** (6.5K)
- **Purpose:** OAuth2 authentication endpoints
- **Why Optional:** Custom code uses session-based auth, not OAuth2
- **Why Keep:** May be needed for third-party API integrations
- **Risk if Removed:** **LOW** - Only affects OAuth2 clients
- **Size:** 6.5K (tiny)
- **Recommendation:** Keep unless you're certain no OAuth2 clients exist

---

## SECTION 3: SAFE TO REMOVE - Can Delete Now
**These directories are NOT used by custom code and can be safely removed.**

### 17. **contrib/** (39MB) ⭐ LARGEST REMOVABLE
- **Purpose:** Contributed utilities, forms, and tools
- **Why Remove:** Not referenced anywhere in custom code
- **Risk if Removed:** **NONE**
- **Size:** 39MB
- **Savings:** Largest single directory to remove

### 18. **swagger/** (8.7MB)
- **Purpose:** Swagger/OpenAPI documentation for REST APIs
- **Why Remove:** Documentation only, not functional code
- **Risk if Removed:** **NONE** - Only lose API docs
- **Size:** 8.7MB

### 19. **tests/** (5.0MB)
- **Purpose:** PHPUnit and automated tests
- **Why Remove:** Development/testing only, not needed in production
- **Risk if Removed:** **NONE** - Cannot run tests
- **Size:** 5.0MB

### 20. **docker/** (2.3MB)
- **Purpose:** Docker configuration and build files
- **Why Remove:** Not needed if not using Docker
- **Risk if Removed:** **NONE** - Only affects Docker deployments
- **Size:** 2.3MB

### 21. **portal/** (2.1MB)
- **Purpose:** Patient portal (separate from your React frontend)
- **Why Remove:** Custom code uses separate React app, not OpenEMR portal
- **Risk if Removed:** **NONE** - Your custom app is independent
- **Size:** 2.1MB

### 22. **ccdaservice/** (1.1MB)
- **Purpose:** C-CDA (Consolidated Clinical Document Architecture) service
- **Why Remove:** Not referenced by custom code
- **Risk if Removed:** **NONE** - Unless you need C-CDA exports
- **Size:** 1.1MB

### 23. **docs/** (401K)
- **Purpose:** Documentation files
- **Why Remove:** Documentation only
- **Risk if Removed:** **NONE**
- **Size:** 401K

### 24. **ci/** (251K)
- **Purpose:** Continuous Integration configuration (GitHub Actions, etc.)
- **Why Remove:** Development/CI only
- **Risk if Removed:** **NONE**
- **Size:** 251K

### 25. **controllers/** (163K)
- **Purpose:** MVC controllers (Laminas framework)
- **Why Remove:** Custom code doesn't use MVC pattern
- **Risk if Removed:** **NONE** - Unless using Laminas routes
- **Size:** 163K

### 26. **database/** (18K)
- **Purpose:** Database utilities
- **Why Remove:** Not referenced by custom code
- **Risk if Removed:** **NONE**
- **Size:** 18K

### 27. **sphere/** (17K)
- **Purpose:** Unknown OpenEMR component
- **Why Remove:** Not referenced
- **Risk if Removed:** **NONE**
- **Size:** 17K

### 28. **bin/** (12K)
- **Purpose:** Command-line utilities and scripts
- **Why Remove:** Not used by web application
- **Risk if Removed:** **NONE** - Cannot run CLI scripts
- **Size:** 12K

### 29. **react-frontend/** (2.6MB)
- **Purpose:** React source code (development files)
- **Why Remove:** Already built to /app directory
- **Risk if Removed:** **NONE** - Cannot rebuild frontend
- **Size:** 2.6MB
- **Recommendation:** Keep only if you need to modify frontend code

---

## Summary Statistics

### Total Size Breakdown
- **REQUIRED (Must Keep):** ~105MB (13 directories)
- **OPTIONAL (Review):** ~2.5MB (3 directories)
- **SAFE TO REMOVE:** ~64MB (16 directories)
- **Vendor (Not Yet Installed):** ~300MB estimated

### Space Savings Potential
**Removing all "Safe to Remove" directories:** ~64MB saved

**Top 5 Removable Directories:**
1. contrib/ - 39MB
2. swagger/ - 8.7MB
3. tests/ - 5.0MB
4. react-frontend/ - 2.6MB (if you don't need to rebuild)
5. docker/ - 2.3MB

### Critical Dependencies Chain
```
Custom APIs → interface/globals.php → {
    vendor/autoload.php → src/ (OpenEMR classes)
    library/sql.inc.php → library/sqlconf.php → sites/[site]/config.php
    $GLOBALS setup → public/, templates/, gacl/
}

React Frontend → {
    /app/ (built files)
    /custom/api/* (custom endpoints)
    /apis/default/* (OpenEMR REST API)
}
```

---

## Recommendations

### Immediate Actions (Safe)
```bash
# Remove these directories immediately - no risk
rm -rf /home/user/sacwan-openemr-mh/contrib
rm -rf /home/user/sacwan-openemr-mh/swagger
rm -rf /home/user/sacwan-openemr-mh/tests
rm -rf /home/user/sacwan-openemr-mh/docker
rm -rf /home/user/sacwan-openemr-mh/portal
rm -rf /home/user/sacwan-openemr-mh/ccdaservice
rm -rf /home/user/sacwan-openemr-mh/docs
rm -rf /home/user/sacwan-openemr-mh/ci
rm -rf /home/user/sacwan-openemr-mh/controllers
rm -rf /home/user/sacwan-openemr-mh/database
rm -rf /home/user/sacwan-openemr-mh/sphere
rm -rf /home/user/sacwan-openemr-mh/bin

# Saves ~57MB
```

### Consider Removing (if conditions met)
```bash
# Remove React source if you won't modify frontend
rm -rf /home/user/sacwan-openemr-mh/react-frontend  # +2.6MB

# Total savings: ~60MB
```

### NEVER Remove
**DO NOT delete these under any circumstances:**
- vendor/ (once installed)
- src/
- library/
- interface/
- sites/
- ccr/
- public/
- gacl/
- templates/
- config/
- custom/
- app/
- apis/

### Before Installing Composer
When you run `composer install`, the vendor/ directory will be created (~300-400MB). This is **absolutely required** and contains all third-party dependencies.

---

## Verification Commands

After removing directories, verify system integrity:

```bash
# Check custom API dependencies
grep -r "require_once\|include" /home/user/sacwan-openemr-mh/custom/ | grep "\.\."

# Test a custom API endpoint
curl -I http://localhost/custom/api/client_list.php

# Check React build integrity
ls -lh /home/user/sacwan-openemr-mh/app/

# Verify vendor autoload (after composer install)
php -r "require '/home/user/sacwan-openemr-mh/vendor/autoload.php'; echo 'OK';"
```

---

**Report Generated:** 2026-01-16  
**Analysis Method:** Static code analysis of require/include statements, namespace usage, and $GLOBALS references
