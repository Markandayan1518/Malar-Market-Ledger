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
import { Settings, Save, Trash2, RefreshCw } from 'lucide-react';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-warm-charcoal">
          {t('settings.title')}
        </h1>
        
        <Button
          variant="primary"
          icon={Save}
          onClick={handleSave}
          loading={loading}
        >
          {t('settings.saveSettings')}
        </Button>
      </div>

      {/* Market Settings */}
      <Card>
        <Card.Header>
          <h3 className="card-title">{t('settings.marketSettings')}</h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-warm-brown mb-2">
                  {t('settings.morningSlot')}
                </label>
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
                  />
                  <span className="text-warm-brown">-</span>
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
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-warm-brown mb-2">
                  {t('settings.eveningSlot')}
                </label>
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
                  />
                  <span className="text-warm-brown">-</span>
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
                  />
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Settlement Settings */}
      <Card>
        <Card.Header>
          <h3 className="card-title">{t('settings.settlementSettings')}</h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <Select
              label={t('settings.settlementPeriod')}
              value={settings.settlementPeriod}
              onChange={(value) => setSettings({ ...settings, settlementPeriod: value })}
              options={periodOptions}
              helperText={t('settings.settlementPeriodHelp')}
            />
          </div>
        </Card.Body>
      </Card>

      {/* Cash Advance Settings */}
      <Card>
        <Card.Header>
          <h3 className="card-title">{t('settings.cashAdvanceSettings')}</h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <NumberInput
              label={t('settings.maxAdvanceAmount')}
              value={settings.maxAdvanceAmount}
              onChange={(e) => setSettings({ ...settings, maxAdvanceAmount: e.target.value })}
              min={0}
              precision={2}
              prefix="₹"
              helperText={t('settings.maxAdvanceAmountHelp')}
            />
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoApproveAdvances"
                checked={settings.autoApproveAdvances}
                onChange={(e) => setSettings({ ...settings, autoApproveAdvances: e.target.checked })}
                className="w-5 h-5 rounded border-warm-taupe text-accent-magenta focus:ring-accent-magenta"
              />
              <label htmlFor="autoApproveAdvances" className="text-sm text-warm-charcoal">
                {t('settings.autoApproveAdvances')}
              </label>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Notification Settings */}
      <Card>
        <Card.Header>
          <h3 className="card-title">{t('settings.notificationSettings')}</h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="whatsappNotifications"
                checked={settings.whatsappNotifications}
                onChange={(e) => setSettings({ ...settings, whatsappNotifications: e.target.checked })}
                className="w-5 h-5 rounded border-warm-taupe text-accent-magenta focus:ring-accent-magenta"
              />
              <label htmlFor="whatsappNotifications" className="text-sm text-warm-charcoal">
                {t('settings.whatsappNotifications')}
              </label>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Data Management */}
      <Card>
        <Card.Header>
          <h3 className="card-title">{t('settings.dataManagement')}</h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="backupEnabled"
                checked={settings.backupEnabled}
                onChange={(e) => setSettings({ ...settings, backupEnabled: e.target.checked })}
                className="w-5 h-5 rounded border-warm-taupe text-accent-magenta focus:ring-accent-magenta"
              />
              <label htmlFor="backupEnabled" className="text-sm text-warm-charcoal">
                {t('settings.backupEnabled')}
              </label>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                icon={RefreshCw}
                onClick={handleSyncNow}
                loading={loading}
              >
                {t('offline.syncNow')}
              </Button>
              
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => setShowClearDataDialog(true)}
              >
                {t('settings.clearOfflineData')}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Language Settings */}
      <Card>
        <Card.Header>
          <h3 className="card-title">{t('settings.languageSettings')}</h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <Select
              label={t('settings.language')}
              value={settings.language}
              onChange={(value) => setSettings({ ...settings, language: value })}
              options={languageOptions}
            />
          </div>
        </Card.Body>
      </Card>

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
