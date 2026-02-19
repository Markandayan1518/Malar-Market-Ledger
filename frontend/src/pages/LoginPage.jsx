import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import { 
  Eye, 
  EyeOff, 
  Flower2, 
  Sun, 
  Moon,
  Languages,
  Sparkles
} from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { language, toggleLanguage, theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData);
      
      if (result.success) {
        showSuccess(t('auth.loginSuccess'));
        navigate(result.redirect);
      } else {
        showError(result.error || t('auth.loginError'));
      }
    } catch (error) {
      showError(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-arctic-night flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-glacier-400 via-glacier-500 to-glacier-600 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          {/* Floating Circles */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-aurora-400/20 rounded-full blur-3xl" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-ice-300/20 rounded-full blur-2xl" style={{ animationDelay: '2s' }} />
          
          {/* Geometric Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 border border-white/30 rounded-full transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 right-0 w-80 h-80 border border-white/30 rounded-full transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 right-0 w-64 h-64 border border-white/30 rounded-full transform translate-x-1/2 -translate-y-1/2" />
          </div>
          
          {/* Ice Crystal Pattern */}
          <svg className="absolute bottom-0 left-0 w-full h-64 opacity-20" viewBox="0 0 1440 256" preserveAspectRatio="none">
            <path fill="white" d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,181.3C672,192,768,160,864,128C960,96,1056,64,1152,74.7C1248,85,1344,139,1392,165.3L1440,192L1440,256L1392,256C1344,256,1248,256,1152,256C1056,256,960,256,864,256C768,256,672,256,576,256C480,256,384,256,288,256C192,256,96,256,48,256L0,256Z" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <Sparkles className="w-4 h-4 text-aurora-300" />
              <span className="text-white/90 text-sm font-medium tracking-wide">
                {t('app.tagline')}
              </span>
            </div>
          </div>

          <h1 className="font-display text-5xl xl:text-7xl font-bold text-white mb-6 leading-tight">
            {t('app.name')}
          </h1>
          
          <p className="text-xl xl:text-2xl text-white/80 mb-8 max-w-lg font-body leading-relaxed">
            {t('app.description')}
          </p>

          {/* Features List */}
          <div className="space-y-4">
            {[
              { key: 'offline', icon: '🌨️' },
              { key: 'bilingual', icon: '🌸' },
              { key: 'fast', icon: '⚡' }
            ].map((feature, index) => (
              <div 
                key={feature.key}
                className="flex items-center gap-4 text-white/90"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-lg">
                  {feature.icon}
                </div>
                <span className="font-medium">
                  {t(`landing.features.${feature.key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col bg-arctic-ice">
        {/* Top Controls */}
        <div className="flex items-center justify-between p-6">
          <div className="lg:hidden flex items-center gap-2">
            <Flower2 className="w-8 h-8 text-glacier-500" />
            <span className="font-display font-bold text-xl text-arctic-night">
              {t('app.shortName')}
            </span>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 text-arctic-charcoal/70 hover:text-arctic-charcoal hover:bg-ice-border/50 rounded-lg transition-all duration-200"
              title={t('settings.language')}
            >
              <Languages className="w-5 h-5" />
              <span className="text-sm font-medium">
                {language === 'en' ? 'தமிழ்' : 'English'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-arctic-charcoal/70 hover:text-arctic-charcoal hover:bg-ice-border/50 rounded-lg transition-all duration-200"
              title={t('settings.theme')}
            >
              {theme === 'arctic' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-bold text-arctic-night mb-2">
                {t('auth.welcomeBack')}
              </h2>
              <p className="text-arctic-charcoal/60 font-body">
                {t('auth.loginSubtitle')}
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-arctic-xl shadow-arctic-lg border border-ice-border p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-arctic-charcoal mb-2">
                    {t('auth.email')}
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('auth.emailPlaceholder')}
                    required
                    autoFocus
                    className="bg-arctic-50 border-ice-border focus:border-glacier-400 focus:ring-glacier-400/20"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-arctic-charcoal mb-2">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t('auth.passwordPlaceholder')}
                      required
                      className="bg-arctic-50 border-ice-border focus:border-glacier-400 focus:ring-glacier-400/20 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-arctic-charcoal/40 hover:text-arctic-charcoal/70 transition-colors p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-glacier-600 hover:text-glacier-700 font-medium transition-colors"
                  >
                    {t('auth.forgotPassword')}?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full bg-glacier-500 hover:bg-glacier-600 text-white font-semibold py-3 rounded-arctic-lg shadow-glacier transition-all duration-200 hover:shadow-glacier-lg"
                >
                  {t('auth.loginButton')}
                </Button>
              </form>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-arctic-charcoal/50">
                {t('app.shortName')} © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
