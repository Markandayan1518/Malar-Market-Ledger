import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle } from 'lucide-react';

const Input = forwardRef(({
  label,
  error,
  success,
  helper,
  required,
  disabled,
  className = '',
  ...props
}, ref) => {
  const { t } = useTranslation();

  const inputClasses = `
    input-field
    ${error ? 'input-error' : ''}
    ${success ? 'input-success' : ''}
    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="w-full">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-accent-crimson ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined}
          className={inputClasses}
          {...props}
        />
        
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-crimson">
            <AlertCircle size={18} />
          </div>
        )}
        
        {success && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-emerald">
            <CheckCircle size={18} />
          </div>
        )}
      </div>

      {error && (
        <p id={`${props.id}-error`} className="form-error" role="alert">
          {error}
        </p>
      )}

      {helper && !error && (
        <p id={`${props.id}-helper`} className="form-helper">
          {helper}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
