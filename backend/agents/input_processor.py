def classify_scenario(text: str) -> str:
    t = (text or "").lower()
    if any(k in t for k in ["price", "pricing", "plan", "tier"]):
        return "pricing_change"
    if any(k in t for k in ["remove", "sunset", "deprecate"]):
        return "feature_remove"
    if any(k in t for k in ["add feature", "launch", "introduce", "premium tier"]):
        return "feature_add"
    if any(k in t for k in ["ux", "onboarding", "flow", "funnel"]):
        return "ux_change"
    if any(k in t for k in ["infra", "compute", "server", "cost"]):
        return "ops_cost"
    if any(k in t for k in ["gtm", "go-to-market", "release notes", "comms"]):
        return "gtm_change"
    return "other"
