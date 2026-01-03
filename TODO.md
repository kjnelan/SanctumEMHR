# TODO - Mindline EMHR Calendar System

## Configuration Tasks

### Remove "In Office" Category from Calendar Categories
**Status:** Pending (User will handle)
**Priority:** Medium
**Location:** Calendar Settings > Calendar Categories

**Why:** The "In Office" availability category is unnecessary because:
- Providers are assumed available by default
- Only blocking categories (Out of Office, Vacation, etc.) are needed
- "In Office" was causing confusion by appearing in availability blocks
- Simpler UX: Providers only need to mark when they're unavailable

**Action Required:**
1. Navigate to Calendar Settings > Calendar Categories
2. Find the "In Office" category (Type 1 - Availability)
3. Delete or deactivate this category
4. Providers should only use blocking categories like:
   - Out of Office
   - Vacation
   - Meeting
   - Lunch Break
   - Holiday
   - etc.

---

## Future Enhancements

### 1. Repeating Appointments & Availability Blocks
**Status:** ✅ Core Functionality Complete - Ready for Testing
**Priority:** High

**User Requirements:**
- Weekly patterns with specific days (Mon/Thu, Wed/Sat, etc.)
- Intervals: Weekly, Every 2 weeks, Every 3 weeks, Every 4 weeks
- End conditions: After X occurrences OR on specific date
- Series management: Edit/delete single, all, or "this and future"
- Conflict detection BEFORE creating with user decision

**Technical Approach:**
- Create individual records with shared `recurrence_id`
- Link occurrences via `pc_recurrspec` field in OpenEMR
- Uses existing database structure

**✅ Completed - Core Features:**

**Frontend (Phases 1-2):**
- ✅ Recurrence state variables in both AppointmentModal and BlockTimeModal
- ✅ Day selection checkboxes (Sun-Sat)
- ✅ Frequency dropdown (Weekly, Every 2/3/4 weeks)
- ✅ End condition options (After X occurrences / On date)
- ✅ Form validation for recurrence fields
- ✅ UI positioned between Duration and Title/Notes
- ✅ Reset recurrence fields on modal close
- ✅ Recurrence data sent to backend

**Backend (Phase 1):**
- ✅ Generate occurrence dates from recurrence rules
- ✅ Validate ALL occurrences for conflicts BEFORE creating any
- ✅ Return detailed conflict information (409 status)
- ✅ Create all occurrences with shared `pc_recurrspec` ID
- ✅ Set `pc_recurrtype=1` for recurring appointments
- ✅ Support conflict override with `overrideAvailability` flag
- ✅ Return all created appointments with occurrence count

**Conflict Detection & Resolution:**
- ✅ Check conflicts with existing appointments
- ✅ Check conflicts with availability blocks
- ✅ Show conflict details (date, time, reason, type)
- ✅ Display "X of Y occurrences have conflicts" warning
- ✅ Scrollable conflict list in dialog
- ✅ "Create Anyway (Skip Conflicts)" button
- ✅ "Cancel" button to abort

**✅ Completed - Phase 3 (Series Management):**

**Frontend:**
- ✅ Series management UI in AppointmentModal (blue banner)
- ✅ Series management UI in BlockTimeModal (purple banner)
- ✅ Detect recurring events and show banner with radio buttons
- ✅ Series scope options: "Just this", "This and future", "All occurrences"
- ✅ Custom delete confirmations based on scope
- ✅ Pass seriesUpdate/seriesData to backend APIs

**Backend:**
- ✅ Series update logic in update_appointment.php
- ✅ Series delete logic in delete_appointment.php
- ✅ "This and future" split functionality (creates new recurrence ID)
- ✅ Dynamic WHERE clause based on scope (single/all/future)
- ✅ Return updated/deleted counts

**Phase 3 Status:** ✅ COMPLETE - Ready for production testing

### 3. Modal Positioning Fix
**Status:** Pending
**Priority:** Medium

The add/edit appointment modal currently appears at the top of the page instead of being centered in the viewport.

**Components to Check:**
- `AppointmentModal.jsx`
- `BlockTimeModal.jsx`

**Expected Behavior:**
- Modal should be centered in current viewport
- Should scroll with page if content is tall
- Should use `fixed` positioning or proper centering approach

### 4. Admin Access Control (ACL System)
**Status:** Pending
**Priority:** Medium

**Issue:** Regular clinicians can still see the Administration/Settings menu despite attempting to restrict it to calendar admins only.

**Root Cause:** Likely related to OpenEMR's ACL (Access Control List) system which is more complex than simple field checks.

**Current Implementation:**
- Basic check: `admin = (calendar == 1)`
- Located in: session_user.php, login.php, session_login.php

**Required Investigation:**
- Research OpenEMR's ACL system and proper admin permission checks
- May need to use ACL functions like `acl_check()` instead of field checks
- Consider role-based permissions vs. simple boolean flags

**Files to Review:**
- OpenEMR ACL documentation
- `/interface/main/main_screen.php` (OpenEMR admin menu logic)
- ACL-related functions in OpenEMR core

---

## Recently Completed

### ✅ Calendar Availability - Provider Filtering
- Fixed to show only logged-in user's availability blocks
- Added provider ID filtering to API calls

### ✅ Calendar Availability - Absolute Positioning
- Refactored from CSS Grid to absolute positioning
- Multi-hour blocks now span properly across time slots

### ✅ "In Office" Blocking Bug
- Fixed keyword matching in `create_appointment.php`
- Removed 'off' from blocking keywords to prevent false match with "In Office"

### ✅ Dashboard Phantom Appointments
- Filter out availability blocks (categoryType=1) from dashboard
- Fixed timezone bug using local date instead of UTC

### ✅ Appointment Spanning
- Implemented absolute positioning for appointments
- Calculate top/height based on start time and duration
- Appointments now span correctly across multiple time slots

### ✅ Availability Blocks as Background
- Render as background overlays (not clickable cards)
- Use transparency and striped pattern
- Patient appointments remain clickable

### ✅ Override Functionality
- Added amber warning dialog for availability conflicts
- "Override and Book Anyway" button
- Backend accepts `overrideAvailability` parameter
