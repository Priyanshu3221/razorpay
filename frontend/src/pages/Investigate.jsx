import { useEffect, useState } from 'react';
import { createInvestigation, getRisk, getTransaction } from '../api';
import { formatDate, formatINR, riskTone, signalLabel } from '../utils';
import { Banner, Button, LoadingScreen, StatusBadge } from '../components/ui';
import { RiskBadge, ActionBadge } from '../components/RiskBadge';
import RiskDNARadar from '../components/RiskDNARadar';
import { IconArrowLeft, IconShield, IconAlert, IconCheck } from '../components/Icons';

export default function Investigate({ txn, onBack, onOpenSimulator, onOpenNetwork }) {
  const [detail, setDetail] = useState(null);
  const [riskEval, setRiskEval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState('challenged');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.allSettled([
      getTransaction(txn.transaction_id),
      getRisk(txn.transaction_id)
    ]).then(([detailRes, riskRes]) => {
      if (cancelled) return;
      if (detailRes.status === 'fulfilled') setDetail(detailRes.value);
      if (riskRes.status === 'fulfilled') {
        setRiskEval(riskRes.value);
        if (riskRes.value.recommendedAction === 'BLOCK') setDecision('blocked');
        else if (riskRes.value.recommendedAction === 'ALLOW') setDecision('allowed');
        else setDecision('challenged');
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [txn.transaction_id]);

  if (loading) return <LoadingScreen />;

  const record = detail?.transaction || txn;
  const customer = detail?.customer || {};
  const evaluation = riskEval || {
    riskScore: record.risk_score || 50,
    riskLevel: record.risk_level || 'MEDIUM',
    recommendedAction: record.status === 'block' ? 'BLOCK' : 'VERIFY',
    confidence: 0.88,
    explanation: 'Risk score evaluated based on transaction amount vs baseline, velocity, new device identifier, and account age.',
    subScores: {
      transactionAnomaly: Math.min(100, Math.round((record.amount || 0) / 1200)),
      velocity: (record.velocity_6min || 1) * 10,
      deviceAnomaly: record.device_anomaly_flag ? 85 : 15,
      locationAnomaly: record.location_anomaly_flag ? 90 : 10,
      accountBehavior: Math.max(10, 100 - (record.account_age_days || 30)),
      historicalRisk: (record.historical_chargebacks || 0) * 40 + 10,
    },
    signals: ['high_velocity', 'unrecognized_device']
  };

  const tone = riskTone(evaluation.riskScore);
  const subScores = evaluation.subScores || {};

  // Compute primary risk contributors (scores >= 50)
  const primaryContributors = Object.entries(subScores)
    .filter(([_, score]) => score >= 50)
    .sort((a, b) => b[1] - a[1]);

  const submitCase = async (status) => {
    setSaving(true);
    setSaved('');
    setError('');
    try {
      const res = await createInvestigation(record.transaction_id, {
        status,
        decision,
        notes,
      });
      setSaved(res.message || 'Investigation decision saved.');
    } catch (err) {
      setError(err.message || 'Could not save decision');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="ghost" onClick={onBack}>
          <IconArrowLeft /> Back to Transactions
        </Button>
        {onOpenNetwork && (
          <Button variant="ghost" onClick={() => onOpenNetwork(record.transaction_id)}>
            Inspect Entity Network Graph →
          </Button>
        )}
      </div>

      {error && <Banner>{error}</Banner>}
      {saved && <Banner tone="success">{saved}</Banner>}

      <section className="split">
        {/* Left Column: Transaction Details & Signals */}
        <div className="panel">
          <div className="panel-body stack">
            {/* Hero Header */}
            <div className="score-hero">
              <div>
                <div className="mono" style={{ fontSize: '0.85rem', color: '#38bdf8' }}>{record.transaction_id}</div>
                <h2 style={{ fontSize: 24, marginTop: 4, color: '#f8fafc' }}>{record.customer_name}</h2>
                <p className="muted" style={{ fontSize: '0.82rem' }}>
                  {record.location} · {formatDate(record.created_at)} · via {record.payment_method || 'UPI'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={`score-num ${tone}`}>{evaluation.riskScore}</div>
                <div style={{ marginTop: 4 }}>
                  <RiskBadge level={evaluation.riskLevel} score={evaluation.riskScore} />
                </div>
              </div>
            </div>

            {/* Transaction Attributes Grid */}
            <div className="kv-grid">
              <div className="kv">
                <label>Amount</label>
                <strong>{formatINR(record.amount)}</strong>
              </div>
              <div className="kv">
                <label>Engine Action</label>
                <ActionBadge action={evaluation.recommendedAction} />
              </div>
              <div className="kv">
                <label>Confidence</label>
                <strong>{Math.round(evaluation.confidence * 100)}%</strong>
              </div>
              <div className="kv">
                <label>Device Fingerprint</label>
                <strong className="mono" style={{ fontSize: '0.8rem' }}>{record.device_id || 'DEV-01'}</strong>
              </div>
              <div className="kv">
                <label>IP Address</label>
                <strong className="mono" style={{ fontSize: '0.8rem' }}>{record.ip_address || '127.0.0.1'}</strong>
              </div>
              <div className="kv">
                <label>Account Age</label>
                <strong>{record.account_age_days ?? '—'} days</strong>
              </div>
            </div>

            {/* Risk DNA Radar Chart */}
            <div style={{ background: 'rgba(14, 19, 31, 0.5)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', color: '#f8fafc' }}>Risk DNA Telemetry</h3>
                  <p className="muted" style={{ fontSize: '0.78rem' }}>6-dimensional signal radar breakdown</p>
                </div>
                <span className="pill" style={{ fontSize: '0.75rem', background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}>
                  Deterministic Engine
                </span>
              </div>
              <RiskDNARadar subScores={subScores} />
            </div>

            {/* Primary Risk Contributors */}
            <div className="panel" style={{ background: 'rgba(244, 63, 94, 0.05)', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
              <div className="panel-body">
                <h3 style={{ fontSize: '0.92rem', color: '#f43f5e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconAlert /> Primary Risk Contributors
                </h3>
                {primaryContributors.length === 0 ? (
                  <p className="muted" style={{ fontSize: '0.82rem' }}>No individual signal exceeded the high risk threshold (50/100).</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {primaryContributors.map(([key, val]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                        <span><strong>{signalLabel(key)}</strong> — Flagged score {val}/100</span>
                        <span className="badge critical" style={{ fontSize: '0.7rem' }}>HIGH SIGNAL</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Individual Signals Detail */}
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Detailed Signal Diagnostics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(subScores).map(([key, val]) => {
                  let severity = val >= 75 ? 'HIGH' : val >= 45 ? 'MEDIUM' : 'LOW';
                  let explanation = `${signalLabel(key)} evaluated at ${val}/100`;
                  if (key === 'velocity') explanation = `${record.velocity_6min || 1} payment attempts detected within 6 minutes window.`;
                  if (key === 'transactionAnomaly') explanation = `Transaction value of ${formatINR(record.amount)} vs customer baseline.`;
                  if (key === 'deviceAnomaly') explanation = record.device_anomaly_flag ? 'New/unregistered hardware device fingerprint.' : 'Known customer hardware device.';
                  if (key === 'accountBehavior') explanation = `Account age is ${record.account_age_days || 30} days.`;

                  return (
                    <div key={key} style={{ background: 'var(--bg-surface)', padding: 14, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{signalLabel(key)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="mono" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{val}/100</span>
                          <span className={`badge ${severity.toLowerCase()}`}>{severity}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 8 }}>{explanation}</p>
                      <div className="track">
                        <div className={`fill ${riskTone(val)}`} style={{ width: `${Math.min(100, val)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Explanation & Manual Review */}
        <div className="stack">
          {/* AI Explanation Callout */}
          <div className="panel" style={{ borderLeft: '4px solid #38bdf8' }}>
            <div className="panel-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconShield />
                <h2>AI Dynamic Explanation Narrative</h2>
              </div>
            </div>
            <div className="panel-body stack">
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#cbd5e1' }}>
                {evaluation.explanation}
              </p>

              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 600, marginBottom: 4 }}>
                  Engine Verdict
                </div>
                <p style={{ fontSize: '0.84rem', color: '#f8fafc' }}>
                  Recommended Action: <strong>{evaluation.recommendedAction}</strong> ({Math.round(evaluation.confidence * 100)}% engine confidence)
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Action Options */}
          <div className="panel">
            <div className="panel-head">
              <h2>Select Reviewer Action</h2>
            </div>
            <div className="panel-body stack">
              <div style={{ display: 'flex', gap: 8 }}>
                {['ALLOW', 'VERIFY', 'BLOCK'].map((act) => (
                  <button
                    key={act}
                    onClick={() => setDecision(act.toLowerCase())}
                    className={`btn ${decision === act.toLowerCase() ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1, padding: '10px 4px', fontSize: '0.8rem' }}
                  >
                    {act}
                  </button>
                ))}
              </div>

              <div className="field">
                <label htmlFor="notes">Case Reviewer Notes</label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Document investigation findings or policy override reasons..."
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" onClick={() => submitCase('open')} disabled={saving} style={{ flex: 1 }}>
                  Save Open Case
                </Button>
                <Button variant="success" onClick={() => submitCase('resolved')} disabled={saving} style={{ flex: 1 }}>
                  Submit & Resolve
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Simulation Link */}
          <Button onClick={onOpenSimulator} style={{ width: '100%' }}>
            Test policy rules in Risk Simulator →
          </Button>
        </div>
      </section>
    </>
  );
}
