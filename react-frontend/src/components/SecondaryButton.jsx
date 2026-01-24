export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={
        `px-4 py-2 border border-gray-300 rounded-lg 
         hover:bg-gray-50 transition-colors ${className}`
      }
      {...props}
    >
      {children}
    </button>
  );
}

