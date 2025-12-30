# OpenEMR Calendar Development - TODO & Reference

**Project:** SACWAN OpenEMR Mental Health Calendar
**Version:** 7.0.4
**Last Updated:** 2025-12-30
**Current Status:** Phase 1 Complete ✅ | Phase 2 In Progress 🎯

---

## 🎯 Active Development: Phase 2 - Interactive Features

**Goal:** Make the calendar interactive with full view modes and appointment details

### Tasks

#### 2.1 Appointment Details Modal
- [ ] Create AppointmentDetailsModal component
- [ ] Add onClick handler to appointments in Calendar.jsx
- [ ] Fetch full appointment data (extend API if needed)
- [ ] Display in modal:
  - Patient name and demographics
  - Provider name
  - Date and time
  - Duration
  - Category/type
  - Status
  - Notes/comments
  - Facility
- [ ] Add close button and keyboard support (ESC key)
- [ ] Style consistently with app glass-card design

#### 2.2 Day View
- [ ] Create Day view component
- [ ] Single day column with all time slots
- [ ] Show all providers or filtered provider(s)
- [ ] Reuse time slot rendering logic from week view
- [ ] Navigation: previous/next day, jump to today
- [ ] Display appointments in correct time slots

#### 2.3 Month View
- [ ] Create Month view component
- [ ] Calendar grid showing all days of month
- [ ] Display appointments as dots or mini-blocks
- [ ] Click day to navigate to day view
- [ ] Show appointment count per day
- [ ] Month navigation (previous/next month)
- [ ] Highlight today

#### 2.4 Enhanced Provider Filtering
- [ ] Multi-select provider functionality
- [ ] "All Providers" checkbox/toggle
- [ ] "Select All" / "Deselect All" buttons
- [ ] Remember filter preference in session/localStorage
- [ ] Update appointment display based on selection
- [ ] Show count of selected providers

### API Requirements
- May need `get_appointment_details.php` for full appointment data
- Extend `get_appointments.php` for day/month date range queries
- Consider caching strategy for better performance

---

## 📅 Upcoming: Phase 3 - Appointment Management

**Goal:** Full CRUD (Create, Read, Update, Delete) operations for appointments

### 3.1 Create New Appointments
- [ ] Click empty time slot to create appointment
- [ ] Create AppointmentForm component (will be reused for edit)
- [ ] Patient search/selection widget
- [ ] Date/time picker (pre-filled from clicked slot)
- [ ] Duration selector (default from category)
- [ ] Category dropdown (active categories only)
- [ ] Provider selection (default to current user or from filter)
- [ ] Facility selection
- [ ] Notes/comments textarea
- [ ] Status dropdown (default: Scheduled)
- [ ] Form validation
- [ ] Save button with loading state
- [ ] Success/error messaging
- [ ] Refresh calendar after successful create

### 3.2 Edit Existing Appointments
- [ ] Reuse AppointmentForm component
- [ ] Pre-populate with existing appointment data
- [ ] Allow modification of all fields
- [ ] Conflict detection (provider double-booking check)
- [ ] Update button with loading state
- [ ] Confirmation for significant changes (date/time/provider)
- [ ] Refresh calendar after successful update

### 3.3 Appointment Status Management
- [ ] Quick status change dropdown on appointment card
- [ ] Status options:
  - `-` = Scheduled (default)
  - `+` = Confirmed
  - `@` = Arrived
  - `~` = Arrived late
  - `<` = In exam room
  - `>` = Checked out
  - `x` = Cancelled
  - `?` = No show
  - `!` = Left without visit
  - `#` = Insurance/financial issue
- [ ] Visual status indicators (colors, icons)
- [ ] Update status without opening full edit form
- [ ] Status change logging (optional)

### 3.4 Delete/Cancel Appointments
- [ ] Delete/Cancel button in appointment details or edit form
- [ ] Confirmation dialog with appointment summary
- [ ] Soft delete vs. hard delete consideration
- [ ] Handle cancellation reason (optional field)
- [ ] Refresh calendar after deletion

### Required APIs
- [ ] `create_appointment.php` - Insert into `openemr_postcalendar_events`
- [ ] `update_appointment.php` - Update existing appointment
- [ ] `delete_appointment.php` - Delete or cancel appointment
- [ ] `search_patients.php` - Patient search for appointment creation (may already exist)

### Database Considerations
- Table: `openemr_postcalendar_events`
- Must set `pc_cattype = 0` for appointments (not availability)
- Link to patient (`pc_pid`), provider (`pc_aid`), category (`pc_catid`)
- Set facility (`pc_facility`) and billing location
- Record who created it (`pc_informant`)
- Validate against provider availability blocks

---

## ✨ Future: Phase 4 - Polish & Production Ready

**Goal:** Professional features, mobile support, and advanced functionality

### 4.1 Drag-and-Drop Rescheduling
- [ ] Research library: react-beautiful-dnd vs @dnd-kit
- [ ] Make appointments draggable
- [ ] Visual feedback during drag
- [ ] Drop zones for time slots
- [ ] Conflict detection on drop
- [ ] Confirmation dialog before saving reschedule
- [ ] Update appointment via API
- [ ] Handle edge cases (cross-day drag, invalid drops)

### 4.2 Mobile Responsive Design (**CRITICAL**)
- [ ] Define responsive breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- [ ] Mobile layout:
  - Stack provider sidebar (collapsible hamburger menu)
  - Default to Day view on mobile
  - Touch-friendly tap targets (min 44x44px)
  - Swipe gestures for day/week navigation
  - Bottom navigation bar for view switching
- [ ] Tablet layout:
  - Simplified week view (fewer columns)
  - Collapsible sidebars
- [ ] Test on real devices (iOS, Android)

### 4.3 Privacy Mode Toggle (HIPAA)
- [ ] Add Privacy Mode toggle button in calendar header
- [ ] When enabled: Show only patient initials (not full names)
- [ ] Useful when scheduling with other clients present
- [ ] Store preference per-user (localStorage or database)
- [ ] Visual indicator when Privacy Mode is active
- [ ] Apply to all views (week, day, month)

### 4.4 Recurring Appointments
- [ ] Add "Repeat" option to appointment form
- [ ] Recurrence patterns:
  - Daily (every X days)
  - Weekly (specific days of week)
  - Monthly (same day each month)
- [ ] End condition: End date or number of occurrences
- [ ] Create all instances in database
- [ ] "Edit single" vs "Edit series" option
- [ ] Handle exceptions (skip holidays, modified instances)
- [ ] Database fields: `pc_recurrtype`, `pc_recurrspec`, `pc_recurrfreq`, `pc_endDate`

### 4.5 Advanced Settings Integration
- [ ] Verify all Admin > Calendar settings apply correctly:
  - Starting/ending hours
  - Time interval
  - Default view
  - Color scheme
  - Display style
  - Provider visibility
- [ ] Provider-specific settings (if available in OpenEMR)
- [ ] Facility-specific settings

### 4.6 PWA (Progressive Web App) Support
- [ ] Service worker for offline capability
- [ ] App manifest for home screen install
- [ ] Offline appointment viewing (read-only)
- [ ] Push notifications for reminders (future)

---

## 🚀 Future: Phase 5 - Advanced Features & Enhancements

**Goal:** Power user features and optimizations

### 5.1 Provider-Based Color Coding
- [ ] Add color picker to Admin > Users for each provider
- [ ] Option to override category colors with provider colors
- [ ] Color scheme selector (by category, by provider, by facility)
- [ ] Apply to calendar appointments
- [ ] Legend showing color meanings

### 5.2 Enhanced Appointment Details
- [ ] Quick link to patient chart
- [ ] Quick link to create encounter
- [ ] Display appointment history for this patient
- [ ] Show communication log (calls, emails, SMS)
- [ ] Attached files/documents
- [ ] Edit inline without closing modal

### 5.3 Appointment Reminders & Notifications
- [ ] Email reminder configuration
- [ ] SMS reminder configuration (if enabled in OpenEMR)
- [ ] Reminder timing options (24hr, 48hr, 1 week before)
- [ ] Template management for reminder messages
- [ ] Send test reminder
- [ ] Opt-in/opt-out per patient
- [ ] Track reminder delivery status

### 5.4 Bulk Operations
- [ ] Multi-select appointments (checkboxes)
- [ ] Bulk actions:
  - Reschedule multiple appointments
  - Change status for multiple
  - Cancel multiple
  - Send reminders to multiple
- [ ] Select all in date range
- [ ] Confirmation before bulk operations
- [ ] Progress indicator for bulk actions

### 5.5 Calendar Export & Print
- [ ] Print day view
- [ ] Print week view
- [ ] Print month view
- [ ] Export to PDF
- [ ] Export to iCal format (import into Outlook, Google Calendar)
- [ ] Export to CSV (for reports)
- [ ] Date range selector for export
- [ ] Include/exclude cancelled appointments option

### 5.6 Custom Appointment Types & Templates
- [ ] Define appointment templates (preset combinations)
- [ ] Template fields:
  - Name (e.g., "Initial Therapy Session")
  - Default category
  - Default duration
  - Default status
  - Notes template
- [ ] Quick-create buttons for common appointment types
- [ ] Manage templates in Admin section

---

## 📚 Database Schema Reference

### Table: `globals` - Calendar Settings

Simple key/value pairs for global configuration.

**Key Settings:**
- `calendar_start` or `schedule_start` - Starting hour (0-23)
- `calendar_end` or `schedule_end` - Ending hour (0-23)
- `calendar_interval` - Time slot interval (5, 10, 15, 20, 30, 60 minutes)
- `calendar_view_type` - Default view (day/week/month)
- `event_color` - Color scheme (0=category, 1=facility)
- `appt_display_mode` - Name format for display
- `calendar_appt_style` - Additional display preferences

**Note:** Our implementation handles both `calendar_*` and `schedule_*` naming conventions.

---

### Table: `openemr_postcalendar_categories` - Appointment Categories

**Key Fields:**
- `pc_catid` - Category ID (primary key)
- `pc_catname` - Category name (e.g., "Office Visit", "Therapy Session")
- `pc_catcolor` - Hex color code (e.g., "#3B82F6")
- `pc_catdesc` - Description
- `pc_cattype` - **CRITICAL:**
  - `0` = Appointment category (patient appointments)
  - `1` = Event/availability category (provider schedules, breaks)
- `pc_duration` - Default duration in seconds
- `pc_active` - Active status (1=active, 0=inactive)
- `pc_end_date_flag` - Whether appointments require end date

**Usage:**
- Only show categories where `pc_cattype = 0` and `pc_active = 1` for appointment creation
- Use `pc_catcolor` for calendar display
- Use `pc_duration` as default when creating appointments

---

### Table: `openemr_postcalendar_events` - Appointments & Events

**⚠️ CRITICAL UNDERSTANDING:**
This table is **OVERLOADED** - it stores both:
- Actual patient appointments (`pc_cattype = 0`)
- Provider availability blocks (`pc_cattype = 1`)
- Office closures, breaks, recurring patterns

**Identification Fields:**
- `pc_eid` - Event ID (primary key, auto-increment)
- `pc_catid` - Category ID (FK to `openemr_postcalendar_categories`)
- `pc_cattype` - Type: 0=appointment, 1=availability
- `pc_title` - Event title
- `pc_aid` - Provider/User ID (whose calendar this is on)

**Patient Appointment Fields:**
- `pc_pid` - Patient ID (NULL for availability blocks)
- `pc_apptstatus` - Appointment status:
  - `-` = Scheduled (default)
  - `*` = Confirmation required
  - `+` = Confirmed
  - `x` = Cancelled
  - `?` = No show
  - `@` = Arrived
  - `~` = Arrived late
  - `!` = Left without visit
  - `#` = Insurance/financial issue
  - `<` = In exam room
  - `>` = Checked out

**Date/Time Fields:**
- `pc_eventDate` - Date (YYYY-MM-DD)
- `pc_startTime` - Start time (HH:MM:SS)
- `pc_duration` - Duration in seconds
- `pc_endDate` - End date (for multi-day or recurring)
- `pc_alldayevent` - Boolean (0 or 1)

**Recurrence Fields:**
- `pc_recurrtype` - Recurrence type:
  - 0 = None
  - 1 = Daily
  - 2 = Weekly
  - 3 = Monthly
  - 4 = Yearly
- `pc_recurrspec` - Recurrence specification (serialized data)
- `pc_recurrfreq` - Frequency (every X days/weeks/months)
- `pc_endDate` - When recurrence ends

**Location Fields:**
- `pc_facility` - Facility ID
- `pc_billing_location` - Billing location (can differ from pc_facility)

**Additional Fields:**
- `pc_hometext` - Notes/comments
- `pc_informant` - User ID who created the appointment
- `pc_time` - Timestamp of creation
- `pc_sharing` - Sharing/visibility settings
- `pc_sendalertsms` - Send SMS reminder (0 or 1)
- `pc_sendalertemail` - Send email reminder (0 or 1)

**When Creating Appointments:**
```sql
INSERT INTO openemr_postcalendar_events (
  pc_catid,           -- From category selection
  pc_cattype,         -- Always 0 for appointments
  pc_pid,             -- Patient ID
  pc_aid,             -- Provider ID
  pc_eventDate,       -- Appointment date
  pc_startTime,       -- Start time
  pc_duration,        -- Duration in seconds
  pc_apptstatus,      -- Default '-' or from settings
  pc_facility,        -- Current facility
  pc_informant,       -- Current user ID
  pc_time,            -- NOW()
  pc_hometext,        -- Notes
  pc_title            -- Appointment title
) VALUES (...);
```

**Conflict Checking:**
```sql
-- Check for overlapping appointments for same provider
SELECT * FROM openemr_postcalendar_events
WHERE pc_aid = ?
  AND pc_eventDate = ?
  AND pc_cattype = 0
  AND pc_apptstatus NOT IN ('x', '?')  -- Exclude cancelled/no-shows
  AND (
    -- New appointment starts during existing appointment
    ? BETWEEN pc_startTime AND ADDTIME(pc_startTime, SEC_TO_TIME(pc_duration))
    OR
    -- New appointment ends during existing appointment
    ADDTIME(?, SEC_TO_TIME(?)) BETWEEN pc_startTime AND ADDTIME(pc_startTime, SEC_TO_TIME(pc_duration))
    OR
    -- New appointment completely contains existing appointment
    (? <= pc_startTime AND ADDTIME(?, SEC_TO_TIME(?)) >= ADDTIME(pc_startTime, SEC_TO_TIME(pc_duration)))
  )
```

---

## 🗂️ File Structure

### React Frontend
```
react-frontend/src/
├── pages/
│   ├── Calendar.jsx           ← Main calendar page (week view)
│   ├── Admin.jsx              ← Admin page wrapper
│   └── Dashboard.jsx          ← Dashboard (links to calendar)
├── components/
│   ├── admin/
│   │   └── CalendarSettings.jsx  ← Calendar config panel
│   └── calendar/              ← Future: Calendar subcomponents
│       ├── AppointmentDetailsModal.jsx  (Phase 2)
│       ├── AppointmentForm.jsx          (Phase 3)
│       ├── DayView.jsx                  (Phase 2)
│       └── MonthView.jsx                (Phase 2)
└── utils/
    └── dateHelpers.js         ← Date manipulation utilities
```

### Custom PHP APIs
```
custom/api/
├── get_appointments.php          ✅ Fetch appointments for date range
├── get_calendar_settings.php     ✅ Fetch calendar configuration
├── update_calendar_settings.php  ✅ Save calendar settings
├── get_appointment_details.php   🔜 Phase 2
├── create_appointment.php        🔜 Phase 3
├── update_appointment.php        🔜 Phase 3
├── delete_appointment.php        🔜 Phase 3
└── search_patients.php           🔜 Phase 3
```

---

## 🔐 Security & HIPAA Compliance

### Current Implementation ✅
- Session-based authentication (uses OpenEMR's auth system)
- ACL (Access Control List) checks in all PHP APIs
- No sensitive data in URLs (POST requests for mutations)
- Same-origin policy (React frontend on same domain)
- httpOnly and secure session cookies

### Privacy Mode (Phase 4)
- Toggle to show only patient initials
- Prevents accidental PHI disclosure
- Useful when scheduling with other clients present
- Per-user persistent preference

### Audit Logging
- OpenEMR core handles audit logging for appointment CRUD
- All changes logged with user ID and timestamp
- Viewable in OpenEMR admin logs

### Data Protection
- All PHI stays in OpenEMR database
- No external API calls for patient data
- No client-side storage of sensitive data
- HTTPS required for production

---

## 🐛 Known Issues & Fixes

### ✅ Fixed Issues (Phase 1)
- Session handling causing premature logout → FIXED
- Logo showing "M" instead of image → FIXED (using branding.logoUrl)
- Date mutation bug in getWeekDays() → FIXED (timestamp approach)
- Week calculations inconsistent → FIXED (normalized to midnight)
- 24-hour vs 12-hour time format → FIXED (12-hour with AM/PM)
- Category colors not displaying → FIXED
- Settings not loading → FIXED (handle both naming conventions)
- Appointments not showing on initial load → FIXED (date mutation)

### Current Limitations
- ⚠️ Mobile responsiveness (scheduled for Phase 4)
- ⚠️ No appointment creation yet (Phase 3)
- ⚠️ Day/Month views not complete (Phase 2)
- ⚠️ No drag-and-drop (Phase 4)

### Debug Resources
- Debug code saved in `DEBUG_CALENDAR_SETTINGS.md` (if exists)
- Console.log statements may be active in Calendar.jsx
- Browser DevTools Network tab for API debugging

---

## 📈 Performance Optimization

### Current Optimizations ✅
- Efficient date-range queries (only fetch visible week)
- Category data cached in component state
- Provider list cached
- Settings fetched once per session

### Future Optimizations
- Lazy loading for month view (load visible weeks only)
- Virtual scrolling for long appointment lists
- Debounced search/filter inputs
- Memoization of expensive computed values (React.useMemo)
- Server-side pagination for large provider lists
- IndexedDB for offline appointment caching (PWA)

---

## 🧪 Testing Checklist

### Phase 1 Testing ✅ Complete
- [x] Week view with real appointment data
- [x] Provider filtering
- [x] Date navigation (previous/next/today)
- [x] Mini calendar navigation
- [x] Category colors
- [x] Settings integration
- [x] Multiple time zones
- [x] Edge cases (midnight appointments, overnight)

### Phase 2 Testing (Upcoming)
- [ ] Appointment details modal with various data
- [ ] Day view with multiple providers
- [ ] Month view with dense schedules
- [ ] All-day events
- [ ] Cross-browser testing

### Phase 3 Testing (Future)
- [ ] Create appointment validation
- [ ] Edit appointment conflict detection
- [ ] Delete confirmation flow
- [ ] Status changes reflecting immediately
- [ ] Recurring appointments creation

### Phase 4 Testing (Future)
- [ ] Mobile devices (iOS Safari, Android Chrome)
- [ ] Touch gestures
- [ ] Drag-and-drop across browsers
- [ ] Performance with 1000+ appointments
- [ ] Privacy mode functionality

---

## 📞 Resources & Documentation

### OpenEMR Official
- Wiki: https://www.open-emr.org/wiki
- Forum: https://community.open-emr.org/
- GitHub: https://github.com/openemr/openemr
- Calendar Documentation: https://www.open-emr.org/wiki/index.php/Calendar

### Project Documentation
- This TODO.md file
- Code comments in Calendar.jsx
- API documentation in PHP file headers
- DEBUG_CALENDAR_SETTINGS.md (debug notes)

---

## 🎯 Immediate Next Steps

**Starting Phase 2:**

1. **Appointment Details Modal** (First task)
   - Create component file: `react-frontend/src/components/calendar/AppointmentDetailsModal.jsx`
   - Add onClick handler to appointments in Calendar.jsx
   - Fetch full appointment data
   - Display patient info, provider, category, status, notes
   - Style with glass-card design

2. **Day View** (After modal complete)
   - Create component file: `react-frontend/src/components/calendar/DayView.jsx`
   - Reuse time slot logic from week view
   - Single column layout

3. **Month View**
   - Create component file: `react-frontend/src/components/calendar/MonthView.jsx`
   - Grid layout with days
   - Mini appointment indicators

---

## 📊 Version History

| Version | Phase | Status | Key Features |
|---------|-------|--------|--------------|
| v1.0 | Phase 1 | ✅ Complete | Week view, settings integration, provider filtering, mini calendar |
| v2.0 | Phase 2 | 🎯 In Progress | Interactive details, day/month views, enhanced filtering |
| v3.0 | Phase 3 | 📅 Planned | CRUD operations, status management |
| v4.0 | Phase 4 | 📅 Planned | Mobile responsive, drag-and-drop, privacy mode, recurring |
| v5.0 | Phase 5 | 📅 Planned | Advanced features, notifications, bulk ops, export |

---

## ✅ Completed Work (Phase 1 Archive)

<details>
<summary>Click to view Phase 1 completed tasks</summary>

### Phase 1: Basic Read-Only Week View ✅

**All tasks completed and merged to main:**

- ✅ Created session-based appointment fetch API (get_appointments.php)
- ✅ Created Calendar page component with weekly grid
- ✅ Implemented hourly time slots (dynamic from settings!)
- ✅ Display appointments in time slots
- ✅ Day/Week/Month view toggle (week functional)
- ✅ Date navigation (previous/next/today)
- ✅ Provider filter sidebar (clickable list)
- ✅ Integrated into main Dashboard navigation
- ✅ Applied consistent app styling
- ✅ Show provider list on left sidebar
- ✅ Fixed 24-hour to 12-hour time format
- ✅ Removed internal scrolling (page scrolls naturally)
- ✅ Widened layout for better viewing
- ✅ Test with real appointment data
- ✅ Integrate OpenEMR calendar settings (hours, intervals)
- ✅ Use category colors for appointment display
- ✅ Add mini month calendar with click-to-navigate functionality
- ✅ Logo displays correctly in header (using branding.logoUrl)
- ✅ Fixed date mutation bug - appointments now display on initial load
- ✅ Week starts on Sunday (US convention)
- ✅ Session handling fixed (no more logouts!)
- ✅ Handles both schedule_start/schedule_end AND calendar_start/calendar_end conventions

### Admin Settings Infrastructure ✅

- ✅ Created Admin page with sidebar navigation
- ✅ Calendar settings panel (7 configurable options):
  - Calendar Starting Hour
  - Calendar Ending Hour
  - Calendar Interval
  - Default Calendar View
  - Appointment/Event Color
  - Appointment Display Style
  - Providers See Entire Calendar
- ✅ Backend API: get_calendar_settings.php
- ✅ Backend API: update_calendar_settings.php
- ✅ Proper UPDATE/INSERT logic
- ✅ Session-based authentication
- ✅ Maps frontend to OpenEMR global variable names
- ✅ Boolean to integer conversion for database

</details>

---

**Last Updated:** 2025-12-30
**Next Milestone:** Appointment Details Modal (Phase 2.1)
