import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, X, Wifi, WifiOff, RefreshCw, LogOut, User, Globe, Snowflake, Sun, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Header Component - Arctic Frost Design
 * 
 * Features:
 * - Frosted glass background effect
 * - High contrast for early morning use
 * - Offline indicator with sync status
 * - Language toggle (EN/TA)
 * - Theme toggle (Arctic/Warm)
 * - User menu dropdown
 */
const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { isOffline, syncQueueCount, syncPendingData } = useOffline();
  const isOnline = !isOffline;
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isArctic = theme === 'arctic';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ta' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header
      className={`
        sticky top-0 z-30
        ${isArctic
          ? 'bg-arctic-ice/90 backdrop-blur-md border-b border-ice-border shadow-frost-sm'
          : 'bg-white border-b-2 border-warm-taupe shadow-sm'
        }
      `.replace(/\s+/g, ' ').trim()}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Logo and Menu Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className={`
              p-2 rounded-arctic transition-all duration-200 lg:hidden
              ${isArctic
                ? 'hover:bg-arctic-frost active:scale-95 text-slate-charcoal'
                : 'hover:bg-warm-sand text-warm-charcoal'
              }
            `.replace(/\s+/g, ' ').trim()}
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center gap-3">
            {/* Logo */}
            <div
              className={`
                w-10 h-10 rounded-arctic-lg flex items-center justify-center
                ${isArctic
                  ? 'bg-gradient-to-br from-glacier-500 to-glacier-600 shadow-frost-sm'
                  : 'bg-accent-magenta'
                }
              `.replace(/\s+/g, ' ').trim()}
            >
              <span className="text-white font-bold text-xl font-display">M</span>
            </div>

            <div>
              <h1
                className={`
                  font-display text-lg font-bold leading-tight
                  ${isArctic ? 'text-slate-charcoal' : 'text-warm-charcoal'}
                `.replace(/\s+/g, ' ').trim()}
              >
                {t('app.shortName')}
              </h1>
              <p
                className={`
                  text-xs hidden sm:block
                  ${isArctic ? 'text-slate-cool' : 'text-warm-brown'}
                `.replace(/\s+/g, ' ').trim()}
              >
                {t('app.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Sync Status (visible on larger screens) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Online/Offline Status */}
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
              ${isOnline
                ? isArctic
                  ? 'bg-aurora/10 text-aurora border border-aurora/20'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : isArctic
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }
            `.replace(/\s+/g, ' ').trim()}
          >
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isOnline ? t('offline.syncSuccess') : t('offline.title')}</span>
          </div>

          {/* Sync Queue Count */}
          {syncQueueCount > 0 && (
            <div
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                ${isArctic
                  ? 'bg-frostbite/10 text-frostbite border border-frostbite/20'
                  : 'bg-accent-crimson text-white'
                }
              `.replace(/\s+/g, ' ').trim()}
            >
              <RefreshCw size={16} className={isOnline ? 'animate-spin' : ''} />
              <span>{t('offline.syncQueue', { count: syncQueueCount })}</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className={`
              flex items-center gap-1.5 px-2.5 py-2 rounded-arctic transition-all duration-200
              ${isArctic
                ? 'hover:bg-arctic-frost active:scale-95 text-slate-cool hover:text-slate-charcoal'
                : 'hover:bg-warm-sand text-warm-brown'
              }
            `.replace(/\s+/g, ' ').trim()}
            aria-label="Toggle language"
            title={i18n.language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
          >
            <Globe size={18} />
            <span className="text-xs font-semibold hidden sm:inline uppercase">
              {i18n.language === 'en' ? 'EN' : 'தமி'}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`
              p-2 rounded-arctic transition-all duration-200
              ${isArctic
                ? 'hover:bg-arctic-frost active:scale-95'
                : 'hover:bg-warm-sand'
              }
            `.replace(/\s+/g, ' ').trim()}
            aria-label="Toggle theme"
            title={isArctic ? 'Switch to Warm theme' : 'Switch to Arctic theme'}
          >
            {isArctic
              ? <Sun size={20} className="text-gold" />
              : <Snowflake size={20} className="text-blue-500" />
            }
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`
                flex items-center gap-2 px-2 py-1.5 rounded-arctic transition-all duration-200
                ${isArctic
                  ? 'hover:bg-arctic-frost active:scale-[0.98]'
                  : 'hover:bg-warm-sand'
                }
              `.replace(/\s+/g, ' ').trim()}
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
            >
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${isArctic
                    ? 'bg-gradient-to-br from-glacier-400 to-glacier-600'
                    : 'bg-accent-purple'
                  }
                `.replace(/\s+/g, ' ').trim()}
              >
                <User size={16} className="text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p
                  className={`
                    text-sm font-semibold
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
              <ChevronDown
                size={16}
                className={`
                  hidden sm:block transition-transform duration-200
                  ${isUserMenuOpen ? 'rotate-180' : ''}
                  ${isArctic ? 'text-slate-mist' : 'text-warm-brown'}
                `.replace(/\s+/g, ' ').trim()}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                {/* Backdrop for mobile */}
                <div
                  className="fixed inset-0 z-40 sm:hidden"
                  onClick={() => setIsUserMenuOpen(false)}
                />

                <div
                  className={`
                    absolute right-0 top-full mt-2 w-56 rounded-arctic-lg overflow-hidden z-50
                    shadow-frost-lg animate-fade-in-up
                    ${isArctic
                      ? 'bg-arctic-ice border border-ice-border'
                      : 'bg-white border-2 border-warm-taupe shadow-strong'
                    }
                  `.replace(/\s+/g, ' ').trim()}
                >
                  {/* User Info Header */}
                  <div
                    className={`
                      px-4 py-3
                      ${isArctic
                        ? 'bg-arctic-frost/50 border-b border-ice-border'
                        : 'border-b border-warm-sand'
                      }
                    `.replace(/\s+/g, ' ').trim()}
                  >
                    <p
                      className={`
                        text-sm font-semibold
                        ${isArctic ? 'text-slate-charcoal' : 'text-warm-charcoal'}
                      `.replace(/\s+/g, ' ').trim()}
                    >
                      {user?.full_name}
                    </p>
                    <p
                      className={`
                        text-xs
                        ${isArctic ? 'text-slate-cool' : 'text-warm-brown'}
                      `.replace(/\s+/g, ' ').trim()}
                    >
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200
                        ${isArctic
                          ? 'hover:bg-frostbite/5 text-slate-charcoal hover:text-frostbite'
                          : 'hover:bg-warm-sand text-warm-charcoal'
                        }
                      `.replace(/\s+/g, ' ').trim()}
                    >
                      <LogOut size={18} />
                      <span className="text-sm font-medium">{t('nav.logout')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sync Status */}
      <div className="md:hidden px-4 pb-3 flex items-center gap-2">
        <div
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
            ${isOnline
              ? isArctic
                ? 'bg-aurora/10 text-aurora'
                : 'bg-emerald-100 text-emerald-800'
              : isArctic
                ? 'bg-gold/10 text-gold'
                : 'bg-amber-100 text-amber-800'
            }
          `.replace(/\s+/g, ' ').trim()}
        >
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {syncQueueCount > 0 && (
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
              ${isArctic
                ? 'bg-frostbite/10 text-frostbite'
                : 'bg-accent-crimson text-white'
              }
            `.replace(/\s+/g, ' ').trim()}
          >
            <RefreshCw size={14} className={isOnline ? 'animate-spin' : ''} />
            <span>{syncQueueCount} pending</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
