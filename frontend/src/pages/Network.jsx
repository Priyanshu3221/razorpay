import { useEffect, useState } from 'react';
import { getNetwork } from '../api';
import { Banner, Button, LoadingScreen, StatusBadge } from '../components/ui';
import { RiskBadge } from '../components/RiskBadge';
import { IconNetwork, IconAlert, IconSearch } from '../components/Icons';
import { formatINR, formatDate } from '../utils';

export default function Network({ transactionId = 'TXN-00005', onInvestigate }) {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [contained, setContained] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getNetwork(transactionId)
      .then((data) => {
        if (!cancelled) {
          setNetworkData(data);
          if (data.rootTransaction) {
            setSelectedNode({
              id: data.rootTransaction.transaction_id,
              type: 'transaction',
              label: data.rootTransaction.transaction_id,
              data: data.rootTransaction,
            });
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load network graph');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  if (loading) return <LoadingScreen />;

  const root = networkData?.rootTransaction || {};
  const customer = networkData?.customer || {};
  const connections = networkData?.connections || [];

  // Build nodes with SVG coordinates
  const nodes = [
    { id: root.transaction_id, label: root.transaction_id, type: 'transaction', risk: root.risk_level || 'CRITICAL', x: 300, y: 180, details: root },
    { id: customer.customer_id || 'CUST-0001', label: customer.customer_name || 'Customer Node', type: 'customer', risk: customer.risk_tier || 'LOW', x: 140, y: 90, details: customer },
    { id: root.device_id || 'DEV-CLUSTER-01', label: root.device_id || 'DEV-CLUSTER-01', type: 'device', risk: 'HIGH', x: 460, y: 90, details: { device_id: root.device_id, tx_count: connections.length + 1 } },
    { id: root.ip_address || '103.21.244.12', label: root.ip_address || '103.21.244.12', type: 'ip', risk: 'HIGH', x: 300, y: 310, details: { ip_address: root.ip_address, subnet: '103.21.244.0/24' } },
  ];

  connections.slice(0, 5).forEach((conn, idx) => {
    const angle = (idx / 5) * Math.PI * 1.2 + 0.2;
    const radius = 140;
    const x = Math.round(460 + radius * Math.cos(angle));
    const y = Math.round(180 + radius * Math.sin(angle));
    nodes.push({
      id: conn.transaction_id,
      label: conn.transaction_id,
      type: 'transaction',
      risk: conn.risk_level || 'MEDIUM',
      x,
      y,
      details: conn,
    });
  });

  const links = [
    { source: nodes[1], target: nodes[0], label: 'initiated' },
    { source: nodes[0], target: nodes[2], label: 'fingerprint' },
    { source: nodes[0], target: nodes[3], label: 'origin_ip' },
  ];

  for (let i = 4; i < nodes.length; i++) {
    links.push({ source: nodes[i], target: nodes[2], label: 'shared_dev' });
  }

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <>
      {error && <Banner>{error}</Banner>}
      {contained && <Banner tone="success">Cluster IP (103.21.244.12) & Hardware Fingerprint isolated in firewall!</Banner>}

      <section className="split">
        {/* Interactive SVG Canvas */}
        <div className="panel">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconNetwork />
              <div>
                <h2>Interactive Risk Network Graph</h2>
                <p>Click nodes to inspect entity telemetry. Drag to pan canvas.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button variant="ghost" style={{ padding: '4px 10px' }} onClick={() => setZoom((z) => Math.min(2, z + 0.2))}>
                + Zoom
              </Button>
              <Button variant="ghost" style={{ padding: '4px 10px' }} onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}>
                - Zoom
              </Button>
              <Button variant="ghost" style={{ padding: '4px 10px' }} onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                Reset
              </Button>
            </div>
          </div>

          <div
            className="panel-body"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              position: 'relative',
              minHeight: 440,
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
              background: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.05), transparent 70%)',
            }}
          >
            <svg
              width="100%"
              height="420"
              viewBox="0 0 700 420"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease',
              }}
            >
              {/* Relationship Links */}
              {links.map((link, idx) => (
                <g key={`link-${idx}`}>
                  <line
                    x1={link.source.x}
                    y1={link.source.y}
                    x2={link.target.x}
                    y2={link.target.y}
                    stroke={link.label === 'shared_dev' ? 'rgba(244, 63, 94, 0.5)' : 'rgba(56, 189, 248, 0.35)'}
                    strokeWidth={link.label === 'shared_dev' ? 2 : 1.5}
                    strokeDasharray={link.label === 'shared_dev' ? '4' : 'none'}
                  />
                  <text
                    x={(link.source.x + link.target.x) / 2}
                    y={(link.source.y + link.target.y) / 2 - 4}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {link.label}
                  </text>
                </g>
              ))}

              {/* Entity Nodes */}
              {nodes.map((n) => {
                const isSelected = selectedNode?.id === n.id;
                let strokeColor = '#10b981';
                if (n.risk === 'CRITICAL' || n.risk === 'HIGH') strokeColor = '#f43f5e';
                else if (n.risk === 'MEDIUM') strokeColor = '#f97316';
                if (n.type === 'ip') strokeColor = '#eab308';
                if (n.type === 'customer') strokeColor = '#38bdf8';

                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x}, ${n.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(n);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      r={n.type === 'transaction' && n.id === root.transaction_id ? 32 : 26}
                      fill="#0e131f"
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 4 : 2}
                      style={{
                        filter: isSelected ? `drop-shadow(0 0 10px ${strokeColor})` : 'none',
                      }}
                    />
                    <text textAnchor="middle" dy="-2" fill="#f8fafc" fontSize="9" fontWeight="bold">
                      {n.type.toUpperCase()}
                    </text>
                    <text textAnchor="middle" dy="12" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                      {n.label.length > 12 ? `${n.label.slice(0, 10)}…` : n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Entity Info Drawer & Cluster Risk Analysis */}
        <div className="stack">
          {/* Cluster Risk Banner */}
          <div className="panel" style={{ borderLeft: '4px solid #f43f5e' }}>
            <div className="panel-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconAlert />
                <h2>Coordinated Threat Cluster</h2>
              </div>
            </div>
            <div className="panel-body stack">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Cluster Exposure:</span>
                <strong style={{ color: '#f43f5e', fontSize: '1.1rem' }}>{formatINR(485000)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Affected Entities:</span>
                <strong>{connections.length + 1} Transactions / 3 Customers</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Cluster IP Subnet:</span>
                <strong className="mono" style={{ color: '#eab308' }}>103.21.244.12</strong>
              </div>

              <Button
                variant="danger"
                onClick={() => setContained(true)}
                disabled={contained}
                style={{ width: '100%', marginTop: 6 }}
              >
                {contained ? '✓ Cluster Contained' : 'Isolate & Contain Cluster'}
              </Button>
            </div>
          </div>

          {/* Node Inspector Drawer */}
          <div className="panel">
            <div className="panel-head">
              <h2>Entity Inspector</h2>
            </div>
            <div className="panel-body stack">
              {selectedNode ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span className="mono" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{selectedNode.type.toUpperCase()}</span>
                      <h3 style={{ fontSize: '1.05rem', marginTop: 2, color: '#f8fafc' }}>{selectedNode.label}</h3>
                    </div>
                    <RiskBadge level={selectedNode.risk} />
                  </div>

                  {selectedNode.type === 'transaction' && selectedNode.details && (
                    <div className="kv-grid">
                      <div className="kv">
                        <label>Amount</label>
                        <strong>{formatINR(selectedNode.details.amount)}</strong>
                      </div>
                      <div className="kv">
                        <label>Customer</label>
                        <strong style={{ fontSize: '0.8rem' }}>{selectedNode.details.customer_name}</strong>
                      </div>
                      <div className="kv">
                        <label>Device</label>
                        <strong className="mono" style={{ fontSize: '0.75rem' }}>{selectedNode.details.device_id}</strong>
                      </div>
                    </div>
                  )}

                  {selectedNode.type === 'customer' && (
                    <div className="kv-grid">
                      <div className="kv">
                        <label>Email</label>
                        <strong style={{ fontSize: '0.75rem' }}>{selectedNode.details?.email || 'customer@example.com'}</strong>
                      </div>
                      <div className="kv">
                        <label>Location</label>
                        <strong>{selectedNode.details?.home_location || 'Mumbai'}</strong>
                      </div>
                    </div>
                  )}

                  {selectedNode.type === 'transaction' && onInvestigate && (
                    <Button
                      variant="primary"
                      onClick={() => onInvestigate(selectedNode.details)}
                      style={{ width: '100%', marginTop: 8 }}
                    >
                      Open Case in AI Investigator →
                    </Button>
                  )}
                </>
              ) : (
                <p className="muted">Click any node on the graph to inspect entity details.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
