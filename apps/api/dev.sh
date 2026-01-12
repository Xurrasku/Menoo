#!/usr/bin/env bash
set -e

# Activate virtual environment if it exists, otherwise create it
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

# Install dependencies if needed
if [ ! -f ".venv/.installed" ]; then
    echo "Installing dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    touch .venv/.installed
fi

# Run FastAPI with uvicorn
echo "Starting FastAPI server on http://localhost:8000"
PORT=8000 uvicorn main:app --reload --host 0.0.0.0 --port 8000


