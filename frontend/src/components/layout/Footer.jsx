import { useTranslation } from 'react-i18next';
import { useOffline } from '../../context/OfflineContext';
import { useTheme } from '../../context/ThemeContext';
import { Wifi, WifiOff, Clock, Database } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

/**
 * Footer Component - Arctic Frost Design
 * 
 * Features:
 * - Arctic background with subtle border
 * - Connection status indicator
 * - App version display
 * - Real-time clock
 * - Compact mode for smaller screens
 */
const Footer = ({ compact = false }) => {
  const { t } = useTranslation();
  const { isOffline, syncQueueCount } = useOffline();
  const { theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(format(new Date(), 'HH:mm'));

  const isOnline = !isOffline;
  const isArctic = theme === 'arctic';

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(format(new Date(), 'HH:mm'));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <footer
        className={`
          px-3 py-1.5
          ${isArctic
            ? 'bg-arctic-frost/50 border-t border-ice-border'
            : 'bg-warm-sand/30 border-t-2 border-warm-taupe'
          }
        `.replace(/\s+/g, ' ').trim()}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div
              className={`
                w-2 h-2 rounded-full
                ${isOnline ? 'bg-aurora animate-pulse' : 'bg-gold'}
              `.replace(/\s+/g, ' ').trim()}
            />
            <span className={isArctic ? 'text-slate-cool' : 'text-warm-brown'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className={`flex items-center gap-1 font-mono ${isArctic ? 'text-slate-mist' : 'text-warm-brown'}`}>
            <Clock size={12} />
            <span>{currentTime}</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`
        px-4 py-2.5
        ${isArctic
          ? 'bg-arctic-frost/50 border-t border-ice-border backdrop-blur-sm'
          : 'bg-white border-t-2 border-warm-taupe'
        }
      `.replace(/\s+/g, ' ').trim()}
    >
      <div className="flex items-center justify-between">
        {/* Left: Connection Status */}
        <div className="flex items-center gap-3">
          <div
            className={`
              flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold
              ${isOnline
                ? isArctic
                  ? 'bg-aurora/10 text-aurora border border-aurora/20'
                  : 'bg-emerald-100 text-emerald-800'
                : isArctic
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'bg-amber-100 text-amber-800'
              }
            `.replace(/\s+/g, ' ').trim()}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isOnline ? t('offline.syncSuccess') : t('offline.title')}</span>
          </div>

          {/* Sync Queue Indicator */}
          {syncQueueCount > 0 && (
            <div
              className={`
                flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
                ${isArctic
                  ? 'bg-frostbite/10 text-frostbite border border-frostbite/20'
                  : 'bg-accent-crimson/10 text-accent-crimson'
                }
              `.replace(/\s+/g, ' ').trim()}
            >
              <Database size={12} />
              <span>{syncQueueCount} pending</span>
            </div>
          )}
        </div>

        {/* Center: App Info */}
        <div
          className={`
            hidden sm:flex items-center gap-2 text-sm
            ${isArctic ? 'text-slate-cool' : 'text-warm-brown'}
          `.replace(/\s+/g, ' ').trim()}
        >
          <span className="font-semibold font-display">{t('app.shortName')}</span>
          <span className={isArctic ? 'text-slate-mist' : 'text-warm-taupe'}>•</span>
          <span
            className={`
              px-1.5 py-0.5 rounded text-xs font-mono
              ${isArctic
                ? 'bg-arctic-ice text-slate-cool border border-ice-border'
                : 'bg-warm-sand text-warm-brown'
              }
            `.replace(/\s+/g, ' ').trim()}
          >
            v1.0.0
          </span>
        </div>

        {/* Right: Time */}
        <div
          className={`
            flex items-center gap-2 px-2.5 py-1 rounded-arctic
            ${isArctic
              ? 'bg-arctic-ice text-slate-charcoal border border-ice-border'
              : 'bg-warm-sand/50 text-warm-brown'
            }
          `.replace(/\s+/g, ' ').trim()}
        >
          <Clock size={14} className={isArctic ? 'text-glacier-500' : 'text-warm-brown'} />
          <span className="font-mono text-sm font-medium">{currentTime}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
