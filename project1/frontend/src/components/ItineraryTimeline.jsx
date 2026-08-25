import React, { useState } from 'react';
import LineItemCard from './LineItemCard';
import { Calendar, Plane, Home, MapPin } from 'lucide-react';

export default function ItineraryTimeline({ items, durationDays, onToggleLock }) {
  const [activeDayTab, setActiveDayTab] = useState(0); // 0 = all / timeline view

  // Group items by day
  const preTripItems = items.filter(i => i.day === 0);
  const dayMap = {};
  for (let d = 1; d <= durationDays; d++) {
    dayMap[d] = items.filter(i => i.day === d);
  }

  return (
    <div>
      {/* Day Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveDayTab(0)}
          className={`btn ${activeDayTab === 0 ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        >
          All Days
        </button>

        <button
          onClick={() => setActiveDayTab(-1)}
          className={`btn ${activeDayTab === -1 ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        >
          ✈️ Flights & Hotel ({preTripItems.length})
        </button>

        {Array.from({ length: durationDays }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            onClick={() => setActiveDayTab(day)}
            className={`btn ${activeDayTab === day ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            Day {day} ({dayMap[day]?.length || 0})
          </button>
        ))}
      </div>

      {/* Render View */}
      {activeDayTab === 0 ? (
        /* Full Grid Timeline View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {/* Pre-Trip Column */}
          <div className="glass-panel" style={{ padding: '16px', background: 'rgba(17, 24, 39, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: '#818cf8' }}>
              <Plane size={18} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Pre-Trip & Lodging</h3>
            </div>
            {preTripItems.map((item) => (
              <LineItemCard key={item.id} item={item} onToggleLock={onToggleLock} />
            ))}
          </div>

          {/* Daily Schedule Columns */}
          {Array.from({ length: durationDays }, (_, i) => i + 1).map((day) => (
            <div key={day} className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}>
                  <Calendar size={18} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Day {day} Schedule</h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ${(dayMap[day] || []).reduce((acc, i) => acc + i.total_cost, 0).toFixed(0)} total
                </span>
              </div>

              {(dayMap[day] || []).map((item) => (
                <LineItemCard key={item.id} item={item} onToggleLock={onToggleLock} />
              ))}
            </div>
          ))}
        </div>
      ) : activeDayTab === -1 ? (
        /* Single Pre-Trip Tab View */
        <div>
          <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Pre-Trip Flights & Lodging Base</h3>
          {preTripItems.map((item) => (
            <LineItemCard key={item.id} item={item} onToggleLock={onToggleLock} />
          ))}
        </div>
      ) : (
        /* Single Day Tab View */
        <div>
          <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Day {activeDayTab} Itinerary</h3>
          {(dayMap[activeDayTab] || []).map((item) => (
            <LineItemCard key={item.id} item={item} onToggleLock={onToggleLock} />
          ))}
        </div>
      )}
    </div>
  );
}
