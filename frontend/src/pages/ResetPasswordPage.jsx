import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import api from '../services/api';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, toggleLanguage } = useTheme();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (!token) {
      setError(t('auth.resetTokenRequired'));
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: newPassword
      });
      setSuccess(true);
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.detail && Array.isArray(errorData.detail)) {
        setError(errorData.detail.map(e => e.msg).join(', '));
      } else {
        setError(errorData?.detail || t('auth.resetPasswordError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-accent-magenta flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-6">
          <button
            onClick={toggleLanguage}
            className="text-white/80 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
          >
            {language === 'en' ? 'தமிழ்' : 'English'}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-strong p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
              {t('auth.resetPassword')}
            </h1>
            <p className="text-neutral-600 text-sm">
              {t('auth.resetPasswordDescription')}
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  {t('auth.resetPasswordSuccess')}
                </p>
              </div>

              <Button
                onClick={() => navigate('/login')}
                className="w-full"
              >
                {t('auth.login')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('auth.resetTokenLabel')}
                </label>
                <Input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={t('auth.resetTokenPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('auth.newPassword')}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('auth.newPasswordPlaceholder')}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('auth.confirmPassword')}
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                {t('auth.resetPasswordButton')}
              </Button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.backToLogin')}
              </button>
            </form>
          )}

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

export default ResetPasswordPage;
