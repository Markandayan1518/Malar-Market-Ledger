import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, IndianRupee } from 'lucide-react';

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
  className = '',
  ...props
}, ref) => {
  const { t } = useTranslation();
  const [displayValue, setDisplayValue] = useState('');

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
    if (props.value !== undefined && props.value !== null && props.value !== '') {
      setDisplayValue(props.value.toString());
    }
  };

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
        {showCurrency && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-brown pointer-events-none">
            <span className="text-lg font-semibold">₹</span>
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
          className={`${inputClasses} ${showCurrency ? 'pl-8' : ''}`}
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

NumberInput.displayName = 'NumberInput';

export default NumberInput;
