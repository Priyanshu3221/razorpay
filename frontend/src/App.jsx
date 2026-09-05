import { useEffect, useState } from 'react';
import { getDashboard, getTransactions } from './api';
import Layout from './components/Layout';
import { Banner, LoadingScreen } from './components/ui';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Investigate from './pages/Investigate';
import Simulator from './pages/Simulator';
import Network from './pages/Network';
import Incidents from './pages/Incidents';
import Customers from './pages/Customers';
import Copilot from './pages/Copilot';
import Settings from './pages/Settings';
import Login from './pages/Login';

const TITLES = {
  dashboard: { title: 'RISKOS Command Center', kicker: 'Overview & Telemetry' },
  transactions: { title: 'Transaction Monitor', kicker: 'Live Feed & Filters' },
  investigate: { title: 'AI Investigator Case View', kicker: 'Case Analysis & DNA' },
  simulator: { title: 'Risk Policy Simulator', kicker: 'Policy Sandbox' },
  network: { title: 'Entity Risk Network', kicker: 'Cluster Graph' },
  incidents: { title: 'Incident Response Center', kicker: 'Active Threats' },
  customers: { title: 'Customer Behavior Profiles', kicker: 'Spending Baselines' },
  copilot: { title: 'RISKOS AI Copilot', kicker: 'Interactive Assistant' },
  settings: { title: 'Engine Settings', kicker: 'Configuration' },
};

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('riskos_user');
    return saved ? JSON.parse(saved) : { name: 'Risk Analyst', email: 'demo@riskos.ai' };
  });

  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [networkTxnId, setNetworkTxnId] = useState('TXN-00005');
  const [page, setPage] = useState('dashboard');
  const [threshold, setThreshold] = useState(50000);

  const fetchData = async () => {
    try {
      const [dashData, txnData] = await Promise.all([getDashboard(), getTransactions()]);
      setStats(dashData);
      setTransactions(txnData);
      if (txnData && txnData.length > 0 && !selectedTxn) {
        // Default to a high-risk transaction if available for seamless demo flow
        const highRiskItem = txnData.find(t => t.risk_level === 'CRITICAL' || t.risk_level === 'HIGH') || txnData[0];
        setSelectedTxn(highRiskItem);
      }
    } catch (err) {
      console.error('Error fetching RISKOS data:', err);
      setError('Unable to reach RISKOS API backend on port 5001. Please confirm backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogin = (userInfo) => {
    setUser(userInfo);
    localStorage.setItem('riskos_user', JSON.stringify(userInfo));
    setPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('riskos_user');
  };

  const openInvestigate = (txn) => {
    setSelectedTxn(txn);
    setPage('investigate');
  };

  const openNetwork = (txnId) => {
    if (txnId) setNetworkTxnId(txnId);
    setPage('network');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const meta = TITLES[page] || TITLES.dashboard;

  return (
    <Layout
      page={page}
      onNavigate={(next) => setPage(next)}
      user={user}
      onLogout={handleLogout}
      title={meta.title}
      kicker={meta.kicker}
    >
      {error && <Banner>{error}</Banner>}

      {page === 'dashboard' && (
        <Dashboard
          stats={stats}
          transactions={transactions}
          onInvestigate={openInvestigate}
          onOpenSimulator={() => setPage('simulator')}
          onOpenTransactions={() => setPage('transactions')}
        />
      )}

      {page === 'transactions' && (
        <Transactions transactions={transactions} onInvestigate={openInvestigate} />
      )}

      {page === 'investigate' && selectedTxn && (
        <Investigate
          key={selectedTxn.transaction_id}
          txn={selectedTxn}
          onBack={() => setPage('transactions')}
          onOpenSimulator={() => setPage('simulator')}
          onOpenNetwork={openNetwork}
        />
      )}

      {page === 'investigate' && !selectedTxn && (
        <Banner>Please select a transaction from the Command Center or Transaction Monitor to start an investigation.</Banner>
      )}

      {page === 'simulator' && (
        <Simulator
          threshold={threshold}
          setThreshold={setThreshold}
          onBack={() => setPage('dashboard')}
        />
      )}

      {page === 'network' && (
        <Network transactionId={networkTxnId} onInvestigate={openInvestigate} />
      )}

      {page === 'incidents' && (
        <Incidents onOpenNetwork={openNetwork} />
      )}

      {page === 'customers' && (
        <Customers />
      )}

      {page === 'copilot' && (
        <Copilot />
      )}

      {page === 'settings' && (
        <Settings />
      )}
    </Layout>
  );
}

export default App;
