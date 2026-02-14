import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, CheckCircle, AlertCircle } from 'lucide-react';

const WeightInput = ({
  value,
  onChange,
  onBlur,
  error = false,
  disabled = false,
  autoFocus = false,
  className = ''
}) => {
  const { t } = useTranslation();
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      setDisplayValue(value.toString());
    } else {
      setDisplayValue('');
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // Allow only numbers and decimal point
    const sanitizedValue = newValue.replace(/[^0-9.]/g, '');
    setDisplayValue(sanitizedValue);
    
    // Validate
    const numValue = parseFloat(sanitizedValue);
    if (!isNaN(numValue)) {
      setIsValid(null);
      return;
    }

    // Check if weight is reasonable (0.1kg to 500kg)
    if (numValue < 0.1 || numValue > 500) {
      setIsValid(false);
    } else {
      setIsValid(true);
    }

    onChange(numValue);
  };

  const handleBlur = () => {
    const numValue = parseFloat(displayValue);
    
    // Format to 2 decimal places
    if (!isNaN(numValue) && numValue > 0) {
      const formattedValue = numValue.toFixed(2);
      setDisplayValue(formattedValue);
      onChange(parseFloat(formattedValue));
    }
    
    onBlur?.();
  };

  const handleKeyDown = (e) => {
    // Enter key triggers blur/save
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="0.00"
          step="0.01"
          min="0.1"
          max="500"
          className={`
            w-full px-4 py-2.5 pr-10 border-2 rounded-lg font-mono text-lg
            focus:outline-none transition-all duration-200
            ${error 
              ? 'border-accent-crimson focus:border-accent-crimson focus:ring-2 focus:ring-accent-crimson/20' 
              : isValid === true 
                ? 'border-accent-emerald focus:border-accent-emerald focus:ring-2 focus:ring-accent-emerald/20' 
                : 'border-warm-taupe focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed bg-warm-sand' : ''}
          `}
          aria-invalid={error ? 'true' : 'false'}
        />
        
        {/* Validation Icon */}
        {!disabled && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid === true && (
              <CheckCircle size={20} className="text-accent-emerald" />
            )}
            {isValid === false && (
              <AlertCircle size={20} className="text-accent-crimson" />
            )}
          </div>
        )}

        {/* Scale Icon */}
        <Scale size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-brown pointer-events-none" />
      </div>

      {/* Error Message */}
      {error && (
        <p className="form-error mt-1" role="alert">
          {error}
        </p>
      )}

      {/* Helper Text */}
      {!error && isValid === false && (
        <p className="form-helper mt-1">
          Weight must be between 0.1kg and 500kg
        </p>
      )}
    </div>
  );
};

export default WeightInput;
