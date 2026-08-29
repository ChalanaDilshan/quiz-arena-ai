#!/usr/bin/env bash
# Quiz Arena — Start All Services

# Change to the directory where the script is located
cd "$(dirname "$0")"

echo -e "\033[1;36m=== Quiz Arena Startup ===\033[0m"

# --- 1. Python Strands Agents Microservice ---
echo -e "\n\033[1;33m[1/2] Starting Python Strands Agents service...\033[0m"
STRANDS_DIR="./server/strands_agents"
VENV_PATH="$STRANDS_DIR/.venv"

if [ ! -f "$VENV_PATH/bin/python" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv "$VENV_PATH"
    echo "  Installing Strands dependencies..."
    "$VENV_PATH/bin/pip" install -r "$STRANDS_DIR/requirements.txt" --quiet
fi

# Run the Python service in the background
(cd "$STRANDS_DIR" && "$VENV_PATH/bin/python" -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload) &
STRANDS_PID=$!
echo -e "\033[1;32m  Strands service starting on http://127.0.0.1:8001 (PID: $STRANDS_PID)\033[0m"

# --- 2. Node.js Express API Gateway ---
echo -e "\n\033[1;33m[2/2] Starting Node.js API gateway...\033[0m"
(cd server && node index.js) &
NODE_PID=$!
echo -e "\033[1;32m  Node.js gateway starting on http://localhost:3001 (PID: $NODE_PID)\033[0m"

echo -e "\n\033[1;36m=== All services launched. Run 'npm run dev' separately for the frontend. ===\033[0m"
echo "Press Ctrl+C to stop the services."

# Wait for Ctrl+C to kill background processes
trap "echo 'Stopping services...'; kill $STRANDS_PID $NODE_PID; exit" INT TERM
wait
