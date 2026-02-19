import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { AlertCircle, CheckCircle, Minus, Plus } from 'lucide-react';

/**
 * NumberInput Component - Arctic Frost Design
 * 
 * Features:
 * - Theme-aware styling (arctic/warm)
 * - Mono font for numbers
 * - Currency prefix option
 * - Increment/decrement buttons
 * - Validation states
 */
const NumberInput = forwardRef(({
  label,
  error,
  success,
  helper,
  required,
  disabled,
  min,
  max,
  step = '0.01',
  precision = 2,
  showCurrency = false,
  showStepper = false,
  className = '',
  ...props
}, ref) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const isArctic = theme === 'arctic';

  const formatNumber = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toFixed(precision);
  };

  const parseNumber = (str) => {
    if (!str) return '';
    const num = parseFloat(str.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? '' : num;
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setDisplayValue(value);

    const numValue = parseNumber(value);
    if (numValue !== '') {
      props.onChange(numValue);
    } else {
      props.onChange('');
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = parseNumber(displayValue);
    if (numValue !== '') {
      let finalValue = numValue;
      if (min !== undefined && finalValue < min) finalValue = min;
      if (max !== undefined && finalValue > max) finalValue = max;
      props.onChange(finalValue);
      setDisplayValue(formatNumber(finalValue));
    } else {
      setDisplayValue('');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (props.value !== undefined && props.value !== null && props.value !== '') {
      setDisplayValue(props.value.toString());
    }
  };

  const handleIncrement = () => {
    const currentValue = parseNumber(displayValue) || 0;
    const stepValue = parseFloat(step) || 1;
    let newValue = currentValue + stepValue;
    if (max !== undefined && newValue > max) newValue = max;
    props.onChange(newValue);
    setDisplayValue(formatNumber(newValue));
  };

  const handleDecrement = () => {
    const currentValue = parseNumber(displayValue) || 0;
    const stepValue = parseFloat(step) || 1;
    let newValue = currentValue - stepValue;
    if (min !== undefined && newValue < min) newValue = min;
    props.onChange(newValue);
    setDisplayValue(formatNumber(newValue));
  };

  // Arctic input styles
  const arcticBaseStyles = `
    w-full py-3
    bg-arctic-ice border rounded-arctic
    font-mono text-slate-deep text-right
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
    w-full py-2.5
    bg-white border-2 rounded-lg
    font-mono text-warm-charcoal text-right
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

  // Padding based on addons
  const paddingStyles = `
    ${showCurrency ? (isArctic ? 'pl-10' : 'pl-9') : (isArctic ? 'px-4' : 'px-4')}
    ${showStepper ? (isArctic ? 'pr-24' : 'pr-24') : (error || success) ? (isArctic ? 'pr-11' : 'pr-11') : (isArctic ? 'px-4' : 'px-4')}
  `;

  const inputClasses = `
    ${baseStyles}
    ${stateStyles}
    ${paddingStyles}
    ${disabled ? 'opacity-60' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Label styles
  const labelStyles = isArctic
    ? 'block text-sm font-semibold text-slate-charcoal mb-1.5'
    : 'block text-sm font-semibold text-warm-charcoal mb-1.5';

  // Error/helper styles
  const errorStyles = isArctic
    ? 'mt-1.5 text-xs text-frostbite font-medium flex items-center gap-1'
    : 'mt-1.5 text-xs text-accent-crimson font-medium flex items-center gap-1';

  const helperStyles = isArctic
    ? 'mt-1.5 text-xs text-slate-cool'
    : 'mt-1.5 text-xs text-warm-brown';

  // Stepper button styles
  const stepperButtonStyles = isArctic
    ? 'p-1.5 bg-arctic-frost hover:bg-glacier-100 text-slate-cool hover:text-glacier-600 transition-colors rounded-arctic disabled:opacity-50'
    : 'p-1.5 bg-warm-sand hover:bg-warm-taupe/30 text-warm-brown transition-colors rounded disabled:opacity-50';

  return (
    <div className="w-full">
      {label && (
        <label className={labelStyles}>
          {label}
          {required && <span className={`${isArctic ? 'text-frostbite' : 'text-accent-crimson'} ml-1`}>*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Currency prefix */}
        {showCurrency && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
            isArctic ? 'text-slate-cool' : 'text-warm-brown'
          }`}>
            <span className="text-lg font-semibold font-mono">₹</span>
          </div>
        )}

        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined}
          className={inputClasses}
          {...props}
        />

        {/* Stepper buttons */}
        {showStepper && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={disabled || (min !== undefined && parseNumber(displayValue) <= min)}
              className={stepperButtonStyles}
              aria-label="Decrease"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={disabled || (max !== undefined && parseNumber(displayValue) >= max)}
              className={stepperButtonStyles}
              aria-label="Increase"
            >
              <Plus size={14} />
            </button>
          </div>
        )}

        {/* Validation icons (only if no stepper) */}
        {!showStepper && error && (
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${isArctic ? 'text-frostbite' : 'text-accent-crimson'}`}>
            <AlertCircle size={18} />
          </div>
        )}

        {!showStepper && success && !error && (
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${isArctic ? 'text-aurora' : 'text-accent-emerald'}`}>
            <CheckCircle size={18} />
          </div>
        )}
      </div>

      {error && (
        <p id={`${props.id}-error`} className={errorStyles} role="alert">
          <AlertCircle size={14} />
          {error}
        </p>
      )}

      {helper && !error && (
        <p id={`${props.id}-helper`} className={helperStyles}>
          {helper}
        </p>
      )}
    </div>
  );
});

NumberInput.displayName = 'NumberInput';

export default NumberInput;
