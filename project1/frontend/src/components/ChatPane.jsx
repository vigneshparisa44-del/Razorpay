import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export default function ChatPane({ messages, onSendMessage, isThinking }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    "Hotel went up 20%",
    "Flight rebooked +$150",
    "Lower budget to $2200",
    "Lock Sintra day"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSendMessage(input.trim());
    setInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '480px', padding: '16px' }}>
      {/* Pane Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
        <Bot size={18} color="var(--accent-primary)" />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>NLU Agent & Tradeoff Assistant</h3>
      </div>

      {/* Messages List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '8px',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%'
            }}
          >
            {msg.sender === 'agent' && (
              <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '6px', borderRadius: '8px', height: 'fit-content' }}>
                <Bot size={14} color="#818cf8" />
              </div>
            )}

            <div
              style={{
                background: msg.sender === 'user' ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                color: msg.sender === 'user' ? '#fff' : 'var(--text-main)',
                padding: '10px 12px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                lineHeight: '1.45',
                whiteSpace: 'pre-wrap'
              }}
            >
              {msg.text}
            </div>

            {msg.sender === 'user' && (
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '6px', borderRadius: '8px', height: 'fit-content' }}>
                <User size={14} color="#fff" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Sparkles size={14} className="pulse-glow" color="var(--accent-primary)" />
            Solving constraints & updating itinerary state...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 0', marginTop: '6px' }}>
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(p)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '0.7rem',
              padding: '4px 8px',
              borderRadius: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            💬 "{p}"
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask or give constraints (e.g. 'Hotel went up 20%')..."
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: '#fff',
            padding: '8px 12px',
            fontSize: '0.8rem'
          }}
        />
        <button type="submit" disabled={isThinking} className="btn btn-primary" style={{ padding: '8px 12px' }}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
