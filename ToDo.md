# OpenEMR Calendar Development - TODO & Reference

**Project:** SACWAN OpenEMR Mental Health Calendar
**Version:** 7.0.4
**Last Updated:** 2025-12-30

---

## 📊 Current Status

**Phase 1: ✅ COMPLETE!**

All Phase 1 features are implemented and working in production.

---

## 🎯 Development Phases

### ✅ Phase 1: Basic Read-Only Week View (COMPLETE!)

**Completed Features:**
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
- ✅ Test with real appointment data (working!)
- ✅ Integrate OpenEMR calendar settings (hours, intervals)
- ✅ Use category colors for appointment display
- ✅ Add mini month calendar with click-to-navigate functionality
- ✅ Logo displays correctly in header (using branding.logoUrl)
- ✅ Fixed date mutation bug - appointments now display on initial load!
- ✅ Week starts on Sunday (US convention) - main and mini calendars aligned
- ✅ Session handling fixed (no more logouts!)

**Technical Achievements:**
- Resolved getWeekDays() date mutation bug using timestamp-based approach
- Logo image now displays with proper fallback to text
- Week calculations normalized to midnight for consistent date handling
- Handles both schedule_start/schedule_end AND calendar_start/calendar_end conventions

**Known Limitations (to address in later phases):**
- Mobile responsiveness needs work (scheduled for Phase 4)

---

### 🎯 Phase 2: Interactive Features (NEXT UP - IN PROGRESS)

**Goals:** Make the calendar interactive with full view modes and appointment details

**Tasks:**
- [ ] Click appointment to view details modal
  - Display full appointment information
  - Show patient details
  - Show appointment category/type
  - Show status
  - Show provider
  - Show notes/comments
  - Close button
- [ ] Complete Day view implementation
  - Single day column view
  - Same time slots as week view
  - All providers or single provider filter
- [ ] Complete Month view implementation
  - Calendar grid with all days of month
  - Appointments shown as dots or mini-blocks
  - Click day to see day view or details
- [ ] Enhance provider filter functionality
  - Multi-select providers
  - "All Providers" option
  - Remember filter preference

**API Requirements:**
- May need to extend get_appointments.php for day/month queries
- Appointment details endpoint (or include in existing API)

---

### 📅 Phase 3: Appointment Management

**Goals:** Full CRUD operations for appointments

**Tasks:**
- [ ] Create new appointments
  - Click empty time slot to create
  - Appointment form modal
  - Patient search/selection
  - Date/time selection
  - Duration (from category defaults)
  - Category selection
  - Provider selection
  - Notes field
  - Status (default: Scheduled)
  - Validation
- [ ] Edit existing appointments
  - Click existing appointment
  - Same form as create
  - Pre-populated with current values
  - Update functionality
- [ ] Appointment status updates
  - Quick status change buttons
  - Status options: Scheduled, Arrived, In Room, Complete, Cancelled, No-Show
  - Status color coding
  - Status history tracking (optional)
- [ ] Delete/Cancel appointments
  - Confirmation dialog
  - Soft delete vs hard delete consideration

**API Requirements:**
- create_appointment.php
- update_appointment.php
- delete_appointment.php
- get_appointment_details.php

**Database Considerations:**
- Uses `openemr_postcalendar_events` table
- Must differentiate appointments from availability blocks
- Must handle category relationships
- Must update patient history

---

### ✨ Phase 4: Polish & Production Ready

**Goals:** Professional features and mobile support

**Tasks:**
- [ ] Drag-and-drop rescheduling
  - Drag appointment to new time slot
  - Visual feedback during drag
  - Confirm reschedule
  - Update database
  - Handle conflicts
- [ ] Advanced calendar settings integration
  - All settings from Admin > Calendar working
  - Provider-specific settings
  - Facility-specific settings
- [ ] Recurring appointments
  - Daily/Weekly/Monthly patterns
  - End date or number of occurrences
  - Edit single vs edit series
  - Exception handling
- [ ] Mobile responsive design (**CRITICAL**)
  - Touch-friendly interface
  - Responsive breakpoints
  - Mobile-optimized views
  - Swipe gestures for navigation
  - Stack layout for small screens
- [ ] Privacy Mode toggle (HIPAA consideration)
  - Show initials only when enabled
  - Useful when scheduling with clients present
  - Quick toggle button
  - Persistent preference
- [ ] App version consideration
  - Native mobile app vs responsive web
  - PWA (Progressive Web App) support
  - Offline capabilities (future)

**Libraries to Consider:**
- react-beautiful-dnd or @dnd-kit for drag-and-drop
- react-big-calendar (if we want to replace custom implementation)
- date-fns or dayjs for date manipulation (already using dayjs?)

---

### 🚀 Phase 5: New Features & Enhancements

**Goals:** Advanced features and optimizations

**Tasks:**
- [ ] Provider-based color coding
  - Configurable per user in Admin > Users
  - Different color schemes available
  - Override category colors option
- [ ] Enhanced appointment details modal
  - Patient chart quick link
  - Encounter quick create
  - Appointment history
  - Communication log
  - Files/documents attached
- [ ] Appointment reminders/notifications
  - Email reminders
  - SMS reminders (if configured)
  - Configurable timing (24hr, 48hr, etc)
  - Template management
- [ ] Bulk scheduling operations
  - Bulk reschedule
  - Bulk status update
  - Bulk cancel
  - Select multiple appointments
- [ ] Calendar export/print functionality
  - Print day/week/month view
  - Export to PDF
  - Export to iCal format
  - Export to CSV
- [ ] Custom appointment types/templates
  - Predefined appointment types
  - Auto-fill duration, category
  - Quick-create buttons
  - Frequently used combinations

---

## 📚 OpenEMR Calendar Schema & Technical Notes

### Database Schema Overview

OpenEMR uses a complex PostCalendar system that stores both availability blocks AND actual appointments in the same tables. This is important to understand when implementing features.

#### 1. Global Calendar Settings

**Table:** `globals`
**Filter:** `gl_name` starts with `calendar_` or `appt_`

**Key Settings:**
- `calendar_start` - Calendar starting hour (NOT schedule_start!)
- `calendar_end` - Calendar ending hour (NOT schedule_end!)
- `calendar_interval` - Time slot interval (5, 10, 15, 20, 30, 60 minutes)
- `calendar_view_type` - Default view (day/week/month)
- `event_color` - Appointment/Event color scheme (Category/Facility)
- `appt_display_mode` - Appointment display style (5 name format options)
- `calendar_appt_style` - Additional display preferences

**Note:** These are simple key/value pairs in the globals table.

**Naming Convention Warning:**
- Some installations use `calendar_start` / `calendar_end`
- Others use `schedule_start` / `schedule_end`
- Our implementation handles BOTH conventions

---

#### 2. Appointment Categories

**Table:** `openemr_postcalendar_categories`

**Important Fields:**
- `pc_catid` - Category ID (primary key)
- `pc_catname` - Category name (e.g., "Office Visit", "Therapy Session")
- `pc_catcolor` - Hex color code for calendar display
- `pc_catdesc` - Description
- `pc_cattype` - Category type (0 = appointment, 1 = availability/event)
- `pc_duration` - Default duration in seconds
- `pc_end_date_flag` - Whether appointments require end date
- `pc_active` - Active status (1 = active, 0 = inactive)

**Key Insight:**
- `pc_cattype = 0` means this is an appointment category (patient appointments)
- `pc_cattype = 1` means this is an event/availability category (provider schedules, breaks, etc.)

---

#### 3. Appointments & Events (MOST IMPORTANT)

**Table:** `openemr_postcalendar_events`

**Critical Understanding:**
This table is **OVERLOADED** - it stores BOTH:
- Actual patient appointments
- Provider availability blocks
- Office closures
- Breaks
- Recurring patterns

**Key Fields:**

**Identification:**
- `pc_eid` - Event ID (primary key)
- `pc_catid` - Links to category (determines if appointment or availability)
- `pc_title` - Event title
- `pc_aid` - Provider/User ID (who is this event for?)

**Patient Appointment Fields:**
- `pc_pid` - Patient ID (NULL for availability blocks)
- `pc_apptstatus` - Appointment status:
  - `-` = No status
  - `*` = Confirmation required
  - `+` = Confirmed
  - `x` = Cancelled
  - `?` = No show
  - `@` = Arrived
  - `~` = Arrived late
  - `!` = Left without visit
  - `#` = Ins/fin issue
  - `<` = In exam room
  - `>` = Checked out

**Date/Time Fields:**
- `pc_eventDate` - Date of appointment (YYYY-MM-DD)
- `pc_startTime` - Start time (HH:MM:SS)
- `pc_duration` - Duration in seconds
- `pc_endDate` - End date (for multi-day or recurring)
- `pc_alldayevent` - Boolean (0 or 1)

**Recurrence Fields:**
- `pc_recurrtype` - Recurrence type (0 = none, 1 = daily, 2 = weekly, 3 = monthly, etc.)
- `pc_recurrspec` - Recurrence specification (JSON or serialized data)
- `pc_recurrfreq` - Frequency (every X days/weeks/months)
- `pc_endDate` - When recurrence ends

**Location:**
- `pc_facility` - Facility ID
- `pc_billing_location` - Billing location ID (can differ from pc_facility)

**Additional Info:**
- `pc_hometext` - Appointment notes/comments
- `pc_informant` - User ID who created the appointment
- `pc_time` - Timestamp of creation

**Important Flags:**
- `pc_cattype` - Mirrors the category type (0 = appointment, 1 = availability)
- `pc_sharing` - Sharing/visibility settings
- `pc_sendalertsms` - Send SMS reminder flag
- `pc_sendalertemail` - Send email reminder flag

---

#### 4. Provider-Specific Availability

**How It Works:**
- Provider schedules are stored in `openemr_postcalendar_events`
- Differentiated by `pc_cattype = 1` and specific category
- Repeating patterns use recurrence fields
- Can define "In Office" hours, breaks, lunch, etc.

**Common Categories for Availability:**
- "In Office" - When provider is available
- "Out of Office" - When provider is unavailable
- "Reserved" - Time blocked off
- "Break" - Scheduled breaks
- "Lunch" - Lunch breaks

---

### Implementation Considerations

#### When Creating/Editing Appointments (Phase 3):

1. **Insert into** `openemr_postcalendar_events`:
   - Set `pc_catid` from category selection
   - Set `pc_cattype = 0` (appointment)
   - Set `pc_pid` to patient ID
   - Set `pc_aid` to provider ID
   - Set date/time fields
   - Set `pc_apptstatus` (default `'-'` or from settings)
   - Set `pc_facility` from user's current facility
   - Set `pc_informant` to current user ID
   - Set `pc_time` to NOW()

2. **Conflict Checking:**
   - Query `openemr_postcalendar_events` for same provider
   - Check for overlapping time slots
   - Consider `pc_cattype` - can't book during availability blocks marked as unavailable

3. **Category Rules:**
   - Respect `pc_duration` from category (default, can override)
   - Use `pc_catcolor` for display
   - Check if category is active (`pc_active = 1`)

4. **Recurring Appointments:**
   - Set `pc_recurrtype`, `pc_recurrspec`, `pc_recurrfreq`
   - Set `pc_endDate` for series end
   - Consider creating individual events vs one recurring record (OpenEMR varies)

---

### Admin Settings Implementation (Phase 1 ✅)

**Completed Infrastructure:**
- Created Admin page with sidebar navigation
- Calendar settings panel (7 configurable options)
- Backend API: `get_calendar_settings.php`
- Backend API: `update_calendar_settings.php`
- Proper UPDATE/INSERT logic with existence checking
- Session-based authentication
- Maps frontend field names to OpenEMR global variable names
- Handles boolean to integer conversion for database

**Admin Sections Ready (placeholders):**
- Calendar (✅ Complete)
- Appearance (Coming Soon)
- Branding (Coming Soon)
- Features (Coming Soon)
- Providers (Coming Soon)
- Facilities (Coming Soon)
- Users (Coming Soon)
- Security (Coming Soon)

---

## 🗂️ File Structure Reference

### React Frontend Files

**Main Calendar Component:**
- `react-frontend/src/pages/Calendar.jsx` - Main calendar page

**Admin Components:**
- `react-frontend/src/pages/Admin.jsx` - Admin page wrapper
- `react-frontend/src/components/admin/CalendarSettings.jsx` - Calendar config panel

**API Integration:**
- Session-based authentication (no token needed)
- Uses fetch() with credentials: 'include'

### Custom PHP APIs

**Calendar APIs:**
- `custom/api/get_appointments.php` - Fetch appointments for date range
- `custom/api/get_calendar_settings.php` - Fetch calendar configuration

**Admin APIs:**
- `custom/api/update_calendar_settings.php` - Save calendar settings

**Future APIs (Phase 3):**
- `custom/api/create_appointment.php` - Create new appointment
- `custom/api/update_appointment.php` - Update existing appointment
- `custom/api/delete_appointment.php` - Delete/cancel appointment
- `custom/api/get_appointment_details.php` - Get single appointment details

---

## 🐛 Known Issues & Debug Notes

### Fixed Issues:
- ✅ Session handling (logout bug) - FIXED
- ✅ Logo display - FIXED (using branding.logoUrl)
- ✅ Date mutation bug in getWeekDays() - FIXED (timestamp approach)
- ✅ Week calculation consistency - FIXED (normalized to midnight)
- ✅ 24-hour vs 12-hour time format - FIXED
- ✅ Category colors not showing - FIXED
- ✅ Settings not loading - FIXED (handle both naming conventions)

### Current Limitations:
- Mobile responsiveness (scheduled for Phase 4)
- No appointment creation yet (Phase 3)
- Day/Month views not complete (Phase 2)
- No drag-and-drop (Phase 4)

### Debug Reference:
- Debug code and troubleshooting saved in `DEBUG_CALENDAR_SETTINGS.md` (if it exists)
- Console.log statements may still be active in Calendar.jsx for monitoring

---

## 🔐 Security & HIPAA Considerations

### Current Implementation:
- Session-based authentication (uses OpenEMR's auth system)
- ACL checks in PHP APIs
- No sensitive data in URLs (POST requests)

### Future Privacy Features (Phase 4):
- **Privacy Mode Toggle:**
  - Show only patient initials when enabled
  - Useful when scheduling with other clients present
  - Prevents accidental PHI disclosure
  - Quick toggle in calendar header
  - Persistent per-user preference

### HIPAA Compliance Notes:
- All appointment data stays in OpenEMR database
- No external API calls for PHI
- React frontend runs on same domain (no CORS issues)
- Session cookies are httpOnly and secure
- Audit logging handled by OpenEMR core

---

## 📱 Mobile & Responsive Design (Phase 4)

### Current Status:
- Desktop optimized
- Not yet mobile-friendly

### Mobile Requirements:
- Touch-friendly tap targets (min 44x44px)
- Swipe gestures for navigation
- Responsive breakpoints:
  - Mobile: < 768px (stack layout)
  - Tablet: 768px - 1024px (simplified week view)
  - Desktop: > 1024px (full layout)
- Mobile-specific views:
  - Day view (default on mobile)
  - List view option
  - Simplified month view

### PWA Considerations:
- Service worker for offline support
- App manifest for home screen install
- Push notifications for reminders
- Offline appointment viewing (read-only)

---

## 🎨 UI/UX Design Notes

### Current Styling:
- Glass-card design (backdrop-filter, transparency)
- Category-based color coding
- 12-hour time format
- Natural page scrolling (no internal scroll containers)
- Consistent with rest of app design

### Color Coding System:
- Appointments colored by category (from `pc_catcolor`)
- Status indicators (future):
  - Scheduled: Default category color
  - Confirmed: Green accent
  - Arrived: Blue accent
  - In Room: Orange accent
  - Completed: Gray
  - Cancelled: Red with strikethrough
  - No Show: Red

### Future UI Enhancements (Phase 5):
- Provider-based coloring (override category)
- Custom color schemes
- Theme support (light/dark mode)
- Appointment icons for quick status identification
- Tooltips on hover
- Keyboard shortcuts

---

## 🧪 Testing Strategy

### Phase 1 Testing (✅ Complete):
- Verified with real appointment data
- Tested across date ranges
- Provider filtering tested
- Settings integration tested
- Mini calendar navigation tested

### Phase 2 Testing (Upcoming):
- Appointment details modal with various data scenarios
- Day view with multiple providers
- Month view with dense appointment schedules
- Edge cases (midnight appointments, all-day events)

### Phase 3 Testing (Future):
- Create appointment validation
- Edit appointment conflict detection
- Delete appointment confirmation
- Status changes
- Recurring appointment creation

### Phase 4 Testing (Future):
- Mobile device testing (iOS, Android)
- Touch gesture testing
- Drag-and-drop on various browsers
- Performance testing with large datasets

---

## 📈 Performance Considerations

### Current Performance:
- Efficient date-range queries
- Category data cached in component state
- Provider list cached
- Settings fetched once per session

### Future Optimizations:
- Lazy loading for month view (load visible weeks only)
- Virtual scrolling for long appointment lists
- Debounced search/filter inputs
- Memoization of computed values
- Server-side pagination for large provider lists

---

## 🔄 Version History

### v1.0 - Phase 1 Complete (Current)
- Basic week view with all features
- Settings integration
- Provider filtering
- Mini calendar navigation
- Category color coding

### v2.0 - Phase 2 (Planned)
- Interactive appointment details
- Day and Month views
- Enhanced filtering

### v3.0 - Phase 3 (Planned)
- Full CRUD operations
- Appointment management
- Status updates

### v4.0 - Phase 4 (Planned)
- Mobile responsive
- Drag-and-drop
- Privacy mode
- Recurring appointments

### v5.0 - Phase 5 (Planned)
- Advanced features
- Notifications
- Bulk operations
- Export/print

---

## 📞 Support & Documentation

### OpenEMR Resources:
- OpenEMR Wiki: https://www.open-emr.org/wiki
- Forum: https://community.open-emr.org/
- GitHub: https://github.com/openemr/openemr

### Project-Specific:
- This TODO document
- Code comments in Calendar.jsx
- API documentation in PHP file headers
- Debug notes in DEBUG_CALENDAR_SETTINGS.md (if exists)

---

## 🎯 Next Steps

**Immediate Next Task: Phase 2 - Appointment Details Modal**

1. Create AppointmentDetailsModal component
2. Add onClick handler to appointments in Calendar.jsx
3. Fetch full appointment data (extend API if needed)
4. Display patient info, provider, category, status, notes
5. Add close button
6. Style consistently with app design

**After that:**
- Day view implementation
- Month view implementation
- Enhanced provider filtering

---

**Last Updated:** 2025-12-30
**Current Phase:** Phase 2 (Starting)
**Next Milestone:** Interactive appointment details modal
