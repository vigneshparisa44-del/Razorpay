import React from 'react';
import { DollarSign, ShieldCheck, AlertTriangle, PieChart } from 'lucide-react';

export default function BudgetOverview({ tripState }) {
  if (!tripState) return null;

  const { constraints, items, category_caps } = tripState;
  const totalBudget = constraints.total_budget;

  // Calculate actual total spend per category
  const actuals = {
    flights: 0,
    lodging: 0,
    activities: 0,
    dining: 0,
    transit: 0
  };

  let totalSpend = 0;
  items.forEach(item => {
    if (actuals[item.category] !== undefined) {
      actuals[item.category] += item.total_cost;
    }
    totalSpend += item.total_cost;
  });

  const buffer = Math.max(0, totalBudget - totalSpend);
  const isOverBudget = totalSpend > totalBudget;
  const spendPct = Math.min(100, (totalSpend / totalBudget) * 100);

  const categories = [
    { key: 'flights', label: 'Flights', color: 'var(--cat-flights)', value: actuals.flights },
    { key: 'lodging', label: 'Lodging', color: 'var(--cat-lodging)', value: actuals.lodging },
    { key: 'activities', label: 'Activities', color: 'var(--cat-activities)', value: actuals.activities },
    { key: 'dining', label: 'Dining', color: 'var(--cat-dining)', value: actuals.dining },
    { key: 'transit', label: 'Transit', color: 'var(--cat-transit)', value: actuals.transit },
    { key: 'buffer', label: 'Safety Buffer', color: 'var(--cat-buffer)', value: buffer },
  ];

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PieChart size={20} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Budget & Category Allocation</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Allocated Spend</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isOverBudget ? 'var(--accent-rose)' : '#34d399' }}>
              ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}> / ${totalBudget.toLocaleString()}</span>
            </div>
          </div>

          <div style={{
            background: isOverBudget ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${isOverBudget ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            padding: '6px 12px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: isOverBudget ? 'var(--accent-rose)' : '#34d399'
          }}>
            {isOverBudget ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
            {isOverBudget ? `Over by $${(totalSpend - totalBudget).toFixed(0)}` : `$${buffer.toFixed(0)} Buffer`}
          </div>
        </div>
      </div>

      {/* Main Budget Progress Bar Stack */}
      <div style={{
        height: '14px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '7px',
        overflow: 'hidden',
        display: 'flex',
        marginBottom: '16px',
        border: '1px solid var(--border-color)'
      }}>
        {categories.map((cat) => {
          const pct = totalBudget > 0 ? (cat.value / totalBudget) * 100 : 0;
          if (pct <= 0) return null;
          return (
            <div
              key={cat.key}
              style={{
                width: `${pct}%`,
                background: cat.color,
                transition: 'width 0.4s ease'
              }}
              title={`${cat.label}: $${cat.value.toFixed(0)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Category Cost Breakdown Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        {categories.map((cat) => (
          <div
            key={cat.key}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 10px',
              borderLeft: `4px solid ${cat.color}`
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{cat.label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>
              ${cat.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
