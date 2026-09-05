import { useEffect, useState } from 'react';
import {
  IconGrid,
  IconList,
  IconShield,
  IconSliders,
  IconNetwork,
  IconAlert,
  IconUsers,
  IconBot,
  IconMenu,
} from './Icons';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', kicker: 'Command Center', icon: IconGrid },
  { id: 'transactions', label: 'Transactions', kicker: 'Live Feed', icon: IconList },
  { id: 'investigate', label: 'AI Investigator', kicker: 'Case Analysis', icon: IconShield },
  { id: 'simulator', label: 'Risk Simulator', kicker: 'Policy Sandbox', icon: IconSliders },
  { id: 'network', label: 'Risk Network', kicker: 'Entity Graph', icon: IconNetwork },
  { id: 'incidents', label: 'Incident Center', kicker: 'Alert Timeline', icon: IconAlert },
  { id: 'customers', label: 'Customer Profiles', kicker: 'Behavior Baselines', icon: IconUsers },
  { id: 'copilot', label: 'AI Copilot', kicker: 'Assistant', icon: IconBot },
  { id: 'settings', label: 'Settings', kicker: 'Engine Configuration', icon: IconSliders },
];

export default function Layout({ page, onNavigate, user, onLogout, title, kicker, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const go = (id) => {
    onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}

      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Primary">
        <div className="brand">
          <div className="brand-mark">
            <IconShield />
          </div>
          <div>
            <h1>RISKOS</h1>
            <p>Payment Risk OS</p>
          </div>
        </div>

        <nav className="nav-list">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${active ? 'is-active' : ''}`}
                onClick={() => go(item.id)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="status-row" style={{ marginBottom: 8 }}>
            <span className="dot pulse" />
            <span>Engine online · 100% SLA</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3, marginBottom: 12 }}>
            Sits on top of payment intelligence (e.g. Razorpay Vulcan)
          </div>
          {user && (
            <button
              onClick={onLogout}
              className="btn btn-ghost"
              style={{ width: '100%', fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Sign out ({user.name || 'Analyst'})
            </button>
          )}
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-btn"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Open navigation"
            >
              <IconMenu />
            </button>
            <div>
              <div className="page-kicker">{kicker}</div>
              <h2 className="page-title">{title}</h2>
            </div>
          </div>
          <div className="topbar-right">
            <span className="demo-badge">
              Demonstration Data — Synthetic Engine
            </span>
            <span className="pill time">{now.toLocaleTimeString()}</span>
          </div>
        </header>

        <main className="content">{children}</main>

        <footer className="footer-bar">
          <div>RISKOS AI Decision Layer v2.4</div>
          <div className="demo-badge" style={{ background: 'transparent', border: 'none', color: '#64748b' }}>
            Synthetic demo data only — No real card numbers or secrets handled
          </div>
        </footer>
      </div>
    </div>
  );
}
