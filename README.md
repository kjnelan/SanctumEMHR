# Mindline EMHR

**Version 0.3.0-alpha**
*Where modern design meets clinical insight.*

---

## What is Mindline?

Mindline is a purpose-built **Electronic Mental Health Records (EMHR)** system designed specifically for outpatient mental health practices. Unlike traditional medical EMRs retrofitted for therapy, Mindline prioritizes therapeutic workflows, warm design, and the unique needs of mental health practitioners.

### Why EMHR, not EMR?

We're introducing the term **EMHR (Electronic Mental Health Records)** to distinguish mental health documentation systems from general medical EMRs. Mental health practice has fundamentally different clinical workflows, documentation needs, and patient relationships that deserve purpose-built software.

---

## Key Features

### ✨ Modern, Warm Interface
- Glassmorphism design with gradient aesthetics
- Human-centered UI that feels welcoming, not clinical
- Fast, responsive React frontend
- Intuitive navigation designed for therapists

### 🧠 Mental Health-Optimized Workflows
- **Client-focused** (not patient processing)
- Session-based documentation
- Risk assessment tracking (SI, HI, self-harm, substance, etc.)
- Treatment plan management
- Guardian/family relationship tracking
- Outcome measures integration (future)

### 🔒 HIPAA Compliant & Secure
- Session-based authentication
- Encrypted data transmission (HTTPS)
- Role-based access controls
- Audit logging
- Automatic session timeout

### 📅 Integrated Scheduling
- Visual calendar with provider scheduling
- Appointment management
- SMS/Email reminders (coming soon)
- No-show tracking

### 💰 Built-in Billing
- Insurance claims tracking
- Payment recording
- Sliding scale management
- Session billing
- Credit card integration (Square)

---

## Current Status: v0.3.0-alpha

### ✅ Completed
- Authentication & session management
- Main dashboard with widgets
- Client search (HIPAA-compliant)
- Client management (create, edit, view)
- Demographics with full CRUD
- Guardian/related persons management
- Insurance display and editing
- Documents viewing
- Calendar interface
- Provider scheduling

### 🚧 In Progress
- Appointment creation/editing
- Clinical documentation forms
- Billing workflows

### 📋 Roadmap to v1.0 (2-3 weeks)
See [MINDLINE_PROJECT_DOCUMENTATION.md](MINDLINE_PROJECT_DOCUMENTATION.md) for detailed roadmap.

---

## Quick Start

### Prerequisites
- Linux server (Ubuntu recommended)
- Apache with PHP 8.3+ and PHP-FPM
- MySQL 8.0+
- Node.js 18+ (for frontend build)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kjnelan/sacwan-openemr-mh.git mindline
   cd mindline
   ```

2. **Set up the database:**
   ```bash
   # Import OpenEMR 7.0.3 schema (provides base tables)
   mysql -u root -p < sql/7_0_3-to-7_0_4_upgrade.sql

   # Run Mindline customizations
   mysql -u root -p openemr < custom/sql/add_discharged_status.sql
   mysql -u root -p openemr < custom/sql/add_client_payment_type.sql
   mysql -u root -p openemr < custom/sql/rename_gender_identity_codes.sql
   mysql -u root -p openemr < custom/sql/rename_sexual_orientation_codes.sql
   ```

3. **Configure Apache virtual host:**
   ```apache
   <VirtualHost *:443>
       ServerName your-mindline-domain.com
       DocumentRoot /path/to/mindline

       SSLEngine on
       SSLCertificateFile /path/to/cert.pem
       SSLCertificateKeyFile /path/to/key.pem

       <Directory /path/to/mindline>
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

4. **Build the React frontend:**
   ```bash
   cd react-frontend
   npm install
   npm run build
   # Built files go to /app/
   ```

5. **Access Mindline:**
   ```
   https://your-mindline-domain.com/app/
   ```

---

## For Developers

### Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS v4
- **Backend:** PHP 8.3, Custom REST APIs
- **Database:** MySQL (OpenEMR schema)
- **Authentication:** Session-based (cookies)

### Development Setup

```bash
# Frontend development server
cd react-frontend
npm run dev
# Opens at http://localhost:5173

# Backend uses Apache + PHP-FPM
# APIs located in /custom/api/
```

### File Structure
```
/custom/api/          # Custom API endpoints (session-based)
/app/                 # React frontend build output
/react-frontend/      # React source code
  /src/
    /components/      # React components
    /utils/           # API utilities
/custom/sql/          # Database migrations & setup
/interface/           # OpenEMR core (minimal usage)
```

### Key Documentation
- [MINDLINE_PROJECT_DOCUMENTATION.md](MINDLINE_PROJECT_DOCUMENTATION.md) - Full project vision & architecture
- [ToDo.md](ToDo.md) - Development roadmap & tasks
- [custom/sql/PAYMENT_TYPE_REFERENCE.md](custom/sql/PAYMENT_TYPE_REFERENCE.md) - List options reference

---

## Architecture Philosophy

Mindline is a **standalone EMHR** that currently uses OpenEMR's database schema as infrastructure. We are NOT building a React UI for OpenEMR - we're building our own mental health records system.

**What we use from OpenEMR:**
- Database schema (patient_data, encounters, billing tables)
- Database connection infrastructure
- Session management

**What we DON'T use:**
- OpenEMR's service layer or business logic
- OpenEMR's REST APIs
- OpenEMR's frontend interface

**Future:** v2.0 will fork the database schema to `mindline_*` tables optimized for mental health workflows.

See [MINDLINE_PROJECT_DOCUMENTATION.md](MINDLINE_PROJECT_DOCUMENTATION.md#architectural-decision) for details.

---

## Target Users

- Outpatient mental health clinics
- Solo practitioners and small group practices
- Nonprofit counseling centers
- Faith-based counseling organizations
- Therapists who want modern tools without enterprise complexity

---

## Support & Community

**Current Status:** Internal tool for Sacred Wandering (active development)

**Future:** Open source release or product offering (TBD after v1.0)

### Contact
- **Developer:** Fr. Kenn, Sacred Wandering
- **Repository:** https://github.com/kjnelan/sacwan-openemr-mh (private)

---

## License

**Current:** Internal use only (Sacred Wandering)
**Future:** TBD (likely GPL-3.0 or MIT after v1.0)

---

## Acknowledgments

**Built with:**
- React & Vite
- Tailwind CSS
- OpenEMR database schema (foundation)
- Claude.ai & Claude Code (development partners)

**Inspired by:**
- Mental health professionals tired of medical EMRs
- Sacred Wandering clients who deserve better tools
- The belief that therapy software should feel therapeutic

---

## Why "Mindline"?

Mental health work walks the line between science and art, structure and flexibility, protocol and humanity. Mindline represents that balance - providing the structure clinicians need while honoring the human connection at the heart of therapy.

---

**Current Version:** 0.3.0-alpha
**Last Updated:** December 31, 2024
**Status:** Active Development

*Mental health practitioners deserve software built for how therapy actually works.*
