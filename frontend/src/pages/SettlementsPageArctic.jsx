import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, ChevronRight, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

// Settlement components
import SettlementFilterBar from '../components/settlement/SettlementFilterBar';
import SettlementSummary from '../components/settlement/SettlementSummary';
import SettlementTable from '../components/settlement/SettlementTable';
import SettlementCard from '../components/settlement/SettlementCard';

// Hook
import { useSettlements } from '../hooks/useSettlements';

/**
 * Arctic Frost Theme - Monthly Settlements Page
 * 
 * Main page component with responsive layout switching:
 * - Desktop (>= 1024px): Full table with all columns
 * - Tablet (768-1024px): Table with horizontal scroll
 * - Mobile (< 768px): Card list view
 */
const SettlementsPageArctic = () => {
  const { t } = useTranslation();
  
  // Responsive breakpoint state
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // Filter state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sort state
  const [sortColumn, setSortColumn] = useState('farmer_name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Use settlements hook
  const { 
    settlements, 
    loading, 
    error,
    farmers,
    fetchSettlements,
    markAsPaid,
    generateSettlement,
    exportPDF,
    exportExcel
  } = useSettlements();

  // Check screen size for responsive layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch settlements when filters change
  useEffect(() => {
    fetchSettlements({
      month: selectedMonth,
      year: selectedYear,
      farmer_id: selectedFarmer || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined
    });
  }, [selectedMonth, selectedYear, selectedFarmer, selectedStatus]);

  // Handle sort
  const handleSort = useCallback((column, direction) => {
    setSortColumn(column);
    setSortDirection(direction);
  }, []);

  // Filter and sort settlements
  const filteredSettlements = useMemo(() => {
    let result = [...settlements];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.farmer_name?.toLowerCase().includes(term)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      // Handle string comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      // Handle null/undefined
      if (aVal == null) aVal = 0;
      if (bVal == null) bVal = 0;
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [settlements, searchTerm, sortColumn, sortDirection]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const stats = {
      totalFarmers: filteredSettlements.length,
      totalWeight: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalAdvances: 0,
      totalNet: 0,
      paidCount: 0,
      pendingCount: 0,
      lateCount: 0
    };
    
    filteredSettlements.forEach(s => {
      stats.totalWeight += s.total_weight || 0;
      stats.totalGross += s.gross_amount || 0;
      stats.totalDeductions += s.deductions || 0;
      stats.totalAdvances += s.advances || 0;
      stats.totalNet += s.net_amount || 0;
      
      if (s.status === 'paid') stats.paidCount++;
      else if (s.status === 'pending') stats.pendingCount++;
      else if (s.status === 'late') stats.lateCount++;
    });
    
    return stats;
  }, [filteredSettlements]);

  // Handle view details
  const handleViewDetails = useCallback((settlement) => {
    console.log('View details:', settlement);
    // TODO: Open detail modal or navigate to detail page
  }, []);

  // Handle mark as paid
  const handleMarkAsPaid = useCallback(async (settlement) => {
    try {
      await markAsPaid(settlement.id);
    } catch (err) {
      console.error('Error marking as paid:', err);
    }
  }, [markAsPaid]);

  // Handle new settlement
  const handleNewSettlement = useCallback(async () => {
    try {
      await generateSettlement({
        month: selectedMonth,
        year: selectedYear
      });
    } catch (err) {
      console.error('Error generating settlement:', err);
    }
  }, [generateSettlement, selectedMonth, selectedYear]);

  // Handle export PDF
  const handleExportPDF = useCallback(async () => {
    try {
      await exportPDF({
        month: selectedMonth,
        year: selectedYear,
        farmer_id: selectedFarmer || undefined
      });
    } catch (err) {
      console.error('Error exporting PDF:', err);
    }
  }, [exportPDF, selectedMonth, selectedYear, selectedFarmer]);

  // Handle export Excel
  const handleExportExcel = useCallback(async () => {
    try {
      await exportExcel({
        month: selectedMonth,
        year: selectedYear,
        farmer_id: selectedFarmer || undefined
      });
    } catch (err) {
      console.error('Error exporting Excel:', err);
    }
  }, [exportExcel, selectedMonth, selectedYear, selectedFarmer]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-[#EAECF0] px-4 md:px-6 py-3" aria-label="Breadcrumb">
        <div className="flex items-center gap-2 text-sm">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-1 text-[#6B7280] hover:text-[#3B82F6] transition-colors"
          >
            <Home size={16} />
            <span>{t('common.home')}</span>
          </Link>
          <ChevronRight size={16} className="text-[#9CA3AF]" />
          <span className="text-[#1F2937] font-medium">{t('settlements.title')}</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4 md:p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1F2937]">
            {t('settlements.title')}
          </h1>
          <p className="text-[#6B7280] mt-1">
            {t('settlements.description')}
          </p>
        </div>

        {/* Filter Bar */}
        <SettlementFilterBar
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          selectedFarmer={selectedFarmer}
          selectedStatus={selectedStatus}
          searchTerm={searchTerm}
          farmers={farmers}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onFarmerChange={setSelectedFarmer}
          onStatusChange={setSelectedStatus}
          onSearchChange={setSearchTerm}
          onNewSettlement={handleNewSettlement}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
        />

        {/* Summary Stats */}
        <div className="mt-6">
          <SettlementSummary stats={summaryStats} />
        </div>

        {/* Error State */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Content Area - Responsive */}
        <div className="mt-6">
          {/* Mobile: Card View */}
          {isMobile && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredSettlements.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#F1F5F9] flex items-center justify-center">
                    <FileText size={24} className="text-[#9CA3AF]" />
                  </div>
                  <p className="mt-4 text-[#6B7280] font-medium">{t('settlements.noSettlements')}</p>
                  <p className="text-sm text-[#9CA3AF]">{t('settlements.noSettlementsDesc')}</p>
                </div>
              ) : (
                filteredSettlements.map(settlement => (
                  <SettlementCard
                    key={settlement.id}
                    settlement={settlement}
                    onViewDetails={handleViewDetails}
                    onMarkAsPaid={handleMarkAsPaid}
                  />
                ))
              )}
            </div>
          )}

          {/* Desktop/Tablet: Table View */}
          {!isMobile && (
            <div className="bg-white rounded-lg border border-[#EAECF0] shadow-sm overflow-hidden">
              <SettlementTable
                settlements={filteredSettlements}
                loading={loading}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                onViewDetails={handleViewDetails}
                onMarkAsPaid={handleMarkAsPaid}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SettlementsPageArctic;
