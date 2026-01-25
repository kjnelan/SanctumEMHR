export function DangerButton({ children, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
