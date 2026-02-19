import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RefreshCw } from 'lucide-react';
import EntryRow from './EntryRow';

/**
 * Arctic Frost Theme - Entry Grid Component
 * 
 * Features:
 * - Frosted glass header (sticky)
 * - Spotlight on Ice effect (dims surrounding rows when focused)
 * - Flash freeze save animation
 * - High-contrast for 4 AM visibility
 * - Gloved hand touch targets
 */
const EntryGrid = ({
  entries = [],
  farmers = [],
  currentRate,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  loading = false
}) => {
  const { t } = useTranslation();
  const [newEntry, setNewEntry] = useState({
    farmerId: '',
    weight: '',
    adjustments: []
  });
  const [savingEntries, setSavingEntries] = useState(new Set());
  const [savedEntries, setSavedEntries] = useState(new Set());
  const [activeRowId, setActiveRowId] = useState(null);
  const firstRowRef = useRef(null);
  const newFarmerRef = useRef(null);
  const newWeightRef = useRef(null);

  const handleAddEntry = () => {
    if (!newEntry.farmerId || !newEntry.weight) return;
    
    const entry = {
      id: `new-${Date.now()}`,
      farmerId: newEntry.farmerId,
      weight: parseFloat(newEntry.weight),
      adjustments: newEntry.adjustments,
      total: calculateTotal(newEntry.weight, newEntry.adjustments, currentRate),
      isNew: true
    };
    
    onAddEntry(entry);
    setNewEntry({ farmerId: '', weight: '', adjustments: [] });
    
    setTimeout(() => {
      newFarmerRef.current?.focus();
    }, 100);
  };

  const calculateTotal = (weight, adjustments, rate) => {
    if (!weight || !rate) return 0;
    const weightNum = parseFloat(weight);
    const rateNum = parseFloat(rate);
    if (isNaN(weightNum) || isNaN(rateNum)) return 0;
    
    let total = weightNum * rateNum;
    
    adjustments.forEach(adj => {
      if (adj === 'late') total *= 0.95;
      if (adj === 'wet') total *= 0.90;
      if (adj === 'bonus') total *= 1.05;
      if (adj === 'premium') total *= 1.10;
      if (adj === 'first_time') total *= 1.02;
    });
    
    return total.toFixed(2);
  };

  const handleUpdateEntry = (entry) => {
    setSavingEntries(prev => new Set([...prev, entry.id]));
    onUpdateEntry(entry);
    
    setTimeout(() => {
      setSavingEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
      setSavedEntries(prev => new Set([...prev, entry.id]));
      setTimeout(() => {
        setSavedEntries(prev => {
          const newSet = new Set(prev);
          newSet.delete(entry.id);
          return newSet;
        });
      }, 2000);
    }, 600);
  };

  const handleDeleteEntry = (entryId) => {
    onDeleteEntry(entryId);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setNewEntry({ farmerId: '', weight: '', adjustments: [] });
      setActiveRowId(null);
    }
    if (e.key === 'Enter' && e.target === newWeightRef.current) {
      e.preventDefault();
      handleAddEntry();
    }
  };

  const allEntries = [...entries];

  const totalWeight = allEntries.reduce((sum, entry) => {
    return sum + (parseFloat(entry.weight) || 0);
  }, 0);

  const totalAmount = allEntries.reduce((sum, entry) => {
    return sum + (parseFloat(entry.total) || 0);
  }, 0);

  useEffect(() => {
    if (entries.length === 0 && !newEntry.farmerId && !newEntry.weight) {
      firstRowRef.current?.focus();
    }
  }, [entries, newEntry]);

  const selectedFarmer = farmers.find(f => f.id === newEntry.farmerId);
  const newEntryTotal = calculateTotal(newEntry.weight, newEntry.adjustments, currentRate);

  // Calculate adjustment percentage for display
  const getAdjustmentPercentage = (adjustments) => {
    let percentage = 0;
    adjustments.forEach(adj => {
      if (adj === 'late') percentage -= 5;
      if (adj === 'wet') percentage -= 10;
      if (adj === 'bonus') percentage += 5;
      if (adj === 'premium') percentage += 10;
      if (adj === 'first_time') percentage += 2;
    });
    return percentage;
  };

  return (
    <div 
      className="space-y-4" 
      onKeyDown={handleKeyDown}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="font-arctic text-2xl font-bold text-slate-charcoal">
            {t('dailyEntry.title')}
          </h2>
          
          {/* Current Rate Badge - Arctic Glacier */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-glacier-500 text-white rounded-arctic-pill font-semibold text-sm shadow-arctic-btn">
            <span>
              {t('dailyEntry.currentRate', { rate: currentRate || '0.00' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Row - Arctic Ice Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stats-card">
          <p className="stats-label">{t('dashboard.totalEntries')}</p>
          <p className="stats-value">{allEntries.length}</p>
        </div>
        <div className="stats-card">
          <p className="stats-label">{t('dashboard.totalWeight')}</p>
          <p className="stats-value">{totalWeight.toFixed(2)}<span className="text-slate-cool text-sm ml-1 font-normal">kg</span></p>
        </div>
        <div className="stats-card">
          <p className="stats-label">{t('dashboard.totalAmount')}</p>
          <p className="stats-value">₹{totalAmount.toFixed(2)}</p>
        </div>
        <div className="stats-card">
          <p className="stats-label">Avg/Entry</p>
          <p className="stats-value">
            ₹{allEntries.length > 0 ? (totalAmount / allEntries.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* New Entry Row - Always visible at top */}
      <div className="bg-arctic-ice rounded-arctic border border-ice-border p-4 mb-4 shadow-arctic-md">
        <div className="text-xs font-semibold text-slate-cool uppercase tracking-wide mb-3">
          Quick Add Entry
        </div>
        <div className="grid grid-cols-12 gap-3 items-end">
          {/* Farmer Input */}
          <div className="col-span-3">
            <label className="block text-xs font-medium text-slate-cool mb-1">Farmer</label>
            <input
              ref={newFarmerRef}
              type="text"
              value={selectedFarmer?.name || ''}
              onChange={(e) => {
                const farmer = farmers.find(f => 
                  f.name.toLowerCase().includes(e.target.value.toLowerCase())
                );
                setNewEntry(prev => ({ ...prev, farmerId: farmer?.id || '' }));
              }}
              placeholder="Select farmer..."
              className="input-field"
              data-new-entry="true"
            />
          </div>

          {/* Weight Input (Hero) */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-cool mb-1">Weight (kg)</label>
            <input
              ref={newWeightRef}
              type="text"
              inputMode="decimal"
              value={newEntry.weight}
              onChange={(e) => setNewEntry(prev => ({ ...prev, weight: e.target.value }))}
              placeholder="0.00"
              className="input-field font-mono text-lg font-bold text-right text-slate-charcoal"
            />
          </div>

          {/* Adjustments */}
          <div className="col-span-4">
            <label className="block text-xs font-medium text-slate-cool mb-1">Adjustments</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'late', label: 'Late', type: 'deduction' },
                { key: 'wet', label: 'Wet', type: 'deduction' },
                { key: 'bonus', label: 'Bonus', type: 'bonus' },
                { key: 'premium', label: 'Premium', type: 'bonus' },
              ].map(adj => {
                const isSelected = newEntry.adjustments.includes(adj.key);
                return (
                  <button
                    key={adj.key}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setNewEntry(prev => ({
                          ...prev,
                          adjustments: prev.adjustments.filter(a => a !== adj.key)
                        }));
                      } else {
                        setNewEntry(prev => ({
                          ...prev,
                          adjustments: [...prev.adjustments, adj.key]
                        }));
                      }
                    }}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
                      ${isSelected 
                        ? adj.type === 'deduction' 
                          ? 'bg-frostbite-light text-frostbite border border-frostbite-medium' 
                          : 'bg-aurora-light text-aurora-dark border border-aurora-medium'
                        : 'bg-arctic-frost text-slate-cool border border-ice-border hover:border-ice-border-dark'
                      }
                    `}
                  >
                    {adj.label}
                  </button>
                );
              })}
              
              {/* Adjustment Total Badge */}
              {getAdjustmentPercentage(newEntry.adjustments) !== 0 && (
                <span 
                  className={`
                    px-2 py-1 rounded text-xs font-bold ml-1
                    ${getAdjustmentPercentage(newEntry.adjustments) > 0 
                      ? 'bg-aurora-light text-aurora-dark' 
                      : 'bg-frostbite-light text-frostbite'
                    }
                  `}
                >
                  {getAdjustmentPercentage(newEntry.adjustments) > 0 ? '+' : ''}{getAdjustmentPercentage(newEntry.adjustments)}%
                </span>
              )}
            </div>
          </div>

          {/* Total Preview */}
          <div className="col-span-2 text-right">
            <label className="block text-xs font-medium text-slate-cool mb-1">Total</label>
            <div className="font-mono text-xl font-bold text-slate-charcoal">
              ₹{newEntryTotal}
            </div>
          </div>

          {/* Add Button */}
          <div className="col-span-1">
            <button
              onClick={handleAddEntry}
              disabled={!newEntry.farmerId || !newEntry.weight || loading}
              className="btn-primary w-full h-11 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Entry Grid Container - Arctic */}
      <div 
        className={`
          bg-arctic-ice border border-ice-border rounded-arctic overflow-hidden shadow-arctic-md
          ${activeRowId ? '[&_*:not(.arctic-row-active)]:opacity-60' : ''}
          transition-all duration-150
        `}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={32} className="animate-spin text-glacier-500" />
          </div>
        ) : (
          <table className="w-full">
            {/* Frosted Glass Header */}
            <thead 
              className="sticky top-0 z-10"
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid #E2E8F0'
              }}
            >
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-cool uppercase tracking-wider">
                  {t('dailyEntry.farmer')}
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-cool uppercase tracking-wider">
                  {t('dailyEntry.weight')}
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-cool uppercase tracking-wider">
                  {t('dailyEntry.adjustments')}
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-cool uppercase tracking-wider">
                  {t('dailyEntry.rate')}
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-cool uppercase tracking-wider">
                  {t('dailyEntry.amount')}
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-cool uppercase tracking-wider w-[100px]">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            
            <tbody>
              {/* Existing Entries */}
              {allEntries.map((entry, index) => (
                <EntryRow
                  key={entry.id}
                  ref={index === 0 ? firstRowRef : null}
                  entry={entry}
                  farmers={farmers}
                  currentRate={currentRate}
                  onUpdate={handleUpdateEntry}
                  onDelete={handleDeleteEntry}
                  isSaved={savedEntries.has(entry.id)}
                  isSaving={savingEntries.has(entry.id)}
                  isNew={entry.isNew}
                  isActive={activeRowId === entry.id}
                  onActivate={() => setActiveRowId(entry.id)}
                  onDeactivate={() => setActiveRowId(null)}
                />
              ))}
              
              {/* Empty State */}
              {allEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-arctic-frost flex items-center justify-center">
                        <Plus size={24} className="text-slate-cool" />
                      </div>
                      <p className="text-slate-cool font-medium">
                        No entries yet. Add your first entry above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Footer with Totals - Frosted Glass */}
            {allEntries.length > 0 && (
              <tfoot 
                className="sticky bottom-0 z-10"
                style={{
                  background: 'rgba(248, 250, 252, 0.95)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderTop: '2px solid #E2E8F0'
                }}
              >
                <tr>
                  <td className="px-4 py-4 font-semibold text-slate-deep">
                    TOTALS
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-mono text-xl font-bold text-slate-charcoal">{totalWeight.toFixed(2)}</span>
                    <span className="text-slate-cool text-sm ml-1">kg</span>
                  </td>
                  <td></td>
                  <td></td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-mono text-xl font-bold text-slate-charcoal">₹{totalAmount.toFixed(2)}</span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
};

export default EntryGrid;
