import pytest
from app.models.schemas import (
    CreateTripRequest, ShockPayload, ShockType, CategoryEnum, FlexibilityTier
)
from app.solver.constraint_solver import ConstraintSolver
from app.services.data_fetcher import DataFetcher
from app.services.llm_agent import LLMAgentService

def test_initial_trip_creation():
    req = CreateTripRequest(
        destination="Lisbon",
        duration_days=5,
        group_size=2,
        total_budget=2500.0,
        tier="mid-range",
        preferences=["one splurge dinner"]
    )
    items = DataFetcher.generate_grounded_itinerary(
        ConstraintSolver.update_category_caps.__annotations__['state'] if False else 
        pytest.importorskip("app.models.schemas").ConstraintSpec(
            destination=req.destination,
            duration_days=req.duration_days,
            group_size=req.group_size,
            total_budget=req.total_budget
        )
    )
    total_cost, _ = ConstraintSolver.calculate_totals(items)
    assert total_cost <= 2500.0
    assert len(items) > 0

def test_hotel_20_percent_shock_solve():
    # Setup initial trip state
    spec = pytest.importorskip("app.models.schemas").ConstraintSpec(
        destination="Lisbon",
        duration_days=5,
        group_size=2,
        total_budget=2500.0
    )
    items = DataFetcher.generate_grounded_itinerary(spec)
    
    state_v1 = pytest.importorskip("app.models.schemas").TripState(
        trip_id="test_001",
        version=1,
        constraints=spec,
        category_caps=pytest.importorskip("app.models.schemas").CategoryCaps(),
        items=items,
        change_reason="Initial"
    )
    state_v1.category_caps = ConstraintSolver.update_category_caps(state_v1)
    
    old_total, _ = ConstraintSolver.calculate_totals(state_v1.items)

    # Apply Hotel +20% shock
    shock = ShockPayload(
        shock_type=ShockType.CATEGORY_PRICE_SPIKE,
        category=CategoryEnum.LODGING,
        percentage_change=20.0
    )

    state_v2, diff = ConstraintSolver.apply_shock_and_solve(state_v1, shock)
    new_total, _ = ConstraintSolver.calculate_totals(state_v2.items)

    # Assertions
    assert state_v2.version == 2
    assert new_total <= 2500.0  # Budget satisfied!
    assert diff.from_version == 1
    assert diff.to_version == 2
    assert len(diff.swapped_items) > 0  # Items were swapped to absorb lodging increase
    
    # Check that locked flight items were NOT modified
    flight_item = [i for i in state_v2.items if i.category == CategoryEnum.FLIGHTS][0]
    assert flight_item.locked is True

def test_locked_item_protection():
    spec = pytest.importorskip("app.models.schemas").ConstraintSpec(
        destination="Lisbon",
        duration_days=5,
        group_size=2,
        total_budget=2500.0
    )
    items = DataFetcher.generate_grounded_itinerary(spec)
    
    # Lock Sintra activity
    for i in items:
        if "Sintra" in i.title:
            i.locked = True

    state_v1 = pytest.importorskip("app.models.schemas").TripState(
        trip_id="test_002",
        version=1,
        constraints=spec,
        category_caps=pytest.importorskip("app.models.schemas").CategoryCaps(),
        items=items,
        change_reason="Initial"
    )

    shock = ShockPayload(
        shock_type=ShockType.CATEGORY_PRICE_SPIKE,
        category=CategoryEnum.LODGING,
        percentage_change=30.0
    )

    state_v2, diff = ConstraintSolver.apply_shock_and_solve(state_v1, shock)

    # Verify locked Sintra activity survived untouched
    sintra_item = [i for i in state_v2.items if "Sintra" in i.title or "Sintra" in i.description][0]
    assert sintra_item.locked is True
    assert "Sintra" in sintra_item.title

def test_intent_parsing():
    parsed = LLMAgentService.parse_user_intent("Hotel went up 20%")
    assert parsed["action"] == "APPLY_SHOCK"
    assert parsed["shock"].category == CategoryEnum.LODGING
    assert parsed["shock"].percentage_change == 20.0

    parsed_b = LLMAgentService.parse_user_intent("Lower total budget to $2100")
    assert parsed_b["action"] == "APPLY_SHOCK"
    assert parsed_b["shock"].new_total_budget == 2100.0
