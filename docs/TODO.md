# SanctumEMHR EMHR - TODO & Development Roadmap

**Project:** SanctumEMHR Electronic Mental Health Record
**Last Updated:** 2026-01-18
**Current Phase:** Post-Migration Stabilization & Enhancement

---

## 🎯 Current Priority: Post-Migration Tasks

### Database & Backend Stability
- [ ] **Test all migrated endpoints** - Verify all APIs work with SanctumEMHR schema
  - [x] Client detail (client_detail.php)
  - [x] Clinical notes (clinical_notes.php, get_patient_notes.php)
  - [x] Documents (client_documents.php)
  - [x] Appointments (get_appointments.php)
  - [ ] Billing transactions
  - [ ] Treatment plans
  - [ ] Forms and assessments
  - [ ] User management

- [ ] **Document API mappings** - Create comprehensive API documentation
  - [ ] List all active endpoints in /custom/api
  - [ ] Document request/response formats
  - [ ] Document authentication requirements
  - [ ] Create Postman/Insomnia collection

- [ ] **Review interface/ and modules/ folders** - Identify remaining OpenEMR dependencies
  - [ ] Audit what's still used vs. legacy code
  - [ ] Plan migration or removal strategy
  - [ ] Document any temporary dependencies

### Frontend React Application
- [ ] **Audit React components** - Ensure all use SanctumEMHR APIs
  - [ ] Check for any remaining OpenEMR API calls
  - [ ] Verify session management works consistently
  - [ ] Test all user workflows end-to-end

- [ ] **Error handling improvements**
  - [ ] Add user-friendly error messages
  - [ ] Implement retry logic for failed requests
  - [ ] Add loading states for all async operations

---

## 📋 Calendar System Enhancements

### High Priority
- [ ] **Modal positioning fix** - Center modals in viewport instead of page top
  - Components: AppointmentModal.jsx, BlockTimeModal.jsx

- [ ] **Admin access control** - Restrict Admin menu to calendar admins only
  - Review SanctumEMHR's role/permission system
  - Implement proper ACL checks in SessionManager
  - Test with different user roles

### Completed ✅
- ✅ Repeating appointments and availability blocks (full CRUD)
- ✅ Conflict detection and resolution
- ✅ Series management (edit/delete single, all, or "this and future")
- ✅ Calendar settings integration
- ✅ Provider filtering
- ✅ Week/Day/Month views

### Future Enhancements
- [ ] Drag-and-drop rescheduling
- [ ] Mobile responsive design (critical for field use)
- [ ] Privacy mode toggle (show initials only - HIPAA)
- [ ] Export to PDF/iCal
- [ ] SMS/Email appointment reminders
- [ ] Waitlist management

---

## 🏗️ Architecture & Code Quality

### Database Optimization
- [ ] **Index analysis** - Ensure proper indexes on foreign keys
  - client_id, provider_id, facility_id, encounter_id columns
  - Date columns used in range queries

- [ ] **Query optimization** - Review slow queries
  - Add EXPLAIN ANALYZE to complex queries
  - Consider materialized views for reports

- [ ] **Data validation** - Add database constraints
  - Foreign key constraints where missing
  - NOT NULL constraints on required fields
  - CHECK constraints for status enums

### Code Modernization
- [ ] **PSR-12 compliance** - Standardize PHP code style
- [ ] **Type hints** - Add PHP 7.4+ type declarations
- [ ] **Error handling** - Use try/catch consistently
- [ ] **Dependency injection** - Reduce singleton usage where appropriate
- [ ] **Unit tests** - Add PHPUnit tests for critical functions
- [ ] **Integration tests** - Test API endpoints systematically

### Security Hardening
- [ ] **SQL injection review** - Verify all queries use parameterized statements
- [ ] **XSS prevention** - Sanitize all user input
- [ ] **CSRF protection** - Add tokens to all forms
- [ ] **Rate limiting** - Prevent API abuse
- [ ] **Session security** - Review session configuration
  - httpOnly, secure, SameSite cookies
  - Session timeout settings
  - Regenerate session ID on privilege escalation

---

## 📱 Mobile & UX Improvements

### Critical Mobile Support
- [ ] **Responsive breakpoints**
  - Mobile: < 768px (touch-optimized)
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

- [ ] **Mobile navigation**
  - Hamburger menu for sidebar
  - Bottom navigation bar
  - Swipe gestures
  - Touch-friendly tap targets (44x44px minimum)

### Accessibility (WCAG 2.1 AA)
- [ ] **Keyboard navigation** - All features accessible without mouse
- [ ] **Screen reader support** - Proper ARIA labels
- [ ] **Color contrast** - Meet WCAG standards (4.5:1 minimum)
- [ ] **Focus indicators** - Visible focus states
- [ ] **Form labels** - Proper label associations
- [ ] **Error announcements** - Screen reader notifications

---

## 🔐 Compliance & Privacy

### HIPAA Requirements
- [ ] **Audit logging** - Comprehensive access logs
  - Who accessed what data
  - When and from where
  - What changes were made

- [ ] **Data encryption**
  - [ ] At rest (database encryption)
  - [ ] In transit (force HTTPS, no mixed content)
  - [ ] Backup encryption

- [ ] **Access controls**
  - [x] Role-based permissions (RBAC) - Basic implementation complete
  - [ ] Minimum necessary standard
  - [ ] Emergency access procedures

- [ ] **Breach notification** - Procedures and logging

### Configurable RBAC System (Future Enhancement)
- [ ] **Admin UI for Role-Permission Configuration**
  - [ ] Create admin interface to configure which roles can access which features
  - [ ] Database tables: `roles`, `permissions`, `role_permissions`
  - [ ] Permission matrix UI showing roles vs features
  - [ ] Ability to create custom roles beyond standard (admin, provider, supervisor, social_worker)

- [ ] **Granular Permission Categories**
  - [ ] Client access (view, edit, create, delete)
  - [ ] Clinical notes (view, create, sign, view_others)
  - [ ] Billing (view, create, submit_claims)
  - [ ] Calendar (view_own, view_all, manage_others)
  - [ ] Admin settings (users, facilities, codes, system)
  - [ ] Reports (clinical, financial, compliance)

- [ ] **Backend Permission Checks**
  - [ ] Update PermissionChecker.php to read from database config
  - [ ] Cache permission lookups for performance
  - [ ] API endpoint to fetch user's effective permissions

- [ ] **Current Hardcoded Permissions** (to be made configurable)
  - Admins: Full access to everything
  - Supervisors: Own clients + supervisees' clients, no billing
  - Providers/Clinicians: Own clients only, clinical notes, no billing
  - Social Workers: Own clients, case management notes only, no clinical notes, no billing

### Business Associate Agreements
- [ ] Document all third-party services
- [ ] Ensure BAAs are in place
- [ ] Review data processing locations

---

## 📊 Reporting & Analytics

### Clinical Reports
- [ ] **Provider productivity** - Appointments, notes, billing
- [ ] **Client engagement** - Attendance rates, no-shows
- [ ] **Outcome measures** - Treatment effectiveness
- [ ] **Waitlist analysis** - Time to appointment

### Business Intelligence
- [ ] **Revenue reports** - By provider, facility, service type
- [ ] **Insurance claims** - Submission and payment tracking
- [ ] **Census reports** - Active clients, admissions, discharges
- [ ] **Compliance reports** - Note completion, signature rates

---

## 🚀 Feature Roadmap

### Phase 1: Stabilization (Current)
**Goal:** Ensure all core features work reliably after migration

- Test all migrated endpoints
- Fix any schema mapping issues
- Document current state
- Clean up legacy code

### Phase 2: Enhancement (Q1 2026)
**Goal:** Improve UX and add missing features

- Mobile responsive design
- Calendar improvements (drag-and-drop, modal positioning)
- Better error handling and loading states
- Accessibility improvements

### Phase 3: Advanced Features (Q2 2026)
**Goal:** Power user features and automation

- Treatment plan templates
- Automated appointment reminders
- Telehealth integration
- E-prescribing integration
- Claims submission automation

### Phase 4: Analytics & Reporting (Q3 2026)
**Goal:** Business intelligence and outcomes tracking

- Custom report builder
- Dashboard widgets
- Outcome measurement tools
- Quality improvement tracking

### Phase 5: Scale & Performance (Q4 2026)
**Goal:** Enterprise readiness

- Multi-tenant architecture refinement
- Performance optimization
- Caching strategy
- CDN for assets
- Load balancing

---

## 🐛 Known Issues

### High Priority
- ⚠️ Modal positioning - Appears at page top instead of viewport center
- ⚠️ Admin menu visibility - Shows for all users instead of admins only

### Medium Priority
- ⚠️ Mobile responsiveness - Not optimized for mobile devices yet
- ⚠️ Loading states - Some operations lack clear loading indicators
- ⚠️ Error messages - Generic errors instead of user-friendly messages

### Low Priority
- ⚠️ Form validation - Some forms need better client-side validation
- ⚠️ Browser compatibility - Limited testing on Safari/Edge

---

## 📝 Migration Completion Status

### ✅ Completed (100%)
- [x] Database schema design and implementation
- [x] Session management (SessionManager singleton)
- [x] Database wrapper (Database singleton with PDO)
- [x] User authentication and login
- [x] Client detail page (fully migrated)
- [x] Clinical notes (CRUD operations)
- [x] Documents (upload/download/categorization)
- [x] Appointments and calendar
- [x] Facilities management (3 address tabs)
- [x] Users management
- [x] OpenEMR folder cleanup (removed ~1,300 files, ~150K lines)
- [x] Root directory organization

### 🔄 In Progress (0%)
- Currently in stabilization and testing phase

### 📅 Not Started
- See Feature Roadmap above for planned work

---

## 🛠️ Development Setup

### Prerequisites
- PHP 8.1+ with extensions: pdo, pdo_mysql, mbstring, json
- MySQL 8.0+ or MariaDB 10.6+
- Node.js 18+ and npm
- Composer 2.x

### Local Development
```bash
# Install PHP dependencies
composer install

# Install Node dependencies
cd react-frontend && npm install

# Run frontend dev server
npm run dev

# Database setup
mysql -u root -p < database/sanctumEMHR.sql
```

### Environment Configuration
Copy `.env.example` to `.env` and configure:
- Database credentials
- Session settings
- File upload paths
- API keys (if applicable)

---

## 📚 Documentation

### For Developers
- [Database Schema](database/DATABASE_SCHEMA.md)
- [Schema Mapping](database/SCHEMA_MAPPING.md)
- [API Endpoints](api/ENDPOINTS.md)
- [Architecture Overview](architecture/OVERVIEW.md)

### For Migration Reference
- [Migration Plan](migration/MIGRATION_PLAN_CLEAN_START.md)
- [Migration Changes Summary](migration/MIGRATION_CHANGES_SUMMARY.md)
- [Decoupling Analysis](migration/DECOUPLING_ANALYSIS.md)
- [Directory Analysis](migration/DIRECTORY_ANALYSIS.md)

### For Setup
- [Installation Guide](setup/INSTALLATION.md)
- [Authentication Setup](setup/AUTHENTICATION_SETUP.md)
- [Setup Instructions](setup/SETUP.md)

---

## 🎯 Definition of Done

For any feature to be considered "complete":
- [ ] Code written and reviewed
- [ ] Unit tests pass (when applicable)
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Accessibility checked
- [ ] Mobile tested (if user-facing)
- [ ] Performance acceptable
- [ ] User acceptance testing passed
- [ ] Deployed to staging
- [ ] Deployed to production

---

**Next Review:** 2026-02-01
**Maintained by:** Development Team
