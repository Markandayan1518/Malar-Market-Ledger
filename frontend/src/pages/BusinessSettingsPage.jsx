import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { businessProfileService } from '../services/invoiceService';

const BusinessSettingsPage = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    shop_name: '',
    owner_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    alternate_phone: '',
    email: '',
    gst_number: '',
    pan_number: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_branch: '',
    upi_id: '',
    logo_url: '',
    invoice_prefix: 'INV',
    invoice_notes: '',
    invoice_terms: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await businessProfileService.get();
      setProfile(response);
      setFormData({
        shop_name: response.shop_name || '',
        owner_name: response.owner_name || '',
        address_line1: response.address_line1 || '',
        address_line2: response.address_line2 || '',
        city: response.city || '',
        state: response.state || '',
        pincode: response.pincode || '',
        phone: response.phone || '',
        alternate_phone: response.alternate_phone || '',
        email: response.email || '',
        gst_number: response.gst_number || '',
        pan_number: response.pan_number || '',
        bank_name: response.bank_name || '',
        bank_account_number: response.bank_account_number || '',
        bank_ifsc_code: response.bank_ifsc_code || '',
        bank_branch: response.bank_branch || '',
        upi_id: response.upi_id || '',
        logo_url: response.logo_url || '',
        invoice_prefix: response.invoice_prefix || 'INV',
        invoice_notes: response.invoice_notes || '',
        invoice_terms: response.invoice_terms || ''
      });
    } catch (error) {
      console.error('Failed to fetch business profile:', error);
      setMessage({ type: 'error', text: 'Failed to load business profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      if (profile?.id) {
        await businessProfileService.update(profile.id, formData);
      } else {
        await businessProfileService.create(formData);
      }

      setMessage({ type: 'success', text: t('businessProfile.saveSuccess') });
      fetchProfile();
    } catch (error) {
      console.error('Failed to save business profile:', error);
      setMessage({ type: 'error', text: t('businessProfile.saveError') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('businessProfile.title')}</h1>

      {message.text && (
        <div className={`p-4 mb-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            {t('businessProfile.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.shopName')} *
              </label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.ownerName')} *
              </label>
              <input
                type="text"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.addressLine1')} *
              </label>
              <input
                type="text"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.addressLine2')}
              </label>
              <input
                type="text"
                name="address_line2"
                value={formData.address_line2}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.city')} *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.state')} *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.pincode')} *
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.phone')} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.alternatePhone')}
              </label>
              <input
                type="tel"
                name="alternate_phone"
                value={formData.alternate_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.email')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.gstNumber')}
              </label>
              <input
                type="text"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.panNumber')}
              </label>
              <input
                type="text"
                name="pan_number"
                value={formData.pan_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            {t('businessProfile.bankDetails')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.bankName')}
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.accountNumber')}
              </label>
              <input
                type="text"
                name="bank_account_number"
                value={formData.bank_account_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.ifscCode')}
              </label>
              <input
                type="text"
                name="bank_ifsc_code"
                value={formData.bank_ifsc_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.branch')}
              </label>
              <input
                type="text"
                name="bank_branch"
                value={formData.bank_branch}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.upiId')}
              </label>
              <input
                type="text"
                name="upi_id"
                value={formData.upi_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            {t('businessProfile.invoiceSettings')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.invoicePrefix')}
              </label>
              <input
                type="text"
                name="invoice_prefix"
                value={formData.invoice_prefix}
                onChange={handleInputChange}
                maxLength={10}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.logo')}
              </label>
              <input
                type="url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.invoiceNotes')}
              </label>
              <textarea
                name="invoice_notes"
                value={formData.invoice_notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Default notes to appear on all invoices..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('businessProfile.invoiceTerms')}
              </label>
              <textarea
                name="invoice_terms"
                value={formData.invoice_terms}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Payment terms and conditions..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('common.saving') : t('businessProfile.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettingsPage;
