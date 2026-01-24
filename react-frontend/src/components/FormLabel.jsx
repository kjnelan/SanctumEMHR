/**
 * FormLabel Component
 * Reusable label component with consistent styling
 */
export function FormLabel({ children, htmlFor, className = "", ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-gray-700 font-semibold mb-2 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
