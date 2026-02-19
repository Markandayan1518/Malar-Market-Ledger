import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  DollarSign,
  FileText,
  TrendingUp,
  Settings,
  Receipt,
  Building2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Sidebar Component - Arctic Frost Design
 * 
 * Features:
 * - Arctic background with frosted glass
 * - Active state with left border indicator
 * - Hover effects with smooth transitions
 * - Collapse/expand functionality
 * - Section headers for navigation groups
 */
const Sidebar = ({ isOpen, onClose, isMobile }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { syncQueueCount } = useOffline();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isArctic = theme === 'arctic';

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    {
      path: '/dashboard',
      label: 'nav.dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'staff', 'farmer'],
      section: 'main'
    },
    {
      path: '/daily-entry',
      label: 'nav.dailyEntry',
      icon: PlusCircle,
      roles: ['admin', 'staff'],
      section: 'main'
    },
    {
      path: '/farmers',
      label: 'nav.farmers',
      icon: Users,
      roles: ['admin', 'staff', 'farmer'],
      section: 'main'
    },
    {
      path: '/market-rates',
      label: 'nav.marketRates',
      icon: DollarSign,
      roles: ['admin', 'staff'],
      section: 'main'
    },
    {
      path: '/cash-advances',
      label: 'nav.cashAdvances',
      icon: FileText,
      roles: ['admin', 'staff', 'farmer'],
      section: 'financial'
    },
    {
      path: '/settlements',
      label: 'nav.settlements',
      icon: TrendingUp,
      roles: ['admin', 'staff', 'farmer'],
      section: 'financial'
    },
    {
      path: '/reports',
      label: 'nav.reports',
      icon: FileText,
      roles: ['admin', 'staff'],
      section: 'financial'
    },
    {
      path: '/invoices',
      label: 'nav.invoices',
      icon: Receipt,
      roles: ['admin', 'staff'],
      section: 'financial'
    },
    {
      path: '/business-settings',
      label: 'nav.businessSettings',
      icon: Building2,
      roles: ['admin'],
      section: 'settings'
    },
    {
      path: '/settings',
      label: 'nav.settings',
      icon: Settings,
      roles: ['admin'],
      section: 'settings'
    }
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role)
  );

  // Group items by section
  const sections = {
    main: { label: 'Main', items: [] },
    financial: { label: 'Financial', items: [] },
    settings: { label: 'Settings', items: [] }
  };

  filteredMenuItems.forEach(item => {
    if (sections[item.section]) {
      sections[item.section].items.push(item);
    }
  });

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          className={`
            fixed inset-0 z-40 lg:hidden
            ${isArctic
              ? 'bg-slate-charcoal/40 backdrop-blur-sm'
              : 'bg-warm-charcoal/50 backdrop-blur-sm'
            }
          `.replace(/\s+/g, ' ').trim()}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          ${isCollapsed ? 'w-20' : 'w-64'}
          flex flex-col
          ${isArctic
            ? 'bg-arctic-ice border-r border-ice-border shadow-frost-sm'
            : 'bg-white border-r-2 border-warm-taupe'
          }
        `.replace(/\s+/g, ' ').trim()}
      >
        {/* Close Button (Mobile Only) */}
        {isMobile && (
          <div
            className={`
              flex justify-end p-4
              ${isArctic ? 'border-b border-ice-border' : 'border-b border-warm-sand'}
            `.replace(/\s+/g, ' ').trim()}
          >
            <button
              onClick={onClose}
              className={`
                p-2 rounded-arctic transition-all duration-200
                ${isArctic
                  ? 'hover:bg-arctic-frost active:scale-95 text-slate-charcoal'
                  : 'hover:bg-warm-sand text-warm-charcoal'
                }
              `.replace(/\s+/g, ' ').trim()}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Logo Section */}
        <div
          className={`
            p-4 flex items-center gap-3
            ${isArctic ? 'border-b border-ice-border' : 'border-b-2 border-warm-sand'}
            ${isCollapsed ? 'justify-center' : ''}
          `.replace(/\s+/g, ' ').trim()}
        >
          <div
            className={`
              ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'}
              rounded-arctic-lg flex items-center justify-center shadow-frost-sm
              ${isArctic
                ? 'bg-gradient-to-br from-glacier-500 to-glacier-600'
                : 'bg-accent-magenta shadow-md'
              }
            `.replace(/\s+/g, ' ').trim()}
          >
            <span className="text-white font-bold text-xl font-display">M</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h2
                className={`
                  font-display text-lg font-bold truncate
                  ${isArctic ? 'text-slate-charcoal' : 'text-warm-charcoal'}
                `.replace(/\s+/g, ' ').trim()}
              >
                {t('app.name')}
              </h2>
              <p
                className={`
                  text-xs truncate
                  ${isArctic ? 'text-slate-cool' : 'text-warm-brown'}
                `.replace(/\s+/g, ' ').trim()}
              >
                Digital Ledger
              </p>
            </div>
          )}
        </div>

        {/* Collapse Toggle (Desktop Only) */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              absolute -right-3 top-20 z-10
              w-6 h-6 rounded-full flex items-center justify-center
              transition-all duration-200
              ${isArctic
                ? 'bg-glacier-500 text-white hover:bg-glacier-600 shadow-frost-sm'
                : 'bg-accent-magenta text-white hover:bg-accent-magenta/90'
              }
            `.replace(/\s+/g, ' ').trim()}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {Object.entries(sections).map(([sectionKey, section]) => {
            if (section.items.length === 0) return null;
            return (
              <div key={sectionKey} className="mb-4">
                {/* Section Header */}
                {!isCollapsed && (
                  <h3
                    className={`
                      px-3 py-2 text-xs font-semibold uppercase tracking-wider
                      ${isArctic ? 'text-slate-mist' : 'text-warm-brown'}
                    `.replace(/\s+/g, ' ').trim()}
                  >
                    {section.label}
                  </h3>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={isMobile ? onClose : undefined}
                          className={({ isActive }) => `
                            flex items-center gap-3 px-3 py-2.5 rounded-arctic font-medium
                            transition-all duration-200
                            ${isCollapsed ? 'justify-center' : ''}
                            ${isActive
                              ? isArctic
                                ? 'bg-glacier-500 text-white shadow-frost-sm'
                                : 'bg-accent-magenta text-white shadow-md'
                              : isArctic
                                ? 'text-slate-charcoal hover:bg-arctic-frost hover:text-glacier-600'
                                : 'text-warm-charcoal hover:bg-warm-sand'
                            }
                            ${isActive && !isCollapsed && isArctic ? 'border-l-4 border-glacier-300 ml-0' : ''}
                          `.replace(/\s+/g, ' ').trim()}
                          title={isCollapsed ? t(item.label) : undefined}
                        >
                          <Icon size={20} />
                          {!isCollapsed && <span>{t(item.label)}</span>}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Sync Queue Indicator */}
        {syncQueueCount > 0 && (
          <div
            className={`
              p-3 mx-2 mb-2
              ${isArctic ? 'border-t border-ice-border' : 'border-t-2 border-warm-sand'}
            `.replace(/\s+/g, ' ').trim()}
          >
            <div
              className={`
                rounded-arctic p-3
                ${isArctic
                  ? 'bg-frostbite/10 border border-frostbite/20'
                  : 'bg-accent-crimson text-white'
                }
              `.replace(/\s+/g, ' ').trim()}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`
                    w-2 h-2 rounded-full animate-pulse
                    ${isArctic ? 'bg-frostbite' : 'bg-white'}
                  `.replace(/\s+/g, ' ').trim()}
                />
                <span
                  className={`
                    text-xs font-semibold uppercase tracking-wide
                    ${isArctic ? 'text-frostbite' : 'text-white'}
                  `.replace(/\s+/g, ' ').trim()}
                >
                  {isCollapsed ? '' : t('offline.title')}
                </span>
              </div>
              {!isCollapsed && (
                <p
                  className={`
                    text-sm
                    ${isArctic ? 'text-frostbite' : 'text-white'}
                  `.replace(/\s+/g, ' ').trim()}
                >
                  {t('offline.syncQueue', { count: syncQueueCount })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* User Info */}
        <div
          className={`
            p-3 m-2 rounded-arctic-lg
            ${isArctic
              ? 'bg-arctic-frost/50 border border-ice-border'
              : 'bg-warm-sand/30 border-t-2 border-warm-sand'
            }
            ${isCollapsed ? 'flex justify-center' : ''}
          `.replace(/\s+/g, ' ').trim()}
        >
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${isArctic
                  ? 'bg-gradient-to-br from-glacier-400 to-glacier-600'
                  : 'bg-accent-purple'
                }
              `.replace(/\s+/g, ' ').trim()}
            >
              <span className="text-white font-bold text-sm">
                {user?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p
                  className={`
                    text-sm font-semibold truncate
                    ${isArctic ? 'text-slate-charcoal' : 'text-warm-charcoal'}
                  `.replace(/\s+/g, ' ').trim()}
                >
                  {user?.full_name}
                </p>
                <p
                  className={`
                    text-xs capitalize
                    ${isArctic ? 'text-slate-cool' : 'text-warm-brown'}
                  `.replace(/\s+/g, ' ').trim()}
                >
                  {t(`roles.${user?.role}`)}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
