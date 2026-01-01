# Migration Notes - OpenEMR Table References

This document tracks all references to OpenEMR-specific table names that need to be renamed before production.

## Database Tables Currently Using "openemr_" Prefix

### Calendar/Appointment System
- `openemr_postcalendar_events` - Main appointments table
- `openemr_postcalendar_categories` - Appointment types/categories

### References to Rename

#### PHP API Files
1. **custom/api/get_appointments.php**
   - Lines 70-95: `FROM openemr_postcalendar_events e`
   - Lines 91-94: JOINs with `openemr_postcalendar_categories`

2. **custom/api/get_appointment_categories.php**
   - Lines 70-77: `FROM openemr_postcalendar_categories`

3. **custom/api/create_appointment.php**
   - Lines 111-133: `INSERT INTO openemr_postcalendar_events`

4. **custom/api/update_appointment.php**
   - Lines 111-125: `UPDATE openemr_postcalendar_events`

5. **custom/api/check_calendar_schema.php**
   - Lines 28, 38: References to `openemr_postcalendar_categories`

#### Suggested Production Names
- `openemr_postcalendar_events` → `mindline_appointments` or `appointments`
- `openemr_postcalendar_categories` → `mindline_appointment_categories` or `appointment_categories`

## Migration Strategy (Before Production)

1. Create new tables with Mindline naming
2. Copy data from OpenEMR tables
3. Update all API references
4. Test thoroughly
5. Remove OpenEMR tables (optional - could keep for rollback)

## Notes
- Keep this list updated as we add new features
- Search for "openemr_" in codebase before production
- Consider creating SQL migration scripts
