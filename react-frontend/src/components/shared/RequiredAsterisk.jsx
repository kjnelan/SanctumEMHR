import React from 'react';

/**
 * RequiredAsterisk - Displays a purple asterisk for required fields
 * Per CLAUDE.md: Use this component instead of inline asterisks
 * ADA compliant - uses purple which is distinct from green/blue for colorblind users
 */
export function RequiredAsterisk() {
  return (
    <span className="required-field-label ml-0.5" aria-hidden="true">*</span>
  );
}

export default RequiredAsterisk;
