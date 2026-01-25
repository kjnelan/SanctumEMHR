/**
 * SectionHeader Component
 * Reusable section header with color variants
 */

const colorClasses = {
  gray: 'text-gray-800',
  indigo: 'text-indigo-700',
  teal: 'text-teal-700',
  blue: 'text-blue-700',
  emerald: 'text-emerald-700',
  green: 'text-green-700',
  orange: 'text-orange-700',
  red: 'text-red-700',
  purple: 'text-purple-700',
};

export function SectionHeader({ children, color = 'gray', className = '', ...props }) {
  const colorClass = colorClasses[color] || colorClasses.gray;

  return (
    <h3
      className={`text-lg font-semibold ${colorClass} mb-4 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}
