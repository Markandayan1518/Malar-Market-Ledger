import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useMarketRates } from '../hooks/useMarketRates';
import { useFarmers } from '../hooks/useFarmers';
import { useDailyEntries } from '../hooks/useDailyEntries';
import EntryGrid from '../components/entry/EntryGrid';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const DailyEntryPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isOffline, syncQueueCount } = useOffline();
  const isOnline = !isOffline;
  
  const { fetchEntries, addEntry, getTodayStats } = useDailyEntries();
  const { getCurrentRate } = useMarketRates();
  const { farmers, loading: farmersLoading } = useFarmers();
  const { entries, loading: entriesLoading } = useDailyEntries();
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  
  const gridRef = useRef(null);

  const currentRate = getCurrentRate();
  const todayStats = getTodayStats();
  const loading = entriesLoading || farmersLoading;

  useEffect(() => {
    if (selectedDate) {
      fetchEntries(selectedDate);
    }
  }, [selectedDate, fetchEntries]);

  const handleSyncNow = async () => {
    try {
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 3000);
    } catch (error) {
      console.error('Error triggering sync:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-charcoal">
            {t('dailyEntry.title')}
          </h1>
          
          <div className="flex items-center gap-3">
            {/* Current Rate Display */}
            <div className="bg-accent-magenta text-white px-4 py-2 rounded-lg shadow-md">
              <span className="text-sm font-medium">
                {t('dailyEntry.currentRate', { rate: currentRate || '0.00' })}
              </span>
            </div>
            
            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-warm-brown">
                {t('common.date')}:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="input-field"
              />
            </div>
            
            {/* Sync Button */}
            <button
              onClick={handleSyncNow}
              disabled={syncQueueCount === 0 || !isOnline}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-warm-taupe rounded-lg hover:border-accent-magenta transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw size={16} className={syncQueueCount > 0 ? 'animate-spin' : ''} />
              <span className="text-sm font-medium">
                {t('offline.syncNow')}
              </span>
            </button>
          </div>
        </div>
        
        {/* Sync Success Toast */}
        {showSyncSuccess && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-emerald-100 border-2 border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-lg fade-in">
              <p className="font-semibold text-sm">
                {t('offline.syncSuccess')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-2 border-warm-taupe rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-sm text-warm-brown">
                {t('dashboard.totalEntries')}
              </p>
              <p className="text-2xl font-bold text-warm-charcoal">
                {todayStats?.count || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-warm-brown">
                {t('dashboard.totalWeight')}
              </p>
              <p className="text-2xl font-bold text-warm-charcoal">
                {todayStats?.totalWeight || '0'} kg
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-warm-brown">
                {t('dashboard.totalAmount')}
              </p>
              <p className="text-2xl font-bold text-warm-charcoal">
                ₹{todayStats?.totalAmount || '0.00'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-warm-brown">
                Avg/Entry
              </p>
              <p className="text-2xl font-bold text-warm-charcoal">
                ₹{todayStats?.count > 0 ? (todayStats.totalAmount / todayStats.count).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${syncQueueCount > 0 ? 'bg-accent-crimson' : 'bg-emerald-100'} transition-colors duration-300`}>
              <RefreshCw size={16} className={syncQueueCount > 0 ? 'animate-spin' : ''} />
              <span className="text-sm font-medium">
                {syncQueueCount} {t('offline.syncQueue', { count: syncQueueCount })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Entry Grid */}
      <div ref={gridRef}>
        <EntryGrid
          entries={entries}
          farmers={farmers}
          currentRate={currentRate}
          onAddEntry={addEntry}
          onUpdateEntry={async (entry) => {
            try {
              await addEntry(entry);
            } catch (error) {
              console.error('Error updating entry:', error);
            }
          }}
          onDeleteEntry={async (id) => {
            try {
              await fetchEntries(selectedDate);
            } catch (error) {
              console.error('Error deleting entry:', error);
            }
          }}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default DailyEntryPage;
