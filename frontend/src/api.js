const API_BASE = 'http://localhost:5001/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }

  return res.json();
}

export function getDashboard() {
  return request('/dashboard');
}

export function getStats() {
  return request('/dashboard');
}

export function getTransactions(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.risk_level) query.append('risk_level', params.risk_level);
  if (params.status) query.append('status', params.status);
  const qStr = query.toString();
  return request(`/transactions${qStr ? `?${qStr}` : ''}`);
}

export function getTransaction(id) {
  return request(`/transactions/${encodeURIComponent(id)}`);
}

export function getRisk(id) {
  return request(`/risk/${encodeURIComponent(id)}`);
}

export function simulatePolicy(payload) {
  const body = typeof payload === 'number' ? { thresholdAmount: payload } : payload;
  return request('/simulator', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function createInvestigation(id, payload) {
  return request(`/investigate/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getCustomers() {
  return request('/customers');
}

export function getIncidents() {
  return request('/incidents');
}

export function actionIncident(id, action) {
  return request(`/incidents/${encodeURIComponent(id)}/action`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export function getNetwork(id) {
  return request(`/network/${encodeURIComponent(id || 'TXN-00005')}`);
}

export function askCopilot(message) {
  return request('/copilot', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export function getSettings() {
  return request('/settings');
}

export function updateSettings(payload) {
  return request('/settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
