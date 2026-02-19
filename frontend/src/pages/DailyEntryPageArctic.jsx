import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { RefreshCw, Download, Plus } from 'lucide-react';
import FilterBar from '../components/entry/FilterBar';
import EntryGridArctic from '../components/entry/EntryGridArctic';
import EntryCardArctic from '../components/entry/EntryCardArctic';
import { useDailyEntries } from '../hooks/useDailyEntries';
import { useFarmers } from '../hooks/useFarmers';
import { useMarketRates } from '../hooks/useMarketRates';
import { farmerService } from '../services';

/**
 * Arctic Frost Theme - Daily Entry Page
 * 
 * Features:
 * - Responsive layout: table (>=768px) / cards (<768px)
 * - High-density view for desktop (15-20 rows visible)
 * - Filter bar with date range, farmer, search
 * - Real-time stats bar
 * 
 * Colors:
 * - Glacier Cyan: #ECFEFF (active row highlight)
 * - Ice Border: #EAECF0 (borders)
 * - Frostbite Red: #EF4444 (error/deduction)
 * - Aurora Green: #10B981 (success)
 * - Cool Gray: #6B7280 (muted text)
 */
const DailyEntryPageArctic = () => {
  const { t } = useTranslation();
  
  // Data hooks
  const { entries, loading: entriesLoading, fetchEntries, getTodayStats } = useDailyEntries();
  const { farmers, loading: farmersLoading, refetch: refetchFarmers } = useFarmers();
  const { currentRate, fetchRates } = useMarketRates();
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedFlowerType, setSelectedFlowerType] = useState('');
  
  // View state
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // Flower types (mock for now - would come from API)
  const [flowerTypes] = useState([
    { id: '1', name: 'Rose', name_ta: 'ரோஜா' },
    { id: '2', name: 'Jasmine', name_ta: 'மல்லி' },
    { id: '3', name: 'Marigold', name_ta: 'சாமந்தி' },
    { id: '4', name: 'Tuberose', name_ta: 'செண்பகம்' },
    { id: '5', name: 'Lotus', name_ta: 'தாமரை' },
  ]);

  // Responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchEntries(format(new Date(), 'yyyy-MM-dd'));
    fetchRates();
    refetchFarmers();
  }, [fetchEntries, fetchRates, refetchFarmers]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(entry => {
        const farmer = farmers.find(f => f.id === entry.farmerId);
        return (
          farmer?.name?.toLowerCase().includes(term) ||
          entry.flowerType?.toLowerCase().includes(term) ||
          entry.weight?.toString().includes(term)
        );
      });
    }
    
    // Farmer filter
    if (selectedFarmer) {
      result = result.filter(entry => entry.farmerId === selectedFarmer);
    }
    
    // Flower type filter
    if (selectedFlowerType) {
      result = result.filter(entry => entry.flowerTypeId === selectedFlowerType);
    }
    
    // Date range filter
    if (dateFrom) {
      result = result.filter(entry => entry.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(entry => entry.date <= dateTo);
    }
    
    return result;
  }, [entries, searchTerm, selectedFarmer, selectedFlowerType, dateFrom, dateTo, farmers]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalWeight = filteredEntries.reduce((sum, e) => sum + (parseFloat(e.weight) || 0), 0);
    const totalAmount = filteredEntries.reduce((sum, e) => sum + (parseFloat(e.total) || 0), 0);
    return {
      count: filteredEntries.length,
      totalWeight: totalWeight.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      avgPerEntry: filteredEntries.length > 0 ? (totalAmount / filteredEntries.length).toFixed(2) : '0.00'
    };
  }, [filteredEntries]);

  // Handlers
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleDateFromChange = useCallback((date) => {
    setDateFrom(date);
    if (date && dateTo) {
      fetchEntries(date, dateTo);
    }
  }, [dateTo, fetchEntries]);

  const handleDateToChange = useCallback((date) => {
    setDateTo(date);
    if (dateFrom && date) {
      fetchEntries(dateFrom, date);
    }
  }, [dateFrom, fetchEntries]);

  const handleFarmerChange = useCallback((farmerId) => {
    setSelectedFarmer(farmerId);
  }, []);

  const handleFlowerTypeChange = useCallback((flowerTypeId) => {
    setSelectedFlowerType(flowerTypeId);
  }, []);

  const handleNewEntry = useCallback(() => {
    // TODO: Open new entry modal
    console.log('New entry clicked');
  }, []);

  const handleExport = useCallback(() => {
    // TODO: Export to Excel/PDF
    console.log('Export clicked');
  }, []);

  const handleRefresh = useCallback(() => {
    fetchEntries(format(new Date(), 'yyyy-MM-dd'));
    fetchRates();
    refetchFarmers();
  }, [fetchEntries, fetchRates, refetchFarmers]);

  const loading = entriesLoading || farmersLoading;

  // Get farmer name helper
  const getFarmerName = (farmerId) => {
    const farmer = farmers.find(f => f.id === farmerId);
    return farmer?.name || 'Unknown';
  };

  // Get flower type name helper
  const getFlowerTypeName = (flowerTypeId) => {
    const flowerType = flowerTypes.find(f => f.id === flowerTypeId);
    return flowerType?.name || 'N/A';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="border-b border-[#EAECF0] bg-white px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-3" aria-label="Breadcrumb">
            <span className="text-[#6B7280]">{t('nav.home', 'Home')}</span>
            <span className="text-[#EAECF0]">/</span>
            <span className="text-[#3B82F6] font-medium">{t('nav.dailyEntries', 'Daily Entries')}</span>
          </nav>
          
          {/* Title and Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('dailyEntry.title', 'Daily Entries')}
              </h1>
              <p className="text-sm text-[#6B7280] mt-1">
                {t('dailyEntry.subtitle', 'Manage flower transactions and entries')}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#6B7280] bg-white border border-[#EAECF0] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                aria-label={t('common.refresh', 'Refresh')}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{t('common.refresh', 'Refresh')}</span>
              </button>
              
              {/* Export Button */}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#6B7280] bg-white border border-[#EAECF0] rounded-lg hover:bg-gray-50 transition-colors"
                aria-label={t('common.export', 'Export')}
              >
                <Download size={16} />
                <span className="hidden sm:inline">{t('common.export', 'Export')}</span>
              </button>
              
              {/* New Entry Button - Frost Blue Gradient */}
              <button
                onClick={handleNewEntry}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                }}
                aria-label={t('dailyEntry.newEntry', 'New Entry')}
              >
                <Plus size={16} />
                <span className="hidden sm:inline">{t('dailyEntry.newEntry', 'New Entry')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b border-[#EAECF0] bg-[#ECFEFF]/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Entries */}
            <div className="bg-white rounded-lg p-4 border border-[#EAECF0] shadow-sm">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                {t('dashboard.totalEntries', 'Total Entries')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.count}
              </p>
            </div>
            
            {/* Total Weight */}
            <div className="bg-white rounded-lg p-4 border border-[#EAECF0] shadow-sm">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                {t('dashboard.totalWeight', 'Total Weight')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalWeight}
                <span className="text-sm font-normal text-[#6B7280] ml-1">kg</span>
              </p>
            </div>
            
            {/* Total Amount */}
            <div className="bg-white rounded-lg p-4 border border-[#EAECF0] shadow-sm">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                {t('dashboard.totalAmount', 'Total Amount')}
              </p>
              <p className="text-2xl font-bold text-[#10B981] mt-1">
                ₹{stats.totalAmount}
              </p>
            </div>
            
            {/* Avg per Entry */}
            <div className="bg-white rounded-lg p-4 border border-[#EAECF0] shadow-sm">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                Avg/Entry
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{stats.avgPerEntry}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-[#EAECF0] bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            dateFrom={dateFrom}
            onDateFromChange={handleDateFromChange}
            dateTo={dateTo}
            onDateToChange={handleDateToChange}
            selectedFarmer={selectedFarmer}
            onFarmerChange={handleFarmerChange}
            farmers={farmers}
            selectedFlowerType={selectedFlowerType}
            onFlowerTypeChange={handleFlowerTypeChange}
            flowerTypes={flowerTypes}
            onNewEntry={handleNewEntry}
            onExport={handleExport}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {loading && filteredEntries.length === 0 ? (
          /* Loading State */
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-3 border-gray-200 border-t-[#3B82F6] rounded-full animate-spin" />
              <p className="text-[#6B7280] text-sm">{t('common.loading', 'Loading...')}</p>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#ECFEFF] rounded-full flex items-center justify-center mb-4">
              <Plus size={24} className="text-[#6B7280]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('dailyEntry.noEntries', 'No entries found')}
            </h3>
            <p className="text-[#6B7280] text-sm max-w-md mb-6">
              {t('dailyEntry.noEntriesMessage', 'Try adjusting your filters or add a new entry to get started.')}
            </p>
            <button
              onClick={handleNewEntry}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
            >
              <Plus size={16} />
              {t('dailyEntry.newEntry', 'New Entry')}
            </button>
          </div>
        ) : (
          /* Data View - Responsive */
          <>
            {/* Desktop/Tablet: Table View */}
            {!isMobile && (
              <div className="hidden md:block overflow-x-auto">
                <EntryGridArctic
                  entries={filteredEntries}
                  farmers={farmers}
                  currentRate={currentRate}
                  loading={loading}
                  getFarmerName={getFarmerName}
                  getFlowerTypeName={getFlowerTypeName}
                />
              </div>
            )}
            
            {/* Mobile: Card View */}
            {isMobile && (
              <div className="md:hidden space-y-4">
                {filteredEntries.map((entry) => (
                  <EntryCardArctic
                    key={entry.id}
                    entry={entry}
                    farmerName={getFarmerName(entry.farmerId)}
                    flowerTypeName={getFlowerTypeName(entry.flowerTypeId)}
                    marketRate={currentRate}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DailyEntryPageArctic;
