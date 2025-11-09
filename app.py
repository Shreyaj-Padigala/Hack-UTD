# app.py
from typing import Optional, Dict, Any
import os
import traceback

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx

from backend.utils.llm_client import LLMClient
from backend.prompts.templates import SIMULATE_SYSTEM_PROMPT

app = FastAPI(title="AI Scenario Planner API")
llm = LLMClient()

# --- CORS (allow your frontend on 5500 / 3000) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


# --- Debug middleware: show full error in terminal + JSON body ---
@app.middleware("http")
async def debug_errors(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            {"error": str(e), "path": request.url.path},
            status_code=500,
        )


# --- Simple call counter (optional) ---
CALLS = {"count": 0}


@app.get("/metrics")
def metrics():
    return {"api_calls": CALLS["count"]}


# --- Models ---
class SimulateReq(BaseModel):
    scenario: str
    context: Optional[Dict[str, Any]] = None


# --- Health ---
@app.get("/health")
def health():
    return {
        "status": "ok",
        "llm_provider": llm.provider or "mock",
        "llm_model": llm.model,
        "llm_mock_mode": llm.mock,
    }


# --- Simulate ---
USE_MOCK_ON_FAIL = os.getenv("USE_MOCK_ON_FAIL", "1") == "1"


@app.get("/config")
def config():
    return {
        "provider": os.getenv("PROVIDER"),
        "api_base": os.getenv("API_BASE"),
        "model": os.getenv("MODEL"),
        "has_api_key": bool(os.getenv("API_KEY")),
        "cwd": os.getcwd(),
    }


@app.post("/simulate")
async def simulate(body: SimulateReq):
    CALLS["count"] += 1
    print(f"\n{'=' * 60}")
    print(f"📥 Received scenario request #{CALLS['count']}")
    print(f"Scenario: {body.scenario[:100]}...")

    payload = {"scenario": body.scenario, "context": body.context or {}}

    # Log LLM client config
    print(f"🔧 LLM Config: provider={llm.provider}, model={llm.model}, mock={llm.mock}")

    try:
        print("🤖 Calling LLM (Groq)...")
        result = await llm.generate_json(SIMULATE_SYSTEM_PROMPT, payload)

        # minimal validation to ensure we return JSON object
        if not isinstance(result, dict):
            raise ValueError("LLM returned non-JSON content")

        print(f"✅ LLM returned analysis with {len(result)} fields")
        print(f"   Scores: {result.get('scores', {})}")
        print(f"   Decision: {result.get('recommendation', {}).get('decision', 'N/A')}")
        print(f"{'=' * 60}\n")

        return result
    except httpx.HTTPStatusError as e:
        print(f"❌ Groq API Error: {e.response.status_code}")
        print(f"   Response: {e.response.text[:200]}")
        # Surface Groq error body to caller
        raise HTTPException(status_code=502, detail=e.response.text)
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {str(e)}")
        traceback.print_exc()

        # Optional fallback to mock so the app keeps working
        if USE_MOCK_ON_FAIL:
            print("⚠️  Falling back to mock data...")
            try:
                mock_result = await LLMClient().generate_json("", payload)
                print("✅ Mock data generated")
                return mock_result
            except Exception as mock_err:
                print(f"❌ Mock fallback also failed: {mock_err}")

        print(f"{'=' * 60}\n")
        raise HTTPException(status_code=500, detail=str(e))
