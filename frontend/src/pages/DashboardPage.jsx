import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useDailyEntries } from '../hooks/useDailyEntries';
import { useMarketRates } from '../hooks/useMarketRates';
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
  LogOut
} from 'lucide-react';
import Card from '../components/data/Card';
import DataTable from '../components/data/DataTable';
import Badge from '../components/data/Badge';
import Button from '../components/forms/Button';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { syncQueue } = useOffline();
  const navigate = useNavigate();
  
  const { fetchEntries, getTodayStats } = useDailyEntries();
  const { getCurrentRate } = useMarketRates();
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

  const statsCards = [
    {
      title: t('dashboard.totalEntries'),
      value: todayStats?.count || 0,
      icon: LayoutDashboard,
      color: 'text-accent-magenta',
      onClick: () => handleQuickAction('/daily-entry')
    },
    {
      title: t('dashboard.totalWeight'),
      value: `${todayStats?.totalWeight || 0} kg`,
      icon: TrendingUp,
      color: 'text-accent-emerald',
      onClick: () => {}
    },
    {
      title: t('dashboard.totalAmount'),
      value: `₹${todayStats?.totalAmount || '0.00'}`,
      icon: Activity,
      color: 'text-accent-purple',
      onClick: () => {}
    },
    {
      title: 'Pending Advances',
      value: advances.filter(a => a.status === 'pending').length,
      icon: Users,
      color: 'text-accent-amber',
      onClick: () => handleQuickAction('/cash-advances')
    },
    {
      title: 'Active Farmers',
      value: '24',
      icon: Users,
      color: 'text-accent-emerald',
      onClick: () => handleQuickAction('/farmers')
    }
  ];

  const recentActivityColumns = [
    { key: 'time', label: 'Time', sortable: true },
    { key: 'farmer', label: 'Farmer', sortable: false },
    { key: 'weight', label: 'Weight', sortable: false },
    { key: 'amount', label: 'Amount', sortable: false },
    { key: 'adjustments', label: 'Adjustments', sortable: false }
    { key: 'actions', label: '', sortable: false }
  ];

  const recentActivityData = entries.slice(0, 10).map(entry => ({
    id: entry.id,
    time: entry.time,
    farmer: entry.farmerName || 'Unknown',
    weight: entry.weight,
    amount: entry.total,
    adjustments: entry.adjustments?.join(', ') || '-',
    actions: 'view'
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-warm-charcoal">
          {t('dashboard.welcome', { name: user?.username })}
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <Card 
            key={index}
            hoverable={!!stat.onClick}
            onClick={stat.onClick}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={32} />
              </div>
              <div>
                <p className="stats-label">{stat.title}</p>
                <p className="stats-value">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold text-warm-charcoal mb-4">
          {t('dashboard.quickActions')}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => handleQuickAction('/daily-entry')}
          >
            {t('dashboard.newEntry')}
          </Button>
          <Button
            variant="secondary"
            icon={Users}
            onClick={() => handleQuickAction('/farmers')}
          >
            {t('dashboard.viewFarmers')}
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Entries */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <h3 className="card-title">
              {t('dashboard.recentActivity')}
            </h3>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw size={32} className="animate-spin text-accent-magenta" />
              </div>
            ) : entries.length > 0 ? (
              <DataTable
                columns={recentActivityColumns}
                data={recentActivityData}
                emptyMessage="No recent activity"
                searchable={false}
                pagination={false}
              />
            ) : (
              <div className="text-center py-8 text-warm-brown">
                <p>{t('common.noResults')}</p>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Pending Advances */}
        <Card className="lg:col-span-1">
          <Card.Header>
            <h3 className="card-title">
              Pending Advances
            </h3>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw size={32} className="animate-spin text-accent-amber" />
              </div>
            ) : advances.length > 0 ? (
              <DataTable
                columns={[
                  { key: 'farmer', label: 'Farmer' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'date', label: 'Date' },
                  { key: 'status', label: 'Status', render: (row) => (
                    <Badge variant={row.status === 'pending' ? 'warning' : row.status === 'approved' ? 'success' : 'danger'}>
                      {t(`cashAdvances.${row.status}`)}
                    </Badge>
                  )}
                ]}
                data={advances.slice(0, 5).map(advance => ({
                  id: advance.id,
                  farmer: advance.farmerName || 'Unknown',
                  amount: advance.amount,
                  date: advance.date,
                  status: advance.status
                }))}
                emptyMessage="No pending advances"
                searchable={false}
                pagination={false}
              />
            ) : (
              <div className="text-center py-8 text-warm-brown">
                <p>{t('common.noResults')}</p>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Sync Status */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <h3 className="card-title">
              Sync Status
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`status-dot ${isOnline ? 'status-dot-online' : 'status-dot-offline'}`} />
                <span className="text-sm font-medium">
                  {isOnline ? t('offline.syncSuccess') : t('offline.title')}
                </span>
              </div>
              
              {syncQueue.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-accent-crimson text-white rounded-lg">
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  <span className="text-sm font-medium">
                    {syncQueue.length} {t('offline.syncQueue', { count: syncQueue.length })}
                  </span>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
