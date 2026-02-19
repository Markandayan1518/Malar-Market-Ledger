import { useTranslation } from 'react-i18next';
import { Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';

/**
 * Arctic Frost Theme - Settlement Row Component
 * 
 * Compact row styling (40-48px height) for desktop table view
 * Status badges: Paid (Aurora Green), Pending (Frost Blue), Late (Frostbite Red)
 * 
 * Uses Tailwind CSS with Arctic Frost theme colors:
 * - glacier-cyan: #ECFEFF (active row highlight)
 * - aurora-green: #10B981 (paid)
 * - frost-blue: #3B82F6 (pending)
 * - frostbite-red: #EF4444 (late)
 * - ice-border: #EAECF0
 */
const SettlementRow = ({
  settlement,
  onViewDetails,
  onMarkAsPaid,
  isActive = false,
  index = 0
}) => {
  const { t } = useTranslation();

  // Status badge variants
  const statusVariants = {
    paid: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      label: t('settlements.statusPaid'),
      icon: CheckCircle
    },
    pending: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      label: t('settlements.statusPending'),
      icon: Clock
    },
    late: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      label: t('settlements.statusLate'),
      icon: AlertCircle
    }
  };

  // Get status variant
  const status = statusVariants[settlement.status] || statusVariants.pending;
  const StatusIcon = status.icon;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format weight in kg
  const formatWeight = (weight) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format((weight || 0) / 1000);
  };

  // Format period (month/year)
  const formatPeriod = (month, year) => {
    const months = [
      t('common.january'), t('common.february'), t('common.march'),
      t('common.april'), t('common.may'), t('common.june'),
      t('common.july'), t('common.august'), t('common.september'),
      t('common.october'), t('common.november'), t('common.december')
    ];
    return `${months[(month || 1) - 1]} ${year || ''}`;
  };

  return (
    <tr 
      className={`
        h-10 min-h-[40px] border-b border-[#EAECF0] transition-colors duration-150
        ${isActive ? 'bg-[#ECFEFF]' : index % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}
        hover:bg-[#ECFEFF] hover:shadow-sm
      `}
      role="row"
      aria-label={`Settlement for ${settlement.farmer_name}`}
    >
      {/* Farmer Name */}
      <td className="px-3 py-2 text-sm text-[#1F2937] font-medium whitespace-nowrap">
        {settlement.farmer_name}
      </td>

      {/* Period */}
      <td className="px-3 py-2 text-sm text-[#6B7280] whitespace-nowrap">
        {formatPeriod(settlement.month, settlement.year)}
      </td>

      {/* Total Weight */}
      <td className="px-3 py-2 text-sm text-[#1F2937] text-right tabular-nums whitespace-nowrap">
        {formatWeight(settlement.total_weight)} kg
      </td>

      {/* Gross Amount */}
      <td className="px-3 py-2 text-sm text-[#1F2937] text-right tabular-nums whitespace-nowrap">
        {formatCurrency(settlement.gross_amount)}
      </td>

      {/* Deductions */}
      <td className="px-3 py-2 text-sm text-[#EF4444] text-right tabular-nums whitespace-nowrap">
        -{formatCurrency(settlement.deductions)}
      </td>

      {/* Advances */}
      <td className="px-3 py-2 text-sm text-[#F59E0B] text-right tabular-nums whitespace-nowrap">
        -{formatCurrency(settlement.advances)}
      </td>

      {/* Net Amount */}
      <td className="px-3 py-2 text-sm font-semibold text-[#1F2937] text-right tabular-nums whitespace-nowrap">
        {formatCurrency(settlement.net_amount)}
      </td>

      {/* Status */}
      <td className="px-3 py-2 text-center">
        <span className={`
          inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border
          ${status.bg} ${status.text} ${status.border}
        `}>
          <StatusIcon size={12} />
          {status.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-2 justify-center">
          {/* View Details Button */}
          <button
            onClick={() => onViewDetails?.(settlement)}
            className="flex items-center justify-center w-8 h-8 rounded-md
              text-[#6B7280] bg-[#F1F5F9] border border-[#EAECF0]
              hover:bg-[#E2E8F0] hover:border-[#CBD5E1]
              focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]
              transition-colors duration-150"
            aria-label={t('common.view')}
          >
            <Eye size={16} />
          </button>

          {/* Mark as Paid Button (only for pending/late) */}
          {settlement.status !== 'paid' && (
            <button
              onClick={() => onMarkAsPaid?.(settlement)}
              className="flex items-center justify-center w-8 h-8 rounded-md
                text-white bg-[#10B981] border border-[#10B981]
                hover:bg-[#059669] hover:border-[#059669]
                focus:outline-none focus:ring-2 focus:ring-[#10B981]/50
                transition-colors duration-150"
              aria-label={t('settlements.markPaid')}
            >
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default SettlementRow;
