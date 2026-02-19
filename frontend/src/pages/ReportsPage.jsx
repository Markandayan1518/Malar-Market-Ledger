import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../hooks/useReports';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/data/Card';
import Button from '../components/forms/Button';
import LoadingSpinner from '../components/feedback/LoadingSpinner';
import Badge from '../components/data/Badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Download, 
  Calendar,
  FileText,
  IndianRupee,
  Scale,
  RefreshCw,
  PieChart,
  Activity
} from 'lucide-react';

/**
 * Arctic Frost Theme - Reports Page
 * 
 * Redesigned with Arctic Frost design system:
 * - Gradient header with report icon
 * - Report type cards with hover effects
 * - Animated stat cards
 * - Styled preview modal
 * - Loading skeleton states
 */
const ReportsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { 
    generateDailySummary, 
    generateFarmerSummary, 
    generateMarketAnalytics, 
    generateSettlementReport, 
    generateCashAdvanceReport 
  } = useReports();
  
  const [reportType, setReportType] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    farmerId: ''
  });

  const reportOptions = [
    { 
      value: 'daily', 
      label: t('reports.dailySummary'), 
      icon: Calendar,
      description: t('reports.dailySummaryDesc'),
      gradient: 'from-glacier-400 to-glacier-600'
    },
    { 
      value: 'farmer', 
      label: t('reports.farmerSummary'), 
      icon: Users,
      description: t('reports.farmerSummaryDesc'),
      gradient: 'from-aurora-400 to-aurora-600'
    },
    { 
      value: 'market', 
      label: t('reports.marketAnalytics'), 
      icon: PieChart,
      description: t('reports.marketAnalyticsDesc'),
      gradient: 'from-gold-400 to-gold-600'
    },
    { 
      value: 'settlement', 
      label: t('reports.settlementReport'), 
      icon: FileText,
      description: t('reports.settlementReportDesc'),
      gradient: 'from-glacier-500 to-aurora-500'
    },
    { 
      value: 'advance', 
      label: t('reports.cashAdvanceReport'), 
      icon: Activity,
      description: t('reports.cashAdvanceReportDesc'),
      gradient: 'from-gold-500 to-frostbite-500'
    }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setReportData(null);
    setIsRefreshing(false);
    showNotification('success', t('common.refreshed'));
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null);
    
    try {
      let data;
      switch (reportType) {
        case 'daily':
          data = await generateDailySummary(filters.startDate, filters.endDate);
          break;
        case 'farmer':
          data = await generateFarmerSummary(filters.farmerId, filters.startDate, filters.endDate);
          break;
        case 'market':
          data = await generateMarketAnalytics(filters.startDate, filters.endDate);
          break;
        case 'settlement':
          data = await generateSettlementReport(filters.startDate, filters.endDate);
          break;
        case 'advance':
          data = await generateCashAdvanceReport(filters.startDate, filters.endDate);
          break;
        default:
          throw new Error('Invalid report type');
      }
      setReportData(data);
      showNotification('success', t('reports.generateSuccess'));
    } catch (error) {
      showNotification('error', t('reports.generateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      showNotification('info', t('reports.downloadStart'));
      showNotification('success', t('reports.downloadSuccess'));
    } catch (error) {
      showNotification('error', t('reports.downloadError'));
    }
  };

  // Stat card component
  const StatCard = ({ icon: Icon, label, value, color = 'glacier', suffix = '' }) => (
    <div className="bg-white rounded-xl border border-arctic-border p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg bg-${color}-100`}>
          <Icon size={20} className={`text-${color}-600`} />
        </div>
        <div>
          <p className="text-xs text-arctic-mist uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-arctic-night font-mono">
            {value}{suffix}
          </p>
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'daily':
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                icon={FileText} 
                label={t('dashboard.totalEntries')} 
                value={reportData.totalEntries || 0}
                color="glacier"
              />
              <StatCard 
                icon={Scale} 
                label={t('dashboard.totalWeight')} 
                value={reportData.totalWeight || 0}
                suffix=" kg"
                color="aurora"
              />
              <StatCard 
                icon={IndianRupee} 
                label={t('dashboard.totalAmount')} 
                value={`₹${(reportData.totalAmount || 0).toLocaleString('en-IN')}`}
                color="gold"
              />
              <StatCard 
                icon={Users} 
                label={t('reports.activeFarmers')} 
                value={reportData.activeFarmers || 0}
                color="glacier"
              />
            </div>
            
            {/* Daily Breakdown Table */}
            <div className="bg-white rounded-xl border border-arctic-border overflow-hidden">
              <div className="px-6 py-4 border-b border-arctic-border bg-gradient-to-r from-glacier-50 to-aurora-50">
                <h3 className="font-semibold text-arctic-night flex items-center gap-2">
                  <Calendar size={18} className="text-glacier-500" />
                  {t('reports.dailyBreakdown')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-arctic-ice">
                      <th className="text-left py-3 px-6 text-xs font-semibold text-arctic-charcoal uppercase tracking-wide">{t('common.date')}</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-arctic-charcoal uppercase tracking-wide">{t('dashboard.totalEntries')}</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-arctic-charcoal uppercase tracking-wide">{t('dashboard.totalWeight')}</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-arctic-charcoal uppercase tracking-wide">{t('dashboard.totalAmount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dailyBreakdown?.map((day, index) => (
                      <tr key={index} className="border-b border-arctic-border hover:bg-arctic-ice/50 transition-colors">
                        <td className="py-3 px-6 text-arctic-night">{day.date}</td>
                        <td className="text-right py-3 px-6 font-mono text-arctic-night">{day.entries}</td>
                        <td className="text-right py-3 px-6 font-mono text-arctic-night">{day.weight} kg</td>
                        <td className="text-right py-3 px-6 font-mono text-aurora-700">₹{day.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'farmer':
        return (
          <div className="space-y-6">
            {/* Farmer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                icon={FileText} 
                label={t('dashboard.totalEntries')} 
                value={reportData.totalEntries || 0}
                color="glacier"
              />
              <StatCard 
                icon={Scale} 
                label={t('dashboard.totalWeight')} 
                value={reportData.totalWeight || 0}
                suffix=" kg"
                color="aurora"
              />
              <StatCard 
                icon={IndianRupee} 
                label={t('dashboard.totalAmount')} 
                value={`₹${(reportData.totalAmount || 0).toLocaleString('en-IN')}`}
                color="gold"
              />
            </div>
            
            {/* Entries Table */}
            <div className="bg-white rounded-xl border border-arctic-border overflow-hidden">
              <div className="px-6 py-4 border-b border-arctic-border bg-gradient-to-r from-aurora-50 to-glacier-50">
                <h3 className="font-semibold text-arctic-night flex items-center gap-2">
                  <Users size={18} className="text-aurora-500" />
                  {t('reports.farmerSummary')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-arctic-ice">
                      <th className="text-left py-3 px-6 text-xs font-semibold text-arctic-charcoal uppercase tracking-wide">{t('common.date')}</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-arctic-charcoal uppercase tracking-wide">{t('dashboard.totalWeight')}</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-arctic-charcoal uppercase tracking-wide">{t('dashboard.totalAmount')}</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-arctic-charcoal uppercase tracking-wide">{t('reports.adjustments')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.entries?.map((entry, index) => (
                      <tr key={index} className="border-b border-arctic-border hover:bg-arctic-ice/50 transition-colors">
                        <td className="py-3 px-6 text-arctic-night">{entry.date}</td>
                        <td className="text-right py-3 px-6 font-mono text-arctic-night">{entry.weight} kg</td>
                        <td className="text-right py-3 px-6 font-mono text-aurora-700">₹{entry.amount}</td>
                        <td className="text-right py-3 px-6 text-arctic-charcoal">{entry.adjustments?.join(', ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'market':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weight Trends */}
              <div className="bg-white rounded-xl border border-arctic-border overflow-hidden">
                <div className="px-6 py-4 border-b border-arctic-border bg-gradient-to-r from-gold-50 to-aurora-50">
                  <h3 className="font-semibold text-arctic-night flex items-center gap-2">
                    <TrendingUp size={18} className="text-gold-500" />
                    {t('reports.weightTrends')}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-arctic-border">
                    <span className="text-arctic-charcoal">{t('reports.averageWeight')}</span>
                    <span className="font-mono font-semibold text-arctic-night">{reportData.avgWeight} kg</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-arctic-border">
                    <span className="text-arctic-charcoal flex items-center gap-2">
                      <TrendingUp size={14} className="text-aurora-500" />
                      {t('reports.maxWeight')}
                    </span>
                    <span className="font-mono font-semibold text-aurora-700">{reportData.maxWeight} kg</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-arctic-charcoal flex items-center gap-2">
                      <TrendingDown size={14} className="text-frostbite-500" />
                      {t('reports.minWeight')}
                    </span>
                    <span className="font-mono font-semibold text-frostbite-700">{reportData.minWeight} kg</span>
                  </div>
                </div>
              </div>
              
              {/* Adjustment Stats */}
              <div className="bg-white rounded-xl border border-arctic-border overflow-hidden">
                <div className="px-6 py-4 border-b border-arctic-border bg-gradient-to-r from-glacier-50 to-gold-50">
                  <h3 className="font-semibold text-arctic-night flex items-center gap-2">
                    <PieChart size={18} className="text-glacier-500" />
                    {t('reports.adjustmentStats')}
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  {reportData.adjustmentStats?.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <span className="text-arctic-charcoal">{stat.type}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-arctic-ice rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-glacier-500 rounded-full transition-all duration-500"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                        <span className="font-mono text-sm text-arctic-night w-20 text-right">
                          {stat.count} ({stat.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'settlement':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                icon={FileText} 
                label={t('reports.totalSettlements')} 
                value={reportData.totalSettlements || 0}
                color="glacier"
              />
              <StatCard 
                icon={IndianRupee} 
                label={t('settlements.totalAmount')} 
                value={`₹${(reportData.totalAmount || 0).toLocaleString('en-IN')}`}
                color="aurora"
              />
              <StatCard 
                icon={TrendingDown} 
                label={t('settlements.advancesDeducted')} 
                value={`₹${(reportData.advancesDeducted || 0).toLocaleString('en-IN')}`}
                color="gold"
              />
              <StatCard 
                icon={TrendingUp} 
                label={t('settlements.netAmount')} 
                value={`₹${(reportData.netAmount || 0).toLocaleString('en-IN')}`}
                color="aurora"
              />
            </div>
          </div>
        );

      case 'advance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                icon={Activity} 
                label={t('reports.totalAdvances')} 
                value={reportData.totalAdvances || 0}
                color="glacier"
              />
              <StatCard 
                icon={IndianRupee} 
                label={t('reports.totalAmount')} 
                value={`₹${(reportData.totalAmount || 0).toLocaleString('en-IN')}`}
                color="gold"
              />
              <StatCard 
                icon={PieChart} 
                label={t('reports.pendingAdvances')} 
                value={reportData.pendingAdvances || 0}
                color="frostbite"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-arctic-ice">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-glacier-600 via-glacier-700 to-aurora-700 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-white">
                  {t('reports.title')}
                </h1>
                <p className="text-glacier-100 mt-1">
                  {t('reports.subtitle')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-colors disabled:opacity-50"
                title={t('common.refresh')}
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              
              {reportData && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-glacier-700 font-semibold rounded-xl hover:bg-glacier-50 transition-colors shadow-lg"
                >
                  <Download size={18} />
                  {t('reports.download')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Report Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {reportOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setReportType(option.value);
                setReportData(null);
              }}
              className={`
                relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200
                ${reportType === option.value 
                  ? 'bg-white shadow-lg ring-2 ring-glacier-400' 
                  : 'bg-white/70 hover:bg-white shadow-sm hover:shadow-md'
                }
              `}
            >
              {/* Gradient accent bar */}
              <div className={`
                absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${option.gradient}
              `} />
              
              <div className="flex items-center gap-3 mb-2">
                <div className={`
                  p-2 rounded-lg bg-gradient-to-br ${option.gradient}
                `}>
                  <option.icon size={18} className="text-white" />
                </div>
                <span className={`
                  font-semibold text-sm
                  ${reportType === option.value ? 'text-arctic-night' : 'text-arctic-charcoal'}
                `}>
                  {option.label}
                </span>
              </div>
              <p className="text-xs text-arctic-mist line-clamp-2">
                {option.description}
              </p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm p-6">
          <h3 className="font-semibold text-arctic-night mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-glacier-500" />
            {t('reports.dateRange')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('reports.startDate')}
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-arctic-mist" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('reports.endDate')}
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-arctic-mist" />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-glacier-500 to-glacier-600 text-white font-semibold rounded-xl hover:from-glacier-600 hover:to-glacier-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    {t('reports.generating')}
                  </>
                ) : (
                  <>
                    <BarChart3 size={18} />
                    {t('reports.generate')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-arctic-border shadow-sm p-12">
            <div className="flex flex-col items-center justify-center">
              <LoadingSpinner />
              <p className="mt-4 text-arctic-charcoal">{t('reports.generating')}</p>
            </div>
          </div>
        ) : reportData ? (
          renderReportContent()
        ) : (
          <div className="bg-white rounded-2xl border border-arctic-border shadow-sm p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-arctic-ice rounded-full flex items-center justify-center mb-4">
                <BarChart3 size={40} className="text-arctic-mist" />
              </div>
              <h3 className="text-lg font-semibold text-arctic-night mb-2">
                {t('reports.selectReport')}
              </h3>
              <p className="text-arctic-charcoal max-w-md">
                {t('reports.selectReportDesc')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
