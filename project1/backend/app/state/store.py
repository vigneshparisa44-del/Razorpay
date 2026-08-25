import json
import os
from typing import Dict, List, Optional, Tuple
from app.models.schemas import TripState, DiffResult

class StateStore:
    """
    Versioned Trip State Store.
    Stores and manages full version history of canonical JSON trip states per trip_id.
    """

    def __init__(self, storage_dir: str = "./backend_data"):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        # In-memory fast cache: trip_id -> list of TripState (ordered by version)
        self._history: Dict[str, List[TripState]] = {}
        self._diffs: Dict[str, Dict[Tuple[int, int], DiffResult]] = {}

    def save_state(self, state: TripState, diff: Optional[DiffResult] = None) -> None:
        trip_id = state.trip_id
        if trip_id not in self._history:
            self._history[trip_id] = []
            self._diffs[trip_id] = {}
        
        # Append state version
        self._history[trip_id].append(state)
        
        if diff:
            self._diffs[trip_id][(diff.from_version, diff.to_version)] = diff

        # Persist to disk
        self._persist_to_disk(trip_id)

    def get_latest_state(self, trip_id: str) -> Optional[TripState]:
        states = self._history.get(trip_id, [])
        if states:
            return states[-1]
        
        # Attempt to load from disk
        loaded = self._load_from_disk(trip_id)
        if loaded:
            self._history[trip_id] = loaded
            return loaded[-1]
        return None

    def get_state_version(self, trip_id: str, version: int) -> Optional[TripState]:
        states = self._history.get(trip_id, [])
        for st in states:
            if st.version == version:
                return st
        return None

    def get_version_history(self, trip_id: str) -> List[Dict]:
        states = self._history.get(trip_id, [])
        return [
            {
                "version": st.version,
                "change_reason": st.change_reason,
                "updated_at": st.updated_at,
                "total_budget": st.constraints.total_budget,
                "items_count": len(st.items)
            }
            for st in states
        ]

    def get_diff(self, trip_id: str, from_v: int, to_v: int) -> Optional[DiffResult]:
        diff_map = self._diffs.get(trip_id, {})
        return diff_map.get((from_v, to_v))

    def _persist_to_disk(self, trip_id: str) -> None:
        try:
            filepath = os.path.join(self.storage_dir, f"trip_{trip_id}.json")
            states = self._history.get(trip_id, [])
            data = [st.model_dump() for st in states]
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error persisting trip state: {e}")

    def _load_from_disk(self, trip_id: str) -> Optional[List[TripState]]:
        try:
            filepath = os.path.join(self.storage_dir, f"trip_{trip_id}.json")
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return [TripState(**item) for item in data]
        except Exception as e:
            print(f"Error loading trip state: {e}")
        return None

# Global store instance singleton
global_store = StateStore()
