import { ActionBadge, RiskBadge } from './RiskBadge';

export function Button({ variant = 'primary', children, ...props }) {
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  );
}

export function Banner({ tone = 'danger', children }) {
  return <div className={`banner ${tone}`}>{children}</div>;
}

export function LoadingScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div className="dot pulse" style={{ width: 24, height: 24, background: '#38bdf8', boxShadow: '0 0 20px #38bdf8' }} />
      <p className="muted" style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>EVALUATING RISK MATRIX…</p>
    </div>
  );
}

export function EmptyState({ title = 'No data found', body = 'Try adjusting filters or search query.' }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
      <h3 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: 4 }}>{title}</h3>
      <p style={{ fontSize: '0.82rem', color: '#64748b' }}>{body}</p>
    </div>
  );
}

export function StatusBadge({ status }) {
  const norm = (status || 'allow').toLowerCase();
  let action = 'ALLOW';
  if (norm === 'block' || norm === 'blocked' || norm === 'high') action = 'BLOCK';
  else if (norm === 'verify' || norm === 'challenged' || norm === 'medium') action = 'VERIFY';

  return <ActionBadge action={action} />;
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div 
        className="panel" 
        onClick={(e) => e.stopPropagation()} 
        style={{ width: '90%', maxWidth: 540, margin: '60px auto', position: 'relative', zIndex: 100 }}
      >
        <div className="panel-head">
          <h2>{title}</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px 8px' }}>✕</button>
        </div>
        <div className="panel-body">
          {children}
        </div>
      </div>
    </div>
  );
}
