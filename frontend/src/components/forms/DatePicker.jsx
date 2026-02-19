import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { format, parse, isValid } from 'date-fns';
import { ta, enIN } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * DatePicker Component - Arctic Frost Design
 * 
 * Features:
 * - Theme-aware styling (arctic/warm)
 * - Calendar popup with arctic theme
 * - Day/month/year selectors
 * - Selected and today date styling
 * - Today button
 */
const DatePicker = ({
  label,
  value,
  onChange,
  error,
  helper,
  required,
  disabled,
  minDate,
  maxDate,
  className = '',
  ...props
}) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef(null);

  const isArctic = theme === 'arctic';

  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;
  const displayDate = selectedDate && isValid(selectedDate)
    ? format(selectedDate, 'dd MMM yyyy', { locale: i18n.language === 'ta' ? ta : enIN })
    : '';

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek };
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (minDate && newDate < minDate) return;
    if (maxDate && newDate > maxDate) return;

    onChange(format(newDate, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleTodayClick = () => {
    const today = new Date();
    if (minDate && today < minDate) return;
    if (maxDate && today > maxDate) return;

    onChange(format(today, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { daysInMonth, startDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = format(currentMonth, 'MMMM yyyy', { locale: i18n.language === 'ta' ? ta : enIN });
  const days = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="p-2" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isSelected = selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();

    const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
    const isToday = new Date().toDateString() === date.toDateString();

    // Arctic day styles
    const arcticDayStyles = `
      p-2 rounded-arctic text-sm font-medium transition-all duration-150
      ${isSelected
        ? 'bg-glacier-500 text-white shadow-frost-sm'
        : isToday
          ? 'bg-aurora/20 text-aurora font-bold border border-aurora/30'
          : 'hover:bg-arctic-frost text-slate-charcoal'
      }
      ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
    `;

    // Warm day styles (legacy)
    const warmDayStyles = `
      p-2 rounded-lg text-sm font-medium transition-all duration-150
      ${isSelected
        ? 'bg-accent-magenta text-white shadow-md'
        : isToday
          ? 'bg-accent-emerald text-white'
          : 'hover:bg-warm-sand text-warm-charcoal'
      }
      ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
    `;

    days.push(
      <button
        key={day}
        type="button"
        onClick={() => handleDateClick(day)}
        disabled={isDisabled}
        className={isArctic ? arcticDayStyles : warmDayStyles}
      >
        {day}
      </button>
    );
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day =>
    i18n.language === 'ta'
      ? ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'சன'][['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day)]
      : day.slice(0, 3)
  );

  // Button styles
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

  // Dropdown styles
  const arcticDropdownStyles = `
    absolute z-50 w-72 mt-1
    bg-arctic-ice rounded-arctic-lg shadow-frost-lg
    border border-ice-border overflow-hidden
    animate-fade-in-up
  `;

  const warmDropdownStyles = `
    absolute z-50 w-72 mt-1
    bg-white rounded-xl shadow-strong
    border-2 border-warm-taupe overflow-hidden
  `;

  // Label styles
  const labelStyles = isArctic
    ? 'block text-sm font-semibold text-slate-charcoal mb-1.5'
    : 'block text-sm font-semibold text-warm-charcoal mb-1.5';

  // Error/helper styles
  const errorStyles = isArctic
    ? 'mt-1.5 text-xs text-frostbite font-medium'
    : 'mt-1.5 text-xs text-accent-crimson font-medium';

  const helperStyles = isArctic
    ? 'mt-1.5 text-xs text-slate-cool'
    : 'mt-1.5 text-xs text-warm-brown';

  return (
    <div className="w-full" ref={pickerRef}>
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
          className={`${isArctic ? arcticButtonStyles : warmButtonStyles} ${className}`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-invalid={error ? 'true' : 'false'}
        >
          <span className={
            displayDate
              ? isArctic ? 'text-slate-charcoal' : 'text-warm-charcoal'
              : isArctic ? 'text-slate-mist' : 'text-warm-brown/60'
          }>
            {displayDate || t('common.select')}
          </span>
          <Calendar
            size={20}
            className={`flex-shrink-0 ${isArctic ? 'text-glacier-500' : 'text-warm-brown'}`}
          />
        </button>

        {isOpen && (
          <div className={isArctic ? arcticDropdownStyles : warmDropdownStyles}>
            {/* Header */}
            <div className={`
              flex items-center justify-between px-4 py-3
              ${isArctic
                ? 'border-b border-ice-border bg-arctic-frost/50'
                : 'border-b border-warm-sand bg-warm-sand/30'
              }
            `}>
              <button
                type="button"
                onClick={handlePreviousMonth}
                className={`p-1.5 rounded-arctic transition-colors ${
                  isArctic
                    ? 'hover:bg-arctic-ice text-slate-cool hover:text-glacier-500'
                    : 'hover:bg-warm-sand'
                }`}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <span className={`font-semibold font-display ${
                isArctic ? 'text-slate-charcoal' : 'text-warm-charcoal'
              }`}>
                {monthName}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className={`p-1.5 rounded-arctic transition-colors ${
                  isArctic
                    ? 'hover:bg-arctic-ice text-slate-cool hover:text-glacier-500'
                    : 'hover:bg-warm-sand'
                }`}
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day, index) => (
                  <div
                    key={index}
                    className={`text-center text-xs font-semibold uppercase ${
                      isArctic ? 'text-slate-mist' : 'text-warm-brown'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {days}
              </div>
            </div>

            {/* Footer */}
            <div className={`
              px-4 py-2
              ${isArctic
                ? 'border-t border-ice-border bg-arctic-frost/50'
                : 'border-t border-warm-sand bg-warm-sand/30'
              }
            `}>
              <button
                type="button"
                onClick={handleTodayClick}
                className={`
                  w-full py-2 text-sm font-semibold rounded-arctic transition-colors
                  ${isArctic
                    ? 'text-glacier-500 hover:bg-arctic-ice'
                    : 'text-accent-magenta hover:bg-warm-sand rounded-lg'
                  }
                `}
              >
                {t('common.today')}
              </button>
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

export default DatePicker;
