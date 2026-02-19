import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Arctic Frost Theme - Modal Component
 * 
 * Features:
 * - Frosted glass backdrop with blur effect
 * - Smooth entrance/exit animations
 * - Arctic color palette
 * - Accessible focus management
 * - Responsive sizing
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = ''
}) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to trigger entrance animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      // Wait for exit animation before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen, isAnimating]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  };

  if (!shouldRender) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Frosted Glass Backdrop */}
      <div
        className={`
          absolute inset-0
          transition-opacity duration-200
          ${isAnimating ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size]}
          transition-all duration-200 ease-out
          ${isAnimating 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
          }
          ${className}
        `}
      >
        {/* Modal Content Card */}
        <div 
          className="
            relative overflow-hidden
            bg-arctic-ice/95 
            border border-ice-border
            rounded-arctic-lg
            shadow-arctic-lg
          "
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="
              flex items-center justify-between 
              px-6 py-4 
              border-b border-ice-border
              bg-arctic-snow/50
            ">
              {title && (
                <h3 
                  id="modal-title" 
                  className="text-lg font-semibold text-slate-charcoal font-display tracking-tight"
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="
                    p-2 -mr-2
                    text-slate-cool hover:text-slate-charcoal
                    hover:bg-arctic-frost
                    rounded-arctic
                    transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-glacier-500 focus:ring-offset-2 focus:ring-offset-arctic-ice
                  "
                  aria-label={t('common.close')}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
