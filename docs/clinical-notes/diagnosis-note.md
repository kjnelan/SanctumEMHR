# Diagnosis Note - User Guide

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**Phase:** 4B - Clinical Notes

---

## Overview

The **Diagnosis Note** is a specialized clinical assessment form that serves as the **single source of truth** for patient diagnoses in Mindline EMHR. Unlike progress notes where diagnoses are referenced, the Diagnosis Note is where you perform comprehensive diagnostic assessment and documentation.

### Key Principles

1. **Source of Truth**: This is where diagnoses are created and updated
2. **Clinical Rigor**: Full DSM-5 justification and differential diagnosis
3. **Billing Integration**: Billable codes automatically sync to billing (Phase 5)
4. **Referenced Everywhere**: Other notes pull diagnoses from here

---

## When to Create a Diagnosis Note

### Required Scenarios
- ✅ **Initial Intake**: First diagnosis assessment
- ✅ **Diagnosis Change**: New symptoms, revised diagnosis, or treatment response
- ✅ **Quarterly Review**: Best practice for mental health (some insurers require it)
- ✅ **Treatment Plan Update**: Often accompanies changes to treatment goals

### Optional Scenarios
- 📋 **Diagnostic Clarification**: When differential diagnosis is resolved
- 📋 **Severity Change**: Condition improves/worsens significantly
- 📋 **Adding Secondary Diagnosis**: New comorbidity identified

---

## How to Create a Diagnosis Note

### Step 1: Access Clinical Notes
1. Navigate to patient chart
2. Click **Clinical Notes** tab
3. Click **+ New Note**
4. Select **🏥 Diagnosis Note** (first option in "Most Common")

### Step 2: Select ICD-10 Codes

#### Search for Codes
- Type in search box: code (e.g., "F41.1") OR description (e.g., "anxiety")
- Search is **debounced** - waits 300ms after you stop typing
- Results show: **Code** + **Description**
- Click a result to add it to your selection

#### Configure Each Diagnosis

**Billable Toggle:**
- ☑️ Check = Billable diagnosis (max 4 per CMS)
- ☐ Uncheck = Non-billable (Z-codes, V-codes, clinical notes)

**Primary Diagnosis:**
- ⚪ Radio button = Select ONE as primary
- First code added is primary by default
- Primary appears first on claims

**Severity:**
- Dropdown with options:
  - Mild
  - Moderate
  - Severe
  - In partial remission
  - In full remission
  - With psychotic features
  - Unspecified

**Reorder:**
- Use ▲ ▼ arrows to change order
- Order matters for billing (primary first!)

**Remove:**
- Click ✕ to remove a diagnosis

#### Example Setup

```
Selected Diagnoses (3)

┌─────────────────────────────────────────────────┐
│ F41.1  [PRIMARY] [BILLABLE]                    │
│ Generalized anxiety disorder                    │
│ ☑ Billable  ⚪ Primary  [Moderate ▼]           │
│                                          ▲ ▼ ✕  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ F33.1  [BILLABLE]                               │
│ Major depressive disorder, recurrent, moderate  │
│ ☑ Billable  ⚪ Primary  [Moderate ▼]           │
│                                          ▲ ▼ ✕  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Z63.0                                           │
│ Problems in relationship with spouse/partner    │
│ ☐ Billable  ⚪ Primary  [-- Severity -- ▼]    │
│                                          ▲ ▼ ✕  │
└─────────────────────────────────────────────────┘
```

### Step 3: Document Clinical Assessment

#### Symptoms Reported by Client
*What the client describes in their own words*

Example:
```
Client reports feeling "on edge" constantly, with racing thoughts
that keep her awake at night. States she worries about "everything"
- work, family, finances. Reports physical tension, headaches, and
fatigue. Describes difficulty concentrating and irritability affecting
relationships.
```

#### Symptoms Observed by Clinician
*What you directly observe during sessions*

Example:
```
Client appears tense, wringing hands throughout session. Speech is
rapid. Makes frequent eye contact but breaks it when discussing fears.
Posture is rigid. Sighs frequently. No evidence of psychosis or
thought disorder. Insight and judgment intact.
```

#### Duration of Symptoms
*How long symptoms have been present*

Example:
```
Client reports anxiety symptoms began approximately 18 months ago
following job change. Symptoms have been persistent and worsening
over past 6 months. No significant symptom-free periods.
```

### Step 4: Document Diagnostic Reasoning

#### Clinical Justification
*Why this diagnosis? Include DSM-5 criteria*

Example:
```
Diagnosis of F41.1 (Generalized Anxiety Disorder) is supported by:

DSM-5 Criteria Met:
A. Excessive anxiety/worry occurring more days than not for 6+ months
B. Difficulty controlling worry
C. Associated with 3+ symptoms: restlessness, fatigue, difficulty
   concentrating, irritability, muscle tension, sleep disturbance
D. Causes clinically significant distress and functional impairment
E. Not attributable to substance use or medical condition
F. Not better explained by another mental disorder

Client meets criteria A, B (all 6 symptoms), D (work/relationship
impairment), E (medical causes ruled out), and F (differential dx
addressed below).
```

#### Differential Diagnosis
*What else was considered and ruled out?*

Example:
```
Considered and ruled out:
- Panic Disorder: No discrete panic attacks or avoidance behavior
- Social Anxiety Disorder: Anxiety is generalized, not social-specific
- OCD: No obsessions or compulsions present
- PTSD: No traumatic event or re-experiencing symptoms
- Hyperthyroidism: Recent labs normal (TSH 2.1)
- Substance-Induced: Client denies substance use, tox screen negative
```

#### Severity & Specifiers
*Additional clinical details*

Example:
```
Severity: Moderate
- Symptoms cause significant distress
- Functional impairment in work and relationships
- No severe symptoms (psychosis, suicidal ideation)

Specifiers: With excessive worry as predominant feature
```

### Step 5: Document Functional Impact

#### Functional Impairment
*How symptoms affect daily life*

Example:
```
Work: Difficulty concentrating leading to missed deadlines. Reports
calling in sick 3 times in past month due to anxiety. Avoids meetings
when possible.

Relationships: Irritability causing conflicts with spouse. Withdrew
from social activities. Friends have commented on change in behavior.

Self-Care: Sleep disruption (averaging 4-5 hours). Appetite decreased.
Stopped exercising due to fatigue.

Overall: GAF estimated at 55 (moderate symptoms with moderate
difficulty in social/occupational functioning)
```

### Step 6: Document History

#### Previous Diagnoses
*Prior diagnostic history and changes*

Example:
```
Previous Diagnosis History:
- 2020: Adjustment Disorder with Anxiety (Dr. Smith) - Resolved
- 2018: No mental health diagnosis
- Childhood: ADHD diagnosis age 10, discontinued treatment age 16

Current diagnosis represents worsening and persistence beyond
adjustment reaction, now meeting criteria for GAD.
```

### Step 7: Sign the Note

1. Review all fields for completeness
2. Verify ICD-10 codes are correct
3. Ensure billable flags are set properly
4. Click **Sign & Lock Note**

**What Happens When Signed:**
- ✅ Note is locked (cannot be edited without addendum)
- ✅ Timestamp and signature recorded
- ⏳ Billable codes will sync to billing table (Phase 5)
- ✅ Becomes source of truth for other notes

---

## Best Practices

### Clinical Documentation
- ✅ **Use DSM-5 criteria** explicitly in justification
- ✅ **Document differential** - shows clinical reasoning
- ✅ **Quantify impairment** - use GAF, WHODAS, or functional description
- ✅ **Include duration** - required for many diagnoses
- ✅ **Cite sources** - labs, collateral info, previous records

### Coding Best Practices
- ✅ **Primary = Most severe/focus of treatment** (usually)
- ✅ **Billable limit = 4** per CMS requirement
- ✅ **Z-codes as non-billable** (psychosocial factors)
- ✅ **Specificity matters** - use most specific code available
- ✅ **Check for updates** - ICD-10 codes update annually

### Workflow Tips
- 💡 **Create diagnosis note during/after intake**
- 💡 **Update quarterly** or when treatment plan changes
- 💡 **Review before authorization requests**
- 💡 **Link to treatment plan** - diagnoses drive goals

---

## Common Questions

### Q: Can I have more than 4 diagnoses?
**A:** Yes! You can document 6+ diagnoses. Only mark the 4 most relevant as "billable" per CMS limits.

### Q: What if diagnosis changes during treatment?
**A:** Create a NEW diagnosis note. Document changes in "Previous Diagnoses" section. The newest signed diagnosis note becomes the source of truth.

### Q: Do I need a new diagnosis note every session?
**A:** No! Diagnosis notes are periodic (intake, quarterly, when diagnosis changes). Progress notes reference the current diagnosis note.

### Q: What's the difference between billable and non-billable?
**A:**
- **Billable**: Submitted on insurance claims (F-codes, most diagnoses)
- **Non-billable**: Clinical documentation only (Z-codes, V-codes for psychosocial factors)

### Q: Can I edit after signing?
**A:** No. Signed notes are locked. You can create an addendum (Phase 4C feature) or create a new updated diagnosis note.

### Q: Where do Z-codes go?
**A:** Add Z-codes (psychosocial factors) as non-billable diagnoses. Example: Z63.0 (relationship problems), Z56.9 (occupational problems).

---

## Billing Integration (Phase 5)

**Current State (Phase 4B):**
- Diagnoses stored in note as JSON
- Visible in clinical documentation
- NOT yet synced to billing

**Future (Phase 5 - Billing Module):**
- When note signed → billable codes auto-insert into billing table
- Previous diagnoses marked inactive
- CPT codes will link to diagnoses via "justify" field
- Claims generation will pull from billing table

---

## Related Documentation

- [Setup Guide](./setup-guide.md) - ICD-10 code import
- [Technical Architecture](./technical-architecture.md) - Developer reference
- [Clinical Notes README](./README.md) - Full phase overview

---

**Need Help?** Contact support or refer to setup guide for ICD-10 code loading.
