import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional

from app.models.schemas import (
    TripState, ConstraintSpec, CategoryCaps, LineItem,
    CreateTripRequest, ShockPayload, LockItemRequest, ChatMessageRequest,
    DiffResult, TierCompareResponse
)
from app.solver.constraint_solver import ConstraintSolver
from app.services.data_fetcher import DataFetcher
from app.services.llm_agent import LLMAgentService
from app.state.store import global_store

app = FastAPI(
    title="Dynamic Constraint-Aware Itinerary Engine API",
    description="Backend engine treating itineraries as live, versioned constraint systems.",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Dynamic Constraint-Aware Itinerary Engine API is active"}

@app.post("/api/trip/create", response_model=TripState)
def create_trip(req: CreateTripRequest):
    trip_id = str(uuid.uuid4())[:8]
    
    constraints = ConstraintSpec(
        destination=req.destination,
        duration_days=req.duration_days,
        group_size=req.group_size,
        total_budget=req.total_budget,
        tier=req.tier,
        preferences=req.preferences
    )

    # 1. Fetch grounded items from data layer
    grounded_items = DataFetcher.generate_grounded_itinerary(constraints)

    # 2. Build initial TripState
    initial_state = TripState(
        trip_id=trip_id,
        version=1,
        constraints=constraints,
        category_caps=CategoryCaps(),
        items=grounded_items,
        change_reason=f"Initial trip generated for {req.destination} (${req.total_budget:,.0f}, {req.duration_days} days, {req.group_size} travelers)"
    )

    # 3. Balance initial spend against total budget
    total_cost, _ = ConstraintSolver.calculate_totals(initial_state.items)
    if total_cost > constraints.total_budget:
        deficit = total_cost - constraints.total_budget
        ConstraintSolver._absorb_deficit_with_swaps(initial_state, deficit)

    # 4. Calculate category caps
    initial_state.category_caps = ConstraintSolver.update_category_caps(initial_state)

    # 5. Save to versioned store
    global_store.save_state(initial_state)

    return initial_state

@app.post("/api/trip/compare-tiers", response_model=TierCompareResponse)
def compare_tiers(destination: str = "Lisbon, Portugal", duration_days: int = 5, group_size: int = 2):
    # 1. Generate Budget Option ($1,650)
    budget_req = CreateTripRequest(
        destination=destination,
        duration_days=duration_days,
        group_size=group_size,
        total_budget=1650.0,
        tier="budget",
        preferences=["value smart", "free walking tours", "local tascas"]
    )
    budget_state = create_trip(budget_req)

    # 2. Generate Luxury Option ($3,800)
    luxury_req = CreateTripRequest(
        destination=destination,
        duration_days=duration_days,
        group_size=group_size,
        total_budget=3800.0,
        tier="luxury",
        preferences=["5-star hotel", "private yacht sunset", "michelin dining"]
    )
    luxury_state = create_trip(luxury_req)

    return TierCompareResponse(
        destination=destination,
        duration_days=duration_days,
        group_size=group_size,
        budget_option=budget_state,
        luxury_option=luxury_state
    )

@app.get("/api/trip/{trip_id}", response_model=TripState)
def get_trip(trip_id: str, version: Optional[int] = None):
    if version:
        state = global_store.get_state_version(trip_id, version)
    else:
        state = global_store.get_latest_state(trip_id)
        
    if not state:
        raise HTTPException(status_code=404, detail="Trip state not found")
    return state

@app.post("/api/trip/{trip_id}/shock")
def apply_shock(trip_id: str, shock: ShockPayload):
    current_state = global_store.get_latest_state(trip_id)
    if not current_state:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Run deterministic solver to rebalance budget and execute knapsack swaps
    new_state, diff = ConstraintSolver.apply_shock_and_solve(current_state, shock)

    # Save new version to state store
    global_store.save_state(new_state, diff)

    return {
        "trip_state": new_state,
        "diff": diff
    }

@app.post("/api/trip/{trip_id}/lock")
def toggle_lock(trip_id: str, req: LockItemRequest):
    current_state = global_store.get_latest_state(trip_id)
    if not current_state:
        raise HTTPException(status_code=404, detail="Trip not found")

    found = False
    for item in current_state.items:
        if item.id == req.item_id:
            item.locked = req.locked
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Item not found")

    # Persist updated lock state
    global_store.save_state(current_state)
    return current_state

@app.post("/api/trip/{trip_id}/chat")
def chat_interaction(trip_id: str, req: ChatMessageRequest):
    current_state = global_store.get_latest_state(trip_id)
    if not current_state:
        raise HTTPException(status_code=404, detail="Trip not found")

    # NLU intent parsing
    intent = LLMAgentService.parse_user_intent(req.message, current_state)

    if intent["action"] == "APPLY_SHOCK":
        shock = intent["shock"]
        new_state, diff = ConstraintSolver.apply_shock_and_solve(current_state, shock)
        global_store.save_state(new_state, diff)
        return {
            "response": diff.explanation,
            "trip_state": new_state,
            "diff": diff,
            "action_taken": "APPLY_SHOCK"
        }

    elif intent["action"] == "TOGGLE_LOCK":
        item_id = intent["item_id"]
        locked = intent["locked"]
        for item in current_state.items:
            if item.id == item_id:
                item.locked = locked
                status_str = "locked 🔒" if locked else "unlocked 🔓"
                msg = f"Item '{item.title}' is now {status_str}. The engine will protect this item from automatic budget swaps."
                global_store.save_state(current_state)
                return {
                    "response": msg,
                    "trip_state": current_state,
                    "diff": None,
                    "action_taken": "TOGGLE_LOCK"
                }

    # Default general chat response
    total_cost, _ = ConstraintSolver.calculate_totals(current_state.items)
    rem = current_state.constraints.total_budget - total_cost
    msg = (
        f"I've analyzed your trip to {current_state.constraints.destination}. "
        f"Your current spend is **${total_cost:,.0f}** out of **${current_state.constraints.total_budget:,.0f}** "
        f"(${rem:,.0f} buffer remaining across {len(current_state.items)} line items). "
        f"You can tell me things like: *'Hotel went up 20%'*, *'Reduce budget by $300'*, or *'Lock Sintra day'*"
    )
    return {
        "response": msg,
        "trip_state": current_state,
        "diff": None,
        "action_taken": "GENERAL_QUERY"
    }

@app.get("/api/trip/{trip_id}/versions")
def get_versions(trip_id: str):
    history = global_store.get_version_history(trip_id)
    if not history:
        raise HTTPException(status_code=404, detail="No history found")
    return history

@app.get("/api/trip/{trip_id}/diff/{from_v}/{to_v}")
def get_diff(trip_id: str, from_v: int, to_v: int):
    diff = global_store.get_diff(trip_id, from_v, to_v)
    if not diff:
        st_from = global_store.get_state_version(trip_id, from_v)
        st_to = global_store.get_state_version(trip_id, to_v)
        if st_from and st_to:
            # Recompute diff dynamically
            dummy_shock = ShockPayload(shock_type="custom", custom_instruction=st_to.change_reason)
            _, diff = ConstraintSolver.apply_shock_and_solve(st_from, dummy_shock)
            diff.to_version = to_v
            return diff
        raise HTTPException(status_code=404, detail="Diff not available")
    return diff
