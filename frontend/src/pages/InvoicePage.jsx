import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { invoiceService, businessProfileService } from '../services/invoiceService';
import farmerService from '../services/farmerService';

const InvoicePage = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
      } else {
        await invoiceService.create(data);
      }

      setShowModal(false);
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error('Failed to save invoice:', error);
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
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const handleSendInvoice = async (invoice) => {
    try {
      await invoiceService.sendInvoice(invoice.id);
      fetchInvoices();
    } catch (error) {
      console.error('Failed to send invoice:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      overdue: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || statusClasses.draft}`}>
        {t(`invoices.${status}`)}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('invoices.title')}</h1>
        <button
          onClick={openCreateModal}
          className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
        >
          {t('invoices.createInvoice')}
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder={t('invoices.searchInvoices')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="">{t('common.all')}</option>
          <option value="draft">{t('invoices.draft')}</option>
          <option value="pending">{t('invoices.pending')}</option>
          <option value="paid">{t('invoices.paid')}</option>
          <option value="cancelled">{t('invoices.cancelled')}</option>
        </select>
        <button
          onClick={fetchInvoices}
          className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          {t('common.refresh')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {t('invoices.noInvoices')}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('invoices.invoiceNumber')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('invoices.customer')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('invoices.invoiceDate')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('invoices.total')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('invoices.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.invoice_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleDownloadPdf(invoice)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      {t('invoices.downloadPdf')}
                    </button>
                    {invoice.status === 'draft' && (
                      <>
                        <button
                          onClick={() => openEditModal(invoice)}
                          className="text-gray-600 hover:text-gray-800 mr-3"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleSendInvoice(invoice)}
                          className="text-green-600 hover:text-green-800"
                        >
                          {t('invoices.send')}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedInvoice ? t('invoices.editInvoice') : t('invoices.createInvoice')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('farmers.title')}
                  </label>
                  <select
                    value={formData.farmer_id}
                    onChange={handleFarmerSelect}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('invoices.customerName')} *
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('invoices.customerPhone')}
                  </label>
                  <input
                    type="text"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('invoices.invoiceDate')} *
                  </label>
                  <input
                    type="date"
                    name="invoice_date"
                    value={formData.invoice_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('invoices.dueDate')}
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('invoices.taxRate')}
                  </label>
                  <input
                    type="number"
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('invoices.customerAddress')}
                </label>
                <textarea
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('invoices.items')}
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-pink-600 hover:text-pink-800 text-sm"
                  >
                    + {t('invoices.addItem')}
                  </button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          {t('invoices.description')}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-20">
                          {t('invoices.quantity')}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-16">
                          {t('invoices.unit')}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-24">
                          {t('invoices.rate')}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-24">
                          {t('invoices.amount')}
                        </th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              required
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-pink-500"
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
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatCurrency((item.quantity || 0) * (item.rate || 0))}
                          </td>
                          <td className="px-3 py-2">
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                &times;
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end mb-4">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>{t('invoices.subtotal')}:</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  {formData.tax_rate > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>{t('invoices.tax')} ({formData.tax_rate}%):</span>
                      <span>{formatCurrency(calculateTax())}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>{t('invoices.discount')}:</span>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-24 px-2 py-1 border rounded text-right"
                    />
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>{t('invoices.total')}:</span>
                    <span className="text-pink-600">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('invoices.notes')}
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder={businessProfile?.invoice_notes || ''}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicePage;
