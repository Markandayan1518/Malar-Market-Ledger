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
import { Plus, Edit, Trash2, Star } from 'lucide-react';

const MarketRatesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { rates, loading, currentRate, fetchRates, addRate, updateRate, deleteRate, setCurrentRate } = useMarketRates();
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [deletingRate, setDeletingRate] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    rate: '',
    notes: ''
  });

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

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

  const columns = [
    { key: 'date', label: t('common.date'), sortable: true },
    { key: 'rate', label: t('marketRates.rate'), sortable: true, render: (row) => `₹${row.rate}/kg` },
    { key: 'notes', label: t('marketRates.notes'), sortable: false, render: (row) => row.notes || '-' },
    { key: 'isCurrent', label: t('marketRates.current'), sortable: false, render: (row) => (
      row.isCurrent ? (
        <Badge variant="success" size="sm">
          {t('marketRates.active')}
        </Badge>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          icon={Star}
          onClick={() => handleSetCurrent(row)}
          title={t('marketRates.setCurrent')}
        />
      )
    )},
    { key: 'actions', label: t('common.actions'), sortable: false, render: (row) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={Edit}
          onClick={() => handleEdit(row)}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          onClick={() => handleDelete(row)}
          className="text-accent-crimson"
        />
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-warm-charcoal">
          {t('marketRates.title')}
        </h1>
        
        <Button
          variant="primary"
          icon={Plus}
          onClick={handleAdd}
        >
          {t('marketRates.addRate')}
        </Button>
      </div>

      {/* Current Rate Card */}
      <Card>
        <Card.Body>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-brown mb-1">
                {t('marketRates.currentRate')}
              </p>
              <p className="text-3xl font-bold text-warm-charcoal">
                ₹{currentRate?.rate || '0.00'}/kg
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-warm-brown mb-1">
                {t('marketRates.effectiveFrom')}
              </p>
              <p className="text-lg font-semibold text-warm-charcoal">
                {currentRate?.date || '-'}
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Rates Table */}
      <Card>
        <Card.Body>
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
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRate ? t('marketRates.editRate') : t('marketRates.addRate')}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label={t('common.date')}
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              autoFocus
            />
            <NumberInput
              label={t('marketRates.rate')}
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              required
              min={0}
              precision={2}
              prefix="₹"
              suffix="/kg"
            />
            <Input
              label={t('marketRates.notes')}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
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
