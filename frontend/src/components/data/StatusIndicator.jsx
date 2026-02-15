import { useOffline } from '../../context/OfflineContext';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

const StatusIndicator = ({ showSyncCount = false, className = '' }) => {
  const { isOffline, syncQueueCount, isSyncing } = useOffline();
  const isOnline = !isOffline;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Connection Status */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
        isOnline 
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
          : 'bg-amber-100 text-amber-800 border border-amber-200'
      }`}>
        {isOnline ? (
          <>
            <Wifi size={16} />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>Offline</span>
          </>
        )}
      </div>

      {/* Sync Status */}
      {showSyncCount && (syncQueueCount > 0 || isSyncing) && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-crimson text-white rounded-lg text-sm font-semibold">
          {isSyncing ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <span className="font-bold">{syncQueueCount}</span>
              <span>pending</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;
