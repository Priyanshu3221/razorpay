export function RiskBadge({ level, score }) {
  const normLevel = (level || (score > 80 ? 'CRITICAL' : score > 60 ? 'HIGH' : score > 35 ? 'MEDIUM' : 'LOW')).toUpperCase();
  const cls = normLevel.toLowerCase();

  return (
    <span className={`badge ${cls}`}>
      <span className={`dot ${cls === 'critical' || cls === 'high' ? 'pulse' : ''}`} style={{ width: 6, height: 6 }} />
      {normLevel} {score !== undefined ? `(${score})` : ''}
    </span>
  );
}

export function ActionBadge({ action }) {
  const normAction = (action || 'ALLOW').toUpperCase();
  const cls = `action-${normAction.toLowerCase()}`;

  return (
    <span className={`badge ${cls}`}>
      {normAction}
    </span>
  );
}
