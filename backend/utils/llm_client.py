import os, json
from typing import Dict, Any
import httpx
from dotenv import load_dotenv, find_dotenv

# Load .env ONCE, correctly
load_dotenv(find_dotenv(), override=True)


class LLMClient:
    def __init__(self):
        self.provider = (os.getenv("PROVIDER") or "").strip().lower()
        self.api_base = (
            os.getenv("API_BASE") or "https://api.groq.com/openai/v1"
        ).rstrip("/")
        self.api_key = os.getenv("API_KEY") or ""

        # ✅ DEFAULT to supported Groq model
        self.model = os.getenv("MODEL") or "llama-3.3-70b-versatile"

    @property
    def mock(self) -> bool:
        """If no API key, run in mock mode so frontend still works."""
        return not (self.provider and self.api_key)

    async def generate_json(
        self, system: str, user_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Sends the prompt to the LLM and guarantees a JSON response.
        """
        # ✅ MOCK MODE — no API calls burned
        if self.mock:
            scenario = (user_payload.get("scenario") or "").lower()
            return {
                "classification": "pricing_change"
                if "price" in scenario
                else "feature_change",
                "scores": {
                    "risk": 48,
                    "customer": -12,
                    "competitive": 18,
                    "cost": 11,
                    "overall": 67,
                },
                "reasons": {
                    "risk": "Short timeline relative to resources raises execution uncertainty.",
                    "customer": "Price-sensitive cohort may push back based on scenario details.",
                    "competitive": "Move positions the product closer to premium competitors.",
                    "cost": "Minor infra savings based on typical SaaS usage patterns.",
                },
                "impacts": {
                    "risk": "Moderate churn during rollout window.",
                    "customer": "Possible downgrade pressure from SMB/Free-to-Pro users.",
                    "competitive": "Expect competitive discounting by low-cost rivals.",
                    "cost": "Small unit economics improvement.",
                },
                "top_risks": [
                    {
                        "title": "Churn among SMB-Pro users",
                        "mitigation": "Grandfather existing users for 12 months",
                    },
                    {
                        "title": "Sales cycle friction",
                        "mitigation": "Price-lock active POCs for 90 days",
                    },
                ],
                "opportunities": [
                    "Raise ARPU among low-support customers",
                    "Upsell analytics features for enterprise seats",
                ],
                "recommendation": {
                    "decision": "proceed_cautiously",
                    "rationale": "Upside aligns with strategic direction, but requires staged rollout.",
                    "next_actions": [
                        "Run 10% price A/B test for 2 weeks in US SMB segment",
                        "Prepare proactive comms with ROI examples",
                        "Grandfather all current paid users",
                    ],
                    "assumptions_to_validate": ["Churn change < 0.5% in first 30 days"],
                    "success_metrics": [
                        "ARPU +7% in 30 days",
                        "Support ticket delta < 10%",
                    ],
                    "confidence": 0.65,
                },
            }

        # ✅ REAL GROQ MODE
        if self.provider == "groq":
            url = f"{self.api_base}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

            body = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": json.dumps(user_payload)},
                ],
                "temperature": 0.15,
                "response_format": {"type": "json_object"},
            }

            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, headers=headers, json=body)

                # If Groq gives an error, surface it clearly
                if resp.status_code >= 400:
                    raise RuntimeError(
                        f"GROQ ERROR [{resp.status_code}] — model={self.model}\n{resp.text}"
                    )

                content = resp.json()["choices"][0]["message"]["content"]

            # ✅ Parse guaranteed JSON
            try:
                return json.loads(content)
            except:
                # Repair malformed JSON from model (rare)
                start, end = content.find("{"), content.rfind("}")
                if start != -1 and end != -1:
                    return json.loads(content[start : end + 1])
                raise RuntimeError(f"LLM returned invalid JSON:\n{content}")

        raise RuntimeError(f"Provider not supported: {self.provider}")
