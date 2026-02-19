import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, Download, Plus, ChevronDown, Home } from 'lucide-react';

/**
 * Arctic Frost Theme - Settlement Filter Bar Component
 * 
 * Features:
 * - Breadcrumb navigation: Home > Monthly Settlements
 * - Month/Year picker dropdown
 * - Farmer filter dropdown
 * - Status filter (All, Paid, Pending, Late)
 * - New Settlement button with Frost Blue gradient
 * - Export PDF and Export Excel secondary buttons
 * 
 * Uses Tailwind CSS with Arctic Frost theme colors:
 * - glacier-cyan: #ECFEFF (active row highlight)
 * - ice-border: #EAECF0 (borders)
 * - frostbite-red: #EF4444 (error/late)
 * - aurora-green: #10B981 (success/paid)
 * - cool-gray: #6B7280 (muted text)
 * - frost-blue-gradient: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)
 */
const SettlementFilterBar = ({
  // Month/Year filters
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  
  // Farmer filter
  farmers = [],
  selectedFarmerId,
  onFarmerChange,
  
  // Status filter
  selectedStatus,
  onStatusChange,
  
  // Search
  searchTerm,
  onSearchChange,
  
  // Actions
  onRefresh,
  onExportPdf,
  onExportExcel,
  onNewSettlement,
  
  // Loading state
  loading = false
}) => {
  const { t } = useTranslation();

  // Generate month options
  const months = [
    { value: 1, label: t('common.january') },
    { value: 2, label: t('common.february') },
    { value: 3, label: t('common.march') },
    { value: 4, label: t('common.april') },
    { value: 5, label: t('common.may') },
    { value: 6, label: t('common.june') },
    { value: 7, label: t('common.july') },
    { value: 8, label: t('common.august') },
    { value: 9, label: t('common.september') },
    { value: 10, label: t('common.october') },
    { value: 11, label: t('common.november') },
    { value: 12, label: t('common.december') }
  ];

  // Generate year options (current year and past 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Status options
  const statusOptions = [
    { value: '', label: t('common.all') },
    { value: 'paid', label: t('settlements.statusPaid') },
    { value: 'pending', label: t('settlements.statusPending') },
    { value: 'late', label: t('settlements.statusLate') }
  ];

  // Handle search input change
  const handleSearchChange = (e) => {
    onSearchChange?.(e.target.value);
  };

  // Handle month change
  const handleMonthChange = (e) => {
    onMonthChange?.(parseInt(e.target.value, 10));
  };

  // Handle year change
  const handleYearChange = (e) => {
    onYearChange?.(parseInt(e.target.value, 10));
  };

  // Handle farmer change
  const handleFarmerChange = (e) => {
    onFarmerChange?.(e.target.value);
  };

  // Handle status change
  const handleStatusChange = (e) => {
    onStatusChange?.(e.target.value);
  };

  return (
    <div 
      className="flex flex-wrap items-center gap-3 p-4 mb-4 bg-white rounded-lg border border-[#EAECF0] shadow-sm"
      role="search"
      aria-label="Settlement filters"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#6B7280]" aria-label="Breadcrumb">
        <Home size={14} />
        <span className="text-[#6B7280]">/</span>
        <span className="font-medium text-[#1F2937]">{t('settlements.monthlyTitle')}</span>
      </nav>

      {/* Divider */}
      <div className="hidden sm:block w-px h-6 bg-[#EAECF0]" aria-hidden="true" />

      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-[280px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-[#6B7280]" aria-hidden="true" />
        </div>
        <input
          type="search"
          value={searchTerm || ''}
          onChange={handleSearchChange}
          placeholder={t('common.search')}
          className="w-full pl-10 pr-4 py-2 text-sm bg-[#F1F5F9] border border-[#EAECF0] rounded-md 
            focus:bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE] focus:outline-none
            placeholder:text-[#9CA3AF] transition-colors duration-150"
          aria-label={t('common.search')}
        />
      </div>

      {/* Month Picker */}
      <div className="relative">
        <select
          value={selectedMonth || new Date().getMonth() + 1}
          onChange={handleMonthChange}
          className="appearance-none px-4 py-2 pr-8 text-sm bg-[#F1F5F9] border border-[#EAECF0] rounded-md
            focus:bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE] focus:outline-none
            text-[#1F2937] transition-colors duration-150 cursor-pointer
            [&>option]:bg-white [&>option]:text-[#1F2937]"
          aria-label={t('settlements.month')}
        >
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={16} 
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" 
          aria-hidden="true"
        />
      </div>

      {/* Year Picker */}
      <div className="relative">
        <select
          value={selectedYear || currentYear}
          onChange={handleYearChange}
          className="appearance-none px-4 py-2 pr-8 text-sm bg-[#F1F5F9] border border-[#EAECF0] rounded-md
            focus:bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE] focus:outline-none
            text-[#1F2937] transition-colors duration-150 cursor-pointer
            [&>option]:bg-white [&>option]:text-[#1F2937]"
          aria-label={t('settlements.year')}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={16} 
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" 
          aria-hidden="true"
        />
      </div>

      {/* Farmer Filter */}
      <div className="relative">
        <select
          value={selectedFarmerId || ''}
          onChange={handleFarmerChange}
          className="appearance-none px-4 py-2 pr-8 text-sm bg-[#F1F5F9] border border-[#EAECF0] rounded-md
            focus:bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE] focus:outline-none
            text-[#1F2937] transition-colors duration-150 cursor-pointer
            [&>option]:bg-white [&>option]:text-[#1F2937]"
          aria-label={t('settlements.farmer')}
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
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" 
          aria-hidden="true"
        />
      </div>

      {/* Status Filter */}
      <div className="relative">
        <select
          value={selectedStatus || ''}
          onChange={handleStatusChange}
          className="appearance-none px-4 py-2 pr-8 text-sm bg-[#F1F5F9] border border-[#EAECF0] rounded-md
            focus:bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#BFDBFE] focus:outline-none
            text-[#1F2937] transition-colors duration-150 cursor-pointer
            [&>option]:bg-white [&>option]:text-[#1F2937]"
          aria-label={t('settlements.status')}
        >
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={16} 
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" 
          aria-hidden="true"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#6B7280] 
            bg-white border border-[#EAECF0] rounded-md hover:bg-[#F1F5F9] hover:border-[#CBD5E1]
            focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] focus:border-[#3B82F6]
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          aria-label={t('common.refresh')}
        >
          <RefreshCw 
            size={16} 
            className={loading ? 'animate-spin' : ''} 
            aria-hidden="true" 
          />
          <span className="hidden sm:inline">{t('common.refresh')}</span>
        </button>

        {/* Export PDF Button */}
        <button
          onClick={onExportPdf}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#6B7280] 
            bg-white border border-[#EAECF0] rounded-md hover:bg-[#F1F5F9] hover:border-[#CBD5E1]
            focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] focus:border-[#3B82F6]
            transition-colors duration-150"
          aria-label={t('settlements.exportPdf')}
        >
          <Download size={16} aria-hidden="true" />
          <span className="hidden sm:inline">{t('settlements.exportPdf')}</span>
        </button>

        {/* Export Excel Button */}
        <button
          onClick={onExportExcel}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#6B7280] 
            bg-white border border-[#EAECF0] rounded-md hover:bg-[#F1F5F9] hover:border-[#CBD5E1]
            focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] focus:border-[#3B82F6]
            transition-colors duration-150"
          aria-label={t('settlements.exportExcel')}
        >
          <Download size={16} aria-hidden="true" />
          <span className="hidden sm:inline">{t('settlements.exportExcel')}</span>
        </button>

        {/* New Settlement Button - Frost Blue Gradient */}
        <button
          onClick={onNewSettlement}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
            bg-gradient-to-r from-[#60A5FA] to-[#3B82F6] rounded-md shadow-sm
            hover:from-[#3B82F6] hover:to-[#2563EB] hover:shadow-md
            focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] focus:ring-offset-2
            transition-all duration-150"
          aria-label={t('settlements.newSettlement')}
        >
          <Plus size={16} aria-hidden="true" />
          <span>{t('settlements.newSettlement')}</span>
        </button>
      </div>
    </div>
  );
};

export default SettlementFilterBar;
