/**
 * Checkbox Component
 * Reusable checkbox with consistent styling and label
 */
export function Checkbox({
  checked,
  onChange,
  label,
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <label className={`flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mr-2 checkbox"
        {...props}
      />
      <span className="checkbox-label">{label}</span>
    </label>
  );
}
