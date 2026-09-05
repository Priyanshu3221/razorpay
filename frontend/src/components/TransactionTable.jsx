import { formatDate, formatINR } from '../utils';
import { RiskBadge } from './RiskBadge';
import { Button } from './ui';

export default function TransactionTable({ rows = [], onInvestigate, limit }) {
  const displayRows = limit ? rows.slice(0, limit) : rows;

  if (!rows || rows.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No transactions recorded.</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Txn ID</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Location</th>
            <th>Device</th>
            <th>Risk Score</th>
            <th>Risk Level</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((txn) => (
            <tr
              key={txn.transaction_id}
              className="clickable"
              onClick={() => onInvestigate && onInvestigate(txn)}
            >
              <td className="mono">{txn.transaction_id}</td>
              <td>
                <strong style={{ color: '#f8fafc' }}>{txn.customer_name}</strong>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{formatDate(txn.created_at)}</div>
              </td>
              <td className="mono" style={{ color: '#f8fafc', fontWeight: 600 }}>
                {formatINR(txn.amount)}
              </td>
              <td>
                <span className="pill" style={{ fontSize: '0.72rem' }}>{txn.payment_method || 'UPI'}</span>
              </td>
              <td>{txn.location}</td>
              <td className="mono" style={{ fontSize: '0.76rem' }}>{txn.device_id || 'DEV-01'}</td>
              <td>
                <span className="mono" style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                  {txn.risk_score}
                </span>
              </td>
              <td>
                <RiskBadge level={txn.risk_level} score={txn.risk_score} />
              </td>
              <td onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => onInvestigate && onInvestigate(txn)}
                >
                  Investigate →
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
