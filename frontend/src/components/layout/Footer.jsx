import { useTranslation } from 'react-i18next';
import { useOffline } from '../../context/OfflineContext';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Footer = () => {
  const { t } = useTranslation();
  const { isOnline } = useOffline();
  const currentTime = format(new Date(), 'HH:mm');

  return (
    <footer className="bg-white border-t-2 border-warm-taupe px-4 py-2">
      <div className="flex items-center justify-between text-sm">
        {/* Left: Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
            isOnline 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-amber-100 text-amber-800'
          }`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Center: App Info */}
        <div className="hidden sm:flex items-center gap-2 text-warm-brown">
          <span className="font-medium">{t('app.shortName')}</span>
          <span className="text-warm-taupe">•</span>
          <span className="text-xs">v1.0.0</span>
        </div>

        {/* Right: Time */}
        <div className="flex items-center gap-1.5 text-warm-brown">
          <Clock size={14} />
          <span className="font-mono text-xs">{currentTime}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
