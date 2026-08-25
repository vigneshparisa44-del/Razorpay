import React from 'react';
import { Compass, Sparkles, History, Users, Calendar, DollarSign, RotateCcw } from 'lucide-react';

export default function Header({ tripState, versionHistory, onSelectVersion, onNewTrip }) {
  if (!tripState) return null;

  const { constraints, version } = tripState;

  return (
    <header className="glass-panel" style={{ padding: '16px 24px', marginBottom: '20px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Left: Brand Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
          }}>
            <Compass size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }} className="gradient-text">
                Dynamic Itinerary Engine
              </h1>
              <span style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}>
                LIVE SOLVER
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Constraint satisfaction travel engine with versioned state & live data grounding
            </p>
          </div>
        </div>

        {/* Center: Trip Metadata Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={onNewTrip}
            className="glass-panel"
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              background: 'rgba(56, 189, 248, 0.1)'
            }}
            title="Click to search & select another destination location"
          >
            <Compass size={14} color="#38bdf8" />
            <strong style={{ color: '#38bdf8' }}>{constraints.destination}</strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Change)</span>
          </button>

          <div className="glass-panel" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <Calendar size={14} color="#818cf8" />
            <span>{constraints.duration_days} Days</span>
          </div>

          <div className="glass-panel" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <Users size={14} color="#34d399" />
            <span>{constraints.group_size} Travelers</span>
          </div>

          <div className="glass-panel" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <DollarSign size={14} color="#fbbf24" />
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>${constraints.total_budget.toLocaleString()}</span>
          </div>
        </div>

        {/* Right: State Version Selector & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <History size={16} color="var(--text-muted)" />
            <select
              value={version}
              onChange={(e) => onSelectVersion(Number(e.target.value))}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {versionHistory && versionHistory.length > 0 ? (
                versionHistory.map((h) => (
                  <option key={h.version} value={h.version} style={{ background: '#111827', color: '#fff' }}>
                    v{h.version}: {h.change_reason.length > 25 ? h.change_reason.substring(0, 25) + '...' : h.change_reason}
                  </option>
                ))
              ) : (
                <option value={version}>v{version}: Current State</option>
              )}
            </select>
          </div>

          <button className="btn btn-secondary" onClick={onNewTrip} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <RotateCcw size={14} /> New Trip
          </button>
        </div>

      </div>
    </header>
  );
}
