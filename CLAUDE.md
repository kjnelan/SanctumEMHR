# SanctumEMHR - Claude Code Guidelines

## Project Overview
SanctumEMHR is a healthcare EMR (Electronic Medical Records) frontend application built with React and Tailwind CSS.

## Component Architecture & Design System

### Shared UI Components
Always use these shared components instead of creating inline alternatives:

- **Modal** (with `Modal.Header`, `Modal.Body`, `Modal.Footer`) - for all modal dialogs
- **PrimaryButton**, **SecondaryButton**, **DangerButton** - for all buttons
- **ErrorMessage**, **ErrorInline** - for error display
- **RequiredAsterisk** - for required field indicators

### Modal Rules
- Replace any inline modals or `createPortal` modals with the shared `Modal` component
- Exception: Portals used for dropdown positioning (e.g., `ICD10Picker`) are acceptable
- Use the compound component pattern: `Modal.Header`, `Modal.Body`, `Modal.Footer`

### Button Rules
- Never create inline button styles
- Use `PrimaryButton` for primary actions
- Use `SecondaryButton` for cancel/secondary actions
- Use `DangerButton` for destructive actions (delete, remove)

### Error Handling Rules
- Use `ErrorMessage` for block-level errors
- Use `ErrorInline` for inline/field-level errors
- Never create custom error styling

## Code Quality Standards

### Reduce Duplication
- Remove repeated CSS patterns
- Remove repeated modal markup
- Remove repeated button markup
- Consolidate repeated logic into shared components

### Maintain Consistency
- Follow existing Tailwind patterns in the repo
- Use standardized component structure
- Follow consistent naming conventions

### Improve Clarity
- Prefer small, focused components
- Prefer readable, predictable JSX
- Reduce line count where possible without sacrificing readability

## Refactoring Guidelines

### Before Large Changes
1. Summarize what you plan to refactor
2. Confirm alignment with existing Sanctum architecture

### During Refactoring
- Preserve functionality
- Preserve behavior
- Preserve accessibility
- Reduce line count where possible

### Never Do
- Introduce new styling systems
- Create new modal patterns
- Create new button variants
- Add unnecessary abstractions

## File Locations
- Shared components: `src/components/shared/`
- Feature components: `src/components/[feature]/`

## Tech Stack
- React (with hooks)
- Tailwind CSS for styling
- PHP backend API
