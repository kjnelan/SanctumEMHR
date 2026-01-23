# Reference Lists Feature - Database Setup

## Overview
The Reference Lists feature provides a centralized, admin-manageable system for all clinical and demographic lookup lists used throughout Mindline EMHR.

## Installation

### Step 1: Run the Migration
Execute the SQL migration file to create the `reference_lists` table:

```bash
mysql -u [username] -p [database_name] < create_reference_lists_table.sql
```

Or using phpMyAdmin/MySQL Workbench:
1. Open the database
2. Import `create_reference_lists_table.sql`
3. Execute the script

### Step 2: Verify Installation
Check that the table was created and populated:

```sql
SELECT list_type, COUNT(*) as count
FROM reference_lists
GROUP BY list_type
ORDER BY list_type;
```

You should see entries for:
- `calendar-category` (12 items)
- `client-status` (5 items)
- `discharge-reason` (9 items)
- `ethnicity` (10 items)
- `gender-identity` (11 items)
- `insurance-type` (9 items)
- `marital-status` (7 items)
- `pronouns` (8 items)
- `referral-source` (14 items)
- `sexual-orientation` (10 items)
- `treatment-modality` (14 items)

**Total: 109 default reference items**

## API Endpoint
**Location:** `/custom/api/reference_lists.php`

**Authentication:** Requires admin permissions

**Methods:**
- `GET ?type=sexual-orientation` - Fetch all items for a list type
- `POST` - Create new item
- `PUT` - Update existing item
- `DELETE ?type=sexual-orientation&id=123` - Delete item

## Frontend Components
- `ReferenceListManager.jsx` - Reusable CRUD component
- `ReferenceLists.jsx` - Tabbed interface for all list types
- `CalendarCategories.jsx` - Calendar category management

## Supported List Types
1. `sexual-orientation` - Sexual Orientation options
2. `gender-identity` - Gender Identity options
3. `pronouns` - Pronoun preferences
4. `marital-status` - Marital status options
5. `client-status` - Client status (Active, Discharged, etc.)
6. `ethnicity` - Ethnicity/Race options
7. `insurance-type` - Insurance type categories
8. `referral-source` - Referral source tracking
9. `treatment-modality` - Treatment modalities (CBT, DBT, etc.)
10. `discharge-reason` - Discharge reason codes
11. `calendar-category` - Appointment/calendar categories

## Adding New List Types
To add a new list type:

1. Add the type identifier to `$validTypes` array in `/custom/api/reference_lists.php`
2. Add a new tab in `/react-frontend/src/components/admin/ReferenceLists.jsx`
3. Optionally, insert default values in the migration SQL

## Database Schema

```sql
CREATE TABLE reference_lists (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  list_type VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT(11) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_type_name (list_type, name)
);
```

## Features
- ✅ Admin-only access control
- ✅ Active/inactive toggle per item
- ✅ Sortable items within each list
- ✅ Optional descriptions
- ✅ Duplicate name prevention
- ✅ Consistent UI across all list types
- ✅ Beautiful glassmorphism styling

## Next Steps
After installation, admins can:
1. Navigate to **Admin Settings** → **Clinical Data** → **Reference Lists**
2. Select a list type from the tabs
3. Add, edit, or deactivate items as needed
4. Reorder items using the sort_order field

## Author
Kenneth J. Nelan
© 2026 Sacred Wandering
