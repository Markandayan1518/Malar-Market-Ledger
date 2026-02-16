import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import api from '../services/api';
import { ArrowLeft, KeyRound } from 'lucide-react';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, toggleLanguage } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.reset_token) {
        setResetToken(response.data.reset_token);
      }
      setSuccess(true);
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.detail && Array.isArray(errorData.detail)) {
        setError(errorData.detail.map(e => e.msg).join(', '));
      } else {
        setError(errorData?.detail || t('auth.forgotPasswordError'));
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
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
              {t('auth.forgotPassword')}
            </h1>
            <p className="text-neutral-600 text-sm">
              {t('auth.forgotPasswordDescription')}
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  {t('auth.forgotPasswordSuccess')}
                </p>
              </div>
              
              {resetToken && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-xs mb-2 font-medium">
                    {t('auth.resetTokenLabel')}:
                  </p>
                  <code className="block bg-white p-2 rounded text-xs break-all border">
                    {resetToken}
                  </code>
                  <p className="text-blue-600 text-xs mt-2">
                    {t('auth.resetTokenInfo')}
                  </p>
                </div>
              )}

              <Button
                onClick={() => navigate(`/reset-password${resetToken ? `?token=${resetToken}` : ''}`)}
                className="w-full"
              >
                {t('auth.resetPassword')}
              </Button>

              <button
                onClick={() => navigate('/login')}
                className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.backToLogin')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('auth.email')}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  autoFocus
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
                {t('auth.sendResetLink')}
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

export default ForgotPasswordPage;
