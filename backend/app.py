import os
from datetime import datetime

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import requests

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend"))
DIST_DIR = os.path.join(FRONTEND_DIR, "dist")  # Vite production build output

# Create Flask app (API + optional static serving)
app = Flask(__name__)
CORS(app)

# -----------------------------------------------------------------------------
# MongoDB Configuration
# -----------------------------------------------------------------------------
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/utra_da")
client = MongoClient(MONGODB_URI)

# If URI explicitly includes a DB, get_default_database() can work.
# Otherwise, fall back to a known DB name.
try:
    db = client.get_default_database()
except Exception:
    db = client["utra_da"]

runs_collection = db["runs"]
telemetry_collection = db["telemetry"]

# -----------------------------------------------------------------------------
# OpenRouter Configuration
# -----------------------------------------------------------------------------
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Event code mappings (from Arduino EEPROM)
EVENT_CODES = {
    1: "Start",
    2: "ZoneChange",
    3: "Shot",
    4: "Obstacle",
    5: "Stop",
    6: "Error"
}

ZONE_NAMES = {
    0: "Start",
    1: "Red Zone",
    2: "Blue Zone",
    3: "Green Zone",
    4: "Center",
    5: "Unknown"
}


def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    if "created_at" in doc and doc["created_at"]:
        doc["created_at"] = doc["created_at"].isoformat()
    if "analyzed_at" in doc and doc["analyzed_at"]:
        doc["analyzed_at"] = doc["analyzed_at"].isoformat()
    return doc


# -----------------------------------------------------------------------------
# API Routes
# -----------------------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})


@app.route("/ingest", methods=["POST"])
def ingest_data():
    """
    POST /ingest
    Save raw JSON logs from robot EEPROM to MongoDB.
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        if "logs" not in data:
            return jsonify({"error": "Missing 'logs' field"}), 400

        processed_logs = []
        for log in data.get("logs", []):
            event_code = log.get("event", 0)
            zone_id = log.get("data", 0)
            processed_logs.append({
                "event_code": event_code,
                "event_name": EVENT_CODES.get(event_code, "Unknown"),
                "zone_id": zone_id,
                "zone_name": ZONE_NAMES.get(zone_id, "Unknown"),
                "timestamp_ms": log.get("timestamp", 0),
                "raw": log
            })

        run_doc = {
            "robot_id": data.get("robot_id", "unknown"),
            "run_number": data.get("run_number", 0),
            "logs": processed_logs,
            "metadata": data.get("metadata", {}),
            "created_at": datetime.utcnow(),
            "analyzed": False,
            "analysis": None
        }

        result = runs_collection.insert_one(run_doc)

        return jsonify({
            "success": True,
            "run_id": str(result.inserted_id),
            "logs_count": len(processed_logs)
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/runs", methods=["GET"])
def get_runs():
    """GET /runs - list runs (supports pagination and robot_id filter)."""
    try:
        robot_id = request.args.get("robot_id")
        limit = int(request.args.get("limit", 50))
        skip = int(request.args.get("skip", 0))

        query = {}
        if robot_id:
            query["robot_id"] = robot_id

        runs = list(
            runs_collection.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )

        serialized_runs = []
        for run in runs:
            serialized_runs.append({
                "_id": str(run["_id"]),
                "robot_id": run.get("robot_id"),
                "run_number": run.get("run_number"),
                "logs_count": len(run.get("logs", [])),
                "created_at": run.get("created_at").isoformat() if run.get("created_at") else None,
                "analyzed": run.get("analyzed", False),
                "metadata": run.get("metadata", {})
            })

        total_count = runs_collection.count_documents(query)

        return jsonify({
            "runs": serialized_runs,
            "total": total_count,
            "limit": limit,
            "skip": skip
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/runs/<run_id>", methods=["GET"])
def get_run_detail(run_id):
    try:
        run = runs_collection.find_one({"_id": ObjectId(run_id)})
        if not run:
            return jsonify({"error": "Run not found"}), 404
        return jsonify(serialize_doc(run))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analyze", methods=["POST"])
def analyze_run():
    """
    POST /analyze
    Send run data to OpenRouter and return AI critique.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        if "run_id" in data:
            run = runs_collection.find_one({"_id": ObjectId(data["run_id"])})
            if not run:
                return jsonify({"error": "Run not found"}), 404
            logs = run.get("logs", [])
            metadata = run.get("metadata", {})
            run_id = data["run_id"]
        else:
            logs = data.get("logs", [])
            metadata = data.get("metadata", {})
            run_id = None

        if not logs:
            return jsonify({"error": "No logs to analyze"}), 400

        zone_sequence = [log["zone_name"] for log in logs if log.get("event_name") == "ZoneChange"]
        event_summary = {}
        for log in logs:
            event_name = log.get("event_name", "Unknown")
            event_summary[event_name] = event_summary.get(event_name, 0) + 1

        zone_times = {}
        for i, log in enumerate(logs):
            if log.get("event_name") == "ZoneChange":
                zone = log["zone_name"]
                start_time = log["timestamp_ms"]
                end_time = logs[i + 1]["timestamp_ms"] if i + 1 < len(logs) else start_time
                zone_times[zone] = zone_times.get(zone, 0) + (end_time - start_time)

        issues = []
        for zone, time_ms in zone_times.items():
            if time_ms > 10000:
                issues.append(f"Stuck in {zone}: {time_ms/1000:.1f}s")

        oscillations = 0
        for i in range(2, len(zone_sequence)):
            if zone_sequence[i] == zone_sequence[i - 2] and zone_sequence[i] != zone_sequence[i - 1]:
                oscillations += 1
        if oscillations > 2:
            issues.append(f"Oscillation detected: {oscillations} times")

        prompt = f"""You are an expert robotics coach analyzing a competition run.
Analyze this robot's performance and provide actionable feedback.

Run Summary:
- Total Events: {len(logs)}
- Zone Sequence: {' -> '.join(zone_sequence) if zone_sequence else 'No zone changes recorded'}
- Event Breakdown: {event_summary}
- Time in Zones (ms): {zone_times}
- Detected Issues: {issues if issues else 'None detected'}

Full Event Log (first 50):
{logs[:50]}

Please provide:
1. A brief performance summary
2. Identified issues (e.g., oscillation, stuck behavior, inefficient pathing)
3. Specific recommendations with actionable fixes
4. An overall score out of 10
"""

        if not OPENROUTER_API_KEY:
            analysis = {
                "summary": "OPENROUTER_API_KEY not configured. This is a mock analysis.",
                "issues": issues,
                "recommendations": ["Configure OPENROUTER_API_KEY in .env for real AI analysis."],
                "score": 0,
                "zone_sequence": zone_sequence,
                "zone_times": zone_times,
                "event_summary": event_summary
            }
        else:
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://utra-da.local",
                "X-Title": "UTRA Data Analysis"
            }
            payload = {
                "model": "openai/gpt-4-turbo-preview",
                "messages": [
                    {"role": "system", "content": "You are an expert robotics competition coach."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1000
            }

            response = requests.post(OPENROUTER_URL, json=payload, headers=headers)
            response.raise_for_status()

            ai_response = response.json()
            raw_content = ai_response["choices"][0]["message"]["content"]

            analysis = {
                "summary": raw_content,
                "raw_response": raw_content,
                "model_used": ai_response.get("model", "unknown"),
                "usage": ai_response.get("usage", {}),
                "zone_sequence": zone_sequence,
                "zone_times": zone_times,
                "event_summary": event_summary,
                "issues": issues
            }

        if run_id:
            runs_collection.update_one(
                {"_id": ObjectId(run_id)},
                {"$set": {"analyzed": True, "analysis": analysis, "analyzed_at": datetime.utcnow()}}
            )

        return jsonify({"success": True, "analysis": analysis})

    except requests.RequestException as e:
        return jsonify({"error": f"OpenRouter API error: {str(e)}"}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/telemetry", methods=["POST"])
def ingest_telemetry():
    """POST /telemetry - ingest live telemetry."""
    try:
        data = request.get_json() or {}
        telemetry_doc = {
            "robot_id": data.get("robot_id", "unknown"),
            "sensors": data.get("sensors", {}),
            "timestamp": datetime.utcnow()
        }
        telemetry_collection.insert_one(telemetry_doc)
        return jsonify({"success": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/telemetry/latest", methods=["GET"])
def get_latest_telemetry():
    """GET /telemetry/latest - latest telemetry reading."""
    try:
        robot_id = request.args.get("robot_id")
        query = {"robot_id": robot_id} if robot_id else {}

        telemetry = telemetry_collection.find_one(query, sort=[("timestamp", -1)])
        if telemetry:
            telemetry["_id"] = str(telemetry["_id"])
            telemetry["timestamp"] = telemetry["timestamp"].isoformat()
            return jsonify(telemetry)
        return jsonify({"message": "No telemetry data found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------------------------------------------------------
# Frontend Serving (Production Build)
# -----------------------------------------------------------------------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """
    Serve the built React frontend (frontend/dist).
    If dist does not exist, return a helpful message.
    """
    if os.path.isdir(DIST_DIR):
        if path != "" and os.path.exists(os.path.join(DIST_DIR, path)):
            return send_from_directory(DIST_DIR, path)
        return send_from_directory(DIST_DIR, "index.html")

    return jsonify({
        "message": "Frontend build not found. Run `npm run build` in frontend/ to create dist/.",
        "hint": "For development, use Vite dev server at http://localhost:5173."
    }), 404


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
