import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useTheme } from '../context/ThemeContext';
import { useMarketRates } from '../hooks/useMarketRates';
import { useFarmers } from '../hooks/useFarmers';
import { useDailyEntries } from '../hooks/useDailyEntries';
import EntryGrid from '../components/entry/EntryGrid';
import DatePicker from '../components/forms/DatePicker';
import { RefreshCw, TrendingUp, Scale, IndianRupee, Hash } from 'lucide-react';
import { format } from 'date-fns';

/**
 * DailyEntryPage - Arctic Frost Design
 * 
 * Features:
 * - Theme-aware styling (arctic/warm)
 * - Stats bar with icons
 * - Native date picker with arctic styling
 * - Sync status indicator
 * - Responsive layout
 * - Entrance animations
 */
const DailyEntryPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isOffline, syncQueueCount } = useOffline();
  const { theme } = useTheme();
  const isOnline = !isOffline;
  const isArctic = theme === 'arctic';

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

  // Calculate average per entry
  const avgPerEntry = todayStats?.count > 0
    ? (todayStats.totalAmount / todayStats.count).toFixed(2)
    : '0.00';

  // Stats data
  const stats = [
    {
      icon: Hash,
      label: t('dashboard.totalEntries'),
      value: todayStats?.count || 0,
      color: isArctic ? 'text-glacier-500' : 'text-accent-magenta',
      bg: isArctic ? 'bg-glacier-50' : 'bg-accent-magenta/10',
    },
    {
      icon: Scale,
      label: t('dashboard.totalWeight'),
      value: `${todayStats?.totalWeight || '0'} kg`,
      color: isArctic ? 'text-aurora' : 'text-accent-emerald',
      bg: isArctic ? 'bg-aurora/10' : 'bg-accent-emerald/10',
    },
    {
      icon: IndianRupee,
      label: t('dashboard.totalAmount'),
      value: `₹${todayStats?.totalAmount || '0.00'}`,
      color: isArctic ? 'text-gold-500' : 'text-accent-gold',
      bg: isArctic ? 'bg-gold-50' : 'bg-accent-gold/10',
    },
    {
      icon: TrendingUp,
      label: t('dashboard.avgPerEntry') || 'Avg/Entry',
      value: `₹${avgPerEntry}`,
      color: isArctic ? 'text-frostbite' : 'text-accent-crimson',
      bg: isArctic ? 'bg-frostbite/10' : 'bg-accent-crimson/10',
    },
  ];

  return (
    <div className={`space-y-6 ${isArctic ? 'animate-fade-in-up' : ''}`}>
      {/* Sync Success Toast */}
      {showSyncSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className={`
            px-4 py-3 rounded-arctic shadow-frost-lg
            ${isArctic
              ? 'bg-aurora/20 border border-aurora/30 text-aurora'
              : 'bg-emerald-100 border-2 border-emerald-200 text-emerald-800 rounded-lg'
            }
          `}>
            <p className="font-semibold text-sm">
              {t('offline.syncSuccess')}
            </p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className={`
        flex flex-col md:flex-row md:items-center md:justify-between gap-4
        ${isArctic ? 'animate-slide-in-down' : ''}
      `}>
        <div className="space-y-3">
          <h1 className={`
            font-display text-2xl font-bold
            ${isArctic ? 'text-slate-charcoal' : 'text-warm-charcoal'}
          `}>
            {t('dailyEntry.title')}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            {/* Current Rate Badge */}
            <div className={`
              flex items-center gap-2 px-4 py-2 rounded-arctic
              ${isArctic
                ? 'bg-gradient-to-r from-glacier-500 to-glacier-600 text-white shadow-frost-md'
                : 'bg-accent-magenta text-white rounded-lg shadow-md'
              }
            `}>
              <TrendingUp size={16} />
              <span className="text-sm font-semibold">
                {t('dailyEntry.currentRate', { rate: currentRate || '0.00' })}
              </span>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <label className={`
                text-sm font-medium
                ${isArctic ? 'text-slate-cool' : 'text-warm-brown'}
              `}>
                {t('common.date')}:
              </label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                maxDate={new Date()}
                className="w-44"
              />
            </div>

            {/* Sync Button */}
            <button
              onClick={handleSyncNow}
              disabled={syncQueueCount === 0 || !isOnline}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-arctic
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isArctic
                  ? 'bg-arctic-ice border border-ice-border hover:border-glacier-400 hover:shadow-frost-sm'
                  : 'bg-white border-2 border-warm-taupe rounded-lg hover:border-accent-magenta'
                }
              `}
            >
              <RefreshCw
                size={16}
                className={`${syncQueueCount > 0 ? 'animate-spin' : ''} ${
                  isArctic ? 'text-glacier-500' : 'text-warm-brown'
                }`}
              />
              <span className={`text-sm font-medium ${isArctic ? 'text-slate-charcoal' : 'text-warm-charcoal'}`}>
                {t('offline.syncNow')}
              </span>
            </button>
          </div>
        </div>

        {/* Sync Queue Indicator */}
        <div className={`
          flex items-center gap-2 px-4 py-2.5 rounded-arctic transition-colors duration-300
          ${syncQueueCount > 0
            ? isArctic
              ? 'bg-frostbite/20 text-frostbite'
              : 'bg-accent-crimson text-white'
            : isArctic
              ? 'bg-aurora/20 text-aurora'
              : 'bg-emerald-100 text-emerald-800'
          }
        `}>
          <RefreshCw size={16} className={syncQueueCount > 0 ? 'animate-spin' : ''} />
          <span className="text-sm font-semibold">
            {syncQueueCount} {t('offline.syncQueue', { count: syncQueueCount })}
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={`
        p-5 rounded-arctic-lg
        ${isArctic
          ? 'bg-arctic-ice/80 backdrop-blur-sm border border-ice-border shadow-frost-sm'
          : 'bg-white border-2 border-warm-taupe rounded-lg'
        }
        ${isArctic ? 'animate-slide-in-up animation-delay-100' : ''}
      `}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`
                  flex items-center gap-3
                  ${isArctic ? 'animate-fade-in-up' : ''}
                `}
                style={isArctic ? { animationDelay: `${(index + 1) * 75}ms` } : {}}
              >
                <div className={`
                  p-2.5 rounded-arctic
                  ${stat.bg}
                `}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div>
                  <p className={`text-xs font-medium ${isArctic ? 'text-slate-mist' : 'text-warm-brown'}`}>
                    {stat.label}
                  </p>
                  <p className={`
                    text-xl font-bold font-mono
                    ${isArctic ? 'text-slate-charcoal' : 'text-warm-charcoal'}
                  `}>
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Entry Grid */}
      <div
        ref={gridRef}
        className={isArctic ? 'animate-slide-in-up animation-delay-200' : ''}
      >
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
