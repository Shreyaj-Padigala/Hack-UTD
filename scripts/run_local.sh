#!/usr/bin/env bash
set -e

# Create venv if missing
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# Run FastAPI
export PYTHONPATH=.
uvicorn app:app --reload --port 8000
