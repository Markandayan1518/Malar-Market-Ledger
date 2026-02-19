import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSettlements } from '../hooks/useSettlements';
import { useFarmers } from '../hooks/useFarmers';
import { useNotification } from '../context/NotificationContext';
import DataTable from '../components/data/DataTable';
import Card from '../components/data/Card';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import Select from '../components/forms/Select';
import Modal from '../components/feedback/Modal';
import ConfirmationDialog from '../components/feedback/ConfirmationDialog';
import Badge from '../components/data/Badge';
import SettlementSummary from '../components/settlement/SettlementSummary';
import { 
  Plus, 
  Search, 
  Check, 
  FileText, 
  Download, 
  Trash2,
  Receipt,
  Calendar,
  User,
  TrendingUp,
  Filter,
  RefreshCw
} from 'lucide-react';

/**
 * Arctic Frost Theme - Settlements Page
 * 
 * Redesigned with Arctic Frost design system:
 * - Gradient header with settlement statistics
 * - Frosted glass cards
 * - Status badges with aurora/frostbite colors
 * - Smooth animations and transitions
 * - Print stylesheet support
 */
const SettlementsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { 
    settlements, 
    loading, 
    fetchSettlements, 
    generateSettlement, 
    updateSettlement, 
    deleteSettlement 
  } = useSettlements();
  const { farmers, loading: farmersLoading } = useFarmers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSettlement, setDeletingSettlement] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [generateFormData, setGenerateFormData] = useState({
    farmerId: '',
    startDate: '',
    endDate: ''
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // Calculate summary statistics
  const summaryStats = {
    totalFarmers: new Set(filteredSettlements.map(s => s.farmerId)).size,
    totalWeight: filteredSettlements.reduce((sum, s) => sum + (s.totalWeight || 0), 0),
    totalGross: filteredSettlements.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
    totalDeductions: filteredSettlements.reduce((sum, s) => sum + (s.deductions || 0), 0),
    totalAdvances: filteredSettlements.reduce((sum, s) => sum + (s.advancesDeducted || 0), 0),
    totalNet: filteredSettlements.reduce((sum, s) => sum + (s.netAmount || 0), 0)
  };

  // Status filter options
  const statusOptions = [
    { value: 'all', label: t('settlements.allStatuses') },
    { value: 'generated', label: t('settlements.generated') },
    { value: 'approved', label: t('settlements.approved') },
    { value: 'paid', label: t('settlements.paid') }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSettlements();
    setIsRefreshing(false);
    showNotification('success', t('common.refreshed'));
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleGenerate = () => {
    setGenerateFormData({
      farmerId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
    setShowGenerateModal(true);
  };

  const handleApprove = async (settlement) => {
    try {
      await updateSettlement(settlement.id, { status: 'approved' });
      showNotification('success', t('settlements.approveSuccess'));
      await fetchSettlements();
    } catch (error) {
      showNotification('error', t('settlements.error'));
    }
  };

  const handleMarkPaid = async (settlement) => {
    try {
      await updateSettlement(settlement.id, { status: 'paid' });
      showNotification('success', t('settlements.markPaidSuccess'));
      await fetchSettlements();
    } catch (error) {
      showNotification('error', t('settlements.error'));
    }
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const settlementData = {
        farmerId: generateFormData.farmerId,
        startDate: generateFormData.startDate,
        endDate: generateFormData.endDate
      };

      await generateSettlement(settlementData);
      showNotification('success', t('settlements.generateSuccess'));
      setShowGenerateModal(false);
      await fetchSettlements();
    } catch (error) {
      showNotification('error', t('settlements.generateError'));
    }
  };

  const handleDelete = (settlement) => {
    setDeletingSettlement(settlement);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteSettlement(deletingSettlement.id);
      showNotification('success', t('settlements.deleteSuccess'));
      setShowDeleteDialog(false);
      await fetchSettlements();
    } catch (error) {
      showNotification('error', t('settlements.deleteError'));
    }
  };

  const handleDownload = async (settlement) => {
    try {
      showNotification('info', t('settlements.downloadStart'));
      // In a real implementation, this would trigger a PDF download
      showNotification('success', t('settlements.downloadSuccess'));
    } catch (error) {
      showNotification('error', t('settlements.downloadError'));
    }
  };

  // Filter settlements based on search and status
  const filteredSettlements = settlements.filter(settlement => {
    const searchLower = searchTerm.toLowerCase();
    const farmer = farmers.find(f => f.id === settlement.farmerId);
    const matchesSearch = (
      farmer?.name.toLowerCase().includes(searchLower) ||
      settlement.totalAmount.toString().includes(searchLower) ||
      settlement.startDate.includes(searchLower) ||
      settlement.endDate.includes(searchLower)
    );
    const matchesStatus = statusFilter === 'all' || settlement.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'paid':
        return 'success'; // aurora-green
      case 'approved':
        return 'info'; // glacier-blue
      case 'generated':
        return 'warning'; // gold-ice
      default:
        return 'default';
    }
  };

  const columns = [
    { 
      key: 'settlementId', 
      label: t('settlements.settlementId'), 
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm text-arctic-night">
          #{row.settlementId?.slice(-8) || row.id?.slice(-8)}
        </span>
      )
    },
    { 
      key: 'farmer', 
      label: t('settlements.farmer'), 
      sortable: false, 
      render: (row) => {
        const farmer = farmers.find(f => f.id === row.farmerId);
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-glacier-100 flex items-center justify-center">
              <User size={14} className="text-glacier-600" />
            </div>
            <span className="font-medium text-arctic-night">
              {farmer?.name || 'Unknown'}
            </span>
          </div>
        );
      }
    },
    { 
      key: 'period', 
      label: t('settlements.period'), 
      sortable: false, 
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar size={14} className="text-glacier-500" />
          <span className="text-arctic-charcoal">
            {row.startDate} - {row.endDate}
          </span>
        </div>
      )
    },
    { 
      key: 'totalAmount', 
      label: t('settlements.totalAmount'), 
      sortable: true, 
      render: (row) => (
        <span className="font-mono text-sm text-arctic-night">
          ₹{row.totalAmount?.toLocaleString('en-IN')}
        </span>
      )
    },
    { 
      key: 'advancesDeducted', 
      label: t('settlements.advancesDeducted'), 
      sortable: true, 
      render: (row) => (
        <span className="font-mono text-sm text-gold-600">
          -₹{row.advancesDeducted?.toLocaleString('en-IN')}
        </span>
      )
    },
    { 
      key: 'netAmount', 
      label: t('settlements.netAmount'), 
      sortable: true, 
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-aurora-600">
          ₹{row.netAmount?.toLocaleString('en-IN')}
        </span>
      )
    },
    { 
      key: 'status', 
      label: t('settlements.status'), 
      sortable: true, 
      render: (row) => (
        <Badge variant={getStatusVariant(row.status)}>
          {t(`settlements.${row.status}`)}
        </Badge>
      )
    },
    { 
      key: 'actions', 
      label: t('common.actions'), 
      sortable: false, 
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleDownload(row)}
            className="p-2 rounded-lg text-glacier-500 hover:text-glacier-700 hover:bg-glacier-50 transition-colors"
            title={t('settlements.download')}
          >
            <FileText size={16} />
          </button>
          {isAdmin && row.status === 'generated' && (
            <button
              onClick={() => handleApprove(row)}
              className="p-2 rounded-lg text-aurora-500 hover:text-aurora-700 hover:bg-aurora-50 transition-colors"
              title={t('settlements.approve')}
            >
              <Check size={16} />
            </button>
          )}
          {isAdmin && row.status === 'approved' && (
            <button
              onClick={() => handleMarkPaid(row)}
              className="p-2 rounded-lg text-aurora-600 hover:text-aurora-800 hover:bg-aurora-50 transition-colors"
              title={t('settlements.markPaid')}
            >
              <TrendingUp size={16} />
            </button>
          )}
          <button
            onClick={() => handleDelete(row)}
            className="p-2 rounded-lg text-frostbite-500 hover:text-frostbite-700 hover:bg-frostbite-50 transition-colors"
            title={t('common.delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const farmerOptions = farmers.map(farmer => ({
    value: farmer.id,
    label: farmer.name
  }));

  return (
    <div className="min-h-screen bg-arctic-ice">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-glacier-500 via-glacier-600 to-glacier-700 px-6 py-8 print:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-white">
                  {t('settlements.title')}
                </h1>
                <p className="text-glacier-100 mt-1">
                  {t('settlements.subtitle')}
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
              
              {isAdmin && (
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-glacier-700 font-semibold rounded-xl hover:bg-glacier-50 transition-colors shadow-lg"
                >
                  <Plus size={18} />
                  {t('settlements.generateSettlement')}
                </button>
              )}
            </div>
          </div>
          
          {/* Summary Stats in Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <p className="text-glacier-100 text-sm">{t('settlements.totalSettlements')}</p>
              <p className="text-2xl font-bold text-white font-mono">
                {filteredSettlements.length}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <p className="text-glacier-100 text-sm">{t('settlements.pendingApproval')}</p>
              <p className="text-2xl font-bold text-gold-300 font-mono">
                {filteredSettlements.filter(s => s.status === 'generated').length}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <p className="text-glacier-100 text-sm">{t('settlements.approved')}</p>
              <p className="text-2xl font-bold text-glacier-200 font-mono">
                {filteredSettlements.filter(s => s.status === 'approved').length}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <p className="text-glacier-100 text-sm">{t('settlements.paid')}</p>
              <p className="text-2xl font-bold text-aurora-300 font-mono">
                {filteredSettlements.filter(s => s.status === 'paid').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <SettlementSummary 
          {...summaryStats}
          loading={loading}
        />

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm p-4 print:hidden">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-arctic-mist" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night placeholder-arctic-mist focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-arctic-mist" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Settlements Table */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredSettlements.map(settlement => ({
              id: settlement.id,
              settlementId: settlement.settlementId,
              farmerId: settlement.farmerId,
              startDate: settlement.startDate,
              endDate: settlement.endDate,
              totalAmount: settlement.totalAmount,
              advancesDeducted: settlement.advancesDeducted,
              netAmount: settlement.netAmount,
              status: settlement.status
            }))}
            emptyMessage={t('settlements.noSettlements')}
            loading={loading}
            defaultSort={{ key: 'settlementId', direction: 'desc' }}
          />
        </div>

        {/* Empty State */}
        {!loading && filteredSettlements.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-arctic-ice rounded-full flex items-center justify-center">
              <Receipt size={32} className="text-arctic-mist" />
            </div>
            <h3 className="text-lg font-semibold text-arctic-night mb-2">
              {t('settlements.noSettlements')}
            </h3>
            <p className="text-arctic-charcoal mb-4">
              {t('settlements.noSettlementsDescription')}
            </p>
            {isAdmin && (
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-glacier-500 text-white font-semibold rounded-xl hover:bg-glacier-600 transition-colors"
              >
                <Plus size={18} />
                {t('settlements.generateSettlement')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Generate Settlement Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title={t('settlements.generateSettlement')}
        size="md"
      >
        <form onSubmit={handleGenerateSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('settlements.selectFarmer')}
              </label>
              <Select
                value={generateFormData.farmerId}
                onChange={(value) => setGenerateFormData({ ...generateFormData, farmerId: value })}
                options={farmerOptions}
                placeholder={t('settlements.selectFarmerPlaceholder')}
                required
                autoFocus
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-arctic-night mb-1.5">
                  {t('settlements.startDate')}
                </label>
                <Input
                  type="date"
                  value={generateFormData.startDate}
                  onChange={(e) => setGenerateFormData({ ...generateFormData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-arctic-night mb-1.5">
                  {t('settlements.endDate')}
                </label>
                <Input
                  type="date"
                  value={generateFormData.endDate}
                  onChange={(e) => setGenerateFormData({ ...generateFormData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-arctic-border">
            <Button
              variant="secondary"
              onClick={() => setShowGenerateModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Download}
            >
              {t('settlements.generate')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title={t('settlements.deleteConfirm')}
        message={t('settlements.deleteMessage', { id: deletingSettlement?.settlementId || deletingSettlement?.id?.slice(-8) })}
        variant="danger"
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          
          body {
            background: white !important;
          }
          
          .bg-gradient-to-r {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SettlementsPage;
