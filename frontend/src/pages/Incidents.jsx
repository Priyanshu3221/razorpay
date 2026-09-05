import { useEffect, useState } from 'react';
import { actionIncident, getIncidents } from '../api';
import { Banner, Button, LoadingScreen } from '../components/ui';
import { IconAlert, IconShield, IconCheck } from '../components/Icons';
import { formatDate, formatINR } from '../utils';

export default function Incidents({ onOpenNetwork }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = () => {
    setLoading(true);
    getIncidents()
      .then(setIncidents)
      .catch((err) => setError(err.message || 'Failed to load incidents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id, act) => {
    try {
      const res = await actionIncident(id, act);
      setMessage(res.message || `Incident ${id} updated.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Could not update incident');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      {error && <Banner>{error}</Banner>}
      {message && <Banner tone="success">{message}</Banner>}

      <section className="stack">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {incidents.map((inc) => {
            const isCritical = inc.severity === 'CRITICAL';
            const isContained = inc.status === 'CONTAINED';
            return (
              <div
                key={inc.incident_id}
                className="panel"
                style={{
                  borderTop: `4px solid ${isContained ? '#10b981' : isCritical ? '#f43f5e' : '#f97316'}`,
                }}
              >
                <div className="panel-head">
                  <div>
                    <span className="mono" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{inc.incident_id}</span>
                    <h3 style={{ fontSize: '1rem', marginTop: 2 }}>{inc.title}</h3>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: isContained ? 'rgba(16,185,129,0.1)' : isCritical ? 'rgba(244,63,94,0.1)' : 'rgba(249,115,22,0.1)',
                      color: isContained ? '#10b981' : isCritical ? '#f43f5e' : '#f97316',
                    }}
                  >
                    {inc.status}
                  </span>
                </div>

                <div className="panel-body stack">
                  <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    {inc.description}
                  </p>

                  <div className="kv-grid">
                    <div className="kv">
                      <label>Attack Vector</label>
                      <strong style={{ fontSize: '0.78rem' }}>{inc.vector}</strong>
                    </div>
                    <div className="kv">
                      <label>Affected Txns</label>
                      <strong>{inc.affected_tx_count}</strong>
                    </div>
                    <div className="kv">
                      <label>Total Exposure</label>
                      <strong style={{ color: '#f43f5e' }}>{formatINR(inc.total_exposure)}</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Triggered {formatDate(inc.created_at)}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button
                      variant={isContained ? 'ghost' : 'danger'}
                      style={{ flex: 1, padding: '8px 4px', fontSize: '0.78rem' }}
                      disabled={isContained}
                      onClick={() => handleAction(inc.incident_id, 'contain')}
                    >
                      {isContained ? '✓ Contained' : 'Contain Incident'}
                    </Button>
                    <Button
                      variant="ghost"
                      style={{ flex: 1, padding: '8px 4px', fontSize: '0.78rem' }}
                      onClick={() => onOpenNetwork && onOpenNetwork('TXN-00005')}
                    >
                      Investigate Network
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
