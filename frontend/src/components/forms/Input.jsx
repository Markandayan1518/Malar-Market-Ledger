import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Input Component - Arctic Frost Design
 * 
 * Features:
 * - Theme-aware styling (arctic/warm)
 * - Floating label option
 * - Validation states (error, success, warning)
 * - Focus ring animation
 * - Password visibility toggle
 */
const Input = forwardRef(({
  label,
  error,
  success,
  helper,
  required,
  disabled,
  type = 'text',
  floatingLabel = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isArctic = theme === 'arctic';
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Arctic input styles
  const arcticBaseStyles = `
    w-full px-4 py-3
    bg-arctic-ice border rounded-arctic
    font-body text-slate-deep
    placeholder:text-slate-mist placeholder:text-sm
    transition-all duration-200
    focus:outline-none focus:ring-2
    disabled:bg-arctic-frost disabled:cursor-not-allowed disabled:text-slate-cool
  `;

  const arcticStateStyles = error
    ? 'border-frostbite focus:border-frostbite focus:ring-frostbite/20'
    : success
    ? 'border-aurora focus:border-aurora focus:ring-aurora/20'
    : 'border-ice-border focus:border-glacier-500 focus:ring-glacier-100';

  // Warm input styles (legacy)
  const warmBaseStyles = `
    w-full px-4 py-3
    bg-white border-2 rounded-lg
    font-body text-warm-charcoal
    placeholder:text-warm-brown/60
    transition-all duration-200
    focus:outline-none focus:ring-2
    disabled:bg-warm-sand/30 disabled:cursor-not-allowed
  `;

  const warmStateStyles = error
    ? 'border-accent-crimson focus:border-accent-crimson focus:ring-accent-crimson/20'
    : success
    ? 'border-accent-emerald focus:border-accent-emerald focus:ring-accent-emerald/20'
    : 'border-warm-taupe focus:border-accent-magenta focus:ring-accent-magenta/20';

  const baseStyles = isArctic ? arcticBaseStyles : warmBaseStyles;
  const stateStyles = isArctic ? arcticStateStyles : warmStateStyles;

  // Password padding
  const passwordPadding = type === 'password' ? 'pr-11' : '';
  const validationPadding = (error || success) && type !== 'password' ? 'pr-11' : '';

  const inputClasses = `
    ${baseStyles}
    ${stateStyles}
    ${passwordPadding}
    ${validationPadding}
    ${disabled ? 'opacity-60' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Label styles
  const labelStyles = isArctic
    ? 'block text-sm font-semibold text-slate-charcoal mb-1.5'
    : 'block text-sm font-semibold text-warm-charcoal mb-1.5';

  // Helper/error styles
  const errorStyles = isArctic
    ? 'mt-1.5 text-xs text-frostbite font-medium flex items-center gap-1'
    : 'mt-1.5 text-xs text-accent-crimson font-medium flex items-center gap-1';

  const helperStyles = isArctic
    ? 'mt-1.5 text-xs text-slate-cool'
    : 'mt-1.5 text-xs text-warm-brown';

  // Floating label
  const renderFloatingLabel = () => {
    if (!floatingLabel || !label) return null;
    const floatingStyles = `
      absolute left-4 transition-all duration-200 pointer-events-none
      ${isFocused || props.value
        ? `-top-2 text-xs bg-arctic-ice px-1 ${isArctic ? 'text-glacier-500' : 'text-accent-magenta'}`
        : 'top-1/2 -translate-y-1/2 text-slate-mist'
      }
    `.trim().replace(/\s+/g, ' ');
    return (
      <label className={floatingStyles}>
        {label}{required && <span className="text-frostbite ml-1">*</span>}
      </label>
    );
  };

  // Regular label
  const renderLabel = () => {
    if (floatingLabel || !label) return null;
    return (
      <label className={labelStyles}>
        {label}
        {required && <span className={`${isArctic ? 'text-frostbite' : 'text-accent-crimson'} ml-1`}>*</span>}
      </label>
    );
  };

  return (
    <div className={`w-full ${containerClassName}`}>
      {renderLabel()}
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={inputClasses}
          {...props}
        />

        {/* Floating label */}
        {renderFloatingLabel()}

        {/* Password toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`
              absolute right-3 top-1/2 -translate-y-1/2
              transition-colors duration-200
              ${isArctic
                ? 'text-slate-cool hover:text-slate-charcoal'
                : 'text-warm-brown hover:text-warm-charcoal'
              }
            `.trim().replace(/\s+/g, ' ')}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {/* Validation icons */}
        {error && type !== 'password' && (
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${isArctic ? 'text-frostbite' : 'text-accent-crimson'}`}>
            <AlertCircle size={18} />
          </div>
        )}

        {success && !error && type !== 'password' && (
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${isArctic ? 'text-aurora' : 'text-accent-emerald'}`}>
            <CheckCircle size={18} />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id={`${props.id}-error`} className={errorStyles} role="alert">
          <AlertCircle size={14} />
          {error}
        </p>
      )}

      {/* Helper text */}
      {helper && !error && (
        <p id={`${props.id}-helper`} className={helperStyles}>
          {helper}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
