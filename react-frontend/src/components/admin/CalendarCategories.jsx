/**
 * Mindline EMHR
 * Calendar Categories Management
 * Admin interface for managing appointment categories/types
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import ReferenceListManager from './ReferenceListManager';

function CalendarCategories() {
  return (
    <ReferenceListManager
      listType="calendar-category"
      title="Calendar Categories"
      description="Manage appointment types and categories (Individual Session, Group Therapy, Intake, etc.)"
      apiEndpoint="/custom/api/reference_lists.php"
    />
  );
}

export default CalendarCategories;
