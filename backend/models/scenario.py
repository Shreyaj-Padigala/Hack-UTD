from pydantic import BaseModel, Field
from typing import List, Optional, Literal

Classification = Literal[
    "pricing_change",
    "feature_remove",
    "feature_add",
    "ux_change",
    "ops_cost",
    "gtm_change",
    "other",
]


class ScenarioContext(BaseModel):
    product_type: Optional[str] = "SaaS"
    arpu: Optional[float] = None
    customer_segments: Optional[List[str]] = None
    competitors: Optional[List[str]] = None


class ScenarioRequest(BaseModel):
    scenario: str = Field(..., description="Natural language 'what-if' question")
    context: Optional[ScenarioContext] = None


class ImpactTexts(BaseModel):
    risk: str
    customer: str
    competitive: str
    cost: str


class Scores(BaseModel):
    risk: int = Field(ge=0, le=100)
    customer: int = Field(ge=-100, le=100)
    competitive: int = Field(ge=-100, le=100)
    cost: int = Field(ge=-100, le=100)
    overall: int = Field(ge=0, le=100)


class Recommendation(BaseModel):
    decision: Literal["proceed", "proceed_cautiously", "do_not_proceed"]
    rationale: str
    mitigations: List[str]
    confidence: float = Field(ge=0.0, le=1.0)


class ScenarioResult(BaseModel):
    classification: Classification
    scores: Scores
    impacts: ImpactTexts
    recommendation: Recommendation
