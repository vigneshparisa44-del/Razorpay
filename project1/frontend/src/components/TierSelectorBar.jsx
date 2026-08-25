import React from 'react';
import { Sparkles, DollarSign, ShieldCheck, MapPin, Check } from 'lucide-react';

export default function TierSelectorBar({ activeTier, onSelectTier, budgetTotal, luxuryTotal }) {
  return (
    <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', background: 'rgba(17, 24, 39, 0.85)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Choose Your Trip Option</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            (Customers can switch between Smart Budget & Luxury Splurge options at any time)
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Option 1: Budget Option */}
        <div
          onClick={() => onSelectTier('budget')}
          style={{
            background: activeTier === 'budget' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
            border: `2px solid ${activeTier === 'budget' ? '#34d399' : 'var(--border-color)'}`,
            borderRadius: '12px',
            padding: '14px',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s'
          }}
        >
          {activeTier === 'budget' && (
            <span style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: '#34d399',
              color: '#0b0f19',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Check size={12} /> ACTIVE PLAN
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>
            🌿 OPTION A: SMART BUDGET PLAN
          </div>

          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: '6px 0 4px 0' }}>
            ${budgetTotal ? budgetTotal.toLocaleString() : '1,650'} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total ($825/pp)</span>
          </div>

          <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '16px', lineHeight: '1.5' }}>
            <li>Cozy 3-Star Central Boutique Stay in Baixa District</li>
            <li>Free self-guided audio walking tours & Scenic Miradouro lookouts</li>
            <li>Authentic local tascas & Time Out Market food hall</li>
            <li>Public train excursion to Sintra gardens</li>
          </ul>
        </div>

        {/* Option 2: Luxury Option */}
        <div
          onClick={() => onSelectTier('luxury')}
          style={{
            background: activeTier === 'luxury' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
            border: `2px solid ${activeTier === 'luxury' ? '#fbbf24' : 'var(--border-color)'}`,
            borderRadius: '12px',
            padding: '14px',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s'
          }}
        >
          {activeTier === 'luxury' && (
            <span style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: '#fbbf24',
              color: '#0b0f19',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Check size={12} /> ACTIVE PLAN
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
            ✨ OPTION B: LUXURY SPLURGE PLAN
          </div>

          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: '6px 0 4px 0' }}>
            ${luxuryTotal ? luxuryTotal.toLocaleString() : '3,800'} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total ($1,900/pp)</span>
          </div>

          <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '16px', lineHeight: '1.5' }}>
            <li>5-Star Penthouse Suite on Avenida da Liberdade</li>
            <li>Private Yacht Sunset Charter with free-flowing Champagne</li>
            <li>2-Michelin Star tasting extravaganza at Belcanto by Chef Avillez</li>
            <li>VIP Mercedes transfer for private Sintra palace tour</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
