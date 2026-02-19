import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flower2, Check, Loader2 } from 'lucide-react';
import flowerTypeService from '../../services/flowerTypeService';
import farmerProductService from '../../services/farmerProductService';

/**
 * FarmerProductsSelector - Multi-select component for linking flowers to farmers
 * 
 * Used in the farmer profile to select which flowers a farmer typically brings.
 * Displays checkboxes with bilingual names (English/Tamil).
 */
const FarmerProductsSelector = ({ 
  farmerId, 
  selectedFlowerIds = [], 
  onChange,
  disabled = false 
}) => {
  const { t, i18n } = useTranslation();
  const [flowerTypes, setFlowerTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isTamil = i18n.language === 'ta';

  useEffect(() => {
    const fetchFlowerTypes = async () => {
      try {
        setLoading(true);
        const response = await flowerTypeService.getActiveFlowerTypes();
        setFlowerTypes(response.data || []);
      } catch (err) {
        console.error('Failed to fetch flower types:', err);
        setError(t('farmerProducts.saveError'));
      } finally {
        setLoading(false);
      }
    };

    fetchFlowerTypes();
  }, [t]);

  const handleToggle = (flowerId) => {
    if (disabled) return;
    
    const newSelection = selectedFlowerIds.includes(flowerId)
      ? selectedFlowerIds.filter(id => id !== flowerId)
      : [...selectedFlowerIds, flowerId];
    
    onChange(newSelection);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    const allIds = flowerTypes.map(ft => ft.id);
    onChange(allIds);
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-glacier-500 animate-spin" />
        <span className="ml-2 text-arctic-charcoal">{t('farmerProducts.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-frostbite-500">
        {error}
      </div>
    );
  }

  if (flowerTypes.length === 0) {
    return (
      <div className="text-center py-8 text-arctic-charcoal">
        <Flower2 className="w-12 h-12 mx-auto mb-2 text-arctic-mist" />
        <p>{t('farmerProducts.noFlowers')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with select all/clear buttons */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-arctic-night">
          {t('farmerProducts.title')}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled}
            className="text-xs text-glacier-600 hover:text-glacier-800 disabled:opacity-50"
          >
            {t('common.all')}
          </button>
          <span className="text-arctic-mist">|</span>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-xs text-glacier-600 hover:text-glacier-800 disabled:opacity-50"
          >
            {t('common.none')}
          </button>
        </div>
      </div>
      
      <p className="text-xs text-arctic-charcoal">
        {t('farmerProducts.subtitle')}
      </p>

      {/* Flower type checkboxes */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
        {flowerTypes.map((flower) => {
          const isSelected = selectedFlowerIds.includes(flower.id);
          return (
            <button
              key={flower.id}
              type="button"
              onClick={() => handleToggle(flower.id)}
              disabled={disabled}
              className={`
                flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left
                ${isSelected 
                  ? 'border-glacier-400 bg-glacier-50 text-glacier-800' 
                  : 'border-arctic-border bg-white text-arctic-night hover:border-glacier-300 hover:bg-glacier-25'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className={`
                w-5 h-5 rounded flex items-center justify-center flex-shrink-0
                ${isSelected 
                  ? 'bg-glacier-500 text-white' 
                  : 'border-2 border-arctic-border bg-white'
                }
              `}>
                {isSelected && <Check size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {flower.name}
                </div>
                {flower.name_ta && (
                  <div className="text-xs text-arctic-charcoal truncate">
                    {flower.name_ta}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection count */}
      <div className="text-xs text-arctic-charcoal pt-1">
        {selectedFlowerIds.length === 0 
          ? t('farmerProducts.noFlowersSelected')
          : t('farmerProducts.flowersSelected', { count: selectedFlowerIds.length })
        }
      </div>
    </div>
  );
};

export default FarmerProductsSelector;
