from backend.models.scenario import ScenarioRequest, ImpactTexts
from backend.utils.llm_client import LLMClient
from backend.prompts.templates import SCENARIO_SYSTEM_PROMPT

llm = LLMClient()


async def analyze_impacts(req: ScenarioRequest, classification: str) -> ImpactTexts:
    payload = {
        "scenario": req.scenario,
        "context": (req.context.model_dump() if req.context else {}),
        "classification_hint": classification,
        "need": ["classification", "impacts", "scores", "recommendation"],
    }
    out = await llm.generate_json(system=SCENARIO_SYSTEM_PROMPT, user_payload=payload)
    impacts = out.get("impacts") or {
        "risk": "N/A",
        "customer": "N/A",
        "competitive": "N/A",
        "cost": "N/A",
    }
    return ImpactTexts(**impacts)
