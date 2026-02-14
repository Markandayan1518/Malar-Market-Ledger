import { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = () => {
  const { notifications, removeNotification } = useNotification();
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  const handleRemove = (id) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
    setTimeout(() => removeNotification(id), 300);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-emerald-600" />;
      case 'error':
        return <XCircle size={20} className="text-red-600" />;
      case 'warning':
        return <AlertCircle size={20} className="text-amber-600" />;
      case 'info':
      default:
        return <Info size={20} className="text-blue-600" />;
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            toast-enter pointer-events-auto
            max-w-md w-full bg-white rounded-lg shadow-strong border-2
            ${getBackgroundColor(notification.type)}
            p-4 flex items-start gap-3
          `}
          role="alert"
          aria-live="polite"
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            {notification.title && (
              <h4 className="font-semibold text-warm-charcoal mb-1">
                {notification.title}
              </h4>
            )}
            {notification.message && (
              <p className="text-sm text-warm-brown">
                {notification.message}
              </p>
            )}
          </div>

          <button
            onClick={() => handleRemove(notification.id)}
            className="flex-shrink-0 p-1 hover:bg-warm-sand rounded transition-colors"
            aria-label="Close notification"
          >
            <X size={16} className="text-warm-brown" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
