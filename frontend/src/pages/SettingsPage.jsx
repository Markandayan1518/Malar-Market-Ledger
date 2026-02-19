import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/data/Card';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import NumberInput from '../components/forms/NumberInput';
import Select from '../components/forms/Select';
import ConfirmationDialog from '../components/feedback/ConfirmationDialog';
import {
  Settings,
  Save,
  Trash2,
  RefreshCw,
  Clock,
  DollarSign,
  Calendar,
  Bell,
  Database,
  Globe,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Shield,
  Wallet,
  Sunrise,
  Sunset
} from 'lucide-react';

/**
 * Arctic Frost Theme - Settings Page
 * 
 * Redesigned with Arctic Frost design system:
 * - Gradient header with settings icon
 * - Section cards with proper styling
 * - Toggle switch design
 * - Improved form layout
 * - Settings sections with icons
 */
const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    market: true,
    settlement: true,
    cashAdvance: true,
    notifications: true,
    data: false,
    language: true
  });
  
  const [settings, setSettings] = useState({
    marketRate: '',
    timeSlots: {
      morning: { start: '04:00', end: '08:00' },
      evening: { start: '16:00', end: '20:00' }
    },
    settlementPeriod: 'weekly',
    autoApproveAdvances: false,
    maxAdvanceAmount: '',
    whatsappNotifications: true,
    backupEnabled: true,
    language: 'en'
  });

  const periodOptions = [
    { value: 'daily', label: t('settings.daily') },
    { value: 'weekly', label: t('settings.weekly') },
    { value: 'monthly', label: t('settings.monthly') }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ta', label: 'தமிழ்' }
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification('success', t('settings.saveSuccess'));
    } catch (error) {
      showNotification('error', t('settings.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    try {
      // In a real implementation, this would clear IndexedDB
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification('success', t('settings.clearDataSuccess'));
      setShowClearDataDialog(false);
    } catch (error) {
      showNotification('error', t('settings.clearDataError'));
    }
  };

  const handleSyncNow = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would trigger background sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      showNotification('success', t('offline.syncSuccess'));
    } catch (error) {
      showNotification('error', t('offline.syncError'));
    } finally {
      setLoading(false);
    }
  };

  // Toggle Switch Component
  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-arctic-night">{label}</p>
        {description && (
          <p className="text-xs text-arctic-mist mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-glacier-400 focus:ring-offset-2 ${
          checked ? 'bg-aurora-500' : 'bg-arctic-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  // Section Header Component
  const SectionHeader = ({ icon: Icon, title, section, isExpanded }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 hover:bg-arctic-ice/50 transition-colors rounded-t-xl"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-glacier-100 rounded-lg">
          <Icon size={20} className="text-glacier-600" />
        </div>
        <h3 className="font-semibold text-arctic-night">{title}</h3>
      </div>
      {isExpanded ? (
        <ChevronUp size={20} className="text-arctic-mist" />
      ) : (
        <ChevronDown size={20} className="text-arctic-mist" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-arctic-ice">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-arctic-600 via-glacier-600 to-arctic-700 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-white">
                  {t('settings.title')}
                </h1>
                <p className="text-glacier-100 mt-1">
                  {t('settings.subtitle')}
                </p>
              </div>
            </div>
            
            <Button
              variant="primary"
              icon={Save}
              onClick={handleSave}
              loading={loading}
              className="bg-white text-glacier-700 hover:bg-glacier-50"
            >
              {t('settings.saveSettings')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {/* Market Settings */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <SectionHeader
            icon={DollarSign}
            title={t('settings.marketSettings')}
            section="market"
            isExpanded={expandedSections.market}
          />
          
          {expandedSections.market && (
            <div className="p-4 pt-0 space-y-4 border-t border-arctic-border">
              <div className="pt-4">
                <NumberInput
                  label={t('settings.defaultMarketRate')}
                  value={settings.marketRate}
                  onChange={(e) => setSettings({ ...settings, marketRate: e.target.value })}
                  min={0}
                  precision={2}
                  prefix="₹"
                  suffix="/kg"
                  helperText={t('settings.defaultMarketRateHelp')}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-arctic-ice rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Sunrise size={18} className="text-gold-500" />
                    <label className="text-sm font-medium text-arctic-night">
                      {t('settings.morningSlot')}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={settings.timeSlots.morning.start}
                      onChange={(e) => setSettings({
                        ...settings,
                        timeSlots: {
                          ...settings.timeSlots,
                          morning: { ...settings.timeSlots.morning, start: e.target.value }
                        }
                      })}
                      className="flex-1"
                    />
                    <span className="text-arctic-mist font-medium">—</span>
                    <Input
                      type="time"
                      value={settings.timeSlots.morning.end}
                      onChange={(e) => setSettings({
                        ...settings,
                        timeSlots: {
                          ...settings.timeSlots,
                          morning: { ...settings.timeSlots.morning, end: e.target.value }
                        }
                      })}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-arctic-ice rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Sunset size={18} className="text-aurora-500" />
                    <label className="text-sm font-medium text-arctic-night">
                      {t('settings.eveningSlot')}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={settings.timeSlots.evening.start}
                      onChange={(e) => setSettings({
                        ...settings,
                        timeSlots: {
                          ...settings.timeSlots,
                          evening: { ...settings.timeSlots.evening, start: e.target.value }
                        }
                      })}
                      className="flex-1"
                    />
                    <span className="text-arctic-mist font-medium">—</span>
                    <Input
                      type="time"
                      value={settings.timeSlots.evening.end}
                      onChange={(e) => setSettings({
                        ...settings,
                        timeSlots: {
                          ...settings.timeSlots,
                          evening: { ...settings.timeSlots.evening, end: e.target.value }
                        }
                      })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settlement Settings */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <SectionHeader
            icon={Calendar}
            title={t('settings.settlementSettings')}
            section="settlement"
            isExpanded={expandedSections.settlement}
          />
          
          {expandedSections.settlement && (
            <div className="p-4 pt-0 border-t border-arctic-border">
              <div className="pt-4">
                <Select
                  label={t('settings.settlementPeriod')}
                  value={settings.settlementPeriod}
                  onChange={(value) => setSettings({ ...settings, settlementPeriod: value })}
                  options={periodOptions}
                  helperText={t('settings.settlementPeriodHelp')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Cash Advance Settings */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <SectionHeader
            icon={Wallet}
            title={t('settings.cashAdvanceSettings')}
            section="cashAdvance"
            isExpanded={expandedSections.cashAdvance}
          />
          
          {expandedSections.cashAdvance && (
            <div className="p-4 pt-0 space-y-2 border-t border-arctic-border">
              <div className="pt-4">
                <NumberInput
                  label={t('settings.maxAdvanceAmount')}
                  value={settings.maxAdvanceAmount}
                  onChange={(e) => setSettings({ ...settings, maxAdvanceAmount: e.target.value })}
                  min={0}
                  precision={2}
                  prefix="₹"
                  helperText={t('settings.maxAdvanceAmountHelp')}
                />
              </div>
              
              <div className="pt-2">
                <ToggleSwitch
                  checked={settings.autoApproveAdvances}
                  onChange={(value) => setSettings({ ...settings, autoApproveAdvances: value })}
                  label={t('settings.autoApproveAdvances')}
                  description={t('settings.autoApproveAdvancesHelp')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <SectionHeader
            icon={Bell}
            title={t('settings.notificationSettings')}
            section="notifications"
            isExpanded={expandedSections.notifications}
          />
          
          {expandedSections.notifications && (
            <div className="p-4 pt-0 border-t border-arctic-border">
              <div className="pt-2">
                <ToggleSwitch
                  checked={settings.whatsappNotifications}
                  onChange={(value) => setSettings({ ...settings, whatsappNotifications: value })}
                  label={t('settings.whatsappNotifications')}
                  description={t('settings.whatsappNotificationsHelp')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <SectionHeader
            icon={Database}
            title={t('settings.dataManagement')}
            section="data"
            isExpanded={expandedSections.data}
          />
          
          {expandedSections.data && (
            <div className="p-4 pt-0 space-y-4 border-t border-arctic-border">
              <div className="pt-2">
                <ToggleSwitch
                  checked={settings.backupEnabled}
                  onChange={(value) => setSettings({ ...settings, backupEnabled: value })}
                  label={t('settings.backupEnabled')}
                  description={t('settings.backupEnabledHelp')}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="secondary"
                  icon={RefreshCw}
                  onClick={handleSyncNow}
                  loading={loading}
                  className="flex-1"
                >
                  {t('offline.syncNow')}
                </Button>
                
                <Button
                  variant="danger"
                  icon={Trash2}
                  onClick={() => setShowClearDataDialog(true)}
                  className="flex-1"
                >
                  {t('settings.clearOfflineData')}
                </Button>
              </div>
              
              {/* Storage Info */}
              <div className="p-4 bg-arctic-ice rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-arctic-charcoal">{t('settings.storageUsed')}</span>
                  <span className="text-sm font-mono font-semibold text-arctic-night">~2.4 MB</span>
                </div>
                <div className="w-full bg-arctic-200 rounded-full h-2">
                  <div className="bg-glacier-500 h-2 rounded-full" style={{ width: '24%' }}></div>
                </div>
                <p className="text-xs text-arctic-mist mt-2">{t('settings.storageNote')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm overflow-hidden">
          <SectionHeader
            icon={Globe}
            title={t('settings.languageSettings')}
            section="language"
            isExpanded={expandedSections.language}
          />
          
          {expandedSections.language && (
            <div className="p-4 pt-0 border-t border-arctic-border">
              <div className="pt-4">
                <Select
                  label={t('settings.language')}
                  value={settings.language}
                  onChange={(value) => setSettings({ ...settings, language: value })}
                  options={languageOptions}
                  helperText={t('settings.languageHelp')}
                />
              </div>
              
              {/* Language Preview */}
              <div className="mt-4 p-4 bg-arctic-ice rounded-xl">
                <p className="text-xs text-arctic-mist mb-2">{t('settings.preview')}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-arctic-night">English</p>
                    <p className="text-sm text-arctic-charcoal">Good morning!</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-arctic-night">தமிழ்</p>
                    <p className="text-sm text-arctic-charcoal">காலை வணக்கம்!</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* App Info */}
        <div className="bg-white rounded-2xl border border-arctic-border shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-glacier-100 rounded-lg">
                <Shield size={20} className="text-glacier-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-arctic-night">{t('settings.appVersion')}</p>
                <p className="text-xs text-arctic-mist">v1.0.0 - Arctic Frost</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-arctic-mist">{t('settings.lastSync')}</p>
              <p className="text-sm font-mono text-arctic-charcoal">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showClearDataDialog}
        onClose={() => setShowClearDataDialog(false)}
        onConfirm={handleClearData}
        title={t('settings.clearDataConfirm')}
        message={t('settings.clearDataMessage')}
        variant="danger"
      />
    </div>
  );
};

export default SettingsPage;
