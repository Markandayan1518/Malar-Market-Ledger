import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import api from '../services/api';
import { 
  ArrowLeft, 
  KeyRound, 
  Mail,
  CheckCircle,
  AlertCircle,
  Languages,
  Sun,
  Moon,
  Flower2,
  Sparkles
} from 'lucide-react';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, toggleLanguage, theme, toggleTheme } = useTheme();

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
    <div className="min-h-screen bg-arctic-night flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 relative overflow-hidden">
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
          
          {/* Wave Pattern */}
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
            {t('auth.recoverAccount')}
          </h1>
          
          <p className="text-xl xl:text-2xl text-white/80 mb-8 max-w-lg font-body leading-relaxed">
            {t('auth.forgotPasswordSubtitle')}
          </p>

          {/* Help Tips */}
          <div className="space-y-4">
            {[
              { key: 'checkSpam', icon: '📧' },
              { key: 'validEmail', icon: '✓' },
              { key: 'support', icon: '💬' }
            ].map((tip, index) => (
              <div 
                key={tip.key}
                className="flex items-center gap-4 text-white/90"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-lg">
                  {tip.icon}
                </div>
                <span className="font-medium">
                  {t(`auth.helpTips.${tip.key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col bg-arctic-ice">
        {/* Top Controls */}
        <div className="flex items-center justify-between p-6">
          <div className="lg:hidden flex items-center gap-2">
            <Flower2 className="w-8 h-8 text-gold-500" />
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

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-100 rounded-arctic-xl mb-4">
                <KeyRound className="w-8 h-8 text-gold-600" />
              </div>
              <h2 className="font-display text-3xl font-bold text-arctic-night mb-2">
                {t('auth.forgotPassword')}
              </h2>
              <p className="text-arctic-charcoal/60 font-body">
                {t('auth.forgotPasswordDescription')}
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-arctic-xl shadow-arctic-lg border border-ice-border p-8">
              {success ? (
                <div className="space-y-6">
                  {/* Success State */}
                  <div className="bg-aurora-50 border border-aurora-200 rounded-arctic-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-aurora-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-aurora-800 text-sm font-medium">
                          {t('auth.forgotPasswordSuccess')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {resetToken && (
                    <div className="bg-glacier-50 border border-glacier-200 rounded-arctic-lg p-4">
                      <p className="text-glacier-800 text-xs mb-2 font-medium uppercase tracking-wide">
                        {t('auth.resetTokenLabel')}:
                      </p>
                      <code className="block bg-white p-3 rounded-arctic text-xs break-all border border-glacier-100 font-mono text-glacier-900">
                        {resetToken}
                      </code>
                      <p className="text-glacier-600 text-xs mt-2">
                        {t('auth.resetTokenInfo')}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => navigate(`/reset-password${resetToken ? `?token=${resetToken}` : ''}`)}
                    className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3 rounded-arctic-lg transition-all duration-200"
                  >
                    {t('auth.resetPassword')}
                  </Button>

                  <button
                    onClick={() => navigate('/login')}
                    className="w-full text-glacier-600 hover:text-glacier-700 text-sm font-medium flex items-center justify-center gap-2 py-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('auth.backToLogin')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-arctic-charcoal mb-2">
                      {t('auth.email')}
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('auth.emailPlaceholder')}
                        required
                        autoFocus
                        className="bg-arctic-50 border-ice-border focus:border-gold-400 focus:ring-gold-400/20 pl-10"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-arctic-charcoal/40" />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-frostbite-50 border border-frostbite-200 rounded-arctic-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-frostbite-500 flex-shrink-0 mt-0.5" />
                        <p className="text-frostbite-700 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3 rounded-arctic-lg transition-all duration-200"
                  >
                    {t('auth.sendResetLink')}
                  </Button>

                  {/* Back to Login */}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full text-glacier-600 hover:text-glacier-700 text-sm font-medium flex items-center justify-center gap-2 py-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('auth.backToLogin')}
                  </button>
                </form>
              )}
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

export default ForgotPasswordPage;
