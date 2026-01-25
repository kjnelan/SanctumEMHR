/**
 * Modal Component
 * Reusable modal with consistent styling, header, body, and footer
 */
import { createPortal } from 'react-dom';

const sizeClasses = {
  sm: 'modal-sm',
  md: 'modal-md',
  lg: 'modal-lg',
};

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  showCloseButton = true,
}) {
  if (!isOpen) return null;

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-container ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Modal Footer - for action buttons
 * Place inside Modal children, at the end
 */
export function ModalFooter({ children }) {
  return (
    <div className="modal-footer">
      {children}
    </div>
  );
}

// Attach Footer as a subcomponent for convenience
Modal.Footer = ModalFooter;
