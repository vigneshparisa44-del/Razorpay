import React, { useState } from 'react';
import { Compass, X, MapPin, Calendar, Users, DollarSign, Sparkles } from 'lucide-react';

export default function DestinationSelectorModal({ isOpen, onClose, onSubmitDestination }) {
  const [destination, setDestination] = useState('Tokyo, Japan');
  const [durationDays, setDurationDays] = useState(5);
  const [groupSize, setGroupSize] = useState(2);
  const [budget, setBudget] = useState(2500);

  const popularDestinations = [
    { label: '🗼 Paris, France', name: 'Paris, France', budget: 2800 },
    { label: '🏯 Tokyo, Japan', name: 'Tokyo, Japan', budget: 2600 },
    { label: '🗽 New York, USA', name: 'New York, USA', budget: 3200 },
    { label: '🍷 Lisbon, Portugal', name: 'Lisbon, Portugal', budget: 2200 },
    { label: '🏛️ Rome, Italy', name: 'Rome, Italy', budget: 2400 },
    { label: '🏖️ Bali, Indonesia', name: 'Bali, Indonesia', budget: 1800 }
  ];

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!destination.trim()) return;
    onSubmitDestination({
      destination: destination.trim(),
      duration_days: Number(durationDays),
      group_size: Number(groupSize),
      total_budget: Number(budget)
    });
    onClose();
  };

  const handleSelectPopular = (item) => {
    setDestination(item.name);
    setBudget(item.budget);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '550px',
        width: '100%',
        padding: '24px',
        background: '#111827',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        borderRadius: '20px'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }} className="gradient-text">
              Select Trip Destination & Constraints
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Popular Destination Quick Chips */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Popular Worldwide Destinations:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {popularDestinations.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPopular(p)}
                style={{
                  background: destination === p.name ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${destination === p.name ? '#818cf8' : 'var(--border-color)'}`,
                  color: destination === p.name ? '#818cf8' : 'var(--text-main)',
                  padding: '5px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Custom Inputs Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
              <MapPin size={14} color="#38bdf8" /> Destination City / Region:
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Tokyo, Japan or Paris, France..."
              required
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: '#fff',
                padding: '10px 12px',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                <Calendar size={12} color="#818cf8" /> Days:
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '8px',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                <Users size={12} color="#34d399" /> Travelers:
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '8px',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                <DollarSign size={12} color="#fbbf24" /> Total Budget:
              </label>
              <input
                type="number"
                min="500"
                step="100"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '8px',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Sparkles size={14} /> Generate Location Engine State
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
