import re
from typing import Optional, Dict, Any, Tuple
from app.models.schemas import (
    ShockPayload, ShockType, CategoryEnum, LockItemRequest, TripState
)

class LLMAgentService:
    """
    NLU Intent Parser and Tradeoff Explainer agent.
    Parses freeform user text commands into structured constraint shock actions.
    """

    @classmethod
    def parse_user_intent(cls, message: str, current_state: Optional[TripState] = None) -> Dict[str, Any]:
        msg_lower = message.strip().lower()

        # 1. Hotel / Lodging price change shock (e.g. "Hotel went up 20%", "lodging spiked 15%")
        if any(w in msg_lower for w in ["hotel", "lodging", "stay"]):
            pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', msg_lower)
            if pct_match:
                pct = float(pct_match.group(1))
                if "up" in msg_lower or "spike" in msg_lower or "increased" in msg_lower or "higher" in msg_lower or "went up" in msg_lower:
                    return {
                        "action": "APPLY_SHOCK",
                        "shock": ShockPayload(
                            shock_type=ShockType.CATEGORY_PRICE_SPIKE,
                            category=CategoryEnum.LODGING,
                            percentage_change=pct
                        )
                    }
                elif "down" in msg_lower or "decreased" in msg_lower or "lower" in msg_lower:
                    return {
                        "action": "APPLY_SHOCK",
                        "shock": ShockPayload(
                            shock_type=ShockType.CATEGORY_PRICE_SPIKE,
                            category=CategoryEnum.LODGING,
                            percentage_change=-pct
                        )
                    }

        # 2. Flight price change shock (e.g. "Flight rebooked +$150", "flight went up 10%")
        if "flight" in msg_lower or "airfare" in msg_lower:
            pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', msg_lower)
            dollar_match = re.search(r'\$\s*(\d+(?:\.\d+)?)', msg_lower)
            if pct_match:
                pct = float(pct_match.group(1))
                return {
                    "action": "APPLY_SHOCK",
                    "shock": ShockPayload(
                        shock_type=ShockType.CATEGORY_PRICE_SPIKE,
                        category=CategoryEnum.FLIGHTS,
                        percentage_change=pct
                    )
                }
            elif dollar_match and current_state:
                # Find flight item
                for item in current_state.items:
                    if item.category == CategoryEnum.FLIGHTS:
                        add_val = float(dollar_match.group(1))
                        new_cost = item.total_cost + add_val
                        return {
                            "action": "APPLY_SHOCK",
                            "shock": ShockPayload(
                                shock_type=ShockType.LINE_ITEM_PRICE_CHANGE,
                                item_id=item.id,
                                new_cost=new_cost
                            )
                        }

        # 3. Total Budget Change (e.g. "Lower budget to $2000", "Increase budget to $3000")
        budget_match = re.search(r'(?:budget|total).*?\$?\s*(\d{3,6})', msg_lower) or re.search(r'\$\s*(\d{3,6})', msg_lower)
        if budget_match and ("budget" in msg_lower or "total" in msg_lower or "reduce" in msg_lower or "cut" in msg_lower):
            new_b = float(budget_match.group(1))
            return {
                "action": "APPLY_SHOCK",
                "shock": ShockPayload(
                    shock_type=ShockType.TOTAL_BUDGET_CHANGE,
                    new_total_budget=new_b
                )
            }

        # 4. Group Size Change (e.g. "Change to 3 people", "Now 4 travelers")
        group_match = re.search(r'(\d+)\s*(?:people|person|travelers|guests)', msg_lower)
        if group_match:
            new_g = int(group_match.group(1))
            return {
                "action": "APPLY_SHOCK",
                "shock": ShockPayload(
                    shock_type=ShockType.GROUP_SIZE_CHANGE,
                    new_group_size=new_g
                )
            }

        # 5. Lock/Unlock commands (e.g. "Lock day 3 splurge dinner", "Unlock Sintra tour")
        if "lock" in msg_lower and current_state:
            is_lock = "unlock" not in msg_lower
            for item in current_state.items:
                title_words = item.title.lower().split()
                if any(w in msg_lower for w in title_words if len(w) > 3):
                    return {
                        "action": "TOGGLE_LOCK",
                        "item_id": item.id,
                        "locked": is_lock
                    }

        # Fallback / General intent
        return {
            "action": "GENERAL_QUERY",
            "message": message
        }
