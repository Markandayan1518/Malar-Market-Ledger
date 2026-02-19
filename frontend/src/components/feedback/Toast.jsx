import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Arctic Frost Theme - Toast Notification Component
 * 
 * Features:
 * - Slide-in animation from right
 * - Arctic color variants (aurora-green, frostbite-red, gold-ice, glacier-blue)
 * - Progress bar for auto-dismiss
 * - Frosted glass effect
 * - Smooth exit animation
 */
const Toast = () => {
  const { t } = useTranslation();
  const { notifications, removeNotification } = useNotification();
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  const handleRemove = (id) => {
    // First mark as exiting (triggers exit animation)
    setVisibleNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, exiting: true } : n)
    );
    // Then remove after animation completes
    setTimeout(() => removeNotification(id), 200);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-aurora-600" />;
      case 'error':
        return <XCircle size={20} className="text-frostbite-600" />;
      case 'warning':
        return <AlertCircle size={20} className="text-gold-600" />;
      case 'info':
      default:
        return <Info size={20} className="text-glacier-600" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-aurora-50/90',
          border: 'border-aurora-200',
          accent: 'bg-aurora-500'
        };
      case 'error':
        return {
          bg: 'bg-frostbite-50/90',
          border: 'border-frostbite-200',
          accent: 'bg-frostbite-500'
        };
      case 'warning':
        return {
          bg: 'bg-gold-50/90',
          border: 'border-gold-200',
          accent: 'bg-gold-500'
        };
      case 'info':
      default:
        return {
          bg: 'bg-glacier-50/90',
          border: 'border-glacier-200',
          accent: 'bg-glacier-500'
        };
    }
  };

  return (
    <div 
      className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {visibleNotifications.map((notification) => {
        const styles = getStyles(notification.type);
        const isExiting = notification.exiting;
        
        return (
          <div
            key={notification.id}
            className={`
              pointer-events-auto
              max-w-md w-full
              rounded-arctic
              border
              shadow-arctic-lg
              overflow-hidden
              transition-all duration-200 ease-out
              ${isExiting 
                ? 'opacity-0 translate-x-4' 
                : 'opacity-100 translate-x-0 animate-slide-in-right'
              }
              ${styles.bg}
              ${styles.border}
            `}
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
            role="alert"
          >
            {/* Progress bar for auto-dismiss */}
            {notification.duration && (
              <div className="h-1 bg-black/5">
                <div 
                  className={`h-full ${styles.accent} animate-shrink`}
                  style={{
                    animationDuration: `${notification.duration}ms`,
                    animationTimingFunction: 'linear'
                  }}
                />
              </div>
            )}
            
            <div className="p-4 flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {notification.title && (
                  <h4 className="font-semibold text-slate-charcoal mb-1 font-display">
                    {notification.title}
                  </h4>
                )}
                {notification.message && (
                  <p className="text-sm text-slate-deep">
                    {notification.message}
                  </p>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => handleRemove(notification.id)}
                className="
                  flex-shrink-0 p-1.5 
                  text-slate-cool hover:text-slate-charcoal
                  hover:bg-black/5 
                  rounded-arctic-sm
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-glacier-500
                "
                aria-label={t('common.close')}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// CSS Animations (add to index.css or animations.css)
const styles = `
  @keyframes slide-in-right {
    from {
      opacity: 0;
      transform: translateX(1rem);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
  
  .animate-slide-in-right {
    animation: slide-in-right 0.2s ease-out;
  }
  
  .animate-shrink {
    animation: shrink linear forwards;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('toast-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'toast-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default Toast;
