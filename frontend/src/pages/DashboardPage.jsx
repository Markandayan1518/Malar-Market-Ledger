import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useDailyEntries } from '../hooks/useDailyEntries';
import { useCashAdvances } from '../hooks/useCashAdvances';
import { useSettlements } from '../hooks/useSettlements';
import { format } from 'date-fns';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Activity, 
  Plus, 
  ArrowRight,
  RefreshCw,
  Flower2,
  Calendar,
  IndianRupee,
  Scale,
  Wifi,
  WifiOff,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import Card, { StatCard } from '../components/data/Card';
import DataTable from '../components/data/DataTable';
import Badge from '../components/data/Badge';
import Button from '../components/forms/Button';
import StatusIndicator from '../components/data/StatusIndicator';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isOffline, syncQueueCount } = useOffline();
  const isOnline = !isOffline;
  const navigate = useNavigate();
  
  const { fetchEntries, getTodayStats } = useDailyEntries();
  const { fetchAdvances } = useCashAdvances();
  const { fetchSettlements } = useSettlements();
  
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [todayStats, setTodayStats] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchEntries(),
          fetchAdvances(),
          fetchSettlements()
        ]);
        setTodayStats(getTodayStats());
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [fetchEntries, fetchAdvances, fetchSettlements, getTodayStats]);

  const handleQuickAction = (path) => {
    navigate(path);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetings.morning');
    if (hour < 17) return t('dashboard.greetings.afternoon');
    return t('dashboard.greetings.evening');
  };

  const statsCards = [
    {
      title: t('dashboard.totalEntries'),
      value: todayStats?.count || 0,
      icon: LayoutDashboard,
      color: 'glacier',
      trend: '+12%',
      trendDirection: 'up',
      onClick: () => handleQuickAction('/daily-entry')
    },
    {
      title: t('dashboard.totalWeight'),
      value: `${todayStats?.totalWeight || 0} kg`,
      icon: Scale,
      color: 'aurora',
      trend: '+8%',
      trendDirection: 'up',
      onClick: () => {}
    },
    {
      title: t('dashboard.totalAmount'),
      value: `₹${todayStats?.totalAmount || '0.00'}`,
      icon: IndianRupee,
      color: 'gold',
      trend: '+15%',
      trendDirection: 'up',
      onClick: () => {}
    },
    {
      title: t('dashboard.pendingAdvances'),
      value: advances.filter(a => a.status === 'pending').length,
      icon: Clock,
      color: 'frostbite',
      trend: null,
      trendDirection: 'neutral',
      onClick: () => handleQuickAction('/cash-advances')
    }
  ];

  const recentActivityColumns = [
    { 
      key: 'time', 
      label: t('dashboard.table.time'), 
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm text-arctic-charcoal/70">
          {row.time}
        </span>
      )
    },
    { 
      key: 'farmer', 
      label: t('dashboard.table.farmer'), 
      sortable: false,
      render: (row) => (
        <span className="font-medium text-arctic-night">
          {row.farmer}
        </span>
      )
    },
    { 
      key: 'weight', 
      label: t('dashboard.table.weight'), 
      sortable: false,
      render: (row) => (
        <span className="font-mono text-glacier-700">
          {row.weight} kg
        </span>
      )
    },
    { 
      key: 'amount', 
      label: t('dashboard.table.amount'), 
      sortable: false,
      render: (row) => (
        <span className="font-mono font-medium text-aurora-700">
          ₹{row.amount}
        </span>
      )
    },
    { 
      key: 'status', 
      label: t('dashboard.table.status'), 
      sortable: false,
      render: (row) => (
        <Badge variant={row.synced ? 'success' : 'warning'} size="sm">
          {row.synced ? t('status.synced') : t('status.pending')}
        </Badge>
      )
    },
    { 
      key: 'actions', 
      label: '', 
      sortable: false,
      render: (row) => (
        <button 
          onClick={() => navigate(`/daily-entry?id=${row.id}`)}
          className="p-1.5 text-glacier-500 hover:text-glacier-700 hover:bg-glacier-50 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )
    }
  ];

  const recentActivityData = entries.slice(0, 10).map(entry => ({
    id: entry.id,
    time: entry.time,
    farmer: entry.farmerName || 'Unknown',
    weight: entry.weight,
    amount: entry.total,
    synced: entry.synced !== false
  }));

  return (
    <div className="space-y-6 p-6 bg-arctic-ice min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-glacier-500 via-glacier-400 to-aurora-400 rounded-arctic-xl p-6 text-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-aurora-300/20 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-aurora-200" />
                <span className="text-white/80 text-sm font-medium">
                  {getGreeting()}
                </span>
              </div>
              <h1 className="font-display text-3xl font-bold text-white mb-1">
                {t('dashboard.welcome', { name: user?.full_name?.split(' ')[0] || 'User' })}
              </h1>
              <p className="text-white/70 font-body flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-3">
              <StatusIndicator 
                isOnline={isOnline} 
                syncQueueCount={syncQueueCount}
                showLabel
              />
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => handleQuickAction('/daily-entry')}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
            >
              {t('dashboard.newEntry')}
            </Button>
            <Button
              variant="secondary"
              icon={Users}
              onClick={() => handleQuickAction('/farmers')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              {t('dashboard.viewFarmers')}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            trendDirection={stat.trendDirection}
            color={stat.color}
            onClick={stat.onClick}
            className={stat.onClick ? 'cursor-pointer' : ''}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Entries - Takes 2 columns */}
        <Card className="lg:col-span-2 bg-white border border-ice-border rounded-arctic-xl overflow-hidden">
          <Card.Header className="px-6 py-4 border-b border-ice-border bg-arctic-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-glacier-100 rounded-lg">
                  <Flower2 className="w-5 h-5 text-glacier-600" />
                </div>
                <h3 className="font-display text-lg font-semibold text-arctic-night">
                  {t('dashboard.recentActivity')}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAction('/daily-entry')}
                className="text-glacier-600 hover:text-glacier-700 hover:bg-glacier-50"
              >
                {t('dashboard.viewAll')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={32} className="animate-spin text-glacier-500" />
              </div>
            ) : entries.length > 0 ? (
              <DataTable
                columns={recentActivityColumns}
                data={recentActivityData}
                emptyMessage={t('dashboard.noRecentActivity')}
                searchable={false}
                pagination={false}
                className="border-0"
              />
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-arctic-100 rounded-full mb-4">
                  <Flower2 className="w-8 h-8 text-arctic-charcoal/40" />
                </div>
                <p className="text-arctic-charcoal/60 font-medium mb-2">
                  {t('dashboard.noEntriesToday')}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => handleQuickAction('/daily-entry')}
                  className="bg-glacier-500 hover:bg-glacier-600"
                >
                  {t('dashboard.addFirstEntry')}
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pending Advances Card */}
          <Card className="bg-white border border-ice-border rounded-arctic-xl overflow-hidden">
            <Card.Header className="px-6 py-4 border-b border-ice-border bg-arctic-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold-100 rounded-lg">
                  <Clock className="w-5 h-5 text-gold-600" />
                </div>
                <h3 className="font-display text-lg font-semibold text-arctic-night">
                  {t('dashboard.pendingAdvances')}
                </h3>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw size={24} className="animate-spin text-gold-500" />
                </div>
              ) : advances.filter(a => a.status === 'pending').length > 0 ? (
                <div className="space-y-3">
                  {advances.filter(a => a.status === 'pending').slice(0, 4).map((advance) => (
                    <div 
                      key={advance.id}
                      className="flex items-center justify-between p-3 bg-arctic-50 rounded-lg border border-ice-border hover:border-glacier-200 transition-colors cursor-pointer"
                      onClick={() => handleQuickAction('/cash-advances')}
                    >
                      <div>
                        <p className="font-medium text-arctic-night text-sm">
                          {advance.farmerName || 'Unknown'}
                        </p>
                        <p className="text-xs text-arctic-charcoal/60">
                          {advance.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium text-gold-700">
                          ₹{advance.amount}
                        </p>
                        <Badge variant="warning" size="sm">
                          {t('cashAdvances.pending')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {advances.filter(a => a.status === 'pending').length > 4 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickAction('/cash-advances')}
                      className="w-full text-glacier-600 hover:text-glacier-700"
                    >
                      {t('dashboard.viewAll')} ({advances.filter(a => a.status === 'pending').length})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-aurora-100 rounded-full mb-3">
                    <CheckCircle2 className="w-6 h-6 text-aurora-500" />
                  </div>
                  <p className="text-sm text-arctic-charcoal/60">
                    {t('dashboard.noPendingAdvances')}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Sync Status Card */}
          <Card className="bg-white border border-ice-border rounded-arctic-xl overflow-hidden">
            <Card.Header className="px-6 py-4 border-b border-ice-border bg-arctic-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isOnline ? 'bg-aurora-100' : 'bg-gold-100'}`}>
                  {isOnline ? (
                    <Wifi className="w-5 h-5 text-aurora-600" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-gold-600" />
                  )}
                </div>
                <h3 className="font-display text-lg font-semibold text-arctic-night">
                  {t('dashboard.syncStatus')}
                </h3>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="space-y-4">
                {/* Connection Status */}
                <div className="flex items-center justify-between p-3 bg-arctic-50 rounded-lg">
                  <span className="text-sm text-arctic-charcoal">
                    {t('dashboard.connection')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-aurora-500 animate-pulse' : 'bg-gold-500'}`} />
                    <span className={`text-sm font-medium ${isOnline ? 'text-aurora-700' : 'text-gold-700'}`}>
                      {isOnline ? t('status.online') : t('status.offline')}
                    </span>
                  </div>
                </div>

                {/* Sync Queue */}
                {syncQueueCount > 0 ? (
                  <div className="p-4 bg-gold-50 border border-gold-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gold-800">
                          {t('dashboard.pendingSync')}
                        </p>
                        <p className="text-xs text-gold-600 mt-1">
                          {syncQueueCount} {t('dashboard.itemsWaiting')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-aurora-50 border border-aurora-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-aurora-500" />
                      <p className="text-sm text-aurora-700">
                        {t('status.allSynced')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
