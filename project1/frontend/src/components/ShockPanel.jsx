import React, { useState } from 'react';
import { Zap, AlertTriangle, ArrowDown, ArrowUp, Users, DollarSign } from 'lucide-react';

export default function ShockPanel({ onApplyShock }) {
  const [customPct, setCustomPct] = useState('20');
  const [customCategory, setCustomCategory] = useState('lodging');

  const presetShocks = [
    {
      label: '⚡ Hotel +20%',
      type: 'category_price_spike',
      payload: { shock_type: 'category_price_spike', category: 'lodging', percentage_change: 20 },
      color: '#fbbf24'
    },
    {
      label: '⚡ Budget -$300',
      type: 'total_budget_change',
      payload: { shock_type: 'total_budget_change', new_total_budget: 2200 },
      color: '#f43f5e'
    },
    {
      label: '⚡ Flight +$150',
      type: 'category_price_spike',
      payload: { shock_type: 'category_price_spike', category: 'flights', percentage_change: 15 },
      color: '#60a5fa'
    },
    {
      label: '⚡ Add 1 Traveler (Group=3)',
      type: 'group_size_change',
      payload: { shock_type: 'group_size_change', new_group_size: 3 },
      color: '#34d399'
    }
  ];

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    onApplyShock({
      shock_type: 'category_price_spike',
      category: customCategory,
      percentage_change: parseFloat(customPct) || 10
    });
  };

  return (
    <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <Zap size={18} color="#fbbf24" />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Live Constraint Shock Controls</h3>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Trigger real-time price spikes & constraint shifts to observe the deterministic solver re-balancing category spend & line items.
      </p>

      {/* Preset Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {presetShocks.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onApplyShock(s.payload)}
            className="btn btn-shock"
            style={{ justifyContent: 'center', borderColor: s.color, color: s.color }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Custom Price Spike Slider / Form */}
      <form onSubmit={handleCustomSubmit} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
          Custom Category Price Shock:
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <select
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.75rem'
            }}
          >
            <option value="lodging">Lodging</option>
            <option value="flights">Flights</option>
            <option value="activities">Activities</option>
            <option value="dining">Dining</option>
          </select>

          <input
            type="number"
            value={customPct}
            onChange={(e) => setCustomPct(e.target.value)}
            placeholder="%"
            style={{
              width: '60px',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.75rem'
            }}
          />

          <button type="submit" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
            Apply %
          </button>
        </div>
      </form>
    </div>
  );
}
