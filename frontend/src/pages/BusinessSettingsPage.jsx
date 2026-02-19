import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { businessProfileService } from '../services/invoiceService';
import { useNotification } from '../context/NotificationContext';
import Button from '../components/forms/Button';
import {
  Building2,
  Save,
  Upload,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Image,
  ChevronDown,
  ChevronUp,
  Banknote,
  Hash,
  Globe,
  QrCode,
  Loader2
} from 'lucide-react';

/**
 * Arctic Frost Theme - Business Settings Page
 * 
 * Redesigned with Arctic Frost design system:
 * - Gradient header with business icon
 * - Section cards with expandable/collapsible design
 * - Arctic form styling
 * - Logo upload area with preview
 * - Section icons and visual hierarchy
 */
const BusinessSettingsPage = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    address: true,
    contact: true,
    tax: false,
    bank: true,
    invoice: true
  });

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
      showNotification('error', t('businessProfile.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);

      if (profile?.id) {
        await businessProfileService.update(profile.id, formData);
      } else {
        await businessProfileService.create(formData);
      }

      showNotification('success', t('businessProfile.saveSuccess'));
      fetchProfile();
    } catch (error) {
      console.error('Failed to save business profile:', error);
      showNotification('error', t('businessProfile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  // Section Header Component
  const SectionHeader = ({ icon: Icon, title, section, isExpanded, required = false }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 hover:bg-arctic-ice/50 transition-colors rounded-t-xl"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-glacier-100 rounded-lg">
          <Icon size={20} className="text-glacier-600" />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-arctic-night">{title}</h3>
          {required && (
            <span className="px-2 py-0.5 text-xs font-medium bg-frostbite-100 text-frostbite-700 rounded-full">
              {t('common.required')}
            </span>
          )}
        </div>
      </div>
      {isExpanded ? (
        <ChevronUp size={20} className="text-arctic-mist" />
      ) : (
        <ChevronDown size={20} className="text-arctic-mist" />
      )}
    </button>
  );

  // Form Input Component
  const FormInput = ({ label, name, type = 'text', required = false, placeholder, value, onChange, className = '', icon: Icon, helperText }) => (
    <div className={className}>
      <label className="block text-sm font-medium text-arctic-night mb-1.5">
        {label} {required && <span className="text-frostbite-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-arctic-mist" />
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night placeholder-arctic-mist focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all`}
        />
      </div>
      {helperText && (
        <p className="mt-1 text-xs text-arctic-mist">{helperText}</p>
      )}
    </div>
  );

  // Form Textarea Component
  const FormTextarea = ({ label, name, required = false, placeholder, value, onChange, rows = 3, className = '', helperText }) => (
    <div className={className}>
      <label className="block text-sm font-medium text-arctic-night mb-1.5">
        {label} {required && <span className="text-frostbite-500">*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2.5 bg-arctic-ice border border-arctic-border rounded-xl text-arctic-night placeholder-arctic-mist focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:border-transparent transition-all resize-none"
      />
      {helperText && (
        <p className="mt-1 text-xs text-arctic-mist">{helperText}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-arctic-ice flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-glacier-500 mx-auto mb-4" />
          <p className="text-arctic-charcoal">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arctic-ice">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-glacier-600 via-arctic-600 to-glacier-700 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-white">
                  {t('businessProfile.title')}
                </h1>
                <p className="text-glacier-100 mt-1">
                  {t('businessProfile.subtitle')}
                </p>
              </div>
            </div>
            
            <Button
              variant="primary"
              icon={Save}
              onClick={handleSubmit}
              loading={saving}
              className="bg-white text-glacier-700 hover:bg-glacier-50"
            >
              {t('businessProfile.save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {/* Logo Section - Full Width */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              {formData.logo_url ? (
                <div className="w-32 h-32 rounded-2xl border-2 border-arctic-border overflow-hidden bg-white">
                  <img
                    src={formData.logo_url}
                    alt="Business Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-arctic-border bg-arctic-ice flex flex-col items-center justify-center">
                  <Image size={32} className="text-arctic-mist mb-2" />
                  <span className="text-xs text-arctic-mist text-center px-2">
                    {t('businessProfile.noLogo')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-semibold text-arctic-night mb-1">
                {t('businessProfile.businessLogo')}
              </h3>
              <p className="text-sm text-arctic-charcoal mb-3">
                {t('businessProfile.logoHelp')}
              </p>
              <FormInput
                label=""
                name="logo_url"
                type="url"
                placeholder="https://example.com/logo.png"
                value={formData.logo_url}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <SectionHeader
            icon={Building2}
            title={t('businessProfile.basicInfo')}
            section="basic"
            isExpanded={expandedSections.basic}
            required
          />
          
          {expandedSections.basic && (
            <div className="p-4 pt-0 space-y-4 border-t border-arctic-border">
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label={t('businessProfile.shopName')}
                  name="shop_name"
                  required
                  value={formData.shop_name}
                  onChange={handleInputChange}
                  placeholder={t('businessProfile.shopNamePlaceholder')}
                />
                
                <FormInput
                  label={t('businessProfile.ownerName')}
                  name="owner_name"
                  required
                  value={formData.owner_name}
                  onChange={handleInputChange}
                  placeholder={t('businessProfile.ownerNamePlaceholder')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <SectionHeader
            icon={MapPin}
            title={t('businessProfile.addressInfo')}
            section="address"
            isExpanded={expandedSections.address}
            required
          />
          
          {expandedSections.address && (
            <div className="p-4 pt-0 space-y-4 border-t border-arctic-border">
              <div className="pt-4">
                <FormInput
                  label={t('businessProfile.addressLine1')}
                  name="address_line1"
                  required
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  placeholder={t('businessProfile.addressLine1Placeholder')}
                />
              </div>
              
              <FormInput
                label={t('businessProfile.addressLine2')}
                name="address_line2"
                value={formData.address_line2}
                onChange={handleInputChange}
                placeholder={t('businessProfile.addressLine2Placeholder')}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label={t('businessProfile.city')}
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder={t('businessProfile.cityPlaceholder')}
                />
                
                <FormInput
                  label={t('businessProfile.state')}
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder={t('businessProfile.statePlaceholder')}
                />
                
                <FormInput
                  label={t('businessProfile.pincode')}
                  name="pincode"
                  required
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder={t('businessProfile.pincodePlaceholder')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <SectionHeader
            icon={Phone}
            title={t('businessProfile.contactInfo')}
            section="contact"
            isExpanded={expandedSections.contact}
          />
          
          {expandedSections.contact && (
            <div className="p-4 pt-0 space-y-4 border-t border-arctic-border">
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label={t('businessProfile.phone')}
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  icon={Phone}
                />
                
                <FormInput
                  label={t('businessProfile.alternatePhone')}
                  name="alternate_phone"
                  type="tel"
                  value={formData.alternate_phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  icon={Phone}
                />
              </div>
              
              <FormInput
                label={t('businessProfile.email')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contact@business.com"
                icon={Mail}
                helperText={t('businessProfile.emailHelp')}
              />
            </div>
          )}
        </div>

        {/* Tax Information */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <SectionHeader
            icon={Hash}
            title={t('businessProfile.taxInfo')}
            section="tax"
            isExpanded={expandedSections.tax}
          />
          
          {expandedSections.tax && (
            <div className="p-4 pt-0 space-y-4 border-t border-arctic-border">
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label={t('businessProfile.gstNumber')}
                  name="gst_number"
                  value={formData.gst_number}
                  onChange={handleInputChange}
                  placeholder="33AAAAA0000A1Z5"
                  helperText={t('businessProfile.gstHelp')}
                />
                
                <FormInput
                  label={t('businessProfile.panNumber')}
                  name="pan_number"
                  value={formData.pan_number}
                  onChange={handleInputChange}
                  placeholder="AAAAA0000A"
                  helperText={t('businessProfile.panHelp')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <SectionHeader
            icon={Banknote}
            title={t('businessProfile.bankDetails')}
            section="bank"
            isExpanded={expandedSections.bank}
          />
          
          {expandedSections.bank && (
            <div className="p-4 pt-0 space-y-4 border-t border-arctic-border">
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label={t('businessProfile.bankName')}
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  placeholder={t('businessProfile.bankNamePlaceholder')}
                />
                
                <FormInput
                  label={t('businessProfile.branch')}
                  name="bank_branch"
                  value={formData.bank_branch}
                  onChange={handleInputChange}
                  placeholder={t('businessProfile.branchPlaceholder')}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label={t('businessProfile.accountNumber')}
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleInputChange}
                  placeholder="0000000000000"
                />
                
                <FormInput
                  label={t('businessProfile.ifscCode')}
                  name="bank_ifsc_code"
                  value={formData.bank_ifsc_code}
                  onChange={handleInputChange}
                  placeholder="ABCD0000000"
                />
              </div>
              
              <FormInput
                label={t('businessProfile.upiId')}
                name="upi_id"
                value={formData.upi_id}
                onChange={handleInputChange}
                placeholder="business@upi"
                icon={QrCode}
                helperText={t('businessProfile.upiHelp')}
              />
            </div>
          )}
        </div>

        {/* Invoice Settings */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <SectionHeader
            icon={FileText}
            title={t('businessProfile.invoiceSettings')}
            section="invoice"
            isExpanded={expandedSections.invoice}
          />
          
          {expandedSections.invoice && (
            <div className="p-4 pt-0 space-y-4 border-t border-arctic-border">
              <div className="pt-4">
                <FormInput
                  label={t('businessProfile.invoicePrefix')}
                  name="invoice_prefix"
                  value={formData.invoice_prefix}
                  onChange={handleInputChange}
                  placeholder="INV"
                  maxLength={10}
                  helperText={t('businessProfile.invoicePrefixHelp')}
                  className="max-w-xs"
                />
              </div>
              
              <FormTextarea
                label={t('businessProfile.invoiceNotes')}
                name="invoice_notes"
                value={formData.invoice_notes}
                onChange={handleInputChange}
                placeholder={t('businessProfile.invoiceNotesPlaceholder')}
                helperText={t('businessProfile.invoiceNotesHelp')}
              />
              
              <FormTextarea
                label={t('businessProfile.invoiceTerms')}
                name="invoice_terms"
                value={formData.invoice_terms}
                onChange={handleInputChange}
                placeholder={t('businessProfile.invoiceTermsPlaceholder')}
                helperText={t('businessProfile.invoiceTermsHelp')}
              />
            </div>
          )}
        </div>

        {/* Preview Card */}
        <div className="bg-gradient-to-r from-glacier-50 to-arctic-50 rounded-2xl border border-glacier-200 p-6">
          <h3 className="font-semibold text-arctic-night mb-4">
            {t('businessProfile.preview')}
          </h3>
          
          <div className="bg-white rounded-xl border border-arctic-border p-4 shadow-sm">
            <div className="flex items-start gap-4">
              {formData.logo_url ? (
                <img
                  src={formData.logo_url}
                  alt="Logo"
                  className="w-16 h-16 rounded-lg object-contain border border-arctic-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-arctic-ice flex items-center justify-center border border-arctic-border">
                  <Building2 size={24} className="text-arctic-mist" />
                </div>
              )}
              
              <div className="flex-1">
                <h4 className="font-display font-bold text-lg text-arctic-night">
                  {formData.shop_name || t('businessProfile.shopNamePlaceholder')}
                </h4>
                <p className="text-sm text-arctic-charcoal">
                  {formData.owner_name || t('businessProfile.ownerNamePlaceholder')}
                </p>
                {formData.address_line1 && (
                  <p className="text-xs text-arctic-mist mt-1">
                    {[formData.address_line1, formData.city, formData.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-glacier-700">
                  {formData.invoice_prefix}-0001
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button - Fixed at bottom on mobile */}
        <div className="sticky bottom-0 bg-arctic-ice/80 backdrop-blur-sm py-4 -mx-6 px-6 md:relative md:bg-transparent md:py-0 md:mt-6">
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={fetchProfile}
              disabled={saving}
            >
              {t('common.reset')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              icon={Save}
            >
              {saving ? t('common.saving') : t('businessProfile.save')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettingsPage;
