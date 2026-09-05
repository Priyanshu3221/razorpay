import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../api';
import { Banner, Button, LoadingScreen } from '../components/ui';
import { IconSliders, IconShield } from '../components/Icons';
import { formatINR } from '../utils';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('engine');
  const [settings, setSettings] = useState({
    verification_threshold: '50000',
    risk_score_cutoff: '70',
    block_threshold: '100000',
    vulcan_intelligence_mode: 'synthetic_layer',
    auto_contain_clusters: 'enabled',
    alert_email_notifications: 'enabled',
    theme_display: 'dark_command_center',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getSettings()
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.error('Settings load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await updateSettings(settings);
      setMessage(res.message || 'System settings saved successfully.');
    } catch (err) {
      setError(err.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  const TABS = [
    { id: 'engine', label: 'Risk Engine' },
    { id: 'alerts', label: 'Alert Preferences' },
    { id: 'security', label: 'Security & Vulcan' },
    { id: 'account', label: 'Account' },
  ];

  return (
    <section className="panel" style={{ maxWidth: 840, margin: '0 auto', width: '100%' }}>
      <div className="panel-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconSliders />
          <div>
            <h2>RISKOS Settings & Engine Configuration</h2>
            <p>Configure risk thresholds, alert rules, and intelligence parameters</p>
          </div>
        </div>
      </div>

      <div className="panel-body stack">
        {message && <Banner tone="success">{message}</Banner>}
        {error && <Banner>{error}</Banner>}

        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="stack" style={{ marginTop: 10 }}>
          {activeTab === 'engine' && (
            <>
              <div className="field">
                <label htmlFor="verification_threshold">Verification Threshold: {formatINR(settings.verification_threshold)}</label>
                <input
                  id="verification_threshold"
                  type="number"
                  value={settings.verification_threshold}
                  onChange={(e) => setSettings({ ...settings, verification_threshold: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Transactions above this amount require step-up verification</span>
              </div>

              <div className="field">
                <label htmlFor="risk_score_cutoff">Risk Score Cutoff (0-100): {settings.risk_score_cutoff}</label>
                <input
                  id="risk_score_cutoff"
                  type="number"
                  min="10"
                  max="95"
                  value={settings.risk_score_cutoff}
                  onChange={(e) => setSettings({ ...settings, risk_score_cutoff: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Transactions with risk score equal or higher trigger challenge/block rules</span>
              </div>

              <div className="field">
                <label htmlFor="block_threshold">Hard Block Threshold: {formatINR(settings.block_threshold)}</label>
                <input
                  id="block_threshold"
                  type="number"
                  value={settings.block_threshold}
                  onChange={(e) => setSettings({ ...settings, block_threshold: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Transactions exceeding this amount are automatically blocked if combined with high velocity</span>
              </div>
            </>
          )}

          {activeTab === 'alerts' && (
            <>
              <div className="field">
                <label htmlFor="auto_contain_clusters">Auto-Contain Coordinated Bot Clusters</label>
                <select
                  id="auto_contain_clusters"
                  value={settings.auto_contain_clusters}
                  onChange={(e) => setSettings({ ...settings, auto_contain_clusters: e.target.value })}
                >
                  <option value="enabled">Enabled (Auto-isolate IP subnet on 5+ velocity spikes)</option>
                  <option value="disabled">Disabled (Manual analyst containment only)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="alert_email_notifications">Analyst Threat Notifications</label>
                <select
                  id="alert_email_notifications"
                  value={settings.alert_email_notifications}
                  onChange={(e) => setSettings({ ...settings, alert_email_notifications: e.target.value })}
                >
                  <option value="enabled">Instant Alert Email + Webhook Broadcast</option>
                  <option value="disabled">Batch Hourly Summary Only</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <div className="field">
                <label htmlFor="vulcan_intelligence_mode">Payment Intelligence Layer</label>
                <select
                  id="vulcan_intelligence_mode"
                  value={settings.vulcan_intelligence_mode}
                  onChange={(e) => setSettings({ ...settings, vulcan_intelligence_mode: e.target.value })}
                >
                  <option value="synthetic_layer">RISKOS Layer (Sits on top of Payment Intelligence)</option>
                  <option value="simulation_only">Simulation Sandbox Mode</option>
                </select>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                RISKOS provides an explainable AI decision layer. Demonstration synthetic mode enabled.
              </p>
            </>
          )}

          {activeTab === 'account' && (
            <div className="callout">
              <h4 style={{ fontSize: '0.9rem', marginBottom: 4 }}>Signed in as Risk Ops Analyst</h4>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Email: demo@riskos.ai · Organization: Enterprise Operations</p>
            </div>
          )}

          <Button type="submit" disabled={saving} style={{ marginTop: 12 }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </div>
    </section>
  );
}
