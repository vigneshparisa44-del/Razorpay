import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BudgetOverview from './components/BudgetOverview';
import TierSelectorBar from './components/TierSelectorBar';
import ItineraryTimeline from './components/ItineraryTimeline';
import ShockPanel from './components/ShockPanel';
import ChatPane from './components/ChatPane';
import DiffModal from './components/DiffModal';

import DestinationSelectorModal from './components/DestinationSelectorModal';

import {
  createTrip,
  compareTiers,
  getTripState,
  applyShock,
  toggleLock,
  sendChatMessage,
  getVersionHistory
} from './services/api';

export default function App() {
  const [tripState, setTripState] = useState(null);
  const [tierOptions, setTierOptions] = useState(null); // { budget_option, luxury_option }
  const [activeTier, setActiveTier] = useState('budget');
  const [versionHistory, setVersionHistory] = useState([]);
  const [activeDiff, setActiveDiff] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);

  // Initial setup: generate Lisbon dual tier options (Budget vs Luxury)
  useEffect(() => {
    initDefaultTrip();
  }, []);

  const initDefaultTrip = async () => {
    try {
      setIsThinking(true);
      setErrorMsg(null);
      
      const tiers = await compareTiers("Lisbon, Portugal", 5, 2);
      setTierOptions(tiers);
      
      // Default to Budget option
      const initialPlan = tiers.budget_option;
      setTripState(initialPlan);
      setActiveTier('budget');
      await refreshHistory(initialPlan.trip_id);

      setChatMessages([
        {
          sender: 'agent',
          text: `Welcome to Lisbon! I've prepared two distinct customer options:\n\n` +
                `🌿 **Option A: Smart Budget Plan ($1,650)** - Cozy 3-star stay, self-guided miradouro viewpoints, local tascas & train excursion to Sintra.\n` +
                `✨ **Option B: Luxury Splurge Plan ($3,800)** - 5-star penthouse suite, private yacht sunset charter, and 2-Michelin Star tasting at Belcanto.\n\n` +
                `Select an option above to load its live constraint system, or test a price shock (e.g. *"Hotel went up 20%"*)!`
        }
      ]);
    } catch (err) {
      setErrorMsg("Backend connection error. Please ensure FastAPI server is running on http://localhost:8000");
    } finally {
      setIsThinking(false);
    }
  };

  const refreshHistory = async (tripId) => {
    try {
      const history = await getVersionHistory(tripId);
      setVersionHistory(history);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTier = (tierKey) => {
    if (!tierOptions) return;
    setActiveTier(tierKey);
    const selectedState = tierKey === 'luxury' ? tierOptions.luxury_option : tierOptions.budget_option;
    setTripState(selectedState);
    refreshHistory(selectedState.trip_id);

    setChatMessages(prev => [
      ...prev,
      {
        sender: 'agent',
        text: `Switched active plan to **${tierKey === 'luxury' ? '✨ Luxury Splurge ($3,800)' : '🌿 Smart Budget ($1,650)'}**. All line item locations, category caps, and live constraints have been updated!`
      }
    ]);
  };

  const handleApplyShock = async (shockPayload) => {
    if (!tripState) return;
    try {
      setIsThinking(true);
      setErrorMsg(null);
      const res = await applyShock(tripState.trip_id, shockPayload);
      setTripState(res.trip_state);
      setActiveDiff(res.diff);
      await refreshHistory(tripState.trip_id);

      setChatMessages(prev => [
        ...prev,
        { sender: 'user', text: `Triggered Shock: ${shockPayload.shock_type}` },
        { sender: 'agent', text: res.diff.explanation }
      ]);
    } catch (err) {
      setErrorMsg("Failed to apply constraint shock.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleToggleLock = async (itemId, locked) => {
    if (!tripState) return;
    try {
      setErrorMsg(null);
      const updatedState = await toggleLock(tripState.trip_id, itemId, locked);
      setTripState(updatedState);
      const targetItem = updatedState.items.find(i => i.id === itemId);
      const statusText = locked ? "locked 🔒" : "unlocked 🔓";
      
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: `Line item **"${targetItem?.title}"** is now **${statusText}**. The solver will ${locked ? 'protect' : 'allow'} this item during budget rebalances.`
        }
      ]);
    } catch (err) {
      setErrorMsg("Failed to update lock state.");
    }
  };

  const handleSendMessage = async (text) => {
    if (!tripState) return;
    try {
      setIsThinking(true);
      setErrorMsg(null);

      setChatMessages(prev => [...prev, { sender: 'user', text }]);

      const res = await sendChatMessage(tripState.trip_id, text);
      if (res.trip_state) {
        setTripState(res.trip_state);
        await refreshHistory(res.trip_state.trip_id);
      }
      if (res.diff) {
        setActiveDiff(res.diff);
      }

      setChatMessages(prev => [...prev, { sender: 'agent', text: res.response }]);
    } catch (err) {
      setErrorMsg("Failed to process message.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleSelectVersion = async (version) => {
    if (!tripState) return;
    try {
      setIsThinking(true);
      const state = await getTripState(tripState.trip_id, version);
      setTripState(state);
    } catch (err) {
      setErrorMsg("Failed to fetch version state.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleCustomDestinationSubmit = async (customParams) => {
    try {
      setIsThinking(true);
      setErrorMsg(null);

      const tiers = await compareTiers(
        customParams.destination,
        customParams.duration_days,
        customParams.group_size
      );

      setTierOptions(tiers);
      const initialPlan = tiers.budget_option;
      setTripState(initialPlan);
      setActiveTier('budget');
      await refreshHistory(initialPlan.trip_id);

      setChatMessages([
        {
          sender: 'agent',
          text: `Generated custom itinerary state for **${customParams.destination}** (${customParams.duration_days} Days, ${customParams.group_size} Travelers)!\n\n` +
                `🌿 **Option A: Smart Budget Plan ($${tiers.budget_option.constraints.total_budget.toLocaleString()})**\n` +
                `✨ **Option B: Luxury Splurge Plan ($${tiers.luxury_option.constraints.total_budget.toLocaleString()})**\n\n` +
                `Select an option above or trigger a live cost shock to see the live constraint solver in action!`
        }
      ]);
    } catch (err) {
      setErrorMsg("Failed to generate destination itinerary.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '20px' }}>
      
      {/* Top Header */}
      <Header
        tripState={tripState}
        versionHistory={versionHistory}
        onSelectVersion={handleSelectVersion}
        onNewTrip={() => setIsDestModalOpen(true)}
      />

      {/* Destination Selection Modal */}
      <DestinationSelectorModal
        isOpen={isDestModalOpen}
        onClose={() => setIsDestModalOpen(false)}
        onSubmitDestination={handleCustomDestinationSubmit}
      />

      {errorMsg && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          color: '#f43f5e',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontWeight: 600,
          fontSize: '0.85rem'
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Dual Option Tier Selector Bar */}
      <TierSelectorBar
        activeTier={activeTier}
        onSelectTier={handleSelectTier}
        budgetTotal={tierOptions?.budget_option?.constraints?.total_budget || 1650}
        luxuryTotal={tierOptions?.luxury_option?.constraints?.total_budget || 3800}
      />

      {tripState && (
        <>
          {/* Live Budget & Category Bar */}
          <BudgetOverview tripState={tripState} />

          {/* Main 2-Column Split Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>
            
            {/* Left Column: Shock Controls & Agent Chat */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <ShockPanel onApplyShock={handleApplyShock} />
              <ChatPane
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isThinking={isThinking}
              />
            </div>

            {/* Right Column: Dynamic Itinerary Grid */}
            <div>
              <ItineraryTimeline
                items={tripState.items}
                durationDays={tripState.constraints.duration_days}
                onToggleLock={handleToggleLock}
              />
            </div>

          </div>
        </>
      )}

      {/* Visual Diff Modal on State Rebalance */}
      <DiffModal
        diff={activeDiff}
        onClose={() => setActiveDiff(null)}
      />

    </div>
  );
}
