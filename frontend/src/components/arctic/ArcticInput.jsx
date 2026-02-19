import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Search, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * ArcticInput - Input component for Arctic Frost theme
 * 
 * Types: text, number, search, password, email
 * 
 * Features:
 * - Floating label option
 * - Validation states (error, success, warning)
 * - Focus ring animation
 * - Icon prefix/suffix support
 */
const ArcticInput = forwardRef(({
  type = 'text',
  label,
  placeholder,
  floatingLabel = false,
  error,
  success,
  warning,
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  required = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Base input styles
  const baseInputStyles = `
    w-full px-4 py-3
    bg-arctic-ice border rounded-arctic
    font-body text-slate-deep
    placeholder:text-slate-mist placeholder:text-sm
    transition-all duration-200
    focus:outline-none focus:border-glacier-500 focus:ring-2 focus:ring-glacier-100
    disabled:bg-arctic-frost disabled:cursor-not-allowed disabled:text-slate-cool
  `;

  // Validation state styles
  const validationStyles = error
    ? 'border-frostbite focus:border-frostbite focus:ring-frostbite/20'
    : success
    ? 'border-aurora focus:border-aurora focus:ring-aurora/20'
    : warning
    ? 'border-gold focus:border-gold focus:ring-gold/20'
    : 'border-ice-border';

  // Icon padding adjustments
  const iconPadding = Icon
    ? iconPosition === 'left'
      ? 'pl-11'
      : 'pr-11'
    : '';

  // Password toggle padding
  const passwordPadding = type === 'password' ? 'pr-11' : '';

  const renderIcon = () => {
    if (!Icon) return null;
    return (
      <div className={`
        absolute top-1/2 -translate-y-1/2
        text-slate-cool
        ${iconPosition === 'left' ? 'left-4' : 'right-4'}
        ${isFocused ? 'text-glacier-500' : ''}
      `}>
        <Icon className="w-5 h-5" />
      </div>
    );
  };

  const renderPasswordToggle = () => {
    if (type !== 'password') return null;
    return (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-cool hover:text-slate-deep transition-colors"
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    );
  };

  const renderValidationIcon = () => {
    if (error) {
      return (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-frostbite">
          <AlertCircle className="w-5 h-5" />
        </div>
      );
    }
    if (success) {
      return (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-aurora">
          <CheckCircle className="w-5 h-5" />
        </div>
      );
    }
    return null;
  };

  // Floating label component
  const renderFloatingLabel = () => {
    if (!floatingLabel || !label) return null;
    return (
      <label className={`
        absolute left-4 transition-all duration-200 pointer-events-none
        ${isFocused || props.value
          ? '-top-2 text-xs bg-arctic-ice px-1 text-glacier-500'
          : 'top-1/2 -translate-y-1/2 text-slate-mist'
        }
      `}>
        {label}{required && <span className="text-frostbite ml-1">*</span>}
      </label>
    );
  };

  // Regular label
  const renderLabel = () => {
    if (floatingLabel || !label) return null;
    return (
      <label className="block text-sm font-semibold text-slate-deep mb-1.5">
        {label}{required && <span className="text-frostbite ml-1">*</span>}
      </label>
    );
  };

  // Helper/error text
  const renderHelperText = () => {
    if (error) {
      return (
        <p className="mt-1 text-xs text-frostbite font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      );
    }
    if (success && typeof success === 'string') {
      return (
        <p className="mt-1 text-xs text-aurora font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {success}
        </p>
      );
    }
    return null;
  };

  return (
    <div className={`${containerClassName}`}>
      {renderLabel()}
      <div className="relative">
        {renderIcon()}
        <input
          ref={ref}
          type={inputType}
          placeholder={floatingLabel ? ' ' : placeholder}
          disabled={disabled}
          required={required}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            ${baseInputStyles}
            ${validationStyles}
            ${iconPadding}
            ${passwordPadding}
            ${(error || success) && !Icon && type !== 'password' ? 'pr-11' : ''}
            ${className}
          `.replace(/\s+/g, ' ').trim()}
          {...props}
        />
        {renderFloatingLabel()}
        {renderPasswordToggle()}
        {renderValidationIcon()}
        {type === 'search' && !Icon && (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-mist" />
        )}
      </div>
      {renderHelperText()}
    </div>
  );
});

ArcticInput.displayName = 'ArcticInput';

export default ArcticInput;
