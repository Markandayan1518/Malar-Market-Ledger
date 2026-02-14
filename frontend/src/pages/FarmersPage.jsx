import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useFarmers } from '../hooks/useFarmers';
import { useNotification } from '../context/NotificationContext';
import DataTable from '../components/data/DataTable';
import Card from '../components/data/Card';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import Modal from '../components/feedback/Modal';
import ConfirmationDialog from '../components/feedback/ConfirmationDialog';
import { Plus, Search, Edit, Trash2, Phone } from 'lucide-react';

const FarmersPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { farmers, loading, fetchFarmers, addFarmer, updateFarmer, deleteFarmer } = useFarmers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [deletingFarmer, setDeletingFarmer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    village: '',
    notes: ''
  });

  const isAdmin = user?.role === 'admin';
  const isReadOnly = !isAdmin;

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleAdd = () => {
    setEditingFarmer(null);
    setFormData({
      name: '',
      phone: '',
      village: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (farmer) => {
    setEditingFarmer(farmer);
    setFormData({
      name: farmer.name,
      phone: farmer.phone || '',
      village: farmer.village || '',
      notes: farmer.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = (farmer) => {
    setDeletingFarmer(farmer);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingFarmer) {
        await updateFarmer(editingFarmer.id, formData);
        showNotification('success', t('farmers.updateSuccess'));
      } else {
        await addFarmer(formData);
        showNotification('success', t('farmers.addSuccess'));
      }
      setShowModal(false);
      await fetchFarmers();
    } catch (error) {
      showNotification('error', t('farmers.saveError'));
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteFarmer(deletingFarmer.id);
      showNotification('success', t('farmers.deleteSuccess'));
      setShowDeleteDialog(false);
      await fetchFarmers();
    } catch (error) {
      showNotification('error', t('farmers.deleteError'));
    }
  };

  const filteredFarmers = farmers.filter(farmer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      farmer.name.toLowerCase().includes(searchLower) ||
      farmer.phone?.includes(searchLower) ||
      farmer.village?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    { key: 'name', label: t('farmers.name'), sortable: true },
    { key: 'phone', label: t('farmers.phone'), sortable: false, render: (row) => (
      row.phone ? (
        <a href={`tel:${row.phone}`} className="flex items-center gap-2 text-accent-magenta hover:underline">
          <Phone size={16} />
          {row.phone}
        </a>
      ) : '-'
    )},
    { key: 'village', label: t('farmers.village'), sortable: true },
    { key: 'notes', label: t('farmers.notes'), sortable: false, render: (row) => row.notes || '-' },
    ...(isAdmin ? [{
      key: 'actions',
      label: t('common.actions'),
      sortable: false,
      render: (row) => (
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
      )
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-warm-charcoal">
          {t('farmers.title')}
        </h1>
        
        {!isReadOnly && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleAdd}
          >
            {t('farmers.addFarmer')}
          </Button>
        )}
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

      {/* Farmers Table */}
      <Card>
        <Card.Body>
          <DataTable
            columns={columns}
            data={filteredFarmers.map(farmer => ({
              id: farmer.id,
              name: farmer.name,
              phone: farmer.phone,
              village: farmer.village,
              notes: farmer.notes
            }))}
            emptyMessage={t('farmers.noFarmers')}
            loading={loading}
          />
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFarmer ? t('farmers.editFarmer') : t('farmers.addFarmer')}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label={t('farmers.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
            <Input
              label={t('farmers.phone')}
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label={t('farmers.village')}
              value={formData.village}
              onChange={(e) => setFormData({ ...formData, village: e.target.value })}
            />
            <Input
              label={t('farmers.notes')}
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
              {editingFarmer ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title={t('farmers.deleteConfirm')}
        message={t('farmers.deleteMessage', { name: deletingFarmer?.name })}
        variant="danger"
      />
    </div>
  );
};

export default FarmersPage;
