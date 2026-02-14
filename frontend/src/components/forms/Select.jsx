import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search, X } from 'lucide-react';

const Select = ({
  label,
  options = [],
  value,
  onChange,
  placeholder,
  error,
  helper,
  required,
  disabled,
  searchable = false,
  className = '',
  ...props
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full" ref={selectRef}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-accent-crimson ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 bg-white border-2 border-warm-taupe rounded-lg
            focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20
            transition-all duration-200 text-left flex items-center justify-between
            ${disabled ? 'opacity-60 cursor-not-allowed bg-warm-sand' : 'hover:border-warm-brown cursor-pointer'}
            ${error ? 'border-accent-crimson focus:border-accent-crimson focus:ring-accent-crimson/20' : ''}
            ${className}
          `}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={error ? 'true' : 'false'}
        >
          <span className={selectedOption ? 'text-warm-charcoal' : 'text-warm-brown/60'}>
            {selectedOption ? selectedOption.label : placeholder || t('common.select')}
          </span>
          
          <div className="flex items-center gap-2">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-warm-sand rounded transition-colors"
                aria-label="Clear selection"
              >
                <X size={16} />
              </button>
            )}
            <ChevronDown size={20} className="text-warm-brown flex-shrink-0" />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-strong border-2 border-warm-taupe overflow-hidden">
            {searchable && (
              <div className="p-2 border-b border-warm-sand">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-brown" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('common.search')}
                    className="w-full pl-9 pr-3 py-2 border border-warm-taupe rounded-lg focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 text-sm"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                <ul role="listbox" className="py-1">
                  {filteredOptions.map((option) => (
                    <li
                      key={option.value}
                      onClick={() => handleSelect(option)}
                      className={`
                        px-4 py-2.5 cursor-pointer transition-colors duration-150
                        ${option.value === value 
                          ? 'bg-accent-magenta text-white font-medium' 
                          : 'text-warm-charcoal hover:bg-warm-sand'
                        }
                      `}
                      role="option"
                      aria-selected={option.value === value}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center text-warm-brown text-sm">
                  {t('farmers.noResults')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {helper && !error && (
        <p className="form-helper">
          {helper}
        </p>
      )}
    </div>
  );
};

export default Select;
