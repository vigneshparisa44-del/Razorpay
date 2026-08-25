const API_BASE = "http://localhost:8000/api";

export async function createTrip(data) {
  const res = await fetch(`${API_BASE}/trip/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create trip state");
  return res.json();
}

export async function compareTiers(destination = "Lisbon, Portugal", durationDays = 5, groupSize = 2) {
  const url = `${API_BASE}/trip/compare-tiers?destination=${encodeURIComponent(destination)}&duration_days=${durationDays}&group_size=${groupSize}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error("Failed to generate tier options");
  return res.json();
}

export async function getTripState(tripId, version = null) {
  const url = version 
    ? `${API_BASE}/trip/${tripId}?version=${version}` 
    : `${API_BASE}/trip/${tripId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch trip state");
  return res.json();
}

export async function applyShock(tripId, shockPayload) {
  const res = await fetch(`${API_BASE}/trip/${tripId}/shock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(shockPayload),
  });
  if (!res.ok) throw new Error("Failed to apply shock");
  return res.json();
}

export async function toggleLock(tripId, itemId, locked) {
  const res = await fetch(`${API_BASE}/trip/${tripId}/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_id: itemId, locked }),
  });
  if (!res.ok) throw new Error("Failed to toggle lock");
  return res.json();
}

export async function sendChatMessage(tripId, message) {
  const res = await fetch(`${API_BASE}/trip/${tripId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Failed to send chat message");
  return res.json();
}

export async function getVersionHistory(tripId) {
  const res = await fetch(`${API_BASE}/trip/${tripId}/versions`);
  if (!res.ok) throw new Error("Failed to fetch version history");
  return res.json();
}

export async function getDiff(tripId, fromVersion, toVersion) {
  const res = await fetch(`${API_BASE}/trip/${tripId}/diff/${fromVersion}/${toVersion}`);
  if (!res.ok) throw new Error("Failed to fetch diff");
  return res.json();
}
