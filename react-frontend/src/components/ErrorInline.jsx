export function ErrorInline({ children, className = '' }) {
  return (
    <div className={`text-red-600 text-sm ${className}`}>
      {children}
    </div>
  );
}
