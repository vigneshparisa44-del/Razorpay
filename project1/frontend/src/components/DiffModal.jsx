import React from 'react';
import { X, CheckCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function DiffModal({ diff, onClose }) {
  if (!diff) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '650px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        background: '#111827',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="#fbbf24" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }} className="gradient-text">
              State Transition Diff (v{diff.from_version} → v{diff.to_version})
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Change Reason Banner */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#a5b4fc',
          marginBottom: '16px'
        }}>
          Triggered Shock: {diff.change_reason}
        </div>

        {/* Natural Language Tradeoff Explanation */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '14px',
          fontSize: '0.85rem',
          marginBottom: '16px',
          lineHeight: '1.5'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} /> Tradeoff Explanation
          </div>
          <div style={{ color: 'var(--text-main)', whitespace: 'pre-wrap' }}>
            {diff.explanation}
          </div>
        </div>

        {/* Swapped Items Table */}
        {diff.swapped_items && diff.swapped_items.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: '#f3f4f6' }}>
              Rebalanced & Swapped Line Items:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {diff.swapped_items.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(244, 63, 94, 0.05)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--accent-rose)', textDecoration: 'line-through' }}>
                      Day {s.day}: {s.old_title} (${s.old_cost.toFixed(0)})
                    </div>
                    <div style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <ArrowRight size={12} /> {s.new_title} (${s.new_cost.toFixed(0)})
                    </div>
                  </div>
                  <div style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Saved ${s.savings.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Deltas */}
        {diff.category_deltas && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>
              Category Spend Shifts:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
              {diff.category_deltas.map((cat, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{cat.category}</div>
                  <div style={{ fontWeight: 700, color: cat.delta > 0 ? 'var(--accent-rose)' : cat.delta < 0 ? '#34d399' : 'var(--text-main)' }}>
                    {cat.delta > 0 ? `+${cat.delta.toFixed(0)}` : cat.delta.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-primary" onClick={onClose}>
            <CheckCircle size={14} /> Accept & Lock Version v{diff.to_version}
          </button>
        </div>

      </div>
    </div>
  );
}
