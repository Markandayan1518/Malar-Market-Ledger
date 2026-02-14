import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parse, isValid } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef(null);

  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;
  const displayDate = selectedDate && isValid(selectedDate) 
    ? format(selectedDate, 'dd MMM yyyy', { locale: i18n.language === 'ta' ? 'ta-IN' : 'en-IN' })
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
  const monthName = format(currentMonth, 'MMMM yyyy', { locale: i18n.language === 'ta' ? 'ta-IN' : 'en-IN' });
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

    days.push(
      <button
        key={day}
        type="button"
        onClick={() => handleDateClick(day)}
        disabled={isDisabled}
        className={`
          p-2 rounded-lg text-sm font-medium transition-all duration-150
          ${isSelected 
            ? 'bg-accent-magenta text-white shadow-md' 
            : isToday
              ? 'bg-accent-emerald text-white'
              : 'hover:bg-warm-sand text-warm-charcoal'
          }
          ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        `}
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

  return (
    <div className="w-full" ref={pickerRef}>
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
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-invalid={error ? 'true' : 'false'}
        >
          <span className={displayDate ? 'text-warm-charcoal' : 'text-warm-brown/60'}>
            {displayDate || t('common.select')}
          </span>
          <Calendar size={20} className="text-warm-brown flex-shrink-0" />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-72 mt-1 bg-white rounded-xl shadow-strong border-2 border-warm-taupe overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-warm-sand bg-warm-sand/30">
              <button
                type="button"
                onClick={handlePreviousMonth}
                className="p-1 hover:bg-warm-sand rounded transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-semibold text-warm-charcoal font-display">
                {monthName}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-warm-sand rounded transition-colors"
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
                  <div key={index} className="text-center text-xs font-semibold text-warm-brown uppercase">
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
            <div className="px-4 py-2 border-t border-warm-sand bg-warm-sand/30">
              <button
                type="button"
                onClick={handleTodayClick}
                className="w-full py-2 text-sm font-semibold text-accent-magenta hover:bg-warm-sand rounded-lg transition-colors"
              >
                {t('common.today')}
              </button>
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

export default DatePicker;
