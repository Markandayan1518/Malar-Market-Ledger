import Modal from './Modal';
import Button from '../forms/Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center gap-4 py-2">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          <AlertTriangle 
            size={32} 
            className={variant === 'danger' ? 'text-red-600' : 'text-amber-600'} 
          />
        </div>

        {/* Message */}
        <p className="text-center text-warm-charcoal text-base">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
