# Clinical Notes - Technical Architecture

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**Audience:** Developers, Architects

---

## System Overview

The Clinical Notes system in Mindline EMHR is built as a standalone module with a **note-first architecture**, where notes are primary entities that appointments and billing reference (not the other way around).

### Architecture Principles

1. **Notes are Primary**: Clinical notes exist independently of appointments
2. **Flexible Templates**: Multiple note types with type-specific templates
3. **Auto-save First**: 3-second auto-save to prevent data loss
4. **Sign & Lock**: Signed notes are immutable (addendum support in Phase 4C)
5. **Source of Truth**: Diagnosis notes are the single source for patient diagnoses

---

## Database Schema

### Primary Tables

#### `clinical_notes` Table

```sql
CREATE TABLE clinical_notes (
    -- Primary identification
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_uuid VARCHAR(36) UNIQUE NOT NULL,

    -- Core relationships
    patient_id INT NOT NULL,
    provider_id INT NOT NULL,
    appointment_id INT NULL,
    billing_id INT NULL,

    -- Note metadata
    note_type VARCHAR(50) NOT NULL,
    template_type VARCHAR(50) DEFAULT 'BIRP',
    service_date DATE NOT NULL,
    service_duration INT NULL,
    service_location VARCHAR(100) NULL,

    -- BIRP/PIRP content
    behavior_problem TEXT NULL,
    intervention TEXT NULL,
    response TEXT NULL,
    plan TEXT NULL,

    -- Clinical content
    risk_assessment TEXT NULL,
    risk_present BOOLEAN DEFAULT FALSE,
    goals_addressed JSON NULL,
    interventions_selected JSON NULL,
    client_presentation JSON NULL,

    -- Diagnosis fields (Phase 4B)
    diagnosis_codes JSON NULL,
    symptoms_reported TEXT NULL,
    symptoms_observed TEXT NULL,
    clinical_justification TEXT NULL,
    differential_diagnosis TEXT NULL,
    severity_specifiers TEXT NULL,
    functional_impairment TEXT NULL,
    duration_of_symptoms TEXT NULL,
    previous_diagnoses TEXT NULL,

    -- Free-form fields
    presenting_concerns TEXT NULL,
    clinical_observations TEXT NULL,
    mental_status_exam TEXT NULL,

    -- Status & workflow
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_locked BOOLEAN DEFAULT FALSE,

    -- Signatures
    signed_at TIMESTAMP NULL,
    signed_by INT NULL,
    signature_data TEXT NULL,

    -- Supervision
    supervisor_review_required BOOLEAN DEFAULT FALSE,
    supervisor_review_status VARCHAR(20) NULL,
    supervisor_signed_at TIMESTAMP NULL,
    supervisor_signed_by INT NULL,
    supervisor_comments TEXT NULL,

    -- Addendum support
    parent_note_id INT NULL,
    is_addendum BOOLEAN DEFAULT FALSE,
    addendum_reason TEXT NULL,

    -- Audit trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    locked_at TIMESTAMP NULL,
    last_autosave_at TIMESTAMP NULL,

    -- Indexes
    INDEX idx_patient (patient_id),
    INDEX idx_provider (provider_id),
    INDEX idx_note_type (note_type),
    INDEX idx_service_date (service_date),
    INDEX idx_status (status),

    -- Foreign keys
    FOREIGN KEY (patient_id) REFERENCES patient_data(pid),
    FOREIGN KEY (provider_id) REFERENCES users(id),
    FOREIGN KEY (signed_by) REFERENCES users(id),
    FOREIGN KEY (supervisor_signed_by) REFERENCES users(id),
    FOREIGN KEY (parent_note_id) REFERENCES clinical_notes(id)
);
```

#### `note_drafts` Table

```sql
CREATE TABLE note_drafts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT NULL,
    provider_id INT NOT NULL,
    patient_id INT NOT NULL,
    appointment_id INT NULL,

    draft_content JSON NOT NULL,
    note_type VARCHAR(50) NOT NULL,
    service_date DATE NOT NULL,

    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_note (note_id),
    INDEX idx_provider (provider_id),
    INDEX idx_patient (patient_id),

    FOREIGN KEY (note_id) REFERENCES clinical_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patient_data(pid) ON DELETE CASCADE
);
```

### Supporting Tables

#### `intervention_library` Table

```sql
CREATE TABLE intervention_library (
    id INT AUTO_INCREMENT PRIMARY KEY,
    intervention_name VARCHAR(100) NOT NULL UNIQUE,
    intervention_tier INT NOT NULL,  -- 1=Core, 2=Modality, 3=Crisis, 4=Admin
    modality VARCHAR(50) NULL,        -- 'CBT', 'DBT', 'EMDR', etc.
    is_system_intervention BOOLEAN DEFAULT TRUE,
    created_by INT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tier (intervention_tier),
    INDEX idx_modality (modality),
    INDEX idx_active (is_active),

    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### `treatment_goals` Table

```sql
CREATE TABLE treatment_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    provider_id INT NOT NULL,
    goal_text TEXT NOT NULL,
    goal_category VARCHAR(50) NULL,
    target_date DATE NULL,
    status VARCHAR(20) DEFAULT 'active',
    progress_level INT NULL,  -- 0-100
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_patient (patient_id),
    INDEX idx_status (status),

    FOREIGN KEY (patient_id) REFERENCES patient_data(pid),
    FOREIGN KEY (provider_id) REFERENCES users(id)
);
```

---

## Data Structures

### diagnosis_codes JSON Schema

```json
[
  {
    "code": "F41.1",
    "description": "Generalized anxiety disorder",
    "billable": true,
    "primary": true,
    "severity": "Moderate"
  },
  {
    "code": "F33.1",
    "description": "Major depressive disorder, recurrent, moderate",
    "billable": true,
    "primary": false,
    "severity": "Moderate"
  },
  {
    "code": "Z63.0",
    "description": "Problems in relationship with spouse or partner",
    "billable": false,
    "primary": false,
    "severity": null
  }
]
```

**Field Definitions:**
- `code` (string, required): ICD-10 code (e.g., "F41.1")
- `description` (string, required): Full ICD-10 description
- `billable` (boolean, required): Whether code should be billed
- `primary` (boolean, required): Primary diagnosis flag (only ONE should be true)
- `severity` (string, nullable): Severity specifier or null

### interventions_selected JSON Schema

```json
["Psychoeducation", "Cognitive restructuring / reframing", "Grounding techniques"]
```

Simple array of intervention names from intervention_library.

### client_presentation JSON Schema

```json
["Engaged", "Tearful", "Cooperative"]
```

Array of presentation descriptors.

### goals_addressed JSON Schema

```json
[3, 7, 12]
```

Array of treatment_goal IDs addressed in this session.

---

## API Endpoints

### Note Management APIs

#### Create Note
```
POST /custom/api/notes/create_note.php
```

**Request Body:**
```json
{
  "patient_id": 8,
  "note_type": "diagnosis",
  "service_date": "2026-01-05",
  "diagnosis_codes": "[{...}]",
  "symptoms_reported": "...",
  "symptoms_observed": "...",
  "clinical_justification": "...",
  ...
}
```

**Response:**
```json
{
  "success": true,
  "note_id": 145,
  "note_uuid": "a1b2c3d4-..."
}
```

#### Update Note
```
PUT /custom/api/notes/update_note.php
```

**Request Body:**
```json
{
  "note_id": 145,
  "symptoms_reported": "Updated text...",
  ...
}
```

#### Get Note
```
GET /custom/api/notes/get_note.php?note_id=145
```

**Response:**
```json
{
  "success": true,
  "note": {
    "id": 145,
    "note_uuid": "a1b2c3d4-...",
    "patient_id": 8,
    "note_type": "diagnosis",
    "diagnosis_codes": "[{...}]",
    ...
  }
}
```

#### Sign Note
```
POST /custom/api/notes/sign_note.php
```

**Request Body:**
```json
{
  "note_id": 145,
  "signature_password": "***"
}
```

**Response:**
```json
{
  "success": true,
  "signed_at": "2026-01-05 14:32:15",
  "is_locked": true
}
```

### Diagnosis-Specific APIs

#### Search ICD-10 Codes
```
GET /custom/api/search_codes.php
  ?search=anxiety
  &code_type=ICD10
  &limit=50
```

**Response:**
```json
{
  "success": true,
  "codes": [
    {
      "code": "F41.1",
      "description": "Generalized anxiety disorder",
      "code_type": "ICD10",
      "active": true
    },
    ...
  ],
  "count": 15,
  "search_term": "anxiety",
  "code_type": "ICD10"
}
```

**Search Algorithm:**
1. Exact code match first
2. Starts-with code match
3. Contains in description
4. Limited to active codes only
5. Ordered by relevance

**Performance:**
- Indexed search on `codes` table
- Debounced client-side (300ms)
- Max 200 results per query
- Average response time: <100ms

---

## React Component Architecture

### Component Hierarchy

```
NoteEditor.jsx (Container)
├── NoteMetadata.jsx (Read-only display)
├── DiagnosisTemplate.jsx (note_type === 'diagnosis')
│   └── ICD10Picker.jsx (Multi-select code picker)
├── BIRPTemplate.jsx (note_type === 'progress')
├── IntakeTemplate.jsx (note_type === 'intake')
├── CrisisTemplate.jsx (note_type === 'crisis')
├── DischargeTemplate.jsx (note_type === 'discharge')
├── MSETemplate.jsx (note_type === 'mse')
├── RiskAssessmentTemplate.jsx (note_type === 'risk_assessment')
└── AdministrativeTemplate.jsx (note_type === 'admin')
```

### Key Components

#### NoteEditor.jsx

**Purpose:** Container component for all note types

**State:**
```javascript
const [note, setNote] = useState({
  noteType: 'diagnosis',
  templateType: 'Diagnosis',
  serviceDate: '2026-01-05',
  diagnosis_codes: '[]',  // JSON string
  symptoms_reported: '',
  ...
});
const [autoSaving, setAutoSaving] = useState(false);
const [lastSaved, setLastSaved] = useState(null);
```

**Auto-save Logic:**
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    if (hasChanges) {
      autosaveNote(note);
      setLastSaved(new Date());
    }
  }, 3000);  // 3 second debounce

  return () => clearTimeout(timer);
}, [note]);
```

**Note Type Mapping:**
```javascript
const getNoteTemplateType = (noteType) => {
  const mapping = {
    'progress': 'BIRP',
    'intake': 'Intake',
    'diagnosis': 'Diagnosis',  // NEW
    'crisis': 'Crisis',
    ...
  };
  return mapping[noteType] || 'BIRP';
};
```

#### DiagnosisTemplate.jsx

**Purpose:** Diagnosis-specific assessment form

**Props:**
```javascript
{
  note: object,           // Current note state
  onChange: function,     // Field change handler
  disabled: boolean       // Locked state
}
```

**Key Features:**
- ICD-10 code picker integration
- Clinical assessment fields
- JSON serialization/deserialization
- Billing preview

#### ICD10Picker.jsx

**Purpose:** Multi-select ICD-10 code picker with search

**Props:**
```javascript
{
  selectedCodes: array,         // Current selections
  onChange: function,           // Selection change handler
  maxBillable: number,          // Max billable codes (default 4)
  showBillableToggle: boolean,  // Show billable checkbox
  showPrimarySelector: boolean, // Show primary radio
  showSeveritySelector: boolean,// Show severity dropdown
  disabled: boolean             // Disabled state
}
```

**State:**
```javascript
const [searchTerm, setSearchTerm] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [isSearching, setIsSearching] = useState(false);
const [showDropdown, setShowDropdown] = useState(false);
```

**Search Debounce:**
```javascript
useEffect(() => {
  const timer = setTimeout(async () => {
    if (searchTerm.length >= 2) {
      const response = await searchCodes(searchTerm, 'ICD10', 50);
      setSearchResults(response.codes);
      setShowDropdown(true);
    }
  }, 300);  // 300ms debounce

  return () => clearTimeout(timer);
}, [searchTerm]);
```

---

## Security Considerations

### Authentication

- All APIs require active PHP session
- Session validation via `$_SESSION['authUserID']`
- No token-based auth (session cookies only)

### Authorization

- Providers can only edit their own notes
- Supervisors can view/edit supervised notes
- Admins have full access
- Locked notes cannot be edited (except addendum)

### Data Validation

**Server-side:**
- Required field validation
- ICD-10 code existence check
- JSON schema validation
- XSS prevention (htmlspecialchars)
- SQL injection prevention (prepared statements)

**Client-side:**
- Form validation before submit
- Max billable code enforcement (4)
- Primary diagnosis requirement
- Date format validation

### HIPAA Compliance

- Audit logging on all note access
- Encryption at rest (database encryption)
- Encryption in transit (HTTPS required)
- Access control (role-based)
- Data retention policies

---

## Performance Optimization

### Database

**Indexes:**
- `idx_patient` - Fast patient note lookup
- `idx_note_type` - Filter by note type
- `idx_service_date` - Date-based queries
- `idx_status` - Draft vs signed filtering

**Query Optimization:**
```sql
-- Efficient diagnosis note lookup
SELECT *
FROM clinical_notes
WHERE patient_id = ?
  AND note_type = 'diagnosis'
  AND status = 'signed'
ORDER BY service_date DESC
LIMIT 1;
-- Uses: idx_patient, idx_note_type, idx_service_date
```

### Frontend

**Code Splitting:**
```javascript
// Lazy load templates
const DiagnosisTemplate = React.lazy(() => import('./DiagnosisTemplate'));
```

**Debouncing:**
- Auto-save: 3 seconds
- ICD-10 search: 300ms
- Draft restore: On mount only

**Caching:**
- Intervention library cached in context
- Treatment goals cached per patient
- ICD-10 search results cached (session storage)

---

## Future Phase: Billing Integration

### Phase 5: Billing Sync Function

**Trigger:** When diagnosis note is signed

**Function:** `syncDiagnosesToBilling(note_id)`

```php
function syncDiagnosesToBilling($note_id) {
    $note = getClinicalNote($note_id);
    $dx_codes = json_decode($note['diagnosis_codes'], true);

    // Step 1: Mark ALL previous diagnoses inactive
    $sql = "UPDATE billing
            SET activity = 0
            WHERE pid = ?
            AND code_type = 'ICD10'";
    sqlStatement($sql, [$note['patient_id']]);

    // Step 2: Insert new billable diagnoses
    foreach ($dx_codes as $dx) {
        if ($dx['billable']) {
            // Check for duplicates
            $existing = sqlQuery(
                "SELECT id FROM billing
                 WHERE pid = ? AND code = ? AND code_type = 'ICD10'
                 AND encounter = ?",
                [$note['patient_id'], $dx['code'], $note['appointment_id']]
            );

            if (!$existing) {
                sqlInsert("INSERT INTO billing (
                    date, code_type, code, code_text,
                    pid, provider_id, encounter,
                    activity, authorized
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
                    $note['service_date'],
                    'ICD10',
                    $dx['code'],
                    $dx['description'],
                    $note['patient_id'],
                    $note['provider_id'],
                    $note['appointment_id'],
                    1,  // active
                    1   // authorized
                ]);
            } else {
                // Reactivate existing
                sqlStatement(
                    "UPDATE billing SET activity = 1 WHERE id = ?",
                    [$existing['id']]
                );
            }
        }
    }

    return true;
}
```

**Database Changes:**
```sql
billing table structure:
- id (PK)
- date (service date)
- code_type ('ICD10')
- code ('F41.1')
- code_text ('Generalized anxiety disorder')
- pid (patient ID)
- provider_id (provider ID)
- encounter (encounter/appointment ID)
- activity (1=active, 0=inactive)
- justify (CSV of diagnosis pointers for CPT)
- fee (NULL for diagnoses)
- units (NULL for diagnoses)
- billed (0=not yet billed)
```

---

## Testing

### Unit Tests

**Diagnosis Code Validation:**
```javascript
test('validates billable code limit', () => {
  const codes = [
    {code: 'F41.1', billable: true},
    {code: 'F33.1', billable: true},
    {code: 'F43.1', billable: true},
    {code: 'F60.3', billable: true},
    {code: 'Z63.0', billable: true}  // 5th billable - should error
  ];

  expect(() => validateDiagnosisCodes(codes)).toThrow('Max 4 billable');
});
```

### Integration Tests

**End-to-End Note Creation:**
```javascript
test('creates and signs diagnosis note', async () => {
  // Create note
  const response = await createNote({
    patient_id: 8,
    note_type: 'diagnosis',
    diagnosis_codes: JSON.stringify([...]),
    symptoms_reported: 'Test symptoms'
  });

  expect(response.success).toBe(true);

  // Sign note
  const signResponse = await signNote(response.note_id);
  expect(signResponse.is_locked).toBe(true);
});
```

---

## Troubleshooting Guide

### Common Issues

**Issue:** ICD-10 search returns no results
**Cause:** Empty codes table
**Fix:** Import ICD-10 codes (see setup-guide.md)

**Issue:** Diagnosis codes not saving
**Cause:** JSON serialization error
**Fix:** Check for special characters, ensure proper JSON.stringify()

**Issue:** Auto-save not triggering
**Cause:** useEffect dependencies missing
**Fix:** Verify note state is in dependency array

---

## Related Documentation

- [Diagnosis Note User Guide](./diagnosis-note.md)
- [Setup Guide](./setup-guide.md)
- [Clinical Notes README](./README.md)

---

**Version History:**
- 1.0 (2026-01-05): Initial documentation for Phase 4B
