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
import { Plus, Search, Check, FileText, Download, Trash2 } from 'lucide-react';

const SettlementsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { settlements, loading, fetchSettlements, generateSettlement, updateSettlement, deleteSettlement } = useSettlements();
  const { farmers, loading: farmersLoading } = useFarmers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSettlement, setDeletingSettlement] = useState(null);
  const [generateFormData, setGenerateFormData] = useState({
    farmerId: '',
    startDate: '',
    endDate: ''
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchSettlements();
    farmers.length === 0 && !farmersLoading && fetchFarmers();
  }, [fetchSettlements, farmers, farmersLoading]);

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

  const filteredSettlements = settlements.filter(settlement => {
    const searchLower = searchTerm.toLowerCase();
    const farmer = farmers.find(f => f.id === settlement.farmerId);
    return (
      farmer?.name.toLowerCase().includes(searchLower) ||
      settlement.totalAmount.toString().includes(searchLower) ||
      settlement.startDate.includes(searchLower) ||
      settlement.endDate.includes(searchLower)
    );
  });

  const columns = [
    { key: 'settlementId', label: t('settlements.settlementId'), sortable: true },
    { key: 'farmer', label: t('settlements.farmer'), sortable: false, render: (row) => {
      const farmer = farmers.find(f => f.id === row.farmerId);
      return farmer?.name || 'Unknown';
    }},
    { key: 'period', label: t('settlements.period'), sortable: false, render: (row) => `${row.startDate} - ${row.endDate}` },
    { key: 'totalAmount', label: t('settlements.totalAmount'), sortable: true, render: (row) => `₹${row.totalAmount}` },
    { key: 'advancesDeducted', label: t('settlements.advancesDeducted'), sortable: true, render: (row) => `₹${row.advancesDeducted}` },
    { key: 'netAmount', label: t('settlements.netAmount'), sortable: true, render: (row) => `₹${row.netAmount}` },
    { key: 'status', label: t('settlements.status'), sortable: true, render: (row) => (
      <Badge variant={row.status === 'paid' ? 'success' : row.status === 'approved' ? 'info' : 'warning'}>
        {t(`settlements.${row.status}`)}
      </Badge>
    )},
    { key: 'actions', label: t('common.actions'), sortable: false, render: (row) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={FileText}
          onClick={() => handleDownload(row)}
          title={t('settlements.download')}
        />
        {isAdmin && row.status === 'generated' && (
          <Button
            variant="ghost"
            size="sm"
            icon={Check}
            onClick={() => handleApprove(row)}
            title={t('settlements.approve')}
            className="text-accent-purple"
          />
        )}
        {isAdmin && row.status === 'approved' && (
          <Button
            variant="ghost"
            size="sm"
            icon={Check}
            onClick={() => handleMarkPaid(row)}
            title={t('settlements.markPaid')}
            className="text-emerald-600"
          />
        )}
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
          {t('settlements.title')}
        </h1>
        
        {isAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleGenerate}
          >
            {t('settlements.generateSettlement')}
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

      {/* Settlements Table */}
      <Card>
        <Card.Body>
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
        </Card.Body>
      </Card>

      {/* Generate Settlement Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title={t('settlements.generateSettlement')}
        size="md"
      >
        <form onSubmit={handleGenerateSubmit}>
          <div className="space-y-4">
            <Select
              label={t('settlements.farmer')}
              value={generateFormData.farmerId}
              onChange={(value) => setGenerateFormData({ ...generateFormData, farmerId: value })}
              options={farmerOptions}
              required
              autoFocus
            />
            <Input
              label={t('settlements.startDate')}
              type="date"
              value={generateFormData.startDate}
              onChange={(e) => setGenerateFormData({ ...generateFormData, startDate: e.target.value })}
              required
            />
            <Input
              label={t('settlements.endDate')}
              type="date"
              value={generateFormData.endDate}
              onChange={(e) => setGenerateFormData({ ...generateFormData, endDate: e.target.value })}
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
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
        message={t('settlements.deleteMessage', { id: deletingSettlement?.settlementId })}
        variant="danger"
      />
    </div>
  );
};

export default SettlementsPage;
