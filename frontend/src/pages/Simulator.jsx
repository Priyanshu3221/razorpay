import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { simulatePolicy } from '../api';
import { formatINR, formatLakhs } from '../utils';
import { Banner, Button } from '../components/ui';
import { IconArrowLeft, IconSliders } from '../components/Icons';

export default function Simulator({ threshold, setThreshold, onBack }) {
  const [riskCutoff, setRiskCutoff] = useState(70);
  const [blockThreshold, setBlockThreshold] = useState(100000);
  const [simResult, setSimResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await simulatePolicy({ thresholdAmount: threshold, riskCutoff, blockThreshold });
        if (!cancelled) setSimResult(data);
      } catch (err) {
        if (!cancelled) {
          setSimResult(null);
          setError(err.message || 'Simulation failed to run');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [threshold, riskCutoff, blockThreshold]);

  return (
    <>
      <div className="actions">
        <Button variant="ghost" onClick={onBack}>
          <IconArrowLeft /> Back to Command Center
        </Button>
      </div>

      {error && <Banner>{error}</Banner>}

      <section className="split">
        {/* Policy Controls */}
        <div className="panel">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconSliders />
              <div>
                <h2>Interactive Policy Threshold Controls</h2>
                <p>Move sliders to recalculate fraud loss & conversion in real-time</p>
              </div>
            </div>
          </div>
          <div className="panel-body stack">
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label htmlFor="threshold">Verification Threshold: <strong style={{ color: '#38bdf8' }}>{formatINR(threshold)}</strong></label>
                <span className="mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Step-up verification</span>
              </div>
              <input
                id="threshold"
                className="range"
                type="range"
                min="10000"
                max="150000"
                step="5000"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              />
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label htmlFor="riskCutoff">Risk Score Cutoff: <strong style={{ color: '#f97316' }}>{riskCutoff}/100</strong></label>
                <span className="mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Challenge trigger score</span>
              </div>
              <input
                id="riskCutoff"
                className="range"
                type="range"
                min="35"
                max="90"
                step="5"
                value={riskCutoff}
                onChange={(e) => setRiskCutoff(parseInt(e.target.value, 10))}
              />
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label htmlFor="blockThreshold">Hard Block Threshold: <strong style={{ color: '#f43f5e' }}>{formatINR(blockThreshold)}</strong></label>
                <span className="mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Auto-block cutoff</span>
              </div>
              <input
                id="blockThreshold"
                className="range"
                type="range"
                min="50000"
                max="250000"
                step="10000"
                value={blockThreshold}
                onChange={(e) => setBlockThreshold(parseInt(e.target.value, 10))}
              />
            </div>

            {loading && !simResult && <p className="muted">Running deterministic telemetry calculation…</p>}

            {simResult && (
              <div className="compare">
                <div className="compare-card">
                  <p className="muted" style={{ fontSize: '0.78rem' }}>Baseline Standard Policy</p>
                  <p style={{ marginTop: 8, fontSize: '1.05rem', fontWeight: 700, color: '#f43f5e' }}>
                    Fraud Loss: ₹4.8L
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>False Declines: 2.1%</p>
                  <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Conversion: 94.2%</p>
                </div>

                <div className="compare-card is-new">
                  <p className="muted" style={{ fontSize: '0.78rem', color: '#38bdf8' }}>Simulated Custom Policy ({formatINR(threshold)})</p>
                  <p style={{ marginTop: 8, fontSize: '1.05rem', fontWeight: 700, color: '#f43f5e' }}>
                    Fraud Loss: {formatLakhs(simResult.fraud_loss)}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>False Declines: {simResult.false_decline_rate}%</p>
                  <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Conversion: {simResult.conversion_rate}%</p>
                  <p style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600, marginTop: 4 }}>Protected Rev: {formatLakhs(simResult.protected_revenue)}</p>
                </div>
              </div>
            )}

            {simResult && (
              <div className="callout accent">
                <h3 style={{ fontSize: '0.92rem', marginBottom: 4, color: '#38bdf8' }}>
                  Recommended Optimal Policy: {formatINR(simResult.recommended_threshold)}
                </h3>
                <p className="muted" style={{ fontSize: '0.82rem' }}>
                  {simResult.recommended_reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Risk vs Revenue Chart */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Risk vs Revenue Policy Trade-off</h2>
              <p>Simulating financial impact across policy strategies</p>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={simResult?.policy_comparison || []}>
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0e131f', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Legend />
                  <Bar dataKey="fraudLoss" fill="#f43f5e" name="Fraud Loss (₹)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversion" fill="#10b981" name="Conversion Rate (%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
