import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import SettlementRow from './SettlementRow';

/**
 * Arctic Frost Theme - Settlement Table Component
 * 
 * Desktop high-density table view with:
 * - Row height48px compact
: 40- * - Active row highlight: Glacier Cyan (#ECFEFF)
 * - Table headers: Uppercase, 12px, bold, cool gray
 * - Horizontal scroll on narrow screens with sticky first column
 * 
 * Columns: Farmer Name, Period, Total Weight, Gross Amount, Deductions, Advances, Net Amount, Status, Actions
 */
const SettlementTable = ({
  settlements = [],
  onViewDetails,
  onMarkAsPaid,
  sortColumn = 'farmer_name',
  sortDirection = 'asc',
  onSort,
  loading = false
}) => {
  const { t } = useTranslation();

  // Sortable column configuration
  const columns = [
    { key: 'farmer_name', label: t('settlements.farmerName'), sortable: true, align: 'left', sticky: true },
    { key: 'period', label: t('settlements.period'), sortable: true, align: 'left' },
    { key: 'total_weight', label: t('settlements.totalWeight'), sortable: true, align: 'right' },
    { key: 'gross_amount', label: t('settlements.grossAmount'), sortable: true, align: 'right' },
    { key: 'deductions', label: t('settlements.deductions'), sortable: true, align: 'right' },
    { key: 'advances', label: t('settlements.advances'), sortable: true, align: 'right' },
    { key: 'net_amount', label: t('settlements.netAmount'), sortable: true, align: 'right' },
    { key: 'status', label: t('settlements.status'), sortable: true, align: 'center' },
    { key: 'actions', label: t('common.actions'), sortable: false, align: 'center' }
  ];

  // Handle sort click
  const handleSort = (columnKey) => {
    if (onSort) {
      if (sortColumn === columnKey) {
        // Toggle direction if same column
        onSort(columnKey, sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        // Default to ascending for new column
        onSort(columnKey, 'asc');
      }
    }
  };

  // Get sort icon
  const getSortIcon = (columnKey) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown size={14} className="text-[#9CA3AF]" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp size={14} className="text-[#3B82F6]" />
      : <ChevronDown size={14} className="text-[#3B82F6]" />;
  };

  // Get alignment class
  const getAlignClass = (align) => {
    switch (align) {
      case 'right': return 'text-right';
      case 'center': return 'text-center';
      default: return 'text-left';
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table 
        className="w-full min-w-[900px] border-collapse bg-white"
        role="grid"
        aria-label={t('settlements.tableLabel')}
      >
        {/* Table Header */}
        <thead className="bg-[#F8FAFC] sticky top-0 z-10">
          <tr className="border-b-2 border-[#EAECF0]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  px-3 py-3 text-xs font-bold uppercase tracking-wider text-[#6B7280]
                  ${getAlignClass(column.align)}
                  ${column.sortable ? 'cursor-pointer select-none hover:bg-[#F1F5F9] transition-colors' : ''}
                  ${column.sticky ? 'sticky left-0 bg-[#F8FAFC] z-20' : ''}
                `}
                onClick={() => column.sortable && handleSort(column.key)}
                role="columnheader"
                aria-sort={sortColumn === column.key 
                  ? (sortDirection === 'asc' ? 'ascending' : 'descending') 
                  : 'none'
                }
              >
                <div className={`
                  flex items-center gap-1
                  ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}
                `}>
                  <span>{column.label}</span>
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody role="rowgroup">
          {loading ? (
            // Loading state
            <tr>
              <td colSpan={columns.length} className="px-3 py-12 text-center">
                <div className="flex items-center justify-center gap-2 text-[#6B7280]">
                  <div className="w-5 h-5 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">{t('common.loading')}</span>
                </div>
              </td>
            </tr>
          ) : settlements.length === 0 ? (
            // Empty state
            <tr>
              <td colSpan={columns.length} className="px-3 py-12 text-center">
                <div className="flex flex-col items-center gap-2 text-[#6B7280]">
                  <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">{t('settlements.noSettlements')}</p>
                  <p className="text-xs">{t('settlements.noSettlementsDesc')}</p>
                </div>
              </td>
            </tr>
          ) : (
            // Data rows
            settlements.map((settlement, index) => (
              <SettlementRow
                key={settlement.id}
                settlement={settlement}
                onViewDetails={onViewDetails}
                onMarkAsPaid={onMarkAsPaid}
                index={index}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SettlementTable;
