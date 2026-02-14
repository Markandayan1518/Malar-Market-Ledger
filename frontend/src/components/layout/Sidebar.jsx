import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Settings,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';

const Sidebar = ({ isOpen, onClose, isMobile }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { syncQueue } = useOffline();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    {
      path: '/dashboard',
      label: 'nav.dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'staff', 'farmer']
    },
    {
      path: '/daily-entry',
      label: 'nav.dailyEntry',
      icon: PlusCircle,
      roles: ['admin', 'staff']
    },
    {
      path: '/farmers',
      label: 'nav.farmers',
      icon: Users,
      roles: ['admin', 'staff', 'farmer']
    },
    {
      path: '/market-rates',
      label: 'nav.marketRates',
      icon: DollarSign,
      roles: ['admin', 'staff']
    },
    {
      path: '/cash-advances',
      label: 'nav.cashAdvances',
      icon: FileText,
      roles: ['admin', 'staff', 'farmer']
    },
    {
      path: '/settlements',
      label: 'nav.settlements',
      icon: TrendingUp,
      roles: ['admin', 'staff', 'farmer']
    },
    {
      path: '/reports',
      label: 'nav.reports',
      icon: FileText,
      roles: ['admin', 'staff']
    },
    {
      path: '/settings',
      label: 'nav.settings',
      icon: Settings,
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-warm-charcoal/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-white border-r-2 border-warm-taupe z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          w-64 flex flex-col
        `}
      >
        {/* Close Button (Mobile Only) */}
        {isMobile && (
          <div className="flex justify-end p-4 border-b border-warm-sand">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-warm-sand transition-colors duration-200"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Logo Section */}
        <div className="p-6 border-b-2 border-warm-sand">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent-magenta rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-2xl font-display">M</span>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-warm-charcoal">
                {t('app.name')}
              </h2>
              <p className="text-xs text-warm-brown">Digital Ledger</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={isMobile ? onClose : undefined}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-accent-magenta text-white shadow-md' 
                        : 'text-warm-charcoal hover:bg-warm-sand'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span>{t(item.label)}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sync Queue Indicator */}
        {syncQueue.length > 0 && (
          <div className="p-4 border-t-2 border-warm-sand">
            <div className="bg-accent-crimson text-white rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t('offline.title')}
                </span>
              </div>
              <p className="text-sm">
                {t('offline.syncQueue', { count: syncQueue.length })}
              </p>
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="p-4 border-t-2 border-warm-sand bg-warm-sand/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-purple rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-warm-charcoal truncate">
                {user?.username}
              </p>
              <p className="text-xs text-warm-brown capitalize">
                {t(`roles.${user?.role}`)}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
