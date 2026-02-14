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
import { Plus, Search, Check, X, Edit, Trash2 } from 'lucide-react';

const CashAdvancesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { advances, loading, fetchAdvances, addAdvance, updateAdvance, deleteAdvance } = useCashAdvances();
  const { farmers, loading: farmersLoading } = useFarmers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [deletingAdvance, setDeletingAdvance] = useState(null);
  const [formData, setFormData] = useState({
    farmerId: '',
    amount: '',
    date: '',
    reason: ''
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchAdvances();
    farmers.length === 0 && !farmersLoading && fetchFarmers();
  }, [fetchAdvances, farmers, farmersLoading]);

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

  const filteredAdvances = advances.filter(advance => {
    const searchLower = searchTerm.toLowerCase();
    const farmer = farmers.find(f => f.id === advance.farmerId);
    return (
      farmer?.name.toLowerCase().includes(searchLower) ||
      advance.amount.toString().includes(searchLower) ||
      advance.date.includes(searchLower)
    );
  });

  const columns = [
    { key: 'date', label: t('common.date'), sortable: true },
    { key: 'farmer', label: t('cashAdvances.farmer'), sortable: false, render: (row) => {
      const farmer = farmers.find(f => f.id === row.farmerId);
      return farmer?.name || 'Unknown';
    }},
    { key: 'amount', label: t('cashAdvances.amount'), sortable: true, render: (row) => `₹${row.amount}` },
    { key: 'reason', label: t('cashAdvances.reason'), sortable: false, render: (row) => row.reason || '-' },
    { key: 'status', label: t('cashAdvances.status'), sortable: true, render: (row) => (
      <Badge variant={row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'}>
        {t(`cashAdvances.${row.status}`)}
      </Badge>
    )},
    { key: 'actions', label: t('common.actions'), sortable: false, render: (row) => (
      <div className="flex items-center gap-2">
        {isAdmin && row.status === 'pending' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              icon={Check}
              onClick={() => handleApprove(row)}
              title={t('cashAdvances.approve')}
              className="text-emerald-600"
            />
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={() => handleReject(row)}
              title={t('cashAdvances.reject')}
              className="text-accent-crimson"
            />
          </>
        )}
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

  const farmerOptions = farmers.map(farmer => ({
    value: farmer.id,
    label: farmer.name
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-warm-charcoal">
          {t('cashAdvances.title')}
        </h1>
        
        <Button
          variant="primary"
          icon={Plus}
          onClick={handleAdd}
        >
          {t('cashAdvances.addAdvance')}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <Card.Body>
          <div className="flex items-center gap-2">
            <Search size={20} className="text-warm-brown" />
            <Input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1"
            />
          </div>
        </Card.Body>
      </Card>

      {/* Advances Table */}
      <Card>
        <Card.Body>
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
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAdvance ? t('cashAdvances.editAdvance') : t('cashAdvances.addAdvance')}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Select
              label={t('cashAdvances.farmer')}
              value={formData.farmerId}
              onChange={(value) => setFormData({ ...formData, farmerId: value })}
              options={farmerOptions}
              required
              autoFocus
            />
            <NumberInput
              label={t('cashAdvances.amount')}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              min={0}
              precision={2}
              prefix="₹"
            />
            <Input
              label={t('common.date')}
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label={t('cashAdvances.reason')}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
        message={t('cashAdvances.deleteMessage', { amount: deletingAdvance?.amount })}
        variant="danger"
      />
    </div>
  );
};

export default CashAdvancesPage;
