import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { ChevronDown, Search, X, Check } from 'lucide-react';

/**
 * Select Component - Arctic Frost Design
 * 
 * Features:
 * - Theme-aware styling (arctic/warm)
 * - Searchable dropdown option
 * - Option hover states
 * - Selected indicator with checkmark
 * - Clear button
 */
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
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);

  const isArctic = theme === 'arctic';

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

  // Arctic styles
  const arcticButtonStyles = `
    w-full px-4 py-3 bg-arctic-ice border rounded-arctic
    transition-all duration-200 text-left flex items-center justify-between
    focus:outline-none focus:ring-2
    ${error
      ? 'border-frostbite focus:border-frostbite focus:ring-frostbite/20'
      : 'border-ice-border focus:border-glacier-500 focus:ring-glacier-100'
    }
    ${disabled
      ? 'opacity-60 cursor-not-allowed bg-arctic-frost'
      : 'hover:border-glacier-400 cursor-pointer'
    }
  `;

  const warmButtonStyles = `
    w-full px-4 py-2.5 bg-white border-2 border-warm-taupe rounded-lg
    transition-all duration-200 text-left flex items-center justify-between
    focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20
    ${disabled
      ? 'opacity-60 cursor-not-allowed bg-warm-sand'
      : 'hover:border-warm-brown cursor-pointer'
    }
    ${error ? 'border-accent-crimson focus:border-accent-crimson focus:ring-accent-crimson/20' : ''}
  `;

  const buttonStyles = isArctic ? arcticButtonStyles : warmButtonStyles;

  // Dropdown styles
  const arcticDropdownStyles = `
    absolute z-50 w-full mt-1
    bg-arctic-ice rounded-arctic-lg shadow-frost-lg
    border border-ice-border overflow-hidden
    animate-fade-in-up
  `;

  const warmDropdownStyles = `
    absolute z-50 w-full mt-1
    bg-white rounded-lg shadow-strong
    border-2 border-warm-taupe overflow-hidden
  `;

  const dropdownStyles = isArctic ? arcticDropdownStyles : warmDropdownStyles;

  // Label styles
  const labelStyles = isArctic
    ? 'block text-sm font-semibold text-slate-charcoal mb-1.5'
    : 'block text-sm font-semibold text-warm-charcoal mb-1.5';

  // Error/helper styles
  const errorStyles = isArctic
    ? 'mt-1.5 text-xs text-frostbite font-medium flex items-center gap-1'
    : 'mt-1.5 text-xs text-accent-crimson font-medium';

  const helperStyles = isArctic
    ? 'mt-1.5 text-xs text-slate-cool'
    : 'mt-1.5 text-xs text-warm-brown';

  return (
    <div className="w-full" ref={selectRef}>
      {label && (
        <label className={labelStyles}>
          {label}
          {required && <span className={`${isArctic ? 'text-frostbite' : 'text-accent-crimson'} ml-1`}>*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`${buttonStyles} ${className}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={error ? 'true' : 'false'}
        >
          <span className={
            selectedOption
              ? isArctic ? 'text-slate-charcoal' : 'text-warm-charcoal'
              : isArctic ? 'text-slate-mist' : 'text-warm-brown/60'
          }>
            {selectedOption ? selectedOption.label : placeholder || t('common.select')}
          </span>

          <div className="flex items-center gap-2">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className={`p-1 rounded transition-colors ${
                  isArctic ? 'hover:bg-arctic-frost' : 'hover:bg-warm-sand'
                }`}
                aria-label="Clear selection"
              >
                <X size={16} />
              </button>
            )}
            <ChevronDown
              size={20}
              className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
                isArctic ? 'text-slate-cool' : 'text-warm-brown'
              }`}
            />
          </div>
        </button>

        {isOpen && (
          <div className={dropdownStyles}>
            {searchable && (
              <div className={`p-2 ${isArctic ? 'border-b border-ice-border' : 'border-b border-warm-sand'}`}>
                <div className="relative">
                  <Search
                    size={16}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isArctic ? 'text-slate-mist' : 'text-warm-brown'
                    }`}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('common.search')}
                    className={`
                      w-full pl-9 pr-3 py-2 rounded-arctic text-sm
                      focus:outline-none focus:ring-2
                      ${isArctic
                        ? 'bg-arctic-frost border border-ice-border focus:border-glacier-500 focus:ring-glacier-100'
                        : 'border border-warm-taupe focus:border-accent-magenta focus:ring-accent-magenta/20'
                      }
                    `}
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                <ul role="listbox" className="py-1">
                  {filteredOptions.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <li
                        key={option.value}
                        onClick={() => handleSelect(option)}
                        className={`
                          px-4 py-2.5 cursor-pointer transition-all duration-150
                          flex items-center justify-between
                          ${isArctic
                            ? isSelected
                              ? 'bg-glacier-500 text-white'
                              : 'text-slate-charcoal hover:bg-arctic-frost'
                            : isSelected
                              ? 'bg-accent-magenta text-white font-medium'
                              : 'text-warm-charcoal hover:bg-warm-sand'
                          }
                        `}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span>{option.label}</span>
                        {isSelected && (
                          <Check size={16} className={isArctic ? 'text-white' : 'text-white'} />
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className={`px-4 py-8 text-center text-sm ${
                  isArctic ? 'text-slate-cool' : 'text-warm-brown'
                }`}>
                  {t('farmers.noResults')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className={errorStyles} role="alert">
          {error}
        </p>
      )}

      {helper && !error && (
        <p className={helperStyles}>
          {helper}
        </p>
      )}
    </div>
  );
};

export default Select;
