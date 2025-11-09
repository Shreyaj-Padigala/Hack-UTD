from backend.models.scenario import ImpactTexts, Scores, Recommendation


def make_recommendation(
    impacts: ImpactTexts, scores: Scores, classification: str
) -> Recommendation:
    overall = scores.overall
    if overall >= 65:
        decision = "proceed"
        conf = 0.7
        mitigations = [
            "Communicate 2 weeks in advance",
            "Add opt-out window",
            "Monitor early metrics daily",
        ]
        rationale = "Expected upside outweighs risks given current positioning."
    elif overall >= 50:
        decision = "proceed_cautiously"
        conf = 0.6
        mitigations = [
            "Pilot in small region",
            "Grandfather existing users",
            "Offer annual discount",
        ]
        rationale = (
            "Potential benefits with meaningful risks—pilot and guardrails advised."
        )
    else:
        decision = "do_not_proceed"
        conf = 0.55
        mitigations = [
            "Survey users for more signal",
            "Test alternative scope/pricing",
            "Run small A/B test",
        ]
        rationale = "Risk/impact profile skews negative; collect more signal first."

    return Recommendation(
        decision=decision,
        rationale=rationale,
        mitigations=mitigations,
        confidence=conf,
    )
