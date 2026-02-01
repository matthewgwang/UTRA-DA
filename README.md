# PROJECT: SENTINEL

### UTRA Data Analysis Software

A comprehensive telemetry and analytics platform for autonomous robot performance analysis, built for the **UTRA Hackathon 2026**.

---

## Overview

PROJECT: SENTINEL captures, visualizes, and analyzes real-time sensor data from autonomous competition robots. The system processes telemetry from Arduino-based robots, stores it in MongoDB, and provides AI-powered analysis with interactive 3D visualizations to help teams debug and optimize robot performance.

### Key Features

- **Real-Time Telemetry Ingestion** - Captures sensor data at 100ms intervals via serial bridge
- **Interactive Path Animation** - SVG-based visualization that recreates robot movement
- **3D Model Viewer** - Three.js powered robot model visualization with orbit controls
- **AI-Powered Analysis** - OpenRouter LLM integration for natural language debugging insights
- **Performance Metrics** - Checkpoint tracking, velocity analysis, stuck detection, and section breakdowns
- **Interactive Dashboard** - Filter, browse, and analyze multiple competition runs

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
│          React 18 + Vite + Three.js Visualization          │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND LAYER                           │
│            Flask 3.0 Python REST API Server                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ PyMongo
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                            │
│                       MongoDB                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    BRIDGE LAYER                             │
│     Arduino UNO ──Serial──> Python Bridge ──HTTP──> API     │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
UTRA-DA/
├── backend/                    # Flask API server
│   ├── app.py                  # Main application & routes
│   ├── requirements.txt        # Python dependencies
│   ├── test_data.py            # Generate test runs
│   └── .env                    # Environment configuration
│
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── BackgroundRobot.jsx
│   │   │   ├── CRTOverlay.jsx
│   │   │   └── ModelViewer.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Landing page
│   │   │   └── Dashboard.jsx   # Analytics dashboard
│   │   ├── PathAnimator.jsx    # Path visualization
│   │   └── App.jsx             # Root component
│   ├── public/                 # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── bridge/                     # Arduino serial bridge
│   ├── bridge.py               # Serial listener & forwarder
│   └── README.md
│
├── arduino/                    # Arduino firmware
│   └── eeprom_logger.ino       # EEPROM logging code
│
├── DATA_FORMAT.md              # Telemetry schema docs
└── PATH_ANIMATOR_README.md     # Animator feature guide
```

---

## Tech Stack

### Backend
- **Flask 3.0** - REST API framework
- **PyMongo 4.6** - MongoDB driver
- **Flask-CORS** - Cross-origin support
- **Gunicorn** - Production WSGI server
- **Requests** - HTTP client for OpenRouter API

### Frontend
- **React 18** - UI library
- **Vite 7** - Build tool & dev server
- **Three.js** - 3D graphics
- **@react-three/fiber** - React Three.js renderer
- **@react-three/drei** - Three.js utilities
- **Framer Motion** - Animations
- **React Router DOM** - Client routing
- **Lucide React** - Icon library

### Hardware
- **Arduino UNO** - Microcontroller
- **Python Serial Bridge** - USB communication

### Services
- **MongoDB** - Database (local or Atlas)
- **OpenRouter API** - LLM analysis

---

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- MongoDB (local installation or Atlas account)
- OpenRouter API key (for AI analysis)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/UTRA-DA.git
cd UTRA-DA
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and OpenRouter API key

# Start the server
python app.py
```

The backend runs on `http://localhost:5001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if needed (defaults to localhost:5001)

# Start development server
npm run dev
```

The frontend runs on `http://localhost:5173`

### 4. Seed Test Data (Optional)

```bash
cd backend
python test_data.py
```

This generates 3 sample runs with ~3000 sensor readings each.

---

## Environment Variables

### Backend (`backend/.env`)

```env
MONGODB_URI=mongodb://localhost:27017/utra_da
OPENROUTER_API_KEY=your_openrouter_api_key_here
FLASK_ENV=development
PORT=5001
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5001
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/ingest` | Ingest telemetry data |
| `GET` | `/runs` | List all runs (paginated) |
| `GET` | `/runs/<run_id>` | Get run details with analysis |
| `POST` | `/analyze` | Trigger AI analysis for a run |
| `POST` | `/telemetry` | Live telemetry streaming |
| `GET` | `/telemetry/latest` | Get latest sensor readings |
| `GET` | `/api/path` | Get default path data |
| `GET` | `/api/path/<run_id>` | Get path from specific run |

### Telemetry Data Format

The system accepts three data formats:

**Sensor Format:**
```json
{
  "robot_id": "robot_01",
  "run_number": 1,
  "logs": [
    {
      "section_id": 1,
      "timestamp_ms": 1000,
      "checkpoint_success": 1,
      "ultrasonic_distance": 25.5,
      "claw_status": 90
    }
  ]
}
```

**Path Format:**
```json
{
  "logs": [
    { "x": 100, "y": 200, "timestamp_ms": 1000 }
  ]
}
```

**Event Format:**
```json
{
  "logs": [
    { "event": "checkpoint_hit", "timestamp_ms": 1000 }
  ]
}
```

---

## Serial Bridge (Live Robot)

The bridge script automatically connects to an Arduino and forwards telemetry to the backend.

```bash
cd bridge
python bridge.py
```

**Features:**
- Auto-detects Arduino UNO on USB ports
- Parses JSON telemetry from serial
- Forwards data to Flask API
- Triggers AI analysis after log dumps

---

## Analysis Features

### Metrics Calculated
- **Section Times** - Duration per course section (Red Path, Ramp, Green Path)
- **Checkpoint Rate** - Hit/miss percentage
- **Velocity Analysis** - Speed calculations from position data
- **Stuck Detection** - Identifies immobilization events
- **Ultrasonic Stats** - Average/minimum obstacle distances
- **Heatmap Data** - Position frequency grid

### AI Analysis
The system uses OpenRouter to provide natural language insights:
- Performance summaries
- Issue identification
- Optimization recommendations
- Debugging suggestions

---

## Development

### Running Tests

```bash
# Backend
cd backend
python -m pytest

# Frontend
cd frontend
npm test
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build
# Output in dist/

# Backend (with Gunicorn)
cd backend
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

---

## Course Sections

The competition course is divided into three sections:

| Section ID | Name | Description |
|------------|------|-------------|
| 1 | Red Path | Initial navigation segment |
| 2 | Ramp | Incline obstacle |
| 3 | Green Path | Final approach to goal |

---

## Team

Built by the UTRA Hackathon 2026 team.

---

## License

This project is developed for the UTRA Hackathon 2026.

---

## Documentation

- [Data Format Specification](DATA_FORMAT.md)
- [Path Animator Guide](PATH_ANIMATOR_README.md)
- [Bridge Documentation](bridge/README.md)
