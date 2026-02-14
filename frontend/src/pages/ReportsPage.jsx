import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../hooks/useReports';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/data/Card';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import Select from '../components/forms/Select';
import LoadingSpinner from '../components/feedback/LoadingSpinner';
import { BarChart3, TrendingUp, Users, Download, Calendar } from 'lucide-react';

const ReportsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { generateDailySummary, generateFarmerSummary, generateMarketAnalytics, generateSettlementReport, generateCashAdvanceReport } = useReports();
  
  const [reportType, setReportType] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    farmerId: ''
  });

  const reportOptions = [
    { value: 'daily', label: t('reports.dailySummary'), icon: Calendar },
    { value: 'farmer', label: t('reports.farmerSummary'), icon: Users },
    { value: 'market', label: t('reports.marketAnalytics'), icon: TrendingUp },
    { value: 'settlement', label: t('reports.settlementReport'), icon: BarChart3 },
    { value: 'advance', label: t('reports.cashAdvanceReport'), icon: TrendingUp }
  ];

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null);
    
    try {
      let data;
      switch (reportType) {
        case 'daily':
          data = await generateDailySummary(filters.startDate, filters.endDate);
          break;
        case 'farmer':
          data = await generateFarmerSummary(filters.farmerId, filters.startDate, filters.endDate);
          break;
        case 'market':
          data = await generateMarketAnalytics(filters.startDate, filters.endDate);
          break;
        case 'settlement':
          data = await generateSettlementReport(filters.startDate, filters.endDate);
          break;
        case 'advance':
          data = await generateCashAdvanceReport(filters.startDate, filters.endDate);
          break;
        default:
          throw new Error('Invalid report type');
      }
      setReportData(data);
      showNotification('success', t('reports.generateSuccess'));
    } catch (error) {
      showNotification('error', t('reports.generateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      showNotification('info', t('reports.downloadStart'));
      // In a real implementation, this would trigger a CSV/PDF download
      showNotification('success', t('reports.downloadSuccess'));
    } catch (error) {
      showNotification('error', t('reports.downloadError'));
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'daily':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <Card.Body>
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('dashboard.totalEntries')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">{reportData.totalEntries}</p>
                  </div>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body>
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('dashboard.totalWeight')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">{reportData.totalWeight} kg</p>
                  </div>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body>
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('dashboard.totalAmount')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">₹{reportData.totalAmount}</p>
                  </div>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body>
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('reports.activeFarmers')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">{reportData.activeFarmers}</p>
                  </div>
                </Card.Body>
              </Card>
            </div>
            
            <Card>
              <Card.Header>
                <h3 className="card-title">{t('reports.dailyBreakdown')}</h3>
              </Card.Header>
              <Card.Body>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-warm-taupe">
                        <th className="text-left py-3 px-4 font-semibold text-warm-charcoal">{t('common.date')}</th>
                        <th className="text-right py-3 px-4 font-semibold text-warm-charcoal">{t('dashboard.totalEntries')}</th>
                        <th className="text-right py-3 px-4 font-semibold text-warm-charcoal">{t('dashboard.totalWeight')}</th>
                        <th className="text-right py-3 px-4 font-semibold text-warm-charcoal">{t('dashboard.totalAmount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.dailyBreakdown?.map((day, index) => (
                        <tr key={index} className="border-b border-warm-sand">
                          <td className="py-3 px-4">{day.date}</td>
                          <td className="text-right py-3 px-4">{day.entries}</td>
                          <td className="text-right py-3 px-4">{day.weight} kg</td>
                          <td className="text-right py-3 px-4">₹{day.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </div>
        );

      case 'farmer':
        return (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h3 className="card-title">{t('reports.farmerSummary')}</h3>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('dashboard.totalEntries')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">{reportData.totalEntries}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('dashboard.totalWeight')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">{reportData.totalWeight} kg</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('dashboard.totalAmount')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">₹{reportData.totalAmount}</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-warm-taupe">
                        <th className="text-left py-3 px-4 font-semibold text-warm-charcoal">{t('common.date')}</th>
                        <th className="text-right py-3 px-4 font-semibold text-warm-charcoal">{t('dashboard.totalWeight')}</th>
                        <th className="text-right py-3 px-4 font-semibold text-warm-charcoal">{t('dashboard.totalAmount')}</th>
                        <th className="text-right py-3 px-4 font-semibold text-warm-charcoal">{t('reports.adjustments')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.entries?.map((entry, index) => (
                        <tr key={index} className="border-b border-warm-sand">
                          <td className="py-3 px-4">{entry.date}</td>
                          <td className="text-right py-3 px-4">{entry.weight} kg</td>
                          <td className="text-right py-3 px-4">₹{entry.amount}</td>
                          <td className="text-right py-3 px-4">{entry.adjustments?.join(', ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </div>
        );

      case 'market':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <Card.Header>
                  <h3 className="card-title">{t('reports.weightTrends')}</h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-warm-brown">{t('reports.averageWeight')}</span>
                      <span className="font-semibold text-warm-charcoal">{reportData.avgWeight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-brown">{t('reports.maxWeight')}</span>
                      <span className="font-semibold text-warm-charcoal">{reportData.maxWeight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-brown">{t('reports.minWeight')}</span>
                      <span className="font-semibold text-warm-charcoal">{reportData.minWeight} kg</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Header>
                  <h3 className="card-title">{t('reports.adjustmentStats')}</h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-2">
                    {reportData.adjustmentStats?.map((stat, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-warm-brown">{stat.type}</span>
                        <span className="font-semibold text-warm-charcoal">{stat.count} ({stat.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        );

      case 'settlement':
        return (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h3 className="card-title">{t('reports.settlementReport')}</h3>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('reports.totalSettlements')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">{reportData.totalSettlements}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('settlements.totalAmount')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">₹{reportData.totalAmount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('settlements.advancesDeducted')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">₹{reportData.advancesDeducted}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('settlements.netAmount')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">₹{reportData.netAmount}</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        );

      case 'advance':
        return (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h3 className="card-title">{t('reports.cashAdvanceReport')}</h3>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('reports.totalAdvances')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">{reportData.totalAdvances}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('reports.totalAmount')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">₹{reportData.totalAmount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-warm-brown mb-1">{t('reports.pendingAdvances')}</p>
                    <p className="text-3xl font-bold text-warm-charcoal">{reportData.pendingAdvances}</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-warm-charcoal">
          {t('reports.title')}
        </h1>
        
        {reportData && (
          <Button
            variant="primary"
            icon={Download}
            onClick={handleDownload}
          >
            {t('reports.download')}
          </Button>
        )}
      </div>

      {/* Report Type Selection */}
      <Card>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {reportOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setReportType(option.value);
                  setReportData(null);
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${
                  reportType === option.value
                    ? 'border-accent-magenta bg-accent-magenta/5'
                    : 'border-warm-taupe hover:border-accent-magenta'
                }`}
              >
                <option.icon size={32} className={reportType === option.value ? 'text-accent-magenta' : 'text-warm-brown'} />
                <span className={`text-sm font-medium ${reportType === option.value ? 'text-accent-magenta' : 'text-warm-charcoal'}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Filters */}
      <Card>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={t('reports.startDate')}
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              label={t('reports.endDate')}
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={handleGenerateReport}
                className="w-full"
                disabled={loading}
              >
                {t('reports.generate')}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Report Content */}
      {loading ? (
        <Card>
          <Card.Body>
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          </Card.Body>
        </Card>
      ) : reportData ? (
        renderReportContent()
      ) : (
        <Card>
          <Card.Body>
            <div className="text-center py-12 text-warm-brown">
              <BarChart3 size={48} className="mx-auto mb-4 text-warm-taupe" />
              <p>{t('reports.selectReport')}</p>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;
