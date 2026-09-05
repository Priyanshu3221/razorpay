import { useMemo, useState } from 'react';
import TransactionTable from '../components/TransactionTable';
import { IconSearch } from '../components/Icons';

const RISK_FILTERS = [
  { id: 'all', label: 'All Risks' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

const METHOD_FILTERS = [
  { id: 'all', label: 'All Methods' },
  { id: 'UPI', label: 'UPI' },
  { id: 'Credit Card', label: 'Credit Card' },
  { id: 'Net Banking', label: 'Net Banking' },
];

export default function Transactions({ transactions, onInvestigate }) {
  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((txn) => {
      const matchesRisk = riskFilter === 'all' || (txn.risk_level || '').toLowerCase() === riskFilter;
      const matchesMethod = methodFilter === 'all' || txn.payment_method === methodFilter;
      const haystack = `${txn.transaction_id} ${txn.customer_name} ${txn.location} ${txn.device_id} ${txn.ip_address}`.toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return matchesRisk && matchesMethod && matchesQuery;
    });
  }, [transactions, query, riskFilter, methodFilter]);

  return (
    <section className="panel">
      <div className="panel-head" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Transaction Monitor</h2>
            <p>Showing {rows.length} of {transactions.length} total monitored payment events</p>
          </div>
        </div>

        <div style={{ display: 'flex', width: '100%', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }}>
              <IconSearch />
            </span>
            <input
              style={{ paddingLeft: 38, width: '100%' }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, customer name, location, device, IP..."
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              {RISK_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>

            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
              {METHOD_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <TransactionTable rows={rows} onInvestigate={onInvestigate} />
    </section>
  );
}
