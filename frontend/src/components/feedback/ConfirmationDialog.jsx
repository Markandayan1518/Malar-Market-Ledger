import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Button from '../forms/Button';
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

/**
 * Arctic Frost Theme - Confirmation Dialog Component
 * 
 * Features:
 * - Arctic modal styling with frosted glass
 * - Variant-specific icons and colors
 * - Accessible focus management
 * - Responsive button layout
 */
const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
  icon: CustomIcon
}) => {
  const { t } = useTranslation();
  const confirmButtonRef = useRef(null);

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  // Default text values using translations
  const defaultConfirmText = variant === 'danger' 
    ? t('common.delete') 
    : t('common.confirm');
  const defaultCancelText = t('common.cancel');

  // Icon and color configuration based on variant
  const getVariantConfig = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-frostbite-100',
          iconColor: 'text-frostbite-600',
          iconRing: 'ring-4 ring-frostbite-50'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconBg: 'bg-gold-100',
          iconColor: 'text-gold-600',
          iconRing: 'ring-4 ring-gold-50'
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-aurora-100',
          iconColor: 'text-aurora-600',
          iconRing: 'ring-4 ring-aurora-50'
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconBg: 'bg-glacier-100',
          iconColor: 'text-glacier-600',
          iconRing: 'ring-4 ring-glacier-50'
        };
    }
  };

  const config = getVariantConfig();
  const IconComponent = CustomIcon || config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center gap-5 py-2">
        {/* Icon */}
        <div className={`
          w-16 h-16 rounded-arctic-full
          flex items-center justify-center
          ${config.iconBg} ${config.iconRing}
          transition-transform duration-200
          ${isOpen ? 'scale-100' : 'scale-90'}
        `}>
          <IconComponent 
            size={32} 
            className={config.iconColor}
          />
        </div>

        {/* Message */}
        <p className="text-center text-slate-deep text-base leading-relaxed max-w-sm">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 min-h-[44px]"
          >
            {cancelText || defaultCancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={isLoading}
            className="flex-1 min-h-[44px]"
          >
            {confirmText || defaultConfirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
