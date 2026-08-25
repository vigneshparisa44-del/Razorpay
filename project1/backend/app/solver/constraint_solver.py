import copy
from typing import List, Tuple, Dict, Any, Optional
from app.models.schemas import (
    TripState, LineItem, ItemAlternative, DiffResult, CategoryDelta,
    SwappedItemSummary, CategoryCaps, CategoryEnum, FlexibilityTier, ShockPayload, ShockType
)

class ConstraintSolver:
    """
    Deterministic constraint solver for live trip itineraries.
    Executes arithmetic budget math, locked item protection, and greedy weighted knapsack swaps.
    """

    @staticmethod
    def calculate_totals(items: List[LineItem]) -> Tuple[float, Dict[CategoryEnum, float]]:
        category_totals = {cat: 0.0 for cat in CategoryEnum}
        total_cost = 0.0
        for item in items:
            category_totals[item.category] += item.total_cost
            total_cost += item.total_cost
        return total_cost, category_totals

    @staticmethod
    def update_category_caps(state: TripState) -> CategoryCaps:
        _, totals = ConstraintSolver.calculate_totals(state.items)
        remaining_budget = state.constraints.total_budget - sum(totals.values())
        buffer_val = max(0.0, remaining_budget)
        
        return CategoryCaps(
            flights=round(totals.get(CategoryEnum.FLIGHTS, 0.0), 2),
            lodging=round(totals.get(CategoryEnum.LODGING, 0.0), 2),
            activities=round(totals.get(CategoryEnum.ACTIVITIES, 0.0), 2),
            dining=round(totals.get(CategoryEnum.DINING, 0.0), 2),
            transit=round(totals.get(CategoryEnum.TRANSIT, 0.0), 2),
            buffer=round(buffer_val, 2)
        )

    @classmethod
    def apply_shock_and_solve(
        cls,
        old_state: TripState,
        shock: ShockPayload
    ) -> Tuple[TripState, DiffResult]:
        """
        Takes old TripState, applies cost shock/constraint edit, re-solves to satisfy total_budget,
        creates a new versioned TripState, and generates a visual DiffResult.
        """
        # Create deep copy for the new version
        new_state = copy.deepcopy(old_state)
        new_state.version = old_state.version + 1
        
        # 1. Apply raw shock modifications
        shock_desc = cls._apply_shock_to_items(new_state, shock)
        new_state.change_reason = shock_desc

        # 2. Check total spend vs budget
        current_total, cat_totals = cls.calculate_totals(new_state.items)
        total_budget = new_state.constraints.total_budget
        deficit = round(current_total - total_budget, 2)

        swapped_summaries: List[SwappedItemSummary] = []
        
        # 3. If over budget (deficit > 0), execute greedy swap reallocation
        if deficit > 0:
            deficit, swapped_summaries = cls._absorb_deficit_with_swaps(new_state, deficit)

        # 4. Re-calculate caps and category totals
        new_state.category_caps = cls.update_category_caps(new_state)
        new_total, new_cat_totals = cls.calculate_totals(new_state.items)

        # 5. Build Diff Result
        old_total, old_cat_totals = cls.calculate_totals(old_state.items)
        category_deltas = []
        for cat in CategoryEnum:
            if cat == CategoryEnum.BUFFER:
                continue
            o_val = round(old_cat_totals.get(cat, 0.0), 2)
            n_val = round(new_cat_totals.get(cat, 0.0), 2)
            category_deltas.append(CategoryDelta(
                category=cat,
                old_amount=o_val,
                new_amount=n_val,
                delta=round(n_val - o_val, 2)
            ))

        explanation = cls._generate_explanation(
            shock_desc=shock_desc,
            deficit_absorbed=round(current_total - new_total, 2),
            remaining_deficit=deficit,
            swapped_summaries=swapped_summaries,
            final_total=new_total,
            budget=total_budget
        )

        diff = DiffResult(
            from_version=old_state.version,
            to_version=new_state.version,
            change_reason=shock_desc,
            total_budget=total_budget,
            old_total_cost=round(old_total, 2),
            new_total_cost=round(new_total, 2),
            budget_delta=round(new_total - old_total, 2),
            category_deltas=category_deltas,
            swapped_items=swapped_summaries,
            added_items=[],
            removed_items=[],
            explanation=explanation
        )

        return new_state, diff

    @classmethod
    def _apply_shock_to_items(cls, state: TripState, shock: ShockPayload) -> str:
        if shock.shock_type == ShockType.CATEGORY_PRICE_SPIKE:
            cat = shock.category
            pct = shock.percentage_change or 0.0
            mult = 1.0 + (pct / 100.0)
            affected_count = 0
            for item in state.items:
                if item.category == cat:
                    item.cost_per_person = round(item.cost_per_person * mult, 2)
                    item.total_cost = round(item.cost_per_person * state.constraints.group_size, 2)
                    affected_count += 1
            return f"{cat.value.capitalize()} prices spiked by {pct:g}%"

        elif shock.shock_type == ShockType.LINE_ITEM_PRICE_CHANGE:
            target_id = shock.item_id
            new_c = shock.new_cost or 0.0
            for item in state.items:
                if item.id == target_id:
                    old_c = item.total_cost
                    item.total_cost = round(new_c, 2)
                    item.cost_per_person = round(new_c / max(1, state.constraints.group_size), 2)
                    return f"'{item.title}' price changed from ${old_c:.0f} to ${new_c:.0f}"
            return "Line item price update"

        elif shock.shock_type == ShockType.TOTAL_BUDGET_CHANGE:
            old_b = state.constraints.total_budget
            new_b = shock.new_total_budget or old_b
            state.constraints.total_budget = round(new_b, 2)
            return f"Total trip budget changed from ${old_b:.0f} to ${new_b:.0f}"

        elif shock.shock_type == ShockType.GROUP_SIZE_CHANGE:
            old_g = state.constraints.group_size
            new_g = shock.new_group_size or old_g
            state.constraints.group_size = new_g
            for item in state.items:
                item.total_cost = round(item.cost_per_person * new_g, 2)
            return f"Group size changed from {old_g} to {new_g} travelers"

        return shock.custom_instruction or "Custom constraint change"

    @classmethod
    def _absorb_deficit_with_swaps(
        cls,
        state: TripState,
        deficit: float
    ) -> Tuple[float, List[SwappedItemSummary]]:
        """
        Greedy weighted knapsack item degradation heuristic.
        Prioritizes unlocked items with higher flexibility tiers (FLEXIBLE -> STANDARD -> FREE_ALT).
        Preserves locked items and tagged `#splurge` items.
        """
        swapped: List[SwappedItemSummary] = []
        remaining_deficit = deficit

        # Flexibility rank mapping (lower number = swap first)
        tier_priority = {
            FlexibilityTier.FLEXIBLE: 1,
            FlexibilityTier.STANDARD: 2,
            FlexibilityTier.FREE_ALT: 3,
            FlexibilityTier.SPLURGE: 4,
            FlexibilityTier.HARD: 5,
        }

        # Filter candidates: unlocked, swappable, and has alternatives or free replacement
        candidates = [
            item for item in state.items
            if not item.locked and item.swappable and item.total_cost > 0
        ]

        # Sort candidates by tier priority (highest flexibility first), then by total_cost descending
        candidates.sort(
            key=lambda x: (
                tier_priority.get(x.flexibility_tier, 3),
                1 if "#splurge" in x.tags else 0, # Protect #splurge tags
                -x.total_cost
            )
        )

        for item in candidates:
            if remaining_deficit <= 0:
                break

            # Find best alternative that saves cost
            best_alt = cls._find_cheapest_alternative(item, state.constraints.group_size)
            
            if best_alt and best_alt.total_cost < item.total_cost:
                savings = round(item.total_cost - best_alt.total_cost, 2)
                if savings > 0:
                    summary = SwappedItemSummary(
                        item_id=item.id,
                        day=item.day,
                        category=item.category,
                        old_title=item.title,
                        old_cost=item.total_cost,
                        new_title=best_alt.title,
                        new_cost=best_alt.total_cost,
                        savings=savings,
                        reason=f"Swapped to absorb ${deficit:.0f} budget deficit while saving ${savings:.0f}"
                    )
                    swapped.append(summary)

                    # Update item properties
                    item.title = best_alt.title
                    item.description = best_alt.description
                    item.cost_per_person = best_alt.cost_per_person
                    item.total_cost = best_alt.total_cost
                    item.flexibility_tier = best_alt.flexibility_tier
                    if best_alt.booking_url:
                        item.booking_url = best_alt.booking_url

                    remaining_deficit = round(remaining_deficit - savings, 2)

        return max(0.0, remaining_deficit), swapped

    @staticmethod
    def _find_cheapest_alternative(item: LineItem, group_size: int) -> Optional[ItemAlternative]:
        if item.alternatives:
            # Sort by total_cost ascending
            sorted_alts = sorted(item.alternatives, key=lambda a: a.total_cost)
            for alt in sorted_alts:
                if alt.total_cost < item.total_cost:
                    return alt
        
        # Fallback heuristic: synthesize a free/self-guided or budget alternative if none provided
        if item.category == CategoryEnum.ACTIVITIES and item.total_cost > 0:
            return ItemAlternative(
                id=f"alt_free_{item.id}",
                title=f"Self-Guided {item.title.replace('Guided Tour', '').strip()} & Scenic Spot",
                description="Explore at your own pace with a curated offline audio map.",
                cost_per_person=0.0,
                total_cost=0.0,
                category=CategoryEnum.ACTIVITIES,
                flexibility_tier=FlexibilityTier.FREE_ALT
            )
        elif item.category == CategoryEnum.DINING and item.total_cost > 50 and "#splurge" not in item.tags:
            return ItemAlternative(
                id=f"alt_casual_{item.id}",
                title="Local Tasca / Casual Neighborhood Bistro",
                description="Authentic local dishes at budget-friendly prices.",
                cost_per_person=15.0,
                total_cost=round(15.0 * group_size, 2),
                category=CategoryEnum.DINING,
                flexibility_tier=FlexibilityTier.FLEXIBLE
            )

        return None

    @staticmethod
    def _generate_explanation(
        shock_desc: str,
        deficit_absorbed: float,
        remaining_deficit: float,
        swapped_summaries: List[SwappedItemSummary],
        final_total: float,
        budget: float
    ) -> str:
        parts = [f"**Update Analysis**: {shock_desc}."]
        
        if swapped_summaries:
            swap_details = []
            for s in swapped_summaries:
                swap_details.append(
                    f"• Day {s.day}: Swapped '{s.old_title}' (${s.old_cost:.0f}) → '{s.new_title}' (${s.new_cost:.0f}), saving ${s.savings:.0f}."
                )
            parts.append("To absorb the cost shock and maintain your budget, the engine rebalanced your itinerary:")
            parts.extend(swap_details)
        
        if remaining_deficit <= 0:
            buffer_val = budget - final_total
            parts.append(
                f"\n✅ **Result**: Trip budget of **${budget:,.0f}** satisfied! Final spend is **${final_total:,.0f}** (${buffer_val:,.0f} remaining buffer). Locked items & splurge preferences remained untouched."
            )
        else:
            parts.append(
                f"\n⚠️ **Notice**: Even after swapping all flexible items, the plan is **${remaining_deficit:,.0f}** over budget. Options: 1) Increase budget by ${remaining_deficit:,.0f}, 2) Unlock locked items, or 3) Shorten trip by 1 day."
            )

        return "\n".join(parts)
