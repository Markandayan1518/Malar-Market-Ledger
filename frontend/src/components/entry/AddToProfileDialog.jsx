/**
 * AddToProfileDialog - Dialog prompting user to add a flower to farmer's profile
 * 
 * Shown when a farmer brings a flower type they haven't been associated with before.
 * Helps build the farmer's flower profile for future smart suggestions.
 */
import { useTranslation } from 'react-i18next';

export default function AddToProfileDialog({
  isOpen,
  onClose,
  onConfirm,
  farmerName,
  flowerName,
  loading = false
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div 
        className="relative bg-[var(--af-glass-100,rgba(255,255,255,0.95))] 
                   backdrop-blur-xl rounded-2xl shadow-2xl
                   border border-[var(--af-glass-20,rgba(255,255,255,0.2))]
                   p-6 m-4 max-w-md w-full
                   animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--af-periwinkle-200,#c7d2fe)] 
                          to-[var(--af-periwinkle-400,#818cf8)] flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-[var(--af-space-700,#312e81)]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-[var(--af-space-800,#1e1b4b)] text-center mb-2">
          {t('farmerProducts.addToProfileTitle')}
        </h3>

        {/* Description */}
        <p className="text-sm text-[var(--af-space-600,#4338ca)] text-center mb-2">
          {t('farmerProducts.addToProfileDescription')}
        </p>

        {/* Farmer and Flower info */}
        <div className="bg-[var(--af-glass-12,rgba(255,255,255,0.12))] rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--af-space-500,#6366f1)]">{t('dailyEntry.farmer')}:</span>
            <span className="font-medium text-[var(--af-space-800,#1e1b4b)]">{farmerName}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-[var(--af-space-500,#6366f1)]">{t('dailyEntry.flowerType')}:</span>
            <span className="font-medium text-[var(--af-space-800,#1e1b4b)]">{flowerName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                       bg-[var(--af-glass-20,rgba(255,255,255,0.2))]
                       text-[var(--af-space-700,#312e81)]
                       border border-[var(--af-glass-30,rgba(255,255,255,0.3))]
                       hover:bg-[var(--af-glass-30,rgba(255,255,255,0.3))]
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('farmerProducts.no')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                       bg-gradient-to-r from-[var(--af-periwinkle-400,#818cf8)] 
                       to-[var(--af-periwinkle-500,#6366f1)]
                       text-white shadow-lg shadow-[var(--af-periwinkle-500/25,rgba(99,102,241,0.25))]
                       hover:shadow-xl hover:shadow-[var(--af-periwinkle-500/30,rgba(99,102,241,0.3))]
                       hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t('common.saving')}
              </span>
            ) : (
              t('farmerProducts.yes')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
