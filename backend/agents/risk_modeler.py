from backend.models.scenario import ImpactTexts, Scores


def score_impacts(impacts: ImpactTexts) -> Scores:
    txt = f"{impacts.risk} {impacts.customer} {impacts.competitive} {impacts.cost}".lower()

    # very simple heuristics (works in mock mode)
    risk = 70 if any(k in txt for k in ["churn", "risk", "backlash"]) else 55
    customer = (
        -20 if any(k in txt for k in ["friction", "drop", "loss", "churn"]) else -5
    )
    competitive = (
        12 if any(k in txt for k in ["premium", "positioning", "undercut"]) else 6
    )
    cost = 10 if any(k in txt for k in ["infra", "support", "compute", "ops"]) else 5

    overall = max(
        0,
        min(
            100,
            60 + (competitive + cost) * 0.1 - max(0, risk - 50) * 0.2 + customer * 0.2,
        ),
    )
    overall = int(overall)

    return Scores(
        risk=risk,
        customer=customer,
        competitive=competitive,
        cost=cost,
        overall=overall,
    )
