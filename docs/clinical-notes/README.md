# Clinical Notes System - Implementation Guide

**Mindline EMHR - Phase 4**
**Status**: 🟢 Phase 4B Complete (Diagnosis Note System Operational)
**Last Updated**: 2026-01-05

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Philosophy](#core-philosophy)
3. [Implementation Status](#implementation-status)
4. [Detailed Requirements](#detailed-requirements)
5. [Roadmap to Completion](#roadmap-to-completion)
6. [Technical Architecture](#technical-architecture)

---

## Overview

The Clinical Notes system is designed to be **trauma-informed**, **minimal-burden**, and **clinician-centered**. It supports multiple note formats (BIRP, PIRP, MSE, Intake, Crisis, etc.) while maintaining fast, frictionless workflows.

### Key Principles

- **Minimal cognitive load** - No unnecessary fields or clicks
- **Fast, instant loading** - No spinning wheels
- **Flexible structure** - Light guidance, not rigid templates
- **Trauma-informed design** - Respects clinician time and client stories
- **Production-ready** - Must support multiple formats (BIRP, PIRP, SOAP, DAP)

---

## Core Philosophy

### Note Format Preference

**For Psychotherapy**: BIRP or PIRP is the gold standard
- **BIRP** = Behavior, Intervention, Response, Plan
- **PIRP** = Problem, Intervention, Response, Plan

**User Preference**: Leaning toward PIRP, but system must allow purchaser choice

**Why Not SOAP?**
- SOAP is designed for medicine, not psychotherapy
- Forces therapy into medicalized frame
- "Objective" is often artificial in talk therapy
- Better for psychiatry/integrated care

### Note Types Supported

1. **Progress Notes** (BIRP/PIRP)
2. **Intake Assessment** / Diagnostic Evaluation
3. **Diagnosis Note** - ICD-10 diagnosis documentation ✅ **NEW in Phase 4B**
4. **Mental Status Exam** (MSE)
5. **Crisis Notes**
6. **Discharge Summary**
7. **Risk Assessment**
8. **Administrative Notes** (cancel, no-show, coordination)
9. **Treatment Plan Updates** ⏳ *Not yet implemented*

### Workflow Requirements

- **Notes load instantly** - No spinners, no delays
- **Auto-save every 3 seconds** - No lost work
- **Smart carry-forward** - Structure and goals, NOT narrative
- **Quick notes < 10 seconds** - For no-shows, cancellations
- **Sign & lock** - Notes editable until signed, then locked
- **Addendum support** - Edits after signing create addenda (not overwrites)

---

## Implementation Status

### ✅ Completed (Core System)

#### Architecture & Data Model
- ✅ **Notes as standalone entities** - Not nested in appointments/billing
- ✅ **Nullable appointment/billing links** - Maximum flexibility
- ✅ **Draft isolation by note type** - Separate localStorage/server drafts per type
- ✅ **Auto-save system** - 3-second interval to localStorage + server

#### Note Type System
- ✅ **NoteTypeSelector component** - Lightweight, instant selector
- ✅ **Note type to template mapping** - Automatic routing to correct template
- ✅ **Quick notes bypass** - No-show/cancel use minimal QuickNoteForm

#### Templates Built (9 Total)
- ✅ **BIRPTemplate** - Behavior, Intervention, Response, Plan (blue accent)
- ✅ **PIRPTemplate** - Problem, Intervention, Response, Plan (purple accent)
- ✅ **MSETemplate** - Mental Status Exam with 9 domains (teal accent)
- ✅ **IntakeTemplate** - Comprehensive first-session evaluation (indigo accent)
- ✅ **DiagnosisTemplate** - ICD-10 diagnosis assessment and documentation (purple accent) **NEW in Phase 4B**
- ✅ **DischargeTemplate** - Treatment conclusion documentation (emerald accent)
- ✅ **CrisisTemplate** - Emergency intervention with required risk assessment (red accent)
- ✅ **RiskAssessmentTemplate** - Standalone safety evaluation (orange accent)
- ✅ **AdministrativeTemplate** - Non-clinical documentation (gray accent)

#### Core Features
- ✅ **Sign & Lock workflow** - Button in footer, locks on sign
- ✅ **Risk assessment toggle** - Appears in all clinical templates
- ✅ **Service date selection** - Auto-populated, editable
- ✅ **Glassmorphic UI** - Trauma-informed aesthetic design
- ✅ **Sidebar filters** - Note type, date range, status filtering
- ✅ **Note list view** - Chronological with search and filters

### 🔄 In Progress

- 🔄 **Testing all templates** - User currently testing each note type

### ⏳ High Priority (Next Phase)

#### Intervention Quick-Select System
- ⏳ **Tier 1 (Core)** - Always visible, universal interventions
  - Psychoeducation, Cognitive restructuring, Behavioral activation
  - Grounding techniques, Mindfulness/breathing, Emotional regulation
  - Coping skills, Safety planning, Supportive counseling
  - Validation/normalization, Motivational interviewing
  - Treatment plan review/goal alignment

- ⏳ **Tier 2 (Modality-Specific)** - Collapsible sections
  - CBT: Thought records, Cognitive distortions, Exposure planning
  - DBT: Distress tolerance, Interpersonal effectiveness, Chain analysis
  - ACT: Values clarification, Cognitive defusion, Acceptance strategies
  - EMDR: Resourcing, Bilateral stimulation, Target identification
  - IFS: Parts identification, Unblending, Self-energy access
  - Solution-Focused: Miracle question, Scaling, Exception finding

- ⏳ **Tier 3 (Crisis/Risk)** - Triggered when risk flagged
  - Suicide risk assessment, Crisis de-escalation
  - Safety contracting, Emergency coordination, Lethal means counseling

- ⏳ **Tier 4 (Administrative)** - Secondary category
  - Coordination of care, Documentation review
  - Referral discussion, Medication adherence, Homework assignment

- ⏳ **Design Features**
  - Search functionality for all interventions
  - Clinician "favorites" (personalization)
  - Admin-editable intervention library (future)

#### Auto-Population of Metadata
- ⏳ **Auto-fill fields** in all templates:
  - Patient name & demographics
  - Provider name & credentials
  - Service type (individual, couples, telehealth)
  - Location (office, telehealth, etc.)
  - Session duration
  - Diagnosis (pulled from treatment plan)

#### Client Response Quick-Select
- ⏳ **Response indicators**: Engaged, Avoidant, Dissociated, Resistant, Cooperative, etc.
- ⏳ **Integration** into BIRP/PIRP Response section

### ⏳ Medium Priority

#### Smart Carry-Forward System
- ⏳ **Pull forward from previous note**:
  - Treatment goals (from treatment plan)
  - Plan from last session
  - Frequently used interventions
  - Template structure
- ⏳ **Never carry forward**: Narrative content (audit risk!)

#### Pre-Selection Logic
- ⏳ **Auto-select note type based on context**:
  - First appointment → Intake Assessment
  - No attendance → No-Show
  - Crisis flag → Crisis Note
  - Discharge initiated → Discharge Summary
  - Treatment plan opened → Treatment Plan Update
- ⏳ **User can override** with one click

#### Addendum Support
- ⏳ **After note is signed**:
  - Lock original note (no edits)
  - "Add Addendum" button appears
  - Addendum creates new entry with timestamp
  - Links to original note
  - Requires signature
- ⏳ **Audit trail** for all changes

#### Treatment Plan Update Template
- ⏳ **New template** for documenting treatment plan changes
- ⏳ **Fields**:
  - Goals added/modified/completed
  - Interventions changed
  - Diagnosis updates
  - Progress summary

### ⏳ Lower Priority (Future Phases)

#### Supervision Workflow
- ⏳ **Supervisor queue** - Notes awaiting review
- ⏳ **Approve/request changes** functionality
- ⏳ **Comments and feedback** system
- ⏳ **Audit trail** for supervision
- ⏳ **Auto-routing** for supervised clinicians

#### Admin Configuration
- ⏳ **Editable intervention library** - Admin can add/remove interventions
- ⏳ **Default template selection** - Per-clinic, per-clinician preferences
- ⏳ **Custom note types** - Allow admins to create templates
- ⏳ **SOAP/DAP templates** - Additional formats for medical model users

#### Enhanced Features
- ⏳ **Copy note structure** - Template previous note without content
- ⏳ **Collateral contact notes** - Quick documentation for calls/emails
- ⏳ **Medication change notes** - Brief documentation of med changes
- ⏳ **Rescheduled note type** - Quick note for rescheduled appointments

---

## Detailed Requirements

### What MUST Be in Every Note

#### Automatically Included (System Generated)
- Date/time of service ✅ *Implemented*
- Patient name ⏳ *Need to add*
- Provider name & credentials ⏳ *Need to add*
- Service type (individual, couples, telehealth) ⏳ *Need to add*
- Location (office, telehealth) ⏳ *Need to add*
- Duration ⏳ *Need to add*
- Diagnosis (pulled from treatment plan) ⏳ *Need to add*

#### Clinician-Entered
- BIRP/PIRP content ✅ *Implemented*
- Risk assessment (if applicable) ✅ *Implemented*
- Progress toward treatment goals ✅ *Partially implemented*
- Any changes to diagnosis or plan ✅ *Field available*

#### Optional But Helpful
- Quick-select interventions ⏳ *High priority*
- Quick-select client responses ⏳ *High priority*

### Note Structure Preferences

**Hybrid Approach** (User's Preference):
- **Light structure** - BIRP/PIRP headings
- **Free-text fields** - Under each section
- **No forced dropdowns** - Unless legally required

**Why?**
- Rigid templates → cognitive overload, distorts clinical voice
- Blank boxes → inconsistency, missed required elements
- Sweet spot: Minimal structure, maximum flexibility

### Quick Notes vs Full Documentation

#### Quick Notes (< 10 seconds)
- Cancelled ✅
- No-show ✅
- Rescheduled ⏳
- Brief collateral contact ⏳
- Medication change reported ⏳

#### Full Notes
- Standard psychotherapy sessions ✅
- Crisis sessions ✅
- Intake assessments ✅

### Compliance & Legal

#### Note Locking
- Notes remain editable **until signed** ✅ *Implemented*
- Once signed, they **lock** ✅ *Backend verification needed*
- Edits after signing create **addendum** ⏳ *Need to implement*

#### Digital Signatures
- Provider signature required ✅ *Implemented*
- Supervisor co-signature (if supervised) ⏳ *Future phase*
- Date/time stamp ✅ *Backend handles*
- Addendum signatures ⏳ *Need to implement*

#### Supervision Workflows
- Queue of notes awaiting review ⏳
- Approve or request changes ⏳
- Clean audit trail ⏳
- Auto-routing to supervisor ⏳

---

## Roadmap to Completion

### Phase 4A: Enhanced Core Features (CURRENT)
**Goal**: Complete intervention system and metadata auto-population

#### Tasks
1. **Intervention Quick-Select System** 🔴 HIGH
   - [ ] Create `InterventionSelector` component
   - [ ] Implement Tier 1 (core interventions)
   - [ ] Implement Tier 2 (modality-specific, collapsible)
   - [ ] Add search functionality
   - [ ] Add "favorites" system
   - [ ] Integrate into BIRP/PIRP templates
   - [ ] Context-trigger Tier 3 when risk flagged

2. **Auto-Population of Metadata** 🔴 HIGH
   - [ ] Fetch patient demographics
   - [ ] Fetch provider info & credentials
   - [ ] Add service type field (from appointment)
   - [ ] Add location field (from appointment)
   - [ ] Add duration field (from appointment)
   - [ ] Fetch diagnosis from treatment plan
   - [ ] Display in note header (all templates)

3. **Client Response Quick-Select** 🟡 MEDIUM
   - [ ] Create response options list
   - [ ] Add to BIRP/PIRP Response section
   - [ ] Checkbox or tag system
   - [ ] Free-text supplement

4. **Treatment Plan Update Template** 🟡 MEDIUM
   - [ ] Create `TreatmentPlanUpdateTemplate.jsx`
   - [ ] Fields: Goals modified, Interventions changed, Diagnosis updates
   - [ ] Add to note type mapping
   - [ ] Add to NoteTypeSelector

**Estimated Effort**: 3-5 days

---

### Phase 4B: Smart Features & Workflow
**Goal**: Reduce cognitive load with intelligent defaults

#### Tasks
1. **Smart Carry-Forward** 🟡 MEDIUM
   - [ ] "Copy Structure" button in note list
   - [ ] Pull treatment goals from previous note
   - [ ] Pull plan from previous note
   - [ ] Pull frequently used interventions
   - [ ] Clear all narrative fields
   - [ ] Warning: "Structure copied, add new narrative"

2. **Pre-Selection Logic** 🟡 MEDIUM
   - [ ] Detect first appointment → suggest Intake
   - [ ] Detect no attendance → suggest No-Show
   - [ ] Detect crisis flag → suggest Crisis Note
   - [ ] Detect discharge → suggest Discharge Summary
   - [ ] Allow one-click override
   - [ ] Remember user's last choice

3. **Addendum Support** 🟡 MEDIUM
   - [ ] Lock note editing after signing (backend)
   - [ ] "Add Addendum" button on signed notes
   - [ ] Addendum creates linked note entry
   - [ ] Display addenda below original note in viewer
   - [ ] Addendum requires signature
   - [ ] Audit trail for all addenda

**Estimated Effort**: 3-4 days

---

### Phase 4C: Advanced Features (FUTURE)
**Goal**: Supervision, customization, and advanced workflows

#### Tasks
1. **Supervision Workflow**
   - [ ] Supervisor queue view
   - [ ] Approve/return note functionality
   - [ ] Comment system for feedback
   - [ ] Auto-route notes to supervisor
   - [ ] Supervisor signature co-sign
   - [ ] Audit trail

2. **Admin Configuration**
   - [ ] Editable intervention library (admin UI)
   - [ ] Default template settings per clinic
   - [ ] Custom note type builder
   - [ ] SOAP/DAP templates (medical model)

3. **Enhanced Note Types**
   - [ ] Collateral contact template
   - [ ] Medication change quick note
   - [ ] Rescheduled appointment note
   - [ ] Group therapy note template

**Estimated Effort**: 5-7 days (can be phased)

---

## Technical Architecture

### Data Model

#### Notes Table (Primary Entity)
```sql
clinical_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  provider_id INT NOT NULL,
  appointment_id INT NULL,           -- Nullable!
  billing_id INT NULL,               -- Nullable!
  supervisor_id INT NULL,            -- Nullable!

  note_type VARCHAR(50) NOT NULL,    -- progress, intake, crisis, etc.
  template_type VARCHAR(50) NOT NULL, -- BIRP, PIRP, MSE, Intake, etc.

  service_date DATE NOT NULL,

  -- Content (JSON or structured fields)
  behavior_problem TEXT,
  intervention TEXT,
  response TEXT,
  plan TEXT,
  risk_present BOOLEAN DEFAULT FALSE,
  risk_assessment TEXT,
  interventions_selected JSON,       -- Array of intervention IDs
  client_presentation JSON,          -- Array of presentation indicators
  goals_addressed JSON,              -- Array of goal IDs

  -- Status & workflow
  status ENUM('draft', 'signed', 'addendum') DEFAULT 'draft',
  is_locked BOOLEAN DEFAULT FALSE,

  -- Timestamps & signatures
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  signed_at TIMESTAMP NULL,
  signed_by INT NULL,

  -- Addendum linking
  parent_note_id INT NULL,           -- Links to original if this is addendum

  FOREIGN KEY (patient_id) REFERENCES patient_data(pid),
  FOREIGN KEY (provider_id) REFERENCES users(id),
  FOREIGN KEY (appointment_id) REFERENCES openemr_postcalendar_events(pc_eid),
  FOREIGN KEY (parent_note_id) REFERENCES clinical_notes(id)
)
```

### Component Architecture

```
ClinicalNotesTab (Container)
├── NotesList (View)
│   ├── Filters (Sidebar)
│   └── NoteCard (Items)
│
├── NoteTypeSelector (Selection)
│   ├── Common Types (Grid)
│   └── Specialized Types (Grid)
│
├── NoteEditor (Creation/Edit)
│   ├── Header (Title, Date, Auto-save)
│   ├── Template (Dynamic)
│   │   ├── BIRPTemplate
│   │   ├── PIRPTemplate
│   │   ├── MSETemplate
│   │   ├── IntakeTemplate
│   │   ├── DischargeTemplate
│   │   ├── CrisisTemplate
│   │   ├── RiskAssessmentTemplate
│   │   └── AdministrativeTemplate
│   └── Footer (Actions)
│       ├── Cancel
│       ├── Save Draft
│       └── Sign & Lock
│
├── NoteViewer (Read-only)
│   ├── Note Content
│   ├── Addenda (if any)
│   └── Actions (Edit if draft, Add Addendum if signed)
│
└── QuickNoteForm (Minimal)
    ├── Note Type (auto-selected)
    ├── Brief Text
    └── Save
```

### Auto-Save Architecture

```javascript
// Draft Storage Strategy
localStorage.setItem(
  `note_draft_${patientId}_${appointmentId || 'new'}_${noteType}`,
  JSON.stringify(note)
);

// Server Auto-Save (every 3 seconds)
await autosaveNote({
  noteId,
  patientId,
  appointmentId,
  noteType,
  serviceDate,
  draftContent: note
});
```

**Key Point**: Drafts are isolated by note type to prevent collision!

### Template Mapping

```javascript
const getNoteTemplateType = (noteType) => {
  const mapping = {
    'progress': 'BIRP',           // Or 'PIRP' based on user preference
    'intake': 'Intake',
    'crisis': 'Crisis',
    'discharge': 'Discharge',
    'mse': 'MSE',
    'risk_assessment': 'RiskAssessment',
    'admin': 'Administrative',
    'noshow': null,               // Uses QuickNoteForm
    'cancel': null                // Uses QuickNoteForm
  };
  return mapping[noteType] || 'BIRP';
};
```

---

## Files Reference

### Completed Components
- `src/components/notes/ClinicalNotesTab.jsx` - Main container
- `src/components/notes/NotesList.jsx` - List view with filters
- `src/components/notes/NoteTypeSelector.jsx` - Note type picker
- `src/components/notes/NoteEditor.jsx` - Main editor with template routing
- `src/components/notes/NoteViewer.jsx` - Read-only note display
- `src/components/notes/QuickNoteForm.jsx` - Minimal quick notes

### Templates
- `src/components/notes/BIRPTemplate.jsx` ✅
- `src/components/notes/PIRPTemplate.jsx` ✅
- `src/components/notes/MSETemplate.jsx` ✅
- `src/components/notes/IntakeTemplate.jsx` ✅
- `src/components/notes/DischargeTemplate.jsx` ✅
- `src/components/notes/CrisisTemplate.jsx` ✅
- `src/components/notes/RiskAssessmentTemplate.jsx` ✅
- `src/components/notes/AdministrativeTemplate.jsx` ✅

### To Be Created
- `src/components/notes/InterventionSelector.jsx` ⏳
- `src/components/notes/ClientResponseSelector.jsx` ⏳
- `src/components/notes/TreatmentPlanUpdateTemplate.jsx` ⏳
- `src/components/notes/AddendumForm.jsx` ⏳

### Backend APIs
- `src/api/notes.php` - CRUD operations ✅
- `src/api/notes/autosave.php` - Draft management ✅
- `src/api/notes/sign.php` - Signing & locking ✅
- `src/api/notes/addendum.php` - Addendum creation ⏳

---

## Success Criteria

### Phase 4 Complete When:
- ✅ All 8 note templates fully functional
- ⏳ Intervention quick-select system working
- ⏳ Metadata auto-population complete
- ⏳ Smart carry-forward implemented
- ⏳ Pre-selection logic functional
- ⏳ Addendum support working
- ⏳ Treatment plan update template created
- ⏳ All templates tested by user
- ⏳ Documentation complete

### Production Ready When:
- All Phase 4A, 4B tasks complete
- User acceptance testing passed
- No critical bugs
- Performance targets met (instant load)
- Audit trail verified

---

## Notes & Decisions

### BIRP vs PIRP Default
**Current**: BIRP is default for progress notes
**User Preference**: "Could be convinced to use PIRP"
**Decision Needed**: Make configurable or switch default?

### MSE as Standalone
**Document says**: "MSE – separate from the clinical note, but can still be attached to the appointment"
**Current**: MSE is a note type with full template
**Status**: Working as-is, clarification if needed

### Admin-Editable Interventions
**User Question**: "Is there a way to have this editable by the admin?"
**Answer**: Yes, but Phase 4C (future feature)

---

## Contact & Support

For questions about this implementation:
- See `/docs/ClinicalNotes.pdf` for original requirements
- Phase 4 development tracked in this document
- Update status as tasks complete

**Last Updated**: 2026-01-04
**Current Phase**: 4A (Enhanced Core Features)
