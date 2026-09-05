import { useEffect, useState } from 'react';
import { getCustomers } from '../api';
import { Banner, LoadingScreen } from '../components/ui';
import { formatINR } from '../utils';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch((err) => setError(err.message || 'Could not load customer baselines'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <>
      {error && <Banner>{error}</Banner>}

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Customer Behavior Baselines</h2>
            <p>Behavioral deviation scores (Framed as transient activity deviation, not permanent customer labels)</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name / Email</th>
                <th>Baseline Avg Txn</th>
                <th>Primary Device</th>
                <th>Home Location</th>
                <th>Risk Tier</th>
                <th>Current Deviation</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const dev = c.deviation_score || 10;
                const devColor = dev > 35 ? '#f43f5e' : dev > 20 ? '#f97316' : '#10b981';
                return (
                  <tr key={c.customer_id}>
                    <td className="mono" style={{ color: '#38bdf8' }}>{c.customer_id}</td>
                    <td>
                      <strong style={{ color: '#f8fafc' }}>{c.customer_name}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.email}</div>
                    </td>
                    <td className="mono">{formatINR(c.avg_tx_amount)}</td>
                    <td className="mono" style={{ fontSize: '0.78rem' }}>{c.primary_device}</td>
                    <td>{c.home_location}</td>
                    <td>
                      <span className={`badge ${c.risk_tier.toLowerCase()}`}>
                        {c.risk_tier}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="track" style={{ flex: 1, minWidth: 60 }}>
                          <div
                            className="fill"
                            style={{
                              width: `${Math.min(100, dev * 2)}%`,
                              background: devColor,
                            }}
                          />
                        </div>
                        <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: devColor }}>
                          +{dev}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
