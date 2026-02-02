#!/usr/bin/env bash
#
# PixelCut - Main setup and run script
# Sets up ffmpeg, MySQL/MariaDB, Python backend, video-cli (editable install), and runs the FastAPI server.
#

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
VIDEO_CLI_DIR="$BACKEND_DIR/tools/video-cli"
DB_NAME="pixelcut_db"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"

# --- Help ---
usage() {
    echo "Usage: $0"
    echo "  Sets up ffmpeg, MySQL, backend venv, video_cli (pip install -e .), and starts the FastAPI server."
    echo ""
    echo "  Server: http://$HOST:$PORT"
    echo "  Override: HOST=127.0.0.1 PORT=9000 $0"
    exit 0
}
[[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && usage

# --- 1. System deps (ffmpeg) ---
setup_ffmpeg() {
    echo ""
    echo "[1/5] System (ffmpeg)"
    echo "----------------------------------------"

    if ! command -v ffmpeg &>/dev/null; then
        echo "Installing ffmpeg..."
        sudo apt-get update -qq
        sudo apt-get install -y ffmpeg
    else
        echo "ffmpeg already installed."
    fi
}

# --- 2. Database ---
setup_database() {
    echo ""
    echo "[2/5] Database (MySQL/MariaDB)"
    echo "----------------------------------------"

    if ! command -v mysql &>/dev/null; then
        echo "Installing MariaDB..."
        sudo apt-get update -qq
        sudo apt-get install -y mariadb-server mariadb-client
    fi

    if ! (pgrep -x mysqld >/dev/null || pgrep -x mariadb >/dev/null); then
        echo "Starting MariaDB..."
        sudo service mariadb start 2>/dev/null || sudo systemctl start mariadb 2>/dev/null || true
        sleep 2
    fi

    if mysql -u root -e "USE $DB_NAME;" 2>/dev/null; then
        echo "Database $DB_NAME exists."
        return 0
    fi

    echo "Creating database and tables..."
    if sudo mysql < "$SCRIPT_DIR/database/schema.sql" 2>/dev/null; then
        echo "Database and tables created."
    else
        echo "Could not run schema. Run manually:"
        echo "  sudo mysql < $SCRIPT_DIR/database/schema.sql"
        echo "  or: mysql -u root -p < $SCRIPT_DIR/database/schema.sql"
        return 1
    fi
}

# --- 3. Backend venv and deps ---
VENV_DIR="venv-genai"
setup_backend() {
    echo ""
    echo "[3/5] Backend (Python venv: $VENV_DIR)"
    echo "----------------------------------------"

    cd "$BACKEND_DIR"

    if [[ ! -d "$VENV_DIR" ]]; then
        echo "Creating virtual environment ($VENV_DIR)..."
        python3 -m venv "$VENV_DIR"
    fi

    echo "Activating venv and installing requirements..."
    source "$VENV_DIR/bin/activate"
    pip install -q "google-genai==1.61.0" "anyio>=4.8,<5"
    pip install -q -r requirements.txt
    echo "Backend ready."
}

# --- 4. Tools (video_cli editable install) ---
setup_tools() {
    echo ""
    echo "[4/5] Tools (video_cli editable install)"
    echo "----------------------------------------"

    cd "$BACKEND_DIR"
    source "$BACKEND_DIR/$VENV_DIR/bin/activate"

    if [[ -d "$VIDEO_CLI_DIR" && -f "$VIDEO_CLI_DIR/setup.py" ]]; then
        echo "Installing video_cli in editable mode (pip install -e .)..."
        pip install -e "$VIDEO_CLI_DIR"
        echo "video_cli installed (editable)."
    else
        echo "No video-cli source at $VIDEO_CLI_DIR; skipping. Install manually if needed."
    fi

    echo "Tools ready."
}

# --- 5. Run server ---
run_server() {
    echo ""
    echo "[5/5] Server"
    echo "----------------------------------------"
    cd "$BACKEND_DIR"
    source "$BACKEND_DIR/$VENV_DIR/bin/activate"

    # Load .env so GOOGLE_API_KEY is set for Gemini (avoids gcloud ADC / scope errors)
    if [[ -f "$SCRIPT_DIR/.env" ]]; then
        set -a
        source "$SCRIPT_DIR/.env"
        set +a
    fi
    if [[ -f "$BACKEND_DIR/.env" ]]; then
        set -a
        source "$BACKEND_DIR/.env"
        set +a
    fi

    echo "API:  http://$HOST:$PORT"
    echo "Docs: http://$HOST:$PORT/docs"
    echo ""
    echo "Endpoints:"
    echo "  POST /upload              - upload video"
    echo "  GET  /download/{id}       - download video"
    echo "  POST /tools/trim          - trim [start, end]"
    echo "  POST /tools/remove_segment"
    echo "  POST /tools/mute_segment"
    echo "  POST /tools/retime        - speed factor"
    echo "  POST /tools/add_text_overlay"
    echo ""

    exec uvicorn main:app --host "$HOST" --port "$PORT" --workers 4
}

# --- Main ---
main() {
    echo "=== PixelCut ==="
    setup_ffmpeg
    setup_database
    setup_backend
    setup_tools
    run_server
}

main "$@"
