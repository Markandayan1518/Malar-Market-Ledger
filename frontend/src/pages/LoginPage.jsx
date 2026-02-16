import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import { Wifi, WifiOff } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { language, toggleLanguage } = useTheme();

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
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-accent-magenta flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Language Toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={toggleLanguage}
            className="text-white/80 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
          >
            {language === 'en' ? 'தமிழ்' : 'English'}
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-strong p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
              <Wifi className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
              {t('app.name')}
            </h1>
            <p className="text-neutral-600 text-sm">
              {t('app.description')}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('auth.email')}
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('auth.email')}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? (
                    <WifiOff className="w-5 h-5" />
                  ) : (
                    <Wifi className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('auth.forgotPassword')}?
              </Link>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              {t('auth.loginButton')}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-neutral-500">
            <p>
              {t('app.shortName')} © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
