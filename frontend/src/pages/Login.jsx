import { useState } from 'react';
import { Button } from '../components/ui';
import { IconShield } from '../components/Icons';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('demo@riskos.ai');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === 'demo@riskos.ai' && password === 'demo123') {
      onLogin({ email, name: 'Risk Ops Analyst' });
    } else {
      setError('Invalid credentials. Use demo@riskos.ai / demo123');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 20 }}>
      <div className="panel" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, justifyContent: 'center' }}>
          <div className="brand-mark">
            <IconShield />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem' }}>RISKOS</h1>
            <p className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Risk Decision Layer</p>
          </div>
        </div>

        {error && <div className="banner" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="stack">
          <div className="field">
            <label htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" style={{ width: '100%', marginTop: 8 }}>
            Sign In to Command Center →
          </Button>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', fontSize: '0.78rem', marginTop: 4 }}
            onClick={() => {
              setEmail('demo@riskos.ai');
              setPassword('demo123');
            }}
          >
            Fill Demo Credentials (demo@riskos.ai)
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
          Synthetic Payment Engine Demo Mode Enabled
        </div>
      </div>
    </div>
  );
}
