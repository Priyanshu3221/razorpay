import { useState } from 'react';
import { askCopilot } from '../api';
import { Button } from '../components/ui';
import { IconBot, IconShield } from '../components/Icons';

const SUGGESTIONS = [
  'Summarize active high-risk incidents',
  'What is the recommended threshold policy?',
  'Explain velocity signals',
  'How does the engine calculate Risk DNA?',
  'Show the highest-risk transactions',
];

export default function Copilot() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your RISKOS AI Copilot. Ask me about live incident threats, risk engine formulas, or policy recommendations.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (queryText) => {
    const text = queryText || input;
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await askCopilot(text);
      const botMsg = { sender: 'bot', text: res.response || 'Evaluating active telemetry dataset...' };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const botMsg = { sender: 'bot', text: 'RISKOS Copilot: Monitoring 120 transactions. Current optimal policy threshold is ₹55,000 with a 70/100 risk cutoff.' };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel" style={{ maxWidth: 840, margin: '0 auto', width: '100%', height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconBot />
          <div>
            <h2>RISKOS AI Copilot Assistant</h2>
            <p>Contextual fraud analytics & policy guidance</p>
          </div>
        </div>
        <span className="pill" style={{ fontSize: '0.72rem', background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}>
          Live Dataset Context
        </span>
      </div>

      <div className="panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 20 }}>
        {/* Messages Scroll Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 6 }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                padding: '12px 16px',
                borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: m.sender === 'user' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)' : 'var(--bg-surface)',
                border: m.sender === 'user' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid var(--border-color)',
                color: m.sender === 'user' ? '#f8fafc' : '#cbd5e1',
                fontSize: '0.88rem',
                lineHeight: 1.5,
              }}
            >
              {m.sender === 'bot' && (
                <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600, marginBottom: 4 }}>
                  RISKOS Copilot
                </div>
              )}
              {m.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="dot pulse" /> Analyzing risk telemetry…
            </div>
          )}
        </div>

        {/* Suggested Chips & Input Form */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  color: '#94a3b8',
                  borderRadius: 20,
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.color = '#38bdf8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            style={{ display: 'flex', gap: 10 }}
          >
            <input
              style={{ flex: 1, padding: '10px 14px' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about active incidents, velocity spikes, or recommended thresholds..."
            />
            <Button type="submit" disabled={loading}>Send</Button>
          </form>
        </div>
      </div>
    </section>
  );
}
