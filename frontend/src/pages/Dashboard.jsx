import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { formatINR } from '../utils';
import { IconAlert, IconCheck, IconRupee, IconTx, IconShield } from '../components/Icons';
import TransactionTable from '../components/TransactionTable';
import { Button } from '../components/ui';

function StatCard({ label, value, hint, trend, icon, tone }) {
  return (
    <article className="stat-card">
      <header>
        <span className="stat-label">{label}</span>
        <span className={`stat-icon ${tone || ''}`}>{icon}</span>
      </header>
      <div className="stat-value">{value}</div>
      {trend && (
        <div className={`stat-trend ${trend.type === 'up' ? 'up' : 'down'}`}>
          {trend.type === 'up' ? '↑' : '↓'} {trend.text}
        </div>
      )}
      {hint && <div className="stat-hint">{hint}</div>}
    </article>
  );
}

const COLORS = ['#10b981', '#eab308', '#f97316', '#f43f5e'];

export default function Dashboard({ stats, transactions, onInvestigate, onOpenSimulator, onOpenTransactions }) {
  const highRisk = transactions
    .filter((txn) => txn.risk_level === 'HIGH' || txn.risk_level === 'CRITICAL' || txn.status === 'block')
    .slice(0, 6);

  const pieData = stats?.risk_distribution
    ? stats.risk_distribution.map((d) => ({
        name: d.risk_level,
        value: d.count,
      }))
    : [
        { name: 'LOW', value: 75 },
        { name: 'MEDIUM', value: 25 },
        { name: 'HIGH', value: 15 },
        { name: 'CRITICAL', value: 5 },
      ];

  return (
    <>
      <section className="grid-stats">
        <StatCard
          label="Transactions Monitored"
          value={stats?.total_transactions ?? 120}
          trend={{ type: 'up', text: '+8.4% vs prev week' }}
          hint="Captured in real-time engine"
          icon={<IconTx />}
        />
        <StatCard
          label="Gross Processed Volume"
          value={formatINR(stats?.total_amount)}
          trend={{ type: 'up', text: '+12.1% volume growth' }}
          hint="Total transaction value"
          icon={<IconRupee />}
          tone="cyan"
        />
        <StatCard
          label="Risk Volume Prevented"
          value={formatINR(stats?.risk_prevented)}
          trend={{ type: 'down', text: '-3.2% fraud attempt rate' }}
          hint="Flagged high-risk volume"
          icon={<IconAlert />}
          tone="warning"
        />
        <StatCard
          label="Payment Success Rate"
          value={`${stats?.success_rate ?? 96.2}%`}
          trend={{ type: 'up', text: '+0.5% conversion' }}
          hint={`${stats?.high_risk_count ?? 12} high-risk flags`}
          icon={<IconCheck />}
          tone="success"
        />
        <StatCard
          label="Open Investigations"
          value={stats?.open_investigations ?? 3}
          hint="Pending analyst review"
          icon={<IconShield />}
          tone="danger"
        />
      </section>

      {/* Analytics Charts */}
      <section className="split">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Transaction Volume & Risk Trend</h2>
              <p>Daily volume telemetry from payment engine</p>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ width: '100%', height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.volume_chart || []}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0e131f', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Area type="monotone" dataKey="total" stroke="#38bdf8" fillOpacity={1} fill="url(#totalGrad)" name="Total Volume" />
                  <Area type="monotone" dataKey="high_risk" stroke="#f43f5e" fillOpacity={1} fill="url(#riskGrad)" name="High Risk" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Risk Distribution</h2>
              <p>Breakdown across risk levels</p>
            </div>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0e131f', borderColor: 'rgba(255,255,255,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {pieData.map((d, i) => (
                <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Feed & Priority Queue */}
      <section className="split">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Live Risk Feed</h2>
              <p>Real-time stream of evaluated transactions</p>
            </div>
            <Button variant="ghost" onClick={onOpenTransactions}>
              View all transactions →
            </Button>
          </div>
          <TransactionTable rows={transactions} onInvestigate={onInvestigate} limit={7} />
        </div>

        <div className="stack">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Priority Review Queue</h2>
                <p>Transactions requiring human review</p>
              </div>
            </div>
            <div className="panel-body">
              {highRisk.length === 0 ? (
                <p className="muted">No critical risk transactions in queue.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {highRisk.map((txn) => (
                    <button
                      key={txn.transaction_id}
                      onClick={() => onInvestigate(txn)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer',
                        color: 'inherit',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{txn.customer_name}</div>
                        <div className="mono" style={{ fontSize: '0.72rem', color: '#64748b' }}>{txn.transaction_id} · {txn.location}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="mono" style={{ fontWeight: 700, color: '#f43f5e' }}>{formatINR(txn.amount)}</div>
                        <div style={{ fontSize: '0.72rem', color: '#f97316' }}>Score: {txn.risk_score}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(14, 19, 31, 0.9) 100%)' }}>
            <div className="panel-body">
              <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>Risk Policy Simulator</h3>
              <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 14 }}>
                Simulate threshold adjustments on live volume before deploying rules.
              </p>
              <Button onClick={onOpenSimulator} style={{ width: '100%' }}>Launch Policy Sandbox →</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
