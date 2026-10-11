#!/bin/bash
# BerryPulse Wellness Tracker launcher

PORT=${1:-8080}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "🍇 ==========================================="
echo "🍓 Starting BerryPulse Wellness Tracker..."
echo "🫐 Serving at: http://localhost:$PORT"
echo "🍇 Open http://localhost:$PORT in your browser"
echo "============================================="

cd "$DIR"
python3 -m http.server "$PORT"
