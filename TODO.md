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
**Status:** Phase 2 Complete - Frontend UI Implemented
**Priority:** High

**User Requirements:**
- Weekly patterns with specific days (Mon/Thu, Wed/Sat, etc.)
- Intervals: Weekly, Every 2 weeks, Every 3 weeks, Every 4 weeks
- End conditions: After X occurrences OR on specific date
- Series management: Edit/delete single, all, or "this and future"
- Conflict detection BEFORE creating with user decision

**Implementation Plan:**

**Phase 1: Database & Backend**
- Add recurrence fields (or use OpenEMR's existing structure)
- Create API to generate occurrences from recurrence rules
- Conflict validation before creation
- Series management endpoints (edit/delete variants)

**Phase 2: Frontend UI**
- Recurrence section in modals (between Duration and Title)
- Day checkboxes (Mon-Sun)
- Interval dropdown (Weekly, Every 2/3/4 weeks)
- End condition radio: After X occurrences / On date
- Conflict warning dialog with options

**Phase 3: Series Management**
- Detect recurring events (show banner)
- Edit/Delete options: Just this / This and future / All
- "This and future" splits series (original ends, new begins)

**Technical Approach:**
- Option A (Recommended): Create individual records with shared `recurrence_id`
- Link occurrences via `pc_recurrspec` field in OpenEMR
- Simpler, uses existing structure, easier to manage

**Completed (Phase 2):**
- ✅ Added recurrence state variables to AppointmentModal and BlockTimeModal
- ✅ Implemented day selection checkboxes (Mon-Sun)
- ✅ Added frequency dropdown (Weekly, Every 2/3/4 weeks)
- ✅ Implemented end condition options (After X occurrences / On date)
- ✅ Added form validation for recurrence fields
- ✅ Positioned UI between Duration and Title/Notes fields
- ✅ Reset recurrence fields on modal close
- ✅ Frontend sends recurrence data to backend

**Remaining Work:**
- Backend API to generate occurrences from recurrence rules
- Conflict detection BEFORE creating occurrences
- Series management (edit/delete single, all, this+future)
- Conflict warning dialog

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
