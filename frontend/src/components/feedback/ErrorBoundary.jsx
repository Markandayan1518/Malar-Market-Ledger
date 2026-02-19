import { Component } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../forms/Button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 * 
 * Arctic Frost styled with:
 * - Frosted glass card
 * - Gradient accents
 * - Helpful error messages
 * - Recovery actions
 */
class ErrorBoundaryClass extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You can also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Check if a custom fallback was provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onReload={this.handleReload}
          showDetails={this.props.showDetails !== false}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error Fallback UI Component
 */
const ErrorFallback = ({ error, errorInfo, onRetry, onGoHome, onReload, showDetails }) => {
  const { t } = useTranslation();
  const isOffline = !navigator.onLine;

  return (
    <div className="min-h-screen bg-arctic-ice flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-arctic-border shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-frostbite-500 to-frostbite-600 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              {isOffline ? (
                <AlertTriangle className="w-8 h-8 text-white" />
              ) : (
                <Bug className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">
              {isOffline ? t('errors.offlineTitle') : t('errors.errorTitle')}
            </h1>
            <p className="text-frostbite-100">
              {isOffline 
                ? t('errors.offlineMessage')
                : t('errors.errorMessage')
              }
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                icon={RefreshCw}
                onClick={onReload}
                className="w-full"
              >
                {t('errors.reloadPage')}
              </Button>
              <Button
                variant="primary"
                icon={Home}
                onClick={onGoHome}
                className="w-full"
              >
                {t('errors.goHome')}
              </Button>
            </div>

            {/* Retry Button */}
            <Button
              variant="ghost"
              onClick={onRetry}
              className="w-full"
            >
              {t('errors.tryAgain')}
            </Button>

            {/* Error Details (collapsible) */}
            {showDetails && error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-arctic-mist hover:text-arctic-charcoal transition-colors">
                  {t('errors.technicalDetails')}
                </summary>
                <div className="mt-3 p-4 bg-arctic-ice rounded-xl border border-arctic-border overflow-auto">
                  <p className="font-mono text-sm text-frostbite-700 mb-2">
                    {error.toString()}
                  </p>
                  {errorInfo && errorInfo.componentStack && (
                    <pre className="font-mono text-xs text-arctic-charcoal whitespace-pre-wrap overflow-auto max-h-40">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-arctic-mist mt-4">
          {t('errors.persistHelp')}
        </p>
      </div>
    </div>
  );
};

/**
 * Hook to use error boundary reset
 */
export const useErrorBoundary = () => {
  const resetErrorBoundary = () => {
    // Force a re-render by navigating to the same location
    window.location.reload();
  };

  return { resetErrorBoundary };
};

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = (WrappedComponent, errorBoundaryProps = {}) => {
  const WithErrorBoundary = (props) => (
    <ErrorBoundaryClass {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundaryClass>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithErrorBoundary;
};

// Default export is the class component
export default ErrorBoundaryClass;

// Named export for the functional wrapper
export { ErrorBoundaryClass as ErrorBoundary };
