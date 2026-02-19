import { useTranslation } from 'react-i18next';
import { useOffline } from '../../context/OfflineContext';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';

/**
 * Arctic Frost Theme - Status Indicator Component
 * 
 * Features:
 * - Arctic status colors
 * - Pulse animation option
 * - Multiple size variants
 * - Tooltip support
 * - Connection and sync status display
 */
const StatusIndicator = ({ 
  showSyncCount = false, 
  size = 'md',
  showLabel = true,
  className = '' 
}) => {
  const { t } = useTranslation();
  const { isOffline, syncQueueCount, isSyncing } = useOffline();
  const isOnline = !isOffline;

  const sizeConfig = {
    sm: {
      container: 'px-2 py-1 text-xs gap-1',
      icon: 14,
      badge: 'text-xs'
    },
    md: {
      container: 'px-3 py-1.5 text-sm gap-1.5',
      icon: 16,
      badge: 'text-sm'
    },
    lg: {
      container: 'px-4 py-2 text-base gap-2',
      icon: 18,
      badge: 'text-base'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Connection Status */}
      <div 
        className={`
          flex items-center rounded-arctic font-semibold
          transition-all duration-300
          ${config.container}
          ${isOnline 
            ? 'bg-aurora-50 text-aurora-700 border border-aurora-200' 
            : 'bg-gold-50 text-gold-700 border border-gold-200'
          }
        `}
        title={isOnline ? t('status.online') : t('status.offline')}
      >
        {isOnline ? (
          <>
            <Wifi size={config.icon} className="flex-shrink-0" />
            {showLabel && <span>{t('status.online')}</span>}
          </>
        ) : (
          <>
            <WifiOff size={config.icon} className="flex-shrink-0" />
            {showLabel && <span>{t('status.offline')}</span>}
          </>
        )}
      </div>

      {/* Sync Status */}
      {showSyncCount && (syncQueueCount > 0 || isSyncing) && (
        <div 
          className={`
            flex items-center rounded-arctic font-semibold
            bg-frostbite-50 text-frostbite-700 border border-frostbite-200
            ${config.container}
          `}
          title={isSyncing ? t('status.syncing') : t('status.pendingSync')}
        >
          {isSyncing ? (
            <>
              <RefreshCw size={config.icon} className="animate-spin flex-shrink-0" />
              {showLabel && <span>{t('status.syncing')}</span>}
            </>
          ) : (
            <>
              <span className="font-bold">{syncQueueCount}</span>
              {showLabel && <span>{t('status.pending')}</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Connection Status - Compact version
 */
export const ConnectionStatus = ({ 
  size = 'md',
  showLabel = true,
  pulse = true,
  className = '' 
}) => {
  const { t } = useTranslation();
  const { isOffline } = useOffline();
  const isOnline = !isOffline;

  const sizeConfig = {
    sm: { icon: 12, text: 'text-xs', gap: 'gap-1' },
    md: { icon: 14, text: 'text-sm', gap: 'gap-1.5' },
    lg: { icon: 16, text: 'text-base', gap: 'gap-2' }
  };

  const config = sizeConfig[size];

  return (
    <div 
      className={`
        inline-flex items-center ${config.gap} ${config.text}
        ${className}
      `}
      title={isOnline ? t('status.online') : t('status.offline')}
    >
      <span className="relative flex h-2.5 w-2.5">
        {pulse && isOnline && (
          <span className={`
            absolute inline-flex h-full w-full 
            rounded-full opacity-75
            animate-ping
            bg-aurora-500
          `} />
        )}
        <span className={`
          relative inline-flex rounded-full h-2.5 w-2.5
          ${isOnline ? 'bg-aurora-500' : 'bg-gold-500'}
        `} />
      </span>
      {showLabel && (
        <span className={isOnline ? 'text-aurora-700' : 'text-gold-700'}>
          {isOnline ? t('status.online') : t('status.offline')}
        </span>
      )}
    </div>
  );
};

/**
 * Sync Status - Shows pending items count
 */
export const SyncStatus = ({ 
  size = 'md',
  showLabel = true,
  className = '' 
}) => {
  const { t } = useTranslation();
  const { syncQueueCount, isSyncing } = useOffline();

  const sizeConfig = {
    sm: { icon: 12, text: 'text-xs', gap: 'gap-1' },
    md: { icon: 14, text: 'text-sm', gap: 'gap-1.5' },
    lg: { icon: 16, text: 'text-base', gap: 'gap-2' }
  };

  const config = sizeConfig[size];

  if (syncQueueCount === 0 && !isSyncing) {
    return (
      <div 
        className={`inline-flex items-center ${config.gap} ${config.text} text-aurora-600 ${className}`}
        title={t('status.allSynced')}
      >
        <Cloud size={config.icon} />
        {showLabel && <span>{t('status.synced')}</span>}
      </div>
    );
  }

  return (
    <div 
      className={`
        inline-flex items-center ${config.gap} ${config.text}
        text-frostbite-600
        ${className}
      `}
      title={isSyncing ? t('status.syncing') : `${syncQueueCount} ${t('status.pending')}`}
    >
      {isSyncing ? (
        <>
          <RefreshCw size={config.icon} className="animate-spin" />
          {showLabel && <span>{t('status.syncing')}</span>}
        </>
      ) : (
        <>
          <CloudOff size={config.icon} />
          <span className="font-semibold">{syncQueueCount}</span>
          {showLabel && <span>{t('status.pending')}</span>}
        </>
      )}
    </div>
  );
};

/**
 * Simple Status Dot - Minimal indicator
 */
export const StatusDot = ({ 
  status = 'neutral',
  size = 'md',
  pulse = false,
  tooltip,
  className = '' 
}) => {
  const statusColors = {
    online: 'bg-aurora-500',
    offline: 'bg-gold-500',
    success: 'bg-aurora-500',
    warning: 'bg-gold-500',
    error: 'bg-frostbite-500',
    info: 'bg-glacier-500',
    neutral: 'bg-slate-400'
  };

  const sizeConfig = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3'
  };

  return (
    <span 
      className={`relative inline-flex ${sizeConfig[size]} ${className}`}
      title={tooltip}
    >
      {pulse && (
        <span className={`
          absolute inline-flex h-full w-full 
          rounded-full opacity-75
          animate-ping
          ${statusColors[status]}
        `} />
      )}
      <span className={`
        relative inline-flex rounded-full 
        ${sizeConfig[size]}
        ${statusColors[status]}
      `} />
    </span>
  );
};

export default StatusIndicator;
