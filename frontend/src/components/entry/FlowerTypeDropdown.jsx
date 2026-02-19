import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useFarmerFlowerSuggestion } from '../../hooks/useFarmerFlowerSuggestion';

/**
 * FlowerTypeDropdown - Smart flower type selector with auto-suggestion
 * 
 * Features:
 * - Auto-selects flower if farmer has only one linked flower
 * - Highlights suggested flowers based on entry history
 * - Shows bilingual names (English/Tamil)
 * - Supports custom styling for Arctic Frost theme
 * 
 * @param {Object} props
 * @param {string} props.value - Selected flower type ID
 * @param {Function} props.onChange - Callback when selection changes
 * @param {Array} props.flowerTypes - List of available flower types
 * @param {string} props.farmerId - Current farmer ID for smart suggestion
 * @param {boolean} props.disabled - Whether dropdown is disabled
 * @param {string} props.placeholder - Placeholder text
 * @param {Object} props.style - Custom styles
 * @param {Function} props.onNonSuggestedSelect - Callback when a non-suggested flower is selected
 */
const FlowerTypeDropdown = ({
  value,
  onChange,
  flowerTypes = [],
  farmerId = null,
  disabled = false,
  placeholder = 'Select flower type',
  style = {},
  onSuggestionApplied = () => {},
  onNonSuggestedSelect = () => {}
}) => {
  const { t, i18n } = useTranslation();
  const { getSuggestedFlower, loading: suggestionLoading } = useFarmerFlowerSuggestion();
  
  const [isOpen, setIsOpen] = useState(false);
  const [suggestedFlower, setSuggestedFlower] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch suggested flower when farmer changes
  useEffect(() => {
    const fetchSuggestion = async () => {
      if (!farmerId) {
        setSuggestedFlower(null);
        return;
      }

      const suggestion = await getSuggestedFlower(farmerId);
      setSuggestedFlower(suggestion);

      // Auto-select if only one flower and no value is set
      if (suggestion && suggestion.flower_types && suggestion.flower_types.length === 1 && !value) {
        const autoFlower = suggestion.flower_types[0];
        onChange(autoFlower.id);
        onSuggestionApplied(autoFlower);
      }
    };

    fetchSuggestion();
  }, [farmerId, getSuggestedFlower, value, onChange, onSuggestionApplied]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get display name for flower (bilingual)
  const getFlowerDisplayName = (flower) => {
    const isTamil = i18n.language === 'ta';
    if (isTamil && flower.name_ta) {
      return `${flower.name_ta} (${flower.name})`;
    }
    return flower.name;
  };

  // Check if a flower is suggested
  const isSuggested = (flowerId) => {
    if (!suggestedFlower || !suggestedFlower.flower_types) return false;
    return suggestedFlower.flower_types.some(f => f.id === flowerId);
  };

  // Get selected flower object
  const selectedFlower = flowerTypes.find(f => f.id === value);

  // Sort flower types: suggested first, then alphabetically
  const sortedFlowerTypes = [...flowerTypes].sort((a, b) => {
    const aSuggested = isSuggested(a.id);
    const bSuggested = isSuggested(b.id);
    
    if (aSuggested && !bSuggested) return -1;
    if (!aSuggested && bSuggested) return 1;
    
    return a.name.localeCompare(b.name);
  });

  const handleSelect = (flowerId) => {
    onChange(flowerId);
    setIsOpen(false);
    setHighlightedIndex(-1);
    
    // Check if this is a non-suggested flower and we have a farmer selected
    if (farmerId && !isSuggested(flowerId)) {
      const selectedFlower = flowerTypes.find(f => f.id === flowerId);
      if (selectedFlower) {
        onNonSuggestedSelect(farmerId, selectedFlower);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(sortedFlowerTypes[highlightedIndex].id);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < sortedFlowerTypes.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className="relative"
      style={{ width: '100%', ...style }}
    >
      {/* Input/Trigger */}
      <button
        ref={inputRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="af-input af-focus-glow"
        style={{
          width: '100%',
          padding: 'var(--af-space-3) var(--af-space-4)',
          background: 'var(--af-glass-08)',
          border: '1px solid transparent',
          borderRadius: 'var(--af-radius-lg)',
          color: 'var(--af-white-100)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--af-space-2)',
          textAlign: 'left'
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('dailyEntry.selectFlowerType', 'Select flower type')}
      >
        <span style={{ 
          flex: 1, 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: selectedFlower ? 'var(--af-white-100)' : 'var(--af-white-60)'
        }}>
          {selectedFlower ? getFlowerDisplayName(selectedFlower) : placeholder}
        </span>
        
        {/* Show suggestion indicator */}
        {suggestedFlower && suggestedFlower.flower_types?.length > 0 && !value && (
          <span 
            className="af-suggestion-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--af-space-1)',
              padding: '2px var(--af-space-2)',
              background: 'var(--af-periwinkle-400)',
              borderRadius: 'var(--af-radius-full)',
              fontSize: '0.625rem',
              fontWeight: 600,
              color: 'white'
            }}
            title={t('farmerProducts.autoSelected', 'Auto-selected based on history')}
          >
            <Sparkles size={10} />
            {t('farmerProducts.suggested', 'Suggested')}
          </span>
        )}
        
        <ChevronDown 
          size={16} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <div
          className="af-dropdown-list"
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            marginTop: 'var(--af-space-1)',
            background: 'var(--af-glass-15)',
            backdropFilter: 'blur(var(--af-blur-xl))',
            WebkitBackdropFilter: 'blur(var(--af-blur-xl))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--af-radius-lg)',
            boxShadow: 'var(--af-shadow-frost)',
            maxHeight: '240px',
            overflowY: 'auto'
          }}
        >
          {/* Suggestion Header */}
          {suggestedFlower && suggestedFlower.flower_types?.length > 0 && (
            <div
              style={{
                padding: 'var(--af-space-2) var(--af-space-4)',
                fontSize: '0.625rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--af-periwinkle-400)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {t('farmerProducts.frequentlyBrought', 'Frequently brought')}
            </div>
          )}

          {/* Flower Options */}
          {sortedFlowerTypes.map((flower, index) => {
            const isSelected = value === flower.id;
            const isItemSuggested = isSuggested(flower.id);
            const isHighlighted = highlightedIndex === index;

            return (
              <button
                key={flower.id}
                type="button"
                onClick={() => handleSelect(flower.id)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={isSelected}
                style={{
                  width: '100%',
                  padding: 'var(--af-space-3) var(--af-space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--af-space-2)',
                  background: isHighlighted 
                    ? 'var(--af-glass-20)' 
                    : isSelected 
                      ? 'var(--af-periwinkle-400-bg)' 
                      : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: isSelected ? 'var(--af-periwinkle-400)' : 'var(--af-white-100)',
                  transition: 'background 0.15s ease'
                }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>
                  {getFlowerDisplayName(flower)}
                </span>
                
                {/* Suggested indicator */}
                {isItemSuggested && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--af-space-1)',
                      fontSize: '0.625rem',
                      color: 'var(--af-periwinkle-400)'
                    }}
                  >
                    <Sparkles size={10} />
                  </span>
                )}
              </button>
            );
          })}

          {/* Empty State */}
          {sortedFlowerTypes.length === 0 && (
            <div
              style={{
                padding: 'var(--af-space-6)',
                textAlign: 'center',
                color: 'var(--af-white-60)'
              }}
            >
              {t('farmerProducts.noFlowers', 'No active flower types available')}
            </div>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {suggestionLoading && (
        <div
          style={{
            position: 'absolute',
            right: 'var(--af-space-8)',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <div
            className="af-animate-spin"
            style={{
              width: 14,
              height: 14,
              border: '2px solid var(--af-glass-15)',
              borderTop: '2px solid var(--af-periwinkle-400)',
              borderRadius: '50%'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FlowerTypeDropdown;
