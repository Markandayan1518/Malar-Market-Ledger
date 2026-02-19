import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useMarketRates } from '../hooks/useMarketRates';
import { useNotification } from '../context/NotificationContext';
import DataTable from '../components/data/DataTable';
import Card from '../components/data/Card';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import NumberInput from '../components/forms/NumberInput';
import Modal from '../components/feedback/Modal';
import ConfirmationDialog from '../components/feedback/ConfirmationDialog';
import Badge from '../components/data/Badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  StarOff,
  TrendingUp,
  TrendingDown,
  Calendar,
  IndianRupee,
  RefreshCw,
  Clock,
  History
} from 'lucide-react';

/**
 * Arctic Frost Theme - Market Rates Page
 * 
 * Redesigned with Arctic Frost design system:
 * - Gold gradient header (rates are money-focused)
 * - Large current rate display card
 * - Time slot cards with rate info
 * - Historical rates table with animations
 * - Save animation feedback
 */
const MarketRatesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { rates, loading, currentRate, fetchRates, addRate, updateRate, deleteRate, setCurrentRate } = useMarketRates();
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [deletingRate, setDeletingRate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    rate: '',
    notes: ''
  });

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRates();
    setIsRefreshing(false);
    showNotification('success', t('common.refreshed'));
  };

  const handleAdd = () => {
    setEditingRate(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      rate: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (rate) => {
    setEditingRate(rate);
    setFormData({
      date: rate.date,
      rate: rate.rate.toString(),
      notes: rate.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = (rate) => {
    setDeletingRate(rate);
    setShowDeleteDialog(true);
  };

  const handleSetCurrent = async (rate) => {
    try {
      await setCurrentRate(rate.id);
      showNotification('success', t('marketRates.currentRateSet'));
      await fetchRates();
    } catch (error) {
      showNotification('error', t('marketRates.error'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const rateData = {
        date: formData.date,
        rate: parseFloat(formData.rate),
        notes: formData.notes
      };

      if (editingRate) {
        await updateRate(editingRate.id, rateData);
        showNotification('success', t('marketRates.updateSuccess'));
      } else {
        await addRate(rateData);
        showNotification('success', t('marketRates.addSuccess'));
      }
      setShowModal(false);
      await fetchRates();
    } catch (error) {
      showNotification('error', t('marketRates.saveError'));
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteRate(deletingRate.id);
      showNotification('success', t('marketRates.deleteSuccess'));
      setShowDeleteDialog(false);
      await fetchRates();
    } catch (error) {
      showNotification('error', t('marketRates.deleteError'));
    }
  };

  // Calculate rate change from previous
  const getRateChange = () => {
    if (rates.length < 2) return null;
    const sorted = [...rates].sort((a, b) => new Date(b.date) - new Date(a.date));
    const current = sorted.find(r => r.isCurrent);
    if (!current) return null;
    const previous = sorted.find(r => !r.isCurrent && r.date < current.date);
    if (!previous) return null;
    const change = current.rate - previous.rate;
    const percentChange = ((change / previous.rate) * 100).toFixed(1);
    return { change, percentChange, isIncrease: change > 0 };
  };

  const rateChange = getRateChange();

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
      key: 'rate', 
      label: t('marketRates.rate'), 
      sortable: true, 
      render: (row) => (
        <span className="font-mono text-lg font-semibold text-arctic-night">
          ₹{row.rate.toLocaleString('en-IN')}/kg
        </span>
      )
    },
    { 
      key: 'notes', 
      label: t('marketRates.notes'), 
      sortable: false, 
      render: (row) => (
        row.notes ? (
          <span className="text-arctic-charcoal truncate max-w-xs block">{row.notes}</span>
        ) : (
          <span className="text-arctic-mist">—</span>
        )
      )
    },
    { 
      key: 'isCurrent', 
      label: t('marketRates.status'), 
      sortable: false, 
      render: (row) => (
        row.isCurrent ? (
          <Badge variant="success" size="md">
            <Star size={12} className="mr-1" />
            {t('marketRates.active')}
          </Badge>
        ) : (
          <button
            onClick={() => handleSetCurrent(row)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gold-600 bg-gold-50 rounded-lg hover:bg-gold-100 transition-colors"
            title={t('marketRates.setCurrent')}
          >
            <StarOff size={14} />
            {t('marketRates.setAsCurrent')}
          </button>
        )
      )
    },
    { 
      key: 'actions', 
      label: t('common.actions'), 
      sortable: false, 
      render: (row) => (
        <div className="flex items-center gap-1">
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

  return (
    <div className="min-h-screen bg-arctic-ice">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-gold-500 via-gold-600 to-gold-700 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-white">
                  {t('marketRates.title')}
                </h1>
                <p className="text-gold-100 mt-1">
                  {t('marketRates.subtitle')}
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
                {t('marketRates.addRate')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Current Rate Hero Card */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gold-50 to-aurora-50 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Current Rate Display */}
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg">
                  <IndianRupee size={40} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gold-600 uppercase tracking-wide mb-1">
                    {t('marketRates.currentRateLabel')}
                  </p>
                  <p className="text-4xl font-bold text-arctic-night font-mono">
                    ₹{currentRate?.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                    <span className="text-xl font-normal text-arctic-charcoal">/kg</span>
                  </p>
                </div>
              </div>
              
              {/* Rate Change Indicator */}
              {rateChange && (
                <div className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl
                  ${rateChange.isIncrease ? 'bg-aurora-100 text-aurora-700' : 'bg-frostbite-100 text-frostbite-700'}
                `}>
                  {rateChange.isIncrease ? (
                    <TrendingUp size={20} />
                  ) : (
                    <TrendingDown size={20} />
                  )}
                  <div>
                    <p className="font-mono font-semibold">
                      {rateChange.isIncrease ? '+' : ''}{rateChange.change.toFixed(2)}
                    </p>
                    <p className="text-xs opacity-75">
                      {rateChange.percentChange}%
                    </p>
                  </div>
                </div>
              )}
              
              {/* Effective Date */}
              <div className="flex items-center gap-3 text-arctic-charcoal">
                <div className="p-3 bg-white rounded-xl border border-arctic-border">
                  <Calendar size={24} className="text-gold-500" />
                </div>
                <div>
                  <p className="text-xs text-arctic-mist uppercase tracking-wide">
                    {t('marketRates.effectiveFrom')}
                  </p>
                  <p className="font-semibold text-lg">
                    {currentRate?.date || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-arctic-border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold-100 rounded-lg">
                <History size={20} className="text-gold-600" />
              </div>
              <div>
                <p className="text-xs text-arctic-mist uppercase tracking-wide">
                  {t('marketRates.totalRates')}
                </p>
                <p className="text-xl font-bold text-arctic-night font-mono">
                  {rates.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-arctic-border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-aurora-100 rounded-lg">
                <TrendingUp size={20} className="text-aurora-600" />
              </div>
              <div>
                <p className="text-xs text-arctic-mist uppercase tracking-wide">
                  {t('marketRates.highestRate')}
                </p>
                <p className="text-xl font-bold text-arctic-night font-mono">
                  ₹{Math.max(...rates.map(r => r.rate), 0).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-arctic-border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-frostbite-100 rounded-lg">
                <TrendingDown size={20} className="text-frostbite-600" />
              </div>
              <div>
                <p className="text-xs text-arctic-mist uppercase tracking-wide">
                  {t('marketRates.lowestRate')}
                </p>
                <p className="text-xl font-bold text-arctic-night font-mono">
                  ₹{Math.min(...rates.map(r => r.rate), 0).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-arctic-border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-glacier-100 rounded-lg">
                <Clock size={20} className="text-glacier-600" />
              </div>
              <div>
                <p className="text-xs text-arctic-mist uppercase tracking-wide">
                  {t('marketRates.avgRate')}
                </p>
                <p className="text-xl font-bold text-arctic-night font-mono">
                  ₹{(rates.reduce((sum, r) => sum + r.rate, 0) / (rates.length || 1)).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rates Table */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-arctic-border">
            <h2 className="font-semibold text-arctic-night flex items-center gap-2">
              <History size={18} className="text-gold-500" />
              {t('marketRates.rateHistory')}
            </h2>
          </div>
          <DataTable
            columns={columns}
            data={rates.map(rate => ({
              id: rate.id,
              date: rate.date,
              rate: rate.rate,
              notes: rate.notes,
              isCurrent: rate.isCurrent
            }))}
            emptyMessage={t('marketRates.noRates')}
            loading={loading}
            defaultSort={{ key: 'date', direction: 'desc' }}
          />
        </div>

        {/* Empty State */}
        {!loading && rates.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-arctic-border">
            <div className="w-16 h-16 mx-auto mb-4 bg-gold-100 rounded-full flex items-center justify-center">
              <TrendingUp size={32} className="text-gold-500" />
            </div>
            <h3 className="text-lg font-semibold text-arctic-night mb-2">
              {t('marketRates.noRates')}
            </h3>
            <p className="text-arctic-charcoal mb-4">
              {t('marketRates.noRatesDescription')}
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white font-semibold rounded-xl hover:bg-gold-600 transition-colors"
            >
              <Plus size={18} />
              {t('marketRates.addRate')}
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRate ? t('marketRates.editRate') : t('marketRates.addRate')}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                  autoFocus
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('marketRates.rate')} *
              </label>
              <div className="relative">
                <IndianRupee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-arctic-mist" />
                <input
                  type="number"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="w-full pl-10 pr-16 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night font-mono focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-arctic-mist text-sm">
                  /kg
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('marketRates.notes')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night placeholder-arctic-mist focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all resize-none"
                placeholder={t('marketRates.notesPlaceholder')}
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
              {editingRate ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title={t('marketRates.deleteConfirm')}
        message={t('marketRates.deleteMessage', { date: deletingRate?.date })}
        variant="danger"
      />
    </div>
  );
};

export default MarketRatesPage;
