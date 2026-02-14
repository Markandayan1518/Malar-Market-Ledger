import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, User, X } from 'lucide-react';

const FarmerAutocomplete = ({
  farmers = [],
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filteredFarmers = searchTerm
    ? farmers.filter(farmer =>
        farmer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farmer.phone?.includes(searchTerm) ||
        farmer.village?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : farmers;

  const selectedFarmer = farmers.find(f => f.id === value);

  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  const handleSelect = (farmer) => {
    onChange(farmer.id);
    setIsOpen(false);
    setSearchTerm('');
    setSelectedIndex(0);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredFarmers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : 0
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredFarmers[selectedIndex]) {
          handleSelect(filteredFarmers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={selectedFarmer ? selectedFarmer.name : searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder || t('dailyEntry.farmer')}
            className={`
              w-full px-4 py-2.5 border-2 rounded-lg
              focus:outline-none transition-all duration-200
              ${error 
                ? 'border-accent-crimson focus:border-accent-crimson focus:ring-2 focus:ring-accent-crimson/20' 
                : 'border-warm-taupe focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20'
              }
              ${disabled ? 'opacity-60 cursor-not-allowed bg-warm-sand' : ''}
            `}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls="farmer-list"
          />
          
          {selectedFarmer && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-warm-sand rounded transition-colors"
              aria-label="Clear selection"
            >
              <X size={16} className="text-warm-brown" />
            </button>
          )}
          
          {!selectedFarmer && (
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-brown pointer-events-none" />
          )}
        </div>

        {/* Dropdown List */}
        {isOpen && filteredFarmers.length > 0 && (
          <ul
            ref={listRef}
            id="farmer-list"
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-strong border-2 border-warm-taupe max-h-60 overflow-y-auto"
          >
            {filteredFarmers.map((farmer, index) => (
              <li
                key={farmer.id}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => handleSelect(farmer)}
                className={`
                  px-4 py-2.5 cursor-pointer transition-colors duration-150 flex items-center gap-3
                  ${index === selectedIndex 
                    ? 'bg-accent-magenta text-white' 
                    : 'hover:bg-warm-sand text-warm-charcoal'
                  }
                `}
              >
                <User size={18} className="text-warm-brown flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{farmer.name}</p>
                  <p className="text-xs text-warm-brown">{farmer.village}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {isOpen && filteredFarmers.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-strong border-2 border-warm-taupe p-4">
            <p className="text-center text-warm-brown text-sm">
              {t('farmers.noResults')}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="form-error mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FarmerAutocomplete;
