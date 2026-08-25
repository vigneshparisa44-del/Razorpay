from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from enum import Enum
import time

class CategoryEnum(str, Enum):
    FLIGHTS = "flights"
    LODGING = "lodging"
    ACTIVITIES = "activities"
    DINING = "dining"
    TRANSIT = "transit"
    BUFFER = "buffer"

class FlexibilityTier(str, Enum):
    HARD = "hard"              # E.g. Flight dates, essential lodging
    SPLURGE = "splurge"          # Priority item tagged for experience (e.g. #splurge dinner)
    STANDARD = "standard"        # Normal line item, swappable if necessary
    FLEXIBLE = "flexible"        # Highly flexible line item, top priority to degrade/swap
    FREE_ALT = "free_alt"        # Free alternative available (walking tour, miradouro)

class ItemAlternative(BaseModel):
    id: str
    title: str
    description: str
    cost_per_person: float
    total_cost: float
    category: CategoryEnum
    flexibility_tier: FlexibilityTier
    booking_url: Optional[str] = None
    rating: Optional[float] = 4.5

class LineItem(BaseModel):
    id: str
    day: int                     # Day number (0 for pre-trip flights/lodging)
    category: CategoryEnum
    title: str
    description: str
    cost_per_person: float
    total_cost: float
    locked: bool = False         # User-confirmed non-touchable item
    swappable: bool = True
    flexibility_tier: FlexibilityTier = FlexibilityTier.STANDARD
    tags: List[str] = []         # E.g. ["#splurge", "#culture", "#must_see"]
    location: Optional[str] = None
    location_name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    google_maps_url: Optional[str] = None
    photo_url: Optional[str] = None
    time_slot: Optional[str] = None
    source_api: Optional[str] = "Mock/Grounding API"
    booking_url: Optional[str] = None
    alternatives: List[ItemAlternative] = []

class ConstraintSpec(BaseModel):
    destination: str
    start_date: str = "2026-09-01"
    end_date: str = "2026-09-05"
    duration_days: int = 5
    group_size: int = 2
    total_budget: float = 2500.0
    currency: str = "USD"
    tier: str = "mid-range"      # budget, mid-range, luxury
    preferences: List[str] = ["one splurge dinner", "culture", "walkable"]

class CategoryCaps(BaseModel):
    flights: float = 700.0
    lodging: float = 800.0
    activities: float = 400.0
    dining: float = 500.0
    transit: float = 50.0
    buffer: float = 50.0

class TripState(BaseModel):
    trip_id: str
    version: int = 1
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    constraints: ConstraintSpec
    category_caps: CategoryCaps
    items: List[LineItem] = []
    change_reason: str = "Initial trip generation"

class TierCompareResponse(BaseModel):
    destination: str
    duration_days: int
    group_size: int
    budget_option: TripState
    luxury_option: TripState

class CategoryDelta(BaseModel):
    category: CategoryEnum
    old_amount: float
    new_amount: float
    delta: float

class SwappedItemSummary(BaseModel):
    item_id: str
    day: int
    category: CategoryEnum
    old_title: str
    old_cost: float
    new_title: str
    new_cost: float
    savings: float
    reason: str

class DiffResult(BaseModel):
    from_version: int
    to_version: int
    change_reason: str
    total_budget: float
    old_total_cost: float
    new_total_cost: float
    budget_delta: float
    category_deltas: List[CategoryDelta]
    swapped_items: List[SwappedItemSummary]
    added_items: List[LineItem] = []
    removed_items: List[LineItem] = []
    explanation: str

class ShockType(str, Enum):
    CATEGORY_PRICE_SPIKE = "category_price_spike"
    LINE_ITEM_PRICE_CHANGE = "line_item_price_change"
    TOTAL_BUDGET_CHANGE = "total_budget_change"
    GROUP_SIZE_CHANGE = "group_size_change"
    SWAP_PREFERENCE = "swap_preference"

class ShockPayload(BaseModel):
    shock_type: ShockType
    category: Optional[CategoryEnum] = None
    percentage_change: Optional[float] = None
    item_id: Optional[str] = None
    new_cost: Optional[float] = None
    new_total_budget: Optional[float] = None
    new_group_size: Optional[int] = None
    custom_instruction: Optional[str] = None

class CreateTripRequest(BaseModel):
    destination: str
    duration_days: int = 5
    group_size: int = 2
    total_budget: float = 2500.0
    tier: str = "mid-range"
    preferences: List[str] = ["one splurge dinner"]

class LockItemRequest(BaseModel):
    item_id: str
    locked: bool

class ChatMessageRequest(BaseModel):
    message: str
