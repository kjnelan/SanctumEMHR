# Mindline EMHR: Project Documentation

**Version:** 0.3.0-alpha  
**Date:** December 31, 2024  
**Author:** Fr. Kenn, Sacred Wandering  
**Status:** Active Development

---

## Executive Summary

Mindline is a standalone Electronic Mental Health Records (EMHR) system designed specifically for outpatient mental health practices. What began as a UI modernization effort for OpenEMR has evolved into a purpose-built mental health EMR that prioritizes therapeutic workflows over traditional medical paradigms.

**Key Innovation:** We're introducing the term "EMHR" (Electronic Mental Health Records) to distinguish mental health documentation systems from general medical EMRs, reflecting the fundamental differences in clinical workflows, documentation needs, and patient relationships inherent to mental health practice.

---

## Project Vision

### Tagline
"Where modern design meets clinical insight."

### Core Philosophy
Mental health practitioners deserve software built for how therapy actually works, not retrofitted medical EMRs. Mindline prioritizes:

- **Warm, human-centered design** over sterile medical interfaces
- **Therapeutic workflows** over medical visit patterns  
- **Client relationships** over patient processing
- **Clinical insight** over billing optimization
- **Simplicity** over feature bloat

### Target Users
- Outpatient mental health clinics
- Solo practitioners and small group practices
- Nonprofit counseling centers
- Faith-based counseling organizations
- Therapists who want modern tools without enterprise complexity

---

## Architectural Decision

### What Mindline Actually Is

After careful analysis, Mindline is **a standalone mental health EMHR** that currently uses OpenEMR's database schema as a foundation. We are NOT building a React frontend on OpenEMR's backend. We are building our own application.

**What we use from OpenEMR:**
- Database schema (patient_data, encounters, forms, billing tables)
- Database connection via `globals.php`
- SQL helper functions (sqlStatement, sqlQuery, etc.)
- Session management infrastructure

**What we DON'T use from OpenEMR:**
- Service layer (PatientService, EncounterService, etc.)
- Business logic
- Validation rules
- Existing REST APIs
- Frontend interface
- Menu systems
- Workflow engine

**What this means:**
We write raw SQL queries directly to OpenEMR tables through custom API endpoints. We bypass OpenEMR's business logic entirely. We're building our own authentication, our own workflows, our own rules.

This is closer to "building a new EMHR that shares a database with OpenEMR" than "building a UI for OpenEMR."

### Why This Approach

**Advantages:**
1. Full control over user experience and workflows
2. No OAuth2 complexity, simple session-based authentication
3. APIs shaped exactly for mental health needs
4. Faster development velocity
5. Mental health-optimized features without medical baggage
6. Plug-and-play installation for end users
7. Clean separation of concerns

**Risks:**
1. OpenEMR database schema changes could break our queries
2. No automatic benefit from OpenEMR updates
3. We own all validation and business logic
4. Eventual need to fork database schema for full independence

**Risk Mitigation:**
- Version lock OpenEMR at 7.0.3 for stability
- Plan database schema fork for v2.0 when ready
- Document all SQL dependencies for easier migration
- Build comprehensive test suite

---

## Technical Stack

### Frontend
- **Framework:** React 19.3
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4 with PostCSS
- **State Management:** React Context API
- **Routing:** React Router
- **Design System:** Custom glassmorphism with gradient aesthetics

### Backend
- **Language:** PHP 8.4
- **Web Server:** Apache with PHP-FPM
- **Database:** MySQL (OpenEMR schema)
- **Authentication:** Session-based (cookies, not OAuth2)
- **API Pattern:** Custom REST endpoints in `/custom/api/`

### Infrastructure
- **Environment:** Linux (Ubuntu-based)
- **Deployment:** Apache virtual host
- **Development:** Separate domain (sacwanmed.sacwan.org)
- **Version Control:** GitHub (private repository: sacwan-openemr-mh)
- **Development Tools:** Claude.ai + Claude Code for rapid iteration

---

## Current State (v0.3.0-alpha)

### Completed Features

**Authentication & Session Management:**
- Session-based login (no OAuth2)
- User session validation
- Logout functionality
- User role/permission checking

**Main Dashboard:**
- Personalized greeting
- Today's appointments widget
- Active clients count
- Quick actions (New Appointment, Search Clients)
- Messages/Notifications card

**Client Management:**
- Client search (HIPAA-compliant, no exposed lists)
- Client list with filtering
- Client statistics and demographics breakdown

**Client Detail View:**
- Six-tab interface (Summary, Demographics, Clinical, Documents, Billing, Admin Notes)
- Summary tab with key info overview
- Demographics tab with full CRUD operations:
  - Personal information (name, DOB, sex, gender identity, etc.)
  - Guardian/Related Persons management (multiple entries)
  - Contact information
  - Emergency contacts
  - Risk & Protection indicator
  - Clinician assignments
  - Portal settings
- Documents tab (view uploaded files)
- Insurance display and editing

**Calendar System:**
- Calendar interface
- Appointment viewing
- Provider scheduling

**SMS/Email Reminders:**
- Pre-built SMS notification system (portable from previous work)
- Ready for integration

### In Progress
- Appointment scheduling completion
- Custom calendar colors per clinician

---

## Roadmap to v1.0 (Core System Complete)

**Estimated Timeline: 2-3 weeks**

### Week 1: Clinical Documentation
- [ ] Encounter creation workflow
- [ ] Clinical notes display and editing
- [ ] Treatment plan forms
- [ ] Risk assessment forms (per risk factor)
- [ ] Session note templates
- [ ] Electronic signatures

### Week 2: Billing & Financial
- [ ] Session billing interface
- [ ] Insurance claims tracking
- [ ] Payment recording
- [ ] Billing reports
- [ ] Sliding scale management
- [ ] Credit card integration (Square)

### Week 3: Reports & Administration
- [ ] Client outcome reports
- [ ] Productivity reports
- [ ] Demographics reports (for grants)
- [ ] No-show tracking
- [ ] User management (admin only)
- [ ] Clinic settings/configuration
- [ ] List options management
- [ ] Branding configuration

### Post-v1.0 Enhancements
- Messages/Portal integration
- Group therapy tracking
- Outcome measures dashboard
- Advanced reporting
- API for third-party integrations
- Mobile app considerations

---

## Key Design Decisions

### Risk & Protection Tracking

**Approach:** Individual risk assessment forms per risk factor, not checkbox screening.

**Risk Factors Tracked:**
1. Suicidal Ideation (SI)
2. Homicidal Ideation (HI)
3. Self-Harm/NSSI
4. Substance Abuse
5. Violence to Others
6. Child Safety Concerns
7. Domestic Violence/IPV

**Implementation:**
- Protection Indicator field (yes/no) in demographics
- Visual badge on Summary tab if risks present
- Detailed Risk Assessment forms in Clinical Notes
- Each risk factor gets separate form for clear documentation trail
- Forms include: Risk Type, Severity, General Notes, Protective Factors, Safety Plan

**Rationale:** Mental health documentation requires nuanced, individualized risk tracking with progression over time. Checkbox lists don't capture clinical complexity.

### Guardian/Related Persons Management

**Implementation:**
- Uses OpenEMR's `person` and `contact_relation` tables
- Supports multiple guardians per client
- Full contact information for each guardian
- Relationship types (Parent, Legal Guardian, Foster Parent, etc.)

**Rationale:** Mental health clients often have complex family situations. System needs to handle divorced parents, legal guardianships, foster placements, and multiple responsible parties.

### Clinical Tab Organization

**Structure:**
- Problems/Diagnoses (collapsible card)
- Medications (collapsible card)
- Encounters (chronological list with forms)

**Rationale:** In mental health, encounters (sessions) are the primary documentation unit. Treatment plans, assessments, and notes all live within encounter context. This differs from medical EMRs where problems and medications are primary.

### Session-Based Authentication

**Decision:** Use PHP sessions with cookies instead of OAuth2 bearer tokens.

**Rationale:**
- Zero configuration for end users
- Plug-and-play installation
- No OAuth client setup needed
- Simpler for self-hosted single-installation systems
- Better for small practices without IT departments
- Mirrors OpenEMR's existing PHP session patterns

---

## Business Model Considerations

**Current Status:** Internal tool for Sacred Wandering

**Future Options (Post-v1.0):**

**Option A: Keep Internal**
- Use exclusively for Sacred Wandering
- Maintain on own schedule
- No customer support obligations
- Possible open source release for community benefit

**Option B: Productize**
- Beta test with 2-5 friendly clinics
- Prove reliability in real-world practices
- Hire additional developers for polish
- Build support infrastructure
- Establish pricing model

**Potential Revenue Models:**
1. **SaaS Subscription:** $50-150/month per clinician
2. **Self-Hosted License:** $2K-10K one-time or annual
3. **Open Core:** Free base + paid premium features
4. **Freemium:** Free for solo, paid for groups

**Decision Point:** After v1.0 proves functional for Sacred Wandering

---

## Development Philosophy

### Velocity Over Perfection
Ship working features quickly. Iterate based on real usage. Perfect is the enemy of done.

### Mental Health First
Every design decision prioritizes therapeutic workflows over general medical patterns.

### Simplicity Wins
Fewer features done well beats comprehensive features done poorly. Build what therapists actually need.

### User Empowerment
Therapists should feel empowered by their tools, not burdened by them.

---

## Project Organization

### Repository
- **GitHub:** sacwan-openemr-mh (private)
- **Authentication:** Personal Access Token
- **Branching:** Feature branches via Claude Code
- **Deployment:** Manual from main branch

### File Structure
```
/custom/api/          # Custom API endpoints (session-based)
/app/                 # React frontend (Vite build)
/app/src/             # React source code
/app/src/components/  # React components
/interface/           # OpenEMR core (minimal changes)
/sql/                 # Database schema
```

### Development Domains
- **Production:** (TBD when ready)
- **Development:** sacwanmed.sacwan.org
- **Testing:** (TBD)

---

## Success Metrics

### v1.0 Success Criteria
1. Sacred Wandering can run entirely on Mindline
2. All clinical documentation can be completed in-system
3. Billing and claims submission works
4. System is stable for daily use
5. No data loss or integrity issues
6. Performance is acceptable (pages load < 2 seconds)

### Product Success Criteria (if pursued)
1. 5+ clinics using successfully
2. 90%+ user satisfaction
3. Zero critical bugs in production
4. Positive revenue (covers hosting + development)
5. Active user community

---

## Known Limitations & Future Considerations

### Current Limitations
- Dependent on OpenEMR database schema
- No mobile app (desktop/tablet only)
- Single-location focused (no multi-site support yet)
- Limited to English language
- No HL7/FHIR integration (yet)

### Migration Path (v2.0+)
When ready for full independence from OpenEMR:
1. Fork database schema to `mindline_*` tables
2. Optimize for mental health workflows
3. Remove medical-specific fields
4. Add therapy-specific structures
5. Build migration tool from OpenEMR
6. Maintain backward compatibility

---

## Legal & Compliance Considerations

### HIPAA Compliance
- Session security (httpOnly, secure cookies)
- Audit logging of all access
- User authentication and authorization
- Encrypted data transmission (HTTPS required)
- Access controls by user role
- Session timeout after inactivity

### Documentation Standards
- Electronic signatures for clinical notes
- Audit trail of all changes
- Timestamped entries
- Provider identification on all documentation

### Liability
- Currently for Sacred Wandering internal use only
- If productized, requires:
  - Terms of Service
  - Privacy Policy
  - HIPAA Business Associate Agreement templates
  - Professional liability insurance
  - Clear support SLAs

---

## Acknowledgments

**Development Partners:**
- Claude.ai (Anthropic) for technical guidance
- Claude Code for rapid development iteration

**Inspiration:**
- Sacred Wandering clients who deserve better tools
- Mental health professionals tired of medical EMRs
- Open source EMR community

**Foundation:**
- OpenEMR project for database schema and infrastructure
- React and Vite communities
- Tailwind CSS for modern styling approach

---

## Conclusion

Mindline represents a fundamental rethinking of how mental health records should work. We're not adapting medical EMRs for therapy. We're building therapy software from the ground up.

The rapid development velocity (functional client management in one week) proves that purpose-built tools can be created quickly when unconstrained by legacy medical paradigms.

The path forward is clear: finish the core system, prove it works for Sacred Wandering, then decide if the mental health community needs this as a product.

---

**Document Version:** 1.0  
**Last Updated:** December 31, 2024  
**Next Review:** After v1.0 completion

