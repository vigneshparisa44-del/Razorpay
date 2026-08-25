import React, { useState } from 'react';
import { Lock, Unlock, Tag, ExternalLink, ChevronDown, Sparkles, AlertCircle, MapPin } from 'lucide-react';

export default function LineItemCard({ item, onToggleLock }) {
  const [showAlts, setShowAlts] = useState(false);

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'flights': return 'badge-flights';
      case 'lodging': return 'badge-lodging';
      case 'activities': return 'badge-activities';
      case 'dining': return 'badge-dining';
      case 'transit': return 'badge-transit';
      default: return 'badge-buffer';
    }
  };

  const isSplurge = item.tags?.includes('#splurge') || item.flexibility_tier === 'splurge';

  return (
    <div
      className={`glass-panel ${item.locked ? 'pulse-glow' : ''}`}
      style={{
        padding: '14px 16px',
        marginBottom: '12px',
        position: 'relative',
        borderColor: item.locked ? 'rgba(99, 102, 241, 0.5)' : isSplurge ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)',
        background: item.locked ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)'
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span className={`badge-category ${getCategoryBadgeClass(item.category)}`}>
            {item.category}
          </span>

          {isSplurge && (
            <span style={{
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              padding: '2px 6px',
              borderRadius: '6px',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Sparkles size={10} /> SPLURGE
            </span>
          )}

          {item.source_api && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              via {item.source_api}
            </span>
          )}
        </div>

        {/* Lock Toggle Button */}
        <button
          onClick={() => onToggleLock(item.id, !item.locked)}
          title={item.locked ? "Item is LOCKED. Solver will not touch it." : "Lock this item to prevent automatic budget swaps."}
          style={{
            background: item.locked ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${item.locked ? 'rgba(99, 102, 241, 0.6)' : 'var(--border-color)'}`,
            color: item.locked ? '#818cf8' : 'var(--text-muted)',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
        >
          {item.locked ? <Lock size={12} color="#818cf8" /> : <Unlock size={12} />}
          {item.locked ? 'LOCKED' : 'Lock'}
        </button>
      </div>

      {/* Item Title & Cost Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {item.title}
        </h4>
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f3f4f6' }}>
            ${item.total_cost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          {item.cost_per_person > 0 && item.total_cost !== item.cost_per_person && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              ${item.cost_per_person}/pp
            </div>
          )}
        </div>
      </div>

      {/* Location Badge */}
      {item.location_name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', fontSize: '0.75rem', color: '#38bdf8' }}>
          <MapPin size={12} color="#38bdf8" />
          <span style={{ fontWeight: 600 }}>{item.location_name}</span>
          {item.google_maps_url && (
            <a
              href={item.google_maps_url}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#38bdf8', textDecoration: 'underline', marginLeft: '4px', fontSize: '0.7rem' }}
            >
              (View Map <ExternalLink size={10} style={{ display: 'inline' }} />)
            </a>
          )}
        </div>
      )}

      {/* Description */}
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
        {item.description}
      </p>

      {/* Footer Tags & Alternatives Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {item.tags?.map((t, idx) => (
            <span key={idx} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.04)', padding: '2px 6px', borderRadius: '4px' }}>
              {t}
            </span>
          ))}
        </div>

        {item.alternatives && item.alternatives.length > 0 && (
          <button
            onClick={() => setShowAlts(!showAlts)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <span>{item.alternatives.length} Alternatives</span>
            <ChevronDown size={12} style={{ transform: showAlts ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        )}
      </div>

      {/* Alternatives Popover Drawer */}
      {showAlts && item.alternatives && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          fontSize: '0.75rem'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
            Available Solver Swaps:
          </div>
          {item.alternatives.map((alt) => (
            <div key={alt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <strong style={{ color: '#e5e7eb' }}>{alt.title}</strong>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{alt.description}</div>
              </div>
              <div style={{ fontWeight: 700, color: alt.total_cost < item.total_cost ? '#34d399' : 'var(--text-main)' }}>
                ${alt.total_cost}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
