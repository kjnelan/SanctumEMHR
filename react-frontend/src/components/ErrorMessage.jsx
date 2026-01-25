export function ErrorMessage({ children, className = '' }) {
  return (
    <div
      className={`p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm ${className}`}
    >
      {children}
    </div>
  );
}
