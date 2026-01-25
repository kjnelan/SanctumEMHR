export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={
        `px-4 py-2 bg-blue-600 text-white font-medium rounded-lg
         hover:bg-blue-700 transition-colors disabled:opacity-50 ${className}`
      }
      {...props}
    >
      {children}
    </button>
  );
}
