import { useTranslation } from 'react-i18next';
import { Eye, CheckCircle, Clock, AlertCircle, Scale, IndianRupee, Percent } from 'lucide-react';

/**
 * Arctic Frost Theme - Settlement Card Component
 * 
 * Mobile/tablet card view with:
 * - Card with subtle gray border (#EAECF0) and soft shadow
 * - Farmer name prominent
 * - Financial summary grid (Gross, Deductions, Net)
 * - Status badge visible
 * - Quick action buttons
 */
const SettlementCard = ({
  settlement,
  onViewDetails,
  onMarkAsPaid
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
    <div 
      className="bg-white rounded-lg border border-[#EAECF0] shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
      role="article"
      aria-label={`Settlement for ${settlement.farmer_name}`}
    >
      {/* Card Header */}
      <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#EAECF0]">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[#1F2937] truncate">
              {settlement.farmer_name}
            </h3>
            <p className="text-sm text-[#6B7280]">
              {formatPeriod(settlement.month, settlement.year)}
            </p>
          </div>
          <span className={`
            inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ml-2 flex-shrink-0
            ${status.bg} ${status.text} ${status.border}
          `}>
            <StatusIcon size={12} />
            {status.label}
          </span>
        </div>
      </div>

      {/* Financial Summary Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Weight */}
          <div className="flex items-center gap-2 p-2 rounded-md bg-[#F8FAFC]">
            <div className="w-8 h-8 rounded-full bg-[#ECFEFF] flex items-center justify-center flex-shrink-0">
              <Scale size={16} className="text-[#3B82F6]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#6B7280]">{t('settlements.totalWeight')}</p>
              <p className="text-sm font-medium text-[#1F2937]">
                {formatWeight(settlement.total_weight)} kg
              </p>
            </div>
          </div>

          {/* Gross Amount */}
          <div className="flex items-center gap-2 p-2 rounded-md bg-[#F8FAFC]">
            <div className="w-8 h-8 rounded-full bg-[#ECFEFF] flex items-center justify-center flex-shrink-0">
              <IndianRupee size={16} className="text-[#3B82F6]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#6B7280]">{t('settlements.grossAmount')}</p>
              <p className="text-sm font-medium text-[#1F2937]">
                {formatCurrency(settlement.gross_amount)}
              </p>
            </div>
          </div>

          {/* Deductions */}
          <div className="flex items-center gap-2 p-2 rounded-md bg-[#F8FAFC]">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <Percent size={16} className="text-[#EF4444]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#6B7280]">{t('settlements.deductions')}</p>
              <p className="text-sm font-medium text-[#EF4444]">
                -{formatCurrency(settlement.deductions)}
              </p>
            </div>
          </div>

          {/* Advances */}
          <div className="flex items-center gap-2 p-2 rounded-md bg-[#F8FAFC]">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
              <IndianRupee size={16} className="text-[#F59E0B]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#6B7280]">{t('settlements.advances')}</p>
              <p className="text-sm font-medium text-[#F59E0B]">
                -{formatCurrency(settlement.advances)}
              </p>
            </div>
          </div>
        </div>

        {/* Net Amount */}
        <div className="mt-4 pt-3 border-t border-[#EAECF0]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#6B7280]">{t('settlements.netAmount')}</span>
            <span className="text-lg font-bold text-[#1F2937]">
              {formatCurrency(settlement.net_amount)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onViewDetails?.(settlement)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md
              text-[#6B7280] bg-[#F1F5F9] border border-[#EAECF0]
              hover:bg-[#E2E8F0] hover:border-[#CBD5E1]
              focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]
              transition-colors duration-150 text-sm font-medium"
          >
            <Eye size={16} />
            {t('common.view')}
          </button>

          {settlement.status !== 'paid' && (
            <button
              onClick={() => onMarkAsPaid?.(settlement)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md
                text-white bg-gradient-to-r from-[#60A5FA] to-[#3B82F6]
                hover:from-[#3B82F6] hover:to-[#2563EB]
                focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50
                transition-all duration-150 text-sm font-medium shadow-sm"
            >
              <CheckCircle size={16} />
              {t('settlements.markPaid')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettlementCard;
