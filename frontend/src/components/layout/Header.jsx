import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, X, Wifi, WifiOff, RefreshCw, LogOut, User, Globe, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { isOnline, syncQueue, syncNow } = useOffline();
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ta' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="bg-white border-b-2 border-warm-taupe shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Logo and Menu Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-warm-sand transition-colors duration-200 lg:hidden"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-magenta rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg font-display">M</span>
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-warm-charcoal leading-tight">
                {t('app.shortName')}
              </h1>
              <p className="text-xs text-warm-brown hidden sm:block">
                {t('app.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Sync Status (visible on larger screens) */}
        <div className="hidden md:flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
            isOnline 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isOnline ? t('offline.syncSuccess') : t('offline.title')}</span>
          </div>
          
          {syncQueue.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-crimson text-white rounded-lg text-sm font-medium">
              <RefreshCw size={16} className={isOnline ? 'animate-spin' : ''} />
              <span>{t('offline.syncQueue', { count: syncQueue.length })}</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-lg hover:bg-warm-sand transition-colors duration-200"
            aria-label="Toggle language"
            title={i18n.language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
          >
            <Globe size={20} />
            <span className="sr-only">Language</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-warm-sand transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span className="sr-only">Toggle theme</span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-warm-sand transition-colors duration-200"
              aria-label="User menu"
            >
              <div className="w-8 h-8 bg-accent-purple rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-warm-charcoal">{user?.username}</p>
                <p className="text-xs text-warm-brown capitalize">{t(`roles.${user?.role}`)}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-strong border-2 border-warm-taupe overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-warm-sand">
                  <p className="text-sm font-semibold text-warm-charcoal">{user?.username}</p>
                  <p className="text-xs text-warm-brown capitalize">{t(`roles.${user?.role}`)}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-warm-sand transition-colors duration-200 text-warm-charcoal"
                >
                  <LogOut size={16} />
                  <span className="text-sm font-medium">{t('nav.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sync Status */}
      <div className="md:hidden px-4 pb-3 flex items-center gap-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
          isOnline 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-amber-100 text-amber-800'
        }`}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        
        {syncQueue.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-crimson text-white rounded-lg text-xs font-medium">
            <RefreshCw size={14} className={isOnline ? 'animate-spin' : ''} />
            <span>{syncQueue.length} pending</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
