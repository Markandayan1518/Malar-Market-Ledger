import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCashAdvances } from '../hooks/useCashAdvances';
import { useFarmers } from '../hooks/useFarmers';
import { useNotification } from '../context/NotificationContext';
import DataTable from '../components/data/DataTable';
import Card from '../components/data/Card';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import NumberInput from '../components/forms/NumberInput';
import Select from '../components/forms/Select';
import Modal from '../components/feedback/Modal';
import ConfirmationDialog from '../components/feedback/ConfirmationDialog';
import Badge from '../components/data/Badge';
import { 
  Plus, 
  Search, 
  Check, 
  X, 
  Edit, 
  Trash2,
  IndianRupee,
  Calendar,
  User,
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Clock
} from 'lucide-react';

/**
 * Arctic Frost Theme - Cash Advances Page
 * 
 * Redesigned with Arctic Frost design system:
 * - Gold gradient header (money-focused)
 * - Balance indicator component
 * - Status badges with aurora/frostbite colors
 * - Repayment tracking UI
 * - Mobile card view
 */
const CashAdvancesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { advances, loading, fetchAdvances, addAdvance, updateAdvance, deleteAdvance } = useCashAdvances();
  const { farmers, loading: farmersLoading } = useFarmers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [deletingAdvance, setDeletingAdvance] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    farmerId: '',
    amount: '',
    date: '',
    reason: ''
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchAdvances();
  }, [fetchAdvances]);

  // Calculate summary statistics
  const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);
  const pendingAdvances = advances.filter(a => a.status === 'pending');
  const pendingAmount = pendingAdvances.reduce((sum, a) => sum + a.amount, 0);
  const approvedAdvances = advances.filter(a => a.status === 'approved');
  const approvedAmount = approvedAdvances.reduce((sum, a) => sum + a.amount, 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAdvances();
    setIsRefreshing(false);
    showNotification('success', t('common.refreshed'));
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleAdd = () => {
    setEditingAdvance(null);
    setFormData({
      farmerId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      reason: ''
    });
    setShowModal(true);
  };

  const handleEdit = (advance) => {
    setEditingAdvance(advance);
    setFormData({
      farmerId: advance.farmerId,
      amount: advance.amount.toString(),
      date: advance.date,
      reason: advance.reason || ''
    });
    setShowModal(true);
  };

  const handleDelete = (advance) => {
    setDeletingAdvance(advance);
    setShowDeleteDialog(true);
  };

  const handleApprove = async (advance) => {
    try {
      await updateAdvance(advance.id, { status: 'approved' });
      showNotification('success', t('cashAdvances.approveSuccess'));
      await fetchAdvances();
    } catch (error) {
      showNotification('error', t('cashAdvances.error'));
    }
  };

  const handleReject = async (advance) => {
    try {
      await updateAdvance(advance.id, { status: 'rejected' });
      showNotification('success', t('cashAdvances.rejectSuccess'));
      await fetchAdvances();
    } catch (error) {
      showNotification('error', t('cashAdvances.error'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const advanceData = {
        farmerId: formData.farmerId,
        amount: parseFloat(formData.amount),
        date: formData.date,
        reason: formData.reason
      };

      if (editingAdvance) {
        await updateAdvance(editingAdvance.id, advanceData);
        showNotification('success', t('cashAdvances.updateSuccess'));
      } else {
        await addAdvance(advanceData);
        showNotification('success', t('cashAdvances.addSuccess'));
      }
      setShowModal(false);
      await fetchAdvances();
    } catch (error) {
      showNotification('error', t('cashAdvances.saveError'));
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteAdvance(deletingAdvance.id);
      showNotification('success', t('cashAdvances.deleteSuccess'));
      setShowDeleteDialog(false);
      await fetchAdvances();
    } catch (error) {
      showNotification('error', t('cashAdvances.deleteError'));
    }
  };

  // Filter advances
  const filteredAdvances = advances.filter(advance => {
    const searchLower = searchTerm.toLowerCase();
    const farmer = farmers.find(f => f.id === advance.farmerId);
    const matchesSearch = (
      farmer?.name.toLowerCase().includes(searchLower) ||
      advance.amount.toString().includes(searchLower) ||
      advance.date.includes(searchLower)
    );
    const matchesStatus = statusFilter === 'all' || advance.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Status filter options
  const statusOptions = [
    { value: 'all', label: t('cashAdvances.allStatuses') },
    { value: 'pending', label: t('cashAdvances.pending') },
    { value: 'approved', label: t('cashAdvances.approved') },
    { value: 'rejected', label: t('cashAdvances.rejected') }
  ];

  // Get status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'approved':
        return 'success'; // aurora-green
      case 'rejected':
        return 'danger'; // frostbite-red
      case 'pending':
        return 'warning'; // gold-ice
      default:
        return 'default';
    }
  };

  const columns = [
    { 
      key: 'date', 
      label: t('common.date'), 
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gold-500" />
          <span className="text-arctic-night">{row.date}</span>
        </div>
      )
    },
    { 
      key: 'farmer', 
      label: t('cashAdvances.farmer'), 
      sortable: false, 
      render: (row) => {
        const farmer = farmers.find(f => f.id === row.farmerId);
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center">
              <User size={14} className="text-gold-600" />
            </div>
            <span className="font-medium text-arctic-night">
              {farmer?.name || 'Unknown'}
            </span>
          </div>
        );
      }
    },
    { 
      key: 'amount', 
      label: t('cashAdvances.amount'), 
      sortable: true, 
      render: (row) => (
        <span className="font-mono text-lg font-semibold text-gold-700">
          ₹{row.amount?.toLocaleString('en-IN')}
        </span>
      )
    },
    { 
      key: 'reason', 
      label: t('cashAdvances.reason'), 
      sortable: false, 
      render: (row) => (
        row.reason ? (
          <span className="text-arctic-charcoal truncate max-w-xs block">{row.reason}</span>
        ) : (
          <span className="text-arctic-mist">—</span>
        )
      )
    },
    { 
      key: 'status', 
      label: t('cashAdvances.status'), 
      sortable: true, 
      render: (row) => (
        <Badge variant={getStatusVariant(row.status)}>
          {t(`cashAdvances.${row.status}`)}
        </Badge>
      )
    },
    { 
      key: 'actions', 
      label: t('common.actions'), 
      sortable: false, 
      render: (row) => (
        <div className="flex items-center gap-1">
          {isAdmin && row.status === 'pending' && (
            <>
              <button
                onClick={() => handleApprove(row)}
                className="p-2 rounded-lg text-aurora-500 hover:text-aurora-700 hover:bg-aurora-50 transition-colors"
                title={t('cashAdvances.approve')}
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => handleReject(row)}
                className="p-2 rounded-lg text-frostbite-500 hover:text-frostbite-700 hover:bg-frostbite-50 transition-colors"
                title={t('cashAdvances.reject')}
              >
                <X size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => handleEdit(row)}
            className="p-2 rounded-lg text-glacier-500 hover:text-glacier-700 hover:bg-glacier-50 transition-colors"
            title={t('common.edit')}
          >
            <Edit size={16} />
          </button>
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
      <div className="bg-gradient-to-r from-gold-500 via-gold-600 to-gold-700 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-white">
                  {t('cashAdvances.title')}
                </h1>
                <p className="text-gold-100 mt-1">
                  {t('cashAdvances.subtitle')}
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
              
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-gold-700 font-semibold rounded-xl hover:bg-gold-50 transition-colors shadow-lg"
              >
                <Plus size={18} />
                {t('cashAdvances.addAdvance')}
              </button>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <p className="text-gold-100 text-sm">{t('cashAdvances.totalAdvances')}</p>
              <p className="text-2xl font-bold text-white font-mono">
                {advances.length}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <p className="text-gold-100 text-sm">{t('cashAdvances.totalAmount')}</p>
              <p className="text-2xl font-bold text-white font-mono">
                ₹{totalAdvances.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gold-200" />
                <p className="text-gold-100 text-sm">{t('cashAdvances.pending')}</p>
              </div>
              <p className="text-2xl font-bold text-gold-200 font-mono">
                {pendingAdvances.length}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-aurora-300" />
                <p className="text-gold-100 text-sm">{t('cashAdvances.approved')}</p>
              </div>
              <p className="text-2xl font-bold text-aurora-300 font-mono">
                {approvedAdvances.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Balance Indicator */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg">
                <IndianRupee size={28} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-arctic-mist uppercase tracking-wide">
                  {t('cashAdvances.pendingAmount')}
                </p>
                <p className="text-3xl font-bold text-gold-700 font-mono">
                  ₹{pendingAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-aurora-50 rounded-xl border border-aurora-200">
                <p className="text-xs text-aurora-600 uppercase tracking-wide">{t('cashAdvances.approvedAmount')}</p>
                <p className="text-lg font-bold text-aurora-700 font-mono">₹{approvedAmount.toLocaleString('en-IN')}</p>
              </div>
              <div className="px-4 py-2 bg-frostbite-50 rounded-xl border border-frostbite-200">
                <p className="text-xs text-frostbite-600 uppercase tracking-wide">{t('cashAdvances.rejectedAmount')}</p>
                <p className="text-lg font-bold text-frostbite-700 font-mono">
                  ₹{advances.filter(a => a.status === 'rejected').reduce((sum, a) => sum + a.amount, 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-arctic-mist" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night placeholder-arctic-mist focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-arctic-mist" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
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

        {/* Advances Table - Desktop */}
        <div className="hidden md:block bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredAdvances.map(advance => ({
              id: advance.id,
              farmerId: advance.farmerId,
              amount: advance.amount,
              date: advance.date,
              reason: advance.reason,
              status: advance.status
            }))}
            emptyMessage={t('cashAdvances.noAdvances')}
            loading={loading}
            defaultSort={{ key: 'date', direction: 'desc' }}
          />
        </div>

        {/* Advances Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-arctic-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-arctic-ice rounded w-24"></div>
                  <div className="h-6 bg-arctic-ice rounded w-16"></div>
                </div>
                <div className="h-6 bg-arctic-ice rounded w-32"></div>
              </div>
            ))
          ) : filteredAdvances.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-arctic-border">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold-100 rounded-full flex items-center justify-center">
                <Wallet size={32} className="text-gold-500" />
              </div>
              <h3 className="text-lg font-semibold text-arctic-night mb-2">
                {t('cashAdvances.noAdvances')}
              </h3>
              <p className="text-arctic-charcoal mb-4">
                {t('cashAdvances.noAdvancesDescription')}
              </p>
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white font-semibold rounded-xl hover:bg-gold-600 transition-colors"
              >
                <Plus size={18} />
                {t('cashAdvances.addAdvance')}
              </button>
            </div>
          ) : (
            filteredAdvances.map(advance => {
              const farmer = farmers.find(f => f.id === advance.farmerId);
              return (
                <div 
                  key={advance.id}
                  className="bg-white rounded-xl border border-arctic-border p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gold-500" />
                      <span className="text-sm text-arctic-charcoal">{advance.date}</span>
                    </div>
                    <Badge variant={getStatusVariant(advance.status)} size="sm">
                      {t(`cashAdvances.${advance.status}`)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center">
                      <User size={14} className="text-gold-600" />
                    </div>
                    <span className="font-medium text-arctic-night">{farmer?.name || 'Unknown'}</span>
                  </div>
                  
                  <p className="text-2xl font-bold text-gold-700 font-mono mb-2">
                    ₹{advance.amount?.toLocaleString('en-IN')}
                  </p>
                  
                  {advance.reason && (
                    <p className="text-sm text-arctic-charcoal mb-3">
                      {advance.reason}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-arctic-border">
                    {isAdmin && advance.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(advance)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-aurora-50 text-aurora-700 rounded-lg hover:bg-aurora-100 transition-colors"
                        >
                          <Check size={16} />
                          {t('cashAdvances.approve')}
                        </button>
                        <button
                          onClick={() => handleReject(advance)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-frostbite-50 text-frostbite-700 rounded-lg hover:bg-frostbite-100 transition-colors"
                        >
                          <X size={16} />
                          {t('cashAdvances.reject')}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleEdit(advance)}
                      className="p-2 rounded-lg text-glacier-500 hover:bg-glacier-50 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(advance)}
                      className="p-2 rounded-lg text-frostbite-500 hover:bg-frostbite-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAdvance ? t('cashAdvances.editAdvance') : t('cashAdvances.addAdvance')}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('cashAdvances.selectFarmer')} *
              </label>
              <Select
                value={formData.farmerId}
                onChange={(value) => setFormData({ ...formData, farmerId: value })}
                options={farmerOptions}
                placeholder={t('cashAdvances.selectFarmerPlaceholder')}
                required
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('cashAdvances.amount')} *
              </label>
              <div className="relative">
                <IndianRupee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-arctic-mist" />
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night font-mono focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('common.date')} *
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-arctic-mist" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('cashAdvances.reason')}
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night placeholder-arctic-mist focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all resize-none"
                placeholder={t('cashAdvances.reasonPlaceholder')}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-arctic-border">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {editingAdvance ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title={t('cashAdvances.deleteConfirm')}
        message={t('cashAdvances.deleteMessage', { amount: deletingAdvance?.amount?.toLocaleString('en-IN') })}
        variant="danger"
      />
    </div>
  );
};

export default CashAdvancesPage;
