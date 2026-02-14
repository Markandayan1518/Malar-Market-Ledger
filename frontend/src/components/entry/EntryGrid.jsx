import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RefreshCw } from 'lucide-react';
import EntryRow from './EntryRow';

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
  const firstRowRef = useRef(null);

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
    
    // Focus on first field of new row
    setTimeout(() => {
      const inputs = document.querySelectorAll('[data-new-entry="true"]');
      if (inputs.length > 0) {
        inputs[0].focus();
      }
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
    
    // Remove from saving after 2 seconds
    setTimeout(() => {
      setSavingEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
    }, 2000);
  };

  const handleDeleteEntry = (entryId) => {
    onDeleteEntry(entryId);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setNewEntry({ farmerId: '', weight: '', adjustments: [] });
    }
  };

  const allEntries = [...entries, ...(newEntry.farmerId || newEntry.weight ? [newEntry] : [])];

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

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="font-display text-2xl font-bold text-warm-charcoal">
            {t('dailyEntry.title')}
          </h2>
          
          {/* Current Rate Display */}
          <div className="bg-accent-magenta text-white px-4 py-2 rounded-lg shadow-md">
            <span className="text-sm font-medium">
              {t('dailyEntry.currentRate', { rate: currentRate || '0.00' })}
            </span>
          </div>
        </div>

        <button
          onClick={handleAddEntry}
          disabled={!newEntry.farmerId || !newEntry.weight || loading}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          <span>{t('dailyEntry.newEntry')}</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stats-card">
          <p className="stats-label">{t('dashboard.totalEntries')}</p>
          <p className="stats-value">{allEntries.length}</p>
        </div>
        <div className="stats-card">
          <p className="stats-label">{t('dashboard.totalWeight')}</p>
          <p className="stats-value">{totalWeight.toFixed(2)} kg</p>
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

      {/* Entry Grid */}
      <div className="overflow-x-auto rounded-lg border-2 border-warm-taupe">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={32} className="animate-spin text-accent-magenta" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-warm-sand">
                <th className="px-4 py-3 text-left text-xs font-bold text-warm-brown uppercase tracking-wider">
                  {t('dailyEntry.farmer')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-warm-brown uppercase tracking-wider">
                  {t('dailyEntry.weight')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-warm-brown uppercase tracking-wider">
                  {t('dailyEntry.adjustments')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-warm-brown uppercase tracking-wider">
                  {t('dailyEntry.rate')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-warm-brown uppercase tracking-wider">
                  {t('dailyEntry.amount')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-warm-brown uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
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
                />
              ))}
              
              {allEntries.length === 0 && !newEntry.farmerId && !newEntry.weight && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <p className="text-warm-brown">
                      No entries yet. Start by adding a new entry above.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EntryGrid;
