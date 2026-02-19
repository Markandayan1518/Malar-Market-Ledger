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
import Badge from '../components/data/Badge';
import FarmerProductsSelector from '../components/farmers/FarmerProductsSelector';
import farmerProductService from '../services/farmerProductService';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  MapPin,
  User,
  Users,
  FileText,
  RefreshCw,
  Filter,
  Download,
  Flower2
} from 'lucide-react';

/**
 * Arctic Frost Theme - Farmers Page
 * 
 * Redesigned with Arctic Frost design system:
 * - Gradient header with farmer statistics
 * - Card-based farmer list for mobile view
 * - Frosted glass modals
 * - Status badges with aurora colors
 * - Smooth animations and transitions
 */
const FarmersPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { farmers, loading, fetchFarmers, addFarmer, updateFarmer, deleteFarmer } = useFarmers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [villageFilter, setVillageFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [deletingFarmer, setDeletingFarmer] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    village: '',
    notes: '',
    selectedFlowerIds: []
  });

  const isAdmin = user?.role === 'admin';
  const isReadOnly = !isAdmin;

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  // Get unique villages for filter
  const villages = [...new Set(farmers.map(f => f.village).filter(Boolean))];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFarmers();
    setIsRefreshing(false);
    showNotification('success', t('common.refreshed'));
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleAdd = () => {
    setEditingFarmer(null);
    setFormData({
      name: '',
      phone: '',
      village: '',
      notes: '',
      selectedFlowerIds: []
    });
    setShowModal(true);
  };

  const handleEdit = async (farmer) => {
    setEditingFarmer(farmer);
    setFormData({
      name: farmer.name,
      phone: farmer.phone || '',
      village: farmer.village || '',
      notes: farmer.notes || '',
      selectedFlowerIds: [] // Will be loaded separately
    });
    setShowModal(true);
    
    // Load farmer's linked flowers
    try {
      const response = await farmerProductService.getFarmerProducts(farmer.id);
      const flowerIds = (response.products || []).map(p => p.flower_type_id);
      setFormData(prev => ({ ...prev, selectedFlowerIds: flowerIds }));
    } catch (error) {
      console.error('Failed to load farmer products:', error);
      // Don't show error notification - this is optional data
    }
  };

  const handleDelete = (farmer) => {
    setDeletingFarmer(farmer);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let farmerId = editingFarmer?.id;
      
      if (editingFarmer) {
        await updateFarmer(editingFarmer.id, formData);
        showNotification('success', t('farmers.updateSuccess'));
      } else {
        const newFarmer = await addFarmer(formData);
        farmerId = newFarmer.id;
        showNotification('success', t('farmers.addSuccess'));
      }
      
      // Save farmer products (flower associations)
      if (farmerId && formData.selectedFlowerIds.length > 0) {
        try {
          await farmerProductService.syncFarmerProducts(farmerId, formData.selectedFlowerIds);
        } catch (productError) {
          console.error('Failed to save farmer products:', productError);
          // Don't fail the whole operation, just log the error
        }
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

  // Filter farmers based on search and village
  const filteredFarmers = farmers.filter(farmer => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      farmer.name.toLowerCase().includes(searchLower) ||
      farmer.phone?.includes(searchLower) ||
      farmer.village?.toLowerCase().includes(searchLower)
    );
    const matchesVillage = villageFilter === 'all' || farmer.village === villageFilter;
    return matchesSearch && matchesVillage;
  });

  // Village filter options
  const villageOptions = [
    { value: 'all', label: t('farmers.allVillages') },
    ...villages.map(v => ({ value: v, label: v }))
  ];

  const columns = [
    { 
      key: 'name', 
      label: t('farmers.name'), 
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-glacier-400 to-glacier-600 flex items-center justify-center text-white font-semibold">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-arctic-night">{row.name}</span>
        </div>
      )
    },
    { 
      key: 'phone', 
      label: t('farmers.phone'), 
      sortable: false, 
      render: (row) => (
        row.phone ? (
          <a 
            href={`tel:${row.phone}`} 
            className="flex items-center gap-2 text-glacier-600 hover:text-glacier-800 hover:underline transition-colors"
          >
            <Phone size={16} className="text-glacier-500" />
            <span className="font-mono">{row.phone}</span>
          </a>
        ) : (
          <span className="text-arctic-mist">—</span>
        )
      )
    },
    { 
      key: 'village', 
      label: t('farmers.village'), 
      sortable: true,
      render: (row) => (
        row.village ? (
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-gold-500" />
            <span className="text-arctic-charcoal">{row.village}</span>
          </div>
        ) : (
          <span className="text-arctic-mist">—</span>
        )
      )
    },
    { 
      key: 'notes', 
      label: t('farmers.notes'), 
      sortable: false, 
      render: (row) => (
        row.notes ? (
          <span className="text-arctic-charcoal truncate max-w-xs block">{row.notes}</span>
        ) : (
          <span className="text-arctic-mist">—</span>
        )
      )
    },
    ...(isAdmin ? [{
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
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-arctic-ice">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-aurora-500 via-aurora-600 to-glacier-600 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-white">
                  {t('farmers.title')}
                </h1>
                <p className="text-aurora-100 mt-1">
                  {t('farmers.subtitle')}
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
              
              {!isReadOnly && (
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-aurora-700 font-semibold rounded-xl hover:bg-aurora-50 transition-colors shadow-lg"
                >
                  <Plus size={18} />
                  {t('farmers.addFarmer')}
                </button>
              )}
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <p className="text-aurora-100 text-sm">{t('farmers.totalFarmers')}</p>
              <p className="text-2xl font-bold text-white font-mono">
                {farmers.length}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <p className="text-aurora-100 text-sm">{t('farmers.villages')}</p>
              <p className="text-2xl font-bold text-white font-mono">
                {villages.length}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <p className="text-aurora-100 text-sm">{t('farmers.withPhone')}</p>
              <p className="text-2xl font-bold text-white font-mono">
                {farmers.filter(f => f.phone).length}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <p className="text-aurora-100 text-sm">{t('farmers.filtered')}</p>
              <p className="text-2xl font-bold text-white font-mono">
                {filteredFarmers.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-arctic-mist" />
              <input
                type="text"
                placeholder={t('farmers.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night placeholder-arctic-mist focus:outline-none focus:ring-2 focus:ring-aurora-400 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Village Filter */}
            {villages.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-arctic-mist" />
                <select
                  value={villageFilter}
                  onChange={(e) => setVillageFilter(e.target.value)}
                  className="px-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night focus:outline-none focus:ring-2 focus:ring-aurora-400 focus:border-transparent transition-all"
                >
                  {villageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Farmers Table - Desktop */}
        <div className="hidden md:block bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
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
        </div>

        {/* Farmers Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-arctic-border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-arctic-ice rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-arctic-ice rounded w-24 mb-2"></div>
                    <div className="h-3 bg-arctic-ice rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredFarmers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-arctic-border">
              <div className="w-16 h-16 mx-auto mb-4 bg-arctic-ice rounded-full flex items-center justify-center">
                <Users size={32} className="text-arctic-mist" />
              </div>
              <h3 className="text-lg font-semibold text-arctic-night mb-2">
                {t('farmers.noFarmers')}
              </h3>
              <p className="text-arctic-charcoal mb-4">
                {t('farmers.noFarmersDescription')}
              </p>
              {!isReadOnly && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-aurora-500 text-white font-semibold rounded-xl hover:bg-aurora-600 transition-colors"
                >
                  <Plus size={18} />
                  {t('farmers.addFarmer')}
                </button>
              )}
            </div>
          ) : (
            filteredFarmers.map(farmer => (
              <div 
                key={farmer.id}
                className="bg-white rounded-xl border border-arctic-border p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-glacier-400 to-glacier-600 flex items-center justify-center text-white font-semibold text-lg">
                      {farmer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-arctic-night">{farmer.name}</h3>
                      {farmer.village && (
                        <div className="flex items-center gap-1 text-sm text-arctic-charcoal">
                          <MapPin size={12} className="text-gold-500" />
                          {farmer.village}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(farmer)}
                        className="p-2 rounded-lg text-glacier-500 hover:bg-glacier-50 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(farmer)}
                        className="p-2 rounded-lg text-frostbite-500 hover:bg-frostbite-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                {farmer.phone && (
                  <a 
                    href={`tel:${farmer.phone}`}
                    className="flex items-center gap-2 text-glacier-600 hover:text-glacier-800 transition-colors mb-2"
                  >
                    <Phone size={14} />
                    <span className="font-mono text-sm">{farmer.phone}</span>
                  </a>
                )}
                
                {farmer.notes && (
                  <p className="text-sm text-arctic-charcoal mt-2 pt-2 border-t border-arctic-border">
                    {farmer.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFarmer ? t('farmers.editFarmer') : t('farmers.addFarmer')}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('farmers.name')} *
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-arctic-mist" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night placeholder-arctic-mist focus:outline-none focus:ring-2 focus:ring-aurora-400 focus:border-transparent transition-all"
                  placeholder={t('farmers.namePlaceholder')}
                  required
                  autoFocus
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('farmers.phone')}
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-arctic-mist" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night placeholder-arctic-mist focus:outline-none focus:ring-2 focus:ring-aurora-400 focus:border-transparent transition-all"
                  placeholder={t('farmers.phonePlaceholder')}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('farmers.village')}
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-arctic-mist" />
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night placeholder-arctic-mist focus:outline-none focus:ring-2 focus:ring-aurora-400 focus:border-transparent transition-all"
                  placeholder={t('farmers.villagePlaceholder')}
                  list="villages-list"
                />
                <datalist id="villages-list">
                  {villages.map(v => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-arctic-night mb-1.5">
                {t('farmers.notes')}
              </label>
              <div className="relative">
                <FileText size={18} className="absolute left-3 top-3 text-arctic-mist" />
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night placeholder-arctic-mist focus:outline-none focus:ring-2 focus:ring-aurora-400 focus:border-transparent transition-all resize-none"
                  placeholder={t('farmers.notesPlaceholder')}
                />
              </div>
            </div>
            
            {/* Flower Types Selection - Only for editing existing farmers */}
            {editingFarmer && (
              <div className="pt-2 border-t border-arctic-border">
                <FarmerProductsSelector
                  farmerId={editingFarmer.id}
                  selectedFlowerIds={formData.selectedFlowerIds}
                  onChange={(selectedFlowerIds) => setFormData({ ...formData, selectedFlowerIds })}
                  disabled={isReadOnly}
                />
              </div>
            )}
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
