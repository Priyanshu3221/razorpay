export function formatINR(value) {
  const amount = Number(value) || 0;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatLakhs(value) {
  const amount = Number(value) || 0;
  return `₹${(amount / 100000).toFixed(1)}L`;
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function statusLabel(status) {
  if (!status) return 'Unknown';
  return String(status).replace(/_/g, ' ');
}

export function signalLabel(type) {
  if (!type) return 'Signal';
  return String(type)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function riskTone(score) {
  if (score > 70) return 'danger';
  if (score > 40) return 'warning';
  return 'success';
}
