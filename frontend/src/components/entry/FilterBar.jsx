import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { Search, RefreshCw, Download, Plus, ChevronDown, Calendar, X } from 'lucide-react';

/**
 * Filter Bar Component - Arctic Frost Design
 * 
 * Features:
 * - Theme-aware styling (arctic/warm)
 * - Search input with icon
 * - Date range picker dropdowns (From/To)
 * - Farmer filter dropdown
 * - Flower type filter dropdown
 * - New Entry button with gradient
 * - Export secondary button
 * - Responsive layout
 * - Clear filters option
 */
const FilterBar = ({
  // Date filters
  selectedDate,
  dateRange,
  onDateChange,
  onDateRangeChange,

  // Farmer filter
  farmers = [],
  selectedFarmerId,
  onFarmerChange,

  // Flower type filter
  flowerTypes = [],
  selectedFlowerTypeId,
  onFlowerTypeChange,

  // Search
  searchTerm,
  onSearchChange,
  placeholder,

  // Actions
  onRefresh,
  onExport,
  onNewEntry,
  onClearFilters,

  // Loading state
  loading = false,

  // Show date range (vs single date)
  showDateRange = true,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isArctic = theme === 'arctic';

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedFarmerId || selectedFlowerTypeId ||
    (showDateRange && (dateRange?.start || dateRange?.end));

  // Handle search input change
  const handleSearchChange = (e) => {
    onSearchChange?.(e.target.value);
  };

  // Handle date change
  const handleDateChange = (e) => {
    onDateChange?.(e.target.value);
  };

  // Handle date range start
  const handleDateRangeStart = (e) => {
    onDateRangeChange?.({
      start: e.target.value,
      end: dateRange?.end || ''
    });
  };

  // Handle date range end
  const handleDateRangeEnd = (e) => {
    onDateRangeChange?.({
      start: dateRange?.start || '',
      end: e.target.value
    });
  };

  // Handle farmer change
  const handleFarmerChange = (e) => {
    onFarmerChange?.(e.target.value);
  };

  // Handle flower type change
  const handleFlowerTypeChange = (e) => {
    onFlowerTypeChange?.(e.target.value);
  };

  // Arctic styles
  const arcticContainerStyles = `
    flex flex-wrap items-center gap-3 p-4 mb-4
    bg-arctic-ice/80 backdrop-blur-sm
    border border-ice-border rounded-arctic-lg
    shadow-frost-sm
  `;

  const warmContainerStyles = `
    flex flex-wrap items-center gap-3 p-4 mb-4
    bg-white border-2 border-warm-taupe rounded-lg shadow-sm
  `;

  const arcticInputStyles = `
    px-3 py-2 text-sm bg-arctic-frost border border-ice-border rounded-arctic
    focus:bg-arctic-ice focus:border-glacier-500 focus:ring-2 focus:ring-glacier-100 focus:outline-none
    text-slate-charcoal placeholder:text-slate-mist
    transition-all duration-150
  `;

  const warmInputStyles = `
    px-3 py-2 text-sm bg-warm-cream border-2 border-warm-taupe rounded-lg
    focus:bg-white focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 focus:outline-none
    text-warm-charcoal placeholder:text-warm-brown/60
    transition-all duration-150
  `;

  const arcticSelectStyles = `
    appearance-none px-4 py-2 pr-8 text-sm bg-arctic-frost border border-ice-border rounded-arctic
    focus:bg-arctic-ice focus:border-glacier-500 focus:ring-2 focus:ring-glacier-100 focus:outline-none
    text-slate-charcoal cursor-pointer
    transition-all duration-150
    [&>option]:bg-arctic-ice [&>option]:text-slate-charcoal
  `;

  const warmSelectStyles = `
    appearance-none px-4 py-2 pr-8 text-sm bg-warm-cream border-2 border-warm-taupe rounded-lg
    focus:bg-white focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 focus:outline-none
    text-warm-charcoal cursor-pointer
    transition-all duration-150
    [&>option]:bg-white [&>option]:text-warm-charcoal
  `;

  const arcticLabelStyles = "text-sm text-slate-cool font-medium";
  const warmLabelStyles = "text-sm text-warm-brown font-medium";

  return (
    <div
      className={isArctic ? arcticContainerStyles : warmContainerStyles}
      role="search"
      aria-label="Entry filters"
    >
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-[320px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search
            size={16}
            className={isArctic ? 'text-slate-mist' : 'text-warm-brown/60'}
            aria-hidden="true"
          />
        </div>
        <input
          type="search"
          value={searchTerm || ''}
          onChange={handleSearchChange}
          placeholder={placeholder || t('common.search')}
          className={`
            w-full pl-10 pr-4 py-2.5
            ${isArctic ? arcticInputStyles : warmInputStyles}
          `}
          aria-label={t('common.search')}
        />
      </div>

      {/* Date Picker (Single) */}
      {!showDateRange && (
        <div className="flex items-center gap-2">
          <Calendar
            size={16}
            className={isArctic ? 'text-slate-mist' : 'text-warm-brown'}
            aria-hidden="true"
          />
          <input
            type="date"
            value={selectedDate || ''}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
            className={isArctic ? arcticInputStyles : warmInputStyles}
            aria-label={t('common.date')}
          />
        </div>
      )}

      {/* Date Range - From */}
      {showDateRange && (
        <div className="flex items-center gap-2">
          <span className={isArctic ? arcticLabelStyles : warmLabelStyles}>
            {t('common.from')}:
          </span>
          <input
            type="date"
            value={dateRange?.start || ''}
            onChange={handleDateRangeStart}
            max={dateRange?.end || new Date().toISOString().split('T')[0]}
            className={isArctic ? arcticInputStyles : warmInputStyles}
            aria-label="Start date"
          />
        </div>
      )}

      {/* Date Range - To */}
      {showDateRange && (
        <div className="flex items-center gap-2">
          <span className={isArctic ? arcticLabelStyles : warmLabelStyles}>
            {t('common.to')}:
          </span>
          <input
            type="date"
            value={dateRange?.end || ''}
            onChange={handleDateRangeEnd}
            min={dateRange?.start}
            max={new Date().toISOString().split('T')[0]}
            className={isArctic ? arcticInputStyles : warmInputStyles}
            aria-label="End date"
          />
        </div>
      )}

      {/* Farmer Filter */}
      <div className="relative">
        <select
          value={selectedFarmerId || ''}
          onChange={handleFarmerChange}
          className={isArctic ? arcticSelectStyles : warmSelectStyles}
          aria-label={t('dailyEntry.farmer')}
        >
          <option value="">{t('common.all')} {t('farmers.title')}</option>
          {farmers.map((farmer) => (
            <option key={farmer.id} value={farmer.id}>
              {farmer.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className={`
            absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none
            ${isArctic ? 'text-slate-mist' : 'text-warm-brown'}
          `}
          aria-hidden="true"
        />
      </div>

      {/* Flower Type Filter */}
      <div className="relative">
        <select
          value={selectedFlowerTypeId || ''}
          onChange={handleFlowerTypeChange}
          className={isArctic ? arcticSelectStyles : warmSelectStyles}
          aria-label={t('dailyEntry.flowerType')}
        >
          <option value="">{t('common.all')} {t('dailyEntry.flowerType')}</option>
          {flowerTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className={`
            absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none
            ${isArctic ? 'text-slate-mist' : 'text-warm-brown'}
          `}
          aria-hidden="true"
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className={`
            flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-arctic
            transition-colors duration-150
            ${isArctic
              ? 'text-slate-cool hover:text-frostbite hover:bg-frostbite/10'
              : 'text-warm-brown hover:text-accent-crimson hover:bg-accent-crimson/10 rounded-lg'
            }
          `}
          aria-label={t('common.clearFilters')}
        >
          <X size={14} aria-hidden="true" />
          <span className="hidden sm:inline">{t('common.clearFilters')}</span>
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-arctic
            transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isArctic
              ? 'text-slate-cool bg-arctic-frost border border-ice-border hover:bg-arctic-ice hover:border-glacier-400'
              : 'text-warm-brown bg-white border-2 border-warm-taupe rounded-lg hover:bg-warm-cream hover:border-warm-brown'
            }
          `}
          aria-label={t('common.refresh')}
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">{t('common.refresh')}</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-arctic
            transition-colors duration-150
            ${isArctic
              ? 'text-slate-cool bg-arctic-frost border border-ice-border hover:bg-arctic-ice hover:border-glacier-400'
              : 'text-warm-brown bg-white border-2 border-warm-taupe rounded-lg hover:bg-warm-cream hover:border-warm-brown'
            }
          `}
          aria-label={t('common.export')}
        >
          <Download size={16} aria-hidden="true" />
          <span className="hidden sm:inline">{t('common.export')}</span>
        </button>

        {/* New Entry Button */}
        <button
          onClick={onNewEntry}
          className={`
            flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-arctic
            transition-all duration-150
            ${isArctic
              ? 'text-white bg-gradient-to-r from-glacier-500 to-glacier-600 shadow-frost-sm hover:from-glacier-600 hover:to-glacier-700 hover:shadow-frost-md'
              : 'text-white bg-gradient-to-r from-accent-magenta to-accent-crimson rounded-lg shadow-md hover:shadow-lg'
            }
          `}
          aria-label={t('dailyEntry.newEntry')}
        >
          <Plus size={16} aria-hidden="true" />
          <span>{t('dailyEntry.newEntry')}</span>
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
