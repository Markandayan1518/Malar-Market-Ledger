import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { invoiceService, businessProfileService } from '../services/invoiceService';
import farmerService from '../services/farmerService';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/feedback/Modal';
import Badge from '../components/data/Badge';
import Button from '../components/forms/Button';
import {
  FileText,
  Plus,
  Search,
  Download,
  Send,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  Calendar,
  User,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  File,
  Printer
} from 'lucide-react';

/**
 * Arctic Frost Theme - Invoice Page
 * 
 * Redesigned with Arctic Frost design system:
 * - Glacier gradient header (document-focused)
 * - Status badges with aurora/frostbite colors
 * - Invoice preview styling
 * - Print stylesheet optimization
 * - Mobile card view
 */
const InvoicePage = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [invoices, setInvoices] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    farmer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_rate: 0,
    discount: 0,
    notes: '',
    terms: '',
    items: [{ description: '', quantity: 1, unit: 'kg', rate: 0 }]
  });

  useEffect(() => {
    fetchInvoices();
    fetchFarmers();
    fetchBusinessProfile();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await invoiceService.getAll(params);
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      showNotification('error', t('invoices.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmers = async () => {
    try {
      const response = await farmerService.getAll();
      setFarmers(response.farmers || response.data || []);
    } catch (error) {
      console.error('Failed to fetch farmers:', error);
    }
  };

  const fetchBusinessProfile = async () => {
    try {
      const response = await businessProfileService.get();
      setBusinessProfile(response);
    } catch (error) {
      console.error('Failed to fetch business profile:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInvoices();
    setIsRefreshing(false);
    showNotification('success', t('common.refreshed'));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const rate = parseFloat(newItems[index].rate) || 0;
      newItems[index].total = qty * rate;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit: 'kg', rate: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0));
    }, 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * (parseFloat(formData.tax_rate) || 0)) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - (parseFloat(formData.discount) || 0);
  };

  const handleFarmerSelect = (e) => {
    const farmerId = e.target.value;
    setFormData(prev => ({ ...prev, farmer_id: farmerId }));
    
    if (farmerId) {
      const farmer = farmers.find(f => f.id === farmerId);
      if (farmer) {
        setFormData(prev => ({
          ...prev,
          customer_name: farmer.name,
          customer_phone: farmer.phone,
          customer_address: farmer.address || ''
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        items: formData.items.map((item, index) => ({
          ...item,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          sort_order: index
        })),
        tax_rate: parseFloat(formData.tax_rate),
        discount: parseFloat(formData.discount)
      };

      if (selectedInvoice) {
        await invoiceService.update(selectedInvoice.id, data);
        showNotification('success', t('invoices.updateSuccess'));
      } else {
        await invoiceService.create(data);
        showNotification('success', t('invoices.createSuccess'));
      }

      setShowModal(false);
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error('Failed to save invoice:', error);
      showNotification('error', t('invoices.saveError'));
    }
  };

  const resetForm = () => {
    setFormData({
      farmer_id: '',
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      tax_rate: 0,
      discount: 0,
      notes: '',
      terms: '',
      items: [{ description: '', quantity: 1, unit: 'kg', rate: 0 }]
    });
    setSelectedInvoice(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      farmer_id: invoice.farmer_id || '',
      customer_name: invoice.customer_name,
      customer_phone: invoice.customer_phone || '',
      customer_address: invoice.customer_address || '',
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date || '',
      tax_rate: invoice.tax_rate,
      discount: invoice.discount,
      notes: invoice.notes || '',
      terms: invoice.terms || '',
      items: invoice.items.length > 0 ? invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate
      })) : [{ description: '', quantity: 1, unit: 'kg', rate: 0 }]
    });
    setShowModal(true);
  };

  const handleDownloadPdf = async (invoice) => {
    try {
      await invoiceService.downloadPdf(invoice.id);
      showNotification('success', t('invoices.downloadSuccess'));
    } catch (error) {
      console.error('Failed to download PDF:', error);
      showNotification('error', t('invoices.downloadError'));
    }
  };

  const handleSendInvoice = async (invoice) => {
    try {
      await invoiceService.sendInvoice(invoice.id);
      showNotification('success', t('invoices.sendSuccess'));
      fetchInvoices();
    } catch (error) {
      console.error('Failed to send invoice:', error);
      showNotification('error', t('invoices.sendError'));
    }
  };

  // Calculate summary statistics
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const totalAmount = invoices.reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0);
  const paidAmount = paidInvoices.reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0);

  // Get status badge variant and icon
  const getStatusConfig = (status) => {
    switch (status) {
      case 'paid':
        return { variant: 'success', icon: CheckCircle, color: 'aurora' };
      case 'pending':
        return { variant: 'warning', icon: Clock, color: 'gold' };
      case 'overdue':
        return { variant: 'danger', icon: AlertCircle, color: 'frostbite' };
      case 'cancelled':
        return { variant: 'default', icon: XCircle, color: 'arctic-mist' };
      default:
        return { variant: 'default', icon: File, color: 'arctic-mist' };
    }
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  // Status filter options
  const statusOptions = [
    { value: '', label: t('common.all') },
    { value: 'draft', label: t('invoices.draft') },
    { value: 'pending', label: t('invoices.pending') },
    { value: 'paid', label: t('invoices.paid') },
    { value: 'overdue', label: t('invoices.overdue') },
    { value: 'cancelled', label: t('invoices.cancelled') }
  ];

  return (
    <div className="min-h-screen bg-arctic-ice">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-glacier-500 via-glacier-600 to-arctic-600 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-white">
                  {t('invoices.title')}
                </h1>
                <p className="text-glacier-100 mt-1">
                  {t('invoices.subtitle')}
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
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-glacier-700 font-semibold rounded-xl hover:bg-glacier-50 transition-colors shadow-lg"
              >
                <Plus size={18} />
                {t('invoices.createInvoice')}
              </button>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <p className="text-glacier-100 text-sm">{t('invoices.totalInvoices')}</p>
              <p className="text-2xl font-bold text-white font-mono">
                {totalInvoices}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-aurora-300" />
                <p className="text-glacier-100 text-sm">{t('invoices.paid')}</p>
              </div>
              <p className="text-2xl font-bold text-aurora-300 font-mono">
                {paidInvoices.length}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gold-300" />
                <p className="text-glacier-100 text-sm">{t('invoices.pending')}</p>
              </div>
              <p className="text-2xl font-bold text-gold-300 font-mono">
                {pendingInvoices.length}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-frostbite-300" />
                <p className="text-glacier-100 text-sm">{t('invoices.overdue')}</p>
              </div>
              <p className="text-2xl font-bold text-frostbite-300 font-mono">
                {overdueInvoices.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Amount Summary */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-glacier-400 to-glacier-600 flex items-center justify-center shadow-lg">
                <IndianRupee size={28} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-arctic-mist uppercase tracking-wide">
                  {t('invoices.totalAmount')}
                </p>
                <p className="text-3xl font-bold text-glacier-700 font-mono">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-aurora-50 rounded-xl border border-aurora-200">
                <p className="text-xs text-aurora-600 uppercase tracking-wide">{t('invoices.collected')}</p>
                <p className="text-lg font-bold text-aurora-700 font-mono">{formatCurrency(paidAmount)}</p>
              </div>
              <div className="px-4 py-2 bg-gold-50 rounded-xl border border-gold-200">
                <p className="text-xs text-gold-600 uppercase tracking-wide">{t('invoices.outstanding')}</p>
                <p className="text-lg font-bold text-gold-700 font-mono">{formatCurrency(totalAmount - paidAmount)}</p>
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
                placeholder={t('invoices.searchInvoices')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* Invoices Table - Desktop */}
        <div className="hidden md:block bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-arctic-border">
            <thead className="bg-arctic-ice">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-arctic-charcoal uppercase tracking-wider">
                  {t('invoices.invoiceNumber')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-arctic-charcoal uppercase tracking-wider">
                  {t('invoices.customer')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-arctic-charcoal uppercase tracking-wider">
                  {t('invoices.invoiceDate')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-arctic-charcoal uppercase tracking-wider">
                  {t('invoices.total')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-arctic-charcoal uppercase tracking-wider">
                  {t('invoices.status')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-arctic-charcoal uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-arctic-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan="6" className="px-6 py-4">
                      <div className="animate-pulse h-4 bg-arctic-ice rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-glacier-100 rounded-full flex items-center justify-center mb-4">
                        <FileText size={32} className="text-glacier-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-arctic-night mb-2">
                        {t('invoices.noInvoices')}
                      </h3>
                      <p className="text-arctic-charcoal mb-4">
                        {t('invoices.noInvoicesDescription')}
                      </p>
                      <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-glacier-500 text-white font-semibold rounded-xl hover:bg-glacier-600 transition-colors"
                      >
                        <Plus size={18} />
                        {t('invoices.createInvoice')}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const statusConfig = getStatusConfig(invoice.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={invoice.id} className="hover:bg-arctic-ice/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-semibold text-glacier-700">
                          {invoice.invoice_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-glacier-100 flex items-center justify-center">
                            <User size={14} className="text-glacier-600" />
                          </div>
                          <span className="text-arctic-night font-medium">
                            {invoice.customer_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-arctic-mist" />
                          <span className="text-arctic-charcoal">{invoice.invoice_date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-lg font-semibold text-arctic-night">
                          {formatCurrency(invoice.total_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={statusConfig.variant}>
                          <StatusIcon size={12} className="mr-1" />
                          {t(`invoices.${invoice.status}`)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownloadPdf(invoice)}
                            className="p-2 rounded-lg text-glacier-500 hover:text-glacier-700 hover:bg-glacier-50 transition-colors"
                            title={t('invoices.downloadPdf')}
                          >
                            <Download size={16} />
                          </button>
                          {invoice.status === 'draft' && (
                            <>
                              <button
                                onClick={() => openEditModal(invoice)}
                                className="p-2 rounded-lg text-arctic-charcoal hover:text-arctic-night hover:bg-arctic-ice transition-colors"
                                title={t('common.edit')}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleSendInvoice(invoice)}
                                className="p-2 rounded-lg text-aurora-500 hover:text-aurora-700 hover:bg-aurora-50 transition-colors"
                                title={t('invoices.send')}
                              >
                                <Send size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Invoices Cards - Mobile */}
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
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-arctic-border">
              <div className="w-16 h-16 mx-auto mb-4 bg-glacier-100 rounded-full flex items-center justify-center">
                <FileText size={32} className="text-glacier-500" />
              </div>
              <h3 className="text-lg font-semibold text-arctic-night mb-2">
                {t('invoices.noInvoices')}
              </h3>
              <p className="text-arctic-charcoal mb-4">
                {t('invoices.noInvoicesDescription')}
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-glacier-500 text-white font-semibold rounded-xl hover:bg-glacier-600 transition-colors"
              >
                <Plus size={18} />
                {t('invoices.createInvoice')}
              </button>
            </div>
          ) : (
            invoices.map((invoice) => {
              const statusConfig = getStatusConfig(invoice.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div 
                  key={invoice.id}
                  className="bg-white rounded-xl border border-arctic-border p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-mono text-sm font-semibold text-glacier-700">
                        {invoice.invoice_number}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar size={12} className="text-arctic-mist" />
                        <span className="text-xs text-arctic-charcoal">{invoice.invoice_date}</span>
                      </div>
                    </div>
                    <Badge variant={statusConfig.variant} size="sm">
                      <StatusIcon size={10} className="mr-1" />
                      {t(`invoices.${invoice.status}`)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-glacier-100 flex items-center justify-center">
                      <User size={14} className="text-glacier-600" />
                    </div>
                    <span className="font-medium text-arctic-night">{invoice.customer_name}</span>
                  </div>
                  
                  <p className="text-2xl font-bold text-arctic-night font-mono mb-3">
                    {formatCurrency(invoice.total_amount)}
                  </p>
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-arctic-border">
                    <button
                      onClick={() => handleDownloadPdf(invoice)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-glacier-50 text-glacier-700 rounded-lg hover:bg-glacier-100 transition-colors"
                    >
                      <Download size={16} />
                      {t('invoices.downloadPdf')}
                    </button>
                    {invoice.status === 'draft' && (
                      <button
                        onClick={() => handleSendInvoice(invoice)}
                        className="p-2 rounded-lg bg-aurora-50 text-aurora-700 hover:bg-aurora-100 transition-colors"
                      >
                        <Send size={16} />
                      </button>
                    )}
                    {invoice.status === 'draft' && (
                      <button
                        onClick={() => openEditModal(invoice)}
                        className="p-2 rounded-lg bg-arctic-ice text-arctic-charcoal hover:bg-arctic-200 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedInvoice ? t('invoices.editInvoice') : t('invoices.createInvoice')}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Customer Section */}
            <div className="bg-arctic-ice rounded-xl p-4">
              <h3 className="text-sm font-semibold text-arctic-night mb-3 uppercase tracking-wide">
                {t('invoices.customerDetails')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-arctic-charcoal mb-1.5">
                    {t('farmers.title')}
                  </label>
                  <select
                    value={formData.farmer_id}
                    onChange={handleFarmerSelect}
                    className="w-full px-3 py-2.5 bg-white border border-arctic-border rounded-xl text-arctic-night focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all"
                  >
                    <option value="">{t('common.select')}...</option>
                    {farmers.map(farmer => (
                      <option key={farmer.id} value={farmer.id}>
                        {farmer.name} ({farmer.farmer_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-arctic-charcoal mb-1.5">
                    {t('invoices.customerName')} *
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-arctic-border rounded-xl text-arctic-night focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-arctic-charcoal mb-1.5">
                    {t('invoices.customerPhone')}
                  </label>
                  <input
                    type="text"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-white border border-arctic-border rounded-xl text-arctic-night focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-arctic-charcoal mb-1.5">
                    {t('invoices.invoiceDate')} *
                  </label>
                  <input
                    type="date"
                    name="invoice_date"
                    value={formData.invoice_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-arctic-border rounded-xl text-arctic-night focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-arctic-charcoal mb-1.5">
                    {t('invoices.dueDate')}
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-white border border-arctic-border rounded-xl text-arctic-night focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-arctic-charcoal mb-1.5">
                    {t('invoices.taxRate')} (%)
                  </label>
                  <input
                    type="number"
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2.5 bg-white border border-arctic-border rounded-xl text-arctic-night font-mono focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-arctic-charcoal mb-1.5">
                  {t('invoices.customerAddress')}
                </label>
                <textarea
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-white border border-arctic-border rounded-xl text-arctic-night focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            {/* Items Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-arctic-night uppercase tracking-wide">
                  {t('invoices.items')}
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-sm text-glacier-600 hover:text-glacier-700 font-medium"
                >
                  <Plus size={16} />
                  {t('invoices.addItem')}
                </button>
              </div>

              <div className="border border-arctic-border rounded-xl overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-arctic-ice">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-arctic-charcoal">
                        {t('invoices.description')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-arctic-charcoal w-20">
                        {t('invoices.quantity')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-arctic-charcoal w-16">
                        {t('invoices.unit')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-arctic-charcoal w-24">
                        {t('invoices.rate')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-arctic-charcoal w-24">
                        {t('invoices.amount')}
                      </th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arctic-border">
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            required
                            className="w-full px-2 py-1.5 border border-arctic-border rounded-lg text-arctic-night focus:outline-none focus:ring-1 focus:ring-glacier-400 focus:border-transparent transition-all"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-full px-2 py-1.5 border border-arctic-border rounded-lg text-arctic-night font-mono focus:outline-none focus:ring-1 focus:ring-glacier-400 focus:border-transparent transition-all"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 border border-arctic-border rounded-lg text-arctic-night focus:outline-none focus:ring-1 focus:ring-glacier-400 focus:border-transparent transition-all"
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="pcs">pcs</option>
                            <option value="box">box</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-full px-2 py-1.5 border border-arctic-border rounded-lg text-arctic-night font-mono focus:outline-none focus:ring-1 focus:ring-glacier-400 focus:border-transparent transition-all"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-medium text-arctic-night">
                          {formatCurrency((item.quantity || 0) * (item.rate || 0))}
                        </td>
                        <td className="px-3 py-2">
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1 text-frostbite-500 hover:text-frostbite-700 hover:bg-frostbite-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2 bg-arctic-ice rounded-xl p-4">
                <div className="flex justify-between text-arctic-charcoal">
                  <span>{t('invoices.subtotal')}:</span>
                  <span className="font-mono">{formatCurrency(calculateSubtotal())}</span>
                </div>
                {formData.tax_rate > 0 && (
                  <div className="flex justify-between text-arctic-charcoal">
                    <span>{t('invoices.tax')} ({formData.tax_rate}%):</span>
                    <span className="font-mono">{formatCurrency(calculateTax())}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-arctic-charcoal">
                  <span>{t('invoices.discount')}:</span>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-24 px-2 py-1 border border-arctic-border rounded-lg text-right font-mono text-arctic-night focus:outline-none focus:ring-1 focus:ring-glacier-400 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-arctic-border pt-2 mt-2">
                  <span className="text-arctic-night">{t('invoices.total')}:</span>
                  <span className="font-mono text-glacier-700">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-sm font-medium text-arctic-charcoal mb-1.5">
                {t('invoices.notes')}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night placeholder-arctic-mist focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all resize-none"
                placeholder={businessProfile?.invoice_notes || ''}
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
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            background: white !important;
          }
          
          .print-only {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePage;
