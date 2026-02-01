"""
Seed script to populate the database with fake data for testing.
Run with: python seed_fake_data.py
"""

import os
import random
import time
import requests

# Backend URL
API_URL = os.getenv("API_URL", "http://localhost:5000")

# Section configurations matching the track
SECTIONS = {
    1: {"name": "Red Path", "min_duration": 3000, "max_duration": 8000},
    2: {"name": "Ramp", "min_duration": 2000, "max_duration": 5000},
    3: {"name": "Green Path", "min_duration": 4000, "max_duration": 10000},
    4: {"name": "Obstacle Zone", "min_duration": 5000, "max_duration": 12000},
    5: {"name": "Target Zone", "min_duration": 1000, "max_duration": 3000},
}

# Event codes
EVENTS = {
    "Start": 1,
    "SectionComplete": 2,
    "Checkpoint": 3,
    "UltrasonicDodge": 4,
    "IRToggle": 5,
    "ServoStateChange": 6,
    "Stop": 7,
    "Error": 8
}


def generate_fake_run(run_number, robot_id="robot_001"):
    """Generate a fake run with realistic event logs."""
    logs = []
    timestamp = 0

    # Start event
    logs.append({
        "event": EVENTS["Start"],
        "data": 0,
        "timestamp": timestamp
    })
    timestamp += random.randint(100, 300)

    # Go through each section
    section_order = [1, 2, 3, 4, 5]  # Red Path -> Ramp -> Green Path -> Obstacle Zone -> Target

    for section_id in section_order:
        section = SECTIONS[section_id]
        section_start = timestamp

        # Checkpoint trigger (Blue Circle) - happens in some sections
        if section_id in [1, 3, 5] and random.random() < 0.7:
            logs.append({
                "event": EVENTS["Checkpoint"],
                "triggered": 1,
                "timestamp": timestamp
            })
            timestamp += random.randint(200, 500)

        # Ultrasonic dodge events (mainly in obstacle zone)
        if section_id == 4:  # Obstacle Zone
            num_dodges = random.randint(2, 5)
            for _ in range(num_dodges):
                distance = random.randint(5, 30)  # cm
                logs.append({
                    "event": EVENTS["UltrasonicDodge"],
                    "distance_cm": distance,
                    "timestamp": timestamp
                })
                timestamp += random.randint(300, 800)

                # IR toggles during obstacle avoidance
                toggles = random.randint(1, 8)
                logs.append({
                    "event": EVENTS["IRToggle"],
                    "toggle_count": toggles,
                    "timestamp": timestamp
                })
                timestamp += random.randint(100, 300)

        # Random IR toggles in other sections (line following adjustments)
        elif random.random() < 0.4:
            toggles = random.randint(1, 3)
            logs.append({
                "event": EVENTS["IRToggle"],
                "toggle_count": toggles,
                "timestamp": timestamp
            })
            timestamp += random.randint(100, 200)

        # Servo state change (grab box in certain sections)
        if section_id == 1 and random.random() < 0.8:  # Grab box at start
            logs.append({
                "event": EVENTS["ServoStateChange"],
                "state": 1,  # Grabbed Box
                "timestamp": timestamp
            })
            timestamp += random.randint(500, 1000)
        elif section_id == 5:  # Release at target
            logs.append({
                "event": EVENTS["ServoStateChange"],
                "state": 0,  # Travel (released)
                "timestamp": timestamp
            })
            timestamp += random.randint(300, 600)

        # Section duration
        duration = random.randint(section["min_duration"], section["max_duration"])
        timestamp = section_start + duration

        # Section complete event
        logs.append({
            "event": EVENTS["SectionComplete"],
            "section_id": section_id,
            "duration_ms": duration,
            "timestamp": timestamp
        })
        timestamp += random.randint(50, 150)

    # Occasional error
    if random.random() < 0.1:
        logs.append({
            "event": EVENTS["Error"],
            "data": random.randint(1, 5),
            "timestamp": timestamp
        })
        timestamp += random.randint(100, 300)

    # Stop event
    logs.append({
        "event": EVENTS["Stop"],
        "data": 0,
        "timestamp": timestamp
    })

    return {
        "robot_id": robot_id,
        "run_number": run_number,
        "logs": logs,
        "metadata": {
            "battery_voltage": round(random.uniform(6.8, 8.4), 2),
            "firmware_version": "1.2.0",
            "competition_mode": random.choice(["practice", "qualifying", "finals"]),
            "track_condition": random.choice(["dry", "dusty", "clean"])
        }
    }


def generate_fake_telemetry(robot_id="robot_001"):
    """Generate fake real-time telemetry data."""
    section = random.choice(list(SECTIONS.values()))
    zone_name = section["name"]

    # Generate RGB values based on section
    if "Red" in zone_name:
        rgb = {"r": random.randint(180, 255), "g": random.randint(20, 80), "b": random.randint(20, 80)}
    elif "Green" in zone_name:
        rgb = {"r": random.randint(20, 80), "g": random.randint(180, 255), "b": random.randint(20, 80)}
    elif "Ramp" in zone_name:
        rgb = {"r": random.randint(80, 120), "g": random.randint(80, 120), "b": random.randint(80, 120)}
    else:
        rgb = {"r": random.randint(100, 150), "g": random.randint(100, 150), "b": random.randint(100, 150)}

    return {
        "robot_id": robot_id,
        "sensors": {
            "rgb": rgb,
            "battery_voltage": round(random.uniform(6.8, 8.4), 2),
            "zone": zone_name,
            "ultrasonic_cm": random.randint(10, 100),
            "ir_left": random.randint(0, 1),
            "ir_right": random.randint(0, 1),
            "servo_state": random.choice([0, 1])
        }
    }


def seed_runs(num_runs=5):
    """Seed the database with fake runs."""
    print(f"Seeding {num_runs} fake runs...")

    for i in range(1, num_runs + 1):
        run_data = generate_fake_run(run_number=i)
        try:
            response = requests.post(f"{API_URL}/ingest", json=run_data)
            if response.status_code == 201:
                result = response.json()
                print(f"  Run {i}: Created (ID: {result['run_id']}, Logs: {result['logs_count']})")
            else:
                print(f"  Run {i}: Failed - {response.text}")
        except requests.RequestException as e:
            print(f"  Run {i}: Error - {e}")

    print("Done seeding runs!")


def seed_telemetry(num_readings=20, delay=0):
    """Seed the database with fake telemetry readings."""
    print(f"Seeding {num_readings} telemetry readings...")

    for i in range(num_readings):
        telemetry_data = generate_fake_telemetry()
        try:
            response = requests.post(f"{API_URL}/telemetry", json=telemetry_data)
            if response.status_code == 201:
                sensors = telemetry_data['sensors']
                rgb = sensors['rgb']
                print(f"  [{i+1:2}] {sensors['zone']:15} | RGB({rgb['r']:3},{rgb['g']:3},{rgb['b']:3}) | US:{sensors['ultrasonic_cm']:3}cm | Servo:{sensors['servo_state']}")
            else:
                print(f"  Reading {i+1}: Failed - {response.text}")
        except requests.RequestException as e:
            print(f"  Reading {i+1}: Error - {e}")

        if delay > 0:
            time.sleep(delay)

    print("Done seeding telemetry!")


def simulate_live_telemetry(duration_seconds=30, interval=0.5):
    """Simulate live telemetry updates for testing the dashboard."""
    print(f"Simulating live telemetry for {duration_seconds} seconds (Ctrl+C to stop)...")
    print("Open your dashboard to see the updates!\n")

    start_time = time.time()
    reading_count = 0

    try:
        while time.time() - start_time < duration_seconds:
            telemetry_data = generate_fake_telemetry()
            try:
                response = requests.post(f"{API_URL}/telemetry", json=telemetry_data)
                if response.status_code == 201:
                    reading_count += 1
                    sensors = telemetry_data['sensors']
                    rgb = sensors['rgb']
                    print(f"  [{reading_count:3}] {sensors['zone']:15} | RGB({rgb['r']:3},{rgb['g']:3},{rgb['b']:3}) | US:{sensors['ultrasonic_cm']:3}cm | {sensors['battery_voltage']}V")
            except requests.RequestException as e:
                print(f"  Error: {e}")

            time.sleep(interval)

    except KeyboardInterrupt:
        print("\nStopped by user.")

    print(f"\nSent {reading_count} telemetry readings.")


def analyze_latest_run():
    """Trigger analysis on the latest run."""
    print("Fetching latest run...")

    try:
        response = requests.get(f"{API_URL}/runs?limit=1")
        if response.status_code != 200:
            print(f"Failed to get runs: {response.text}")
            return

        data = response.json()
        if not data.get("runs"):
            print("No runs found. Seed some data first!")
            return

        run_id = data["runs"][0]["_id"]
        print(f"Analyzing run {run_id}...")

        response = requests.post(f"{API_URL}/analyze", json={"run_id": run_id})
        if response.status_code == 200:
            result = response.json()
            print("\nAnalysis Result:")
            print("-" * 50)
            analysis = result.get("analysis", {})
            print(f"Summary: {analysis.get('summary', 'No summary')[:500]}...")
            if analysis.get("issues"):
                print(f"\nIssues: {analysis['issues']}")
            print("-" * 50)
        else:
            print(f"Analysis failed: {response.text}")

    except requests.RequestException as e:
        print(f"Error: {e}")


def show_run_stats():
    """Show statistics from the latest run."""
    print("Fetching latest run statistics...")

    try:
        response = requests.get(f"{API_URL}/runs?limit=1")
        if response.status_code != 200:
            print(f"Failed to get runs: {response.text}")
            return

        data = response.json()
        if not data.get("runs"):
            print("No runs found.")
            return

        run_id = data["runs"][0]["_id"]

        # Get full run details
        response = requests.get(f"{API_URL}/runs/{run_id}")
        if response.status_code != 200:
            print(f"Failed to get run details: {response.text}")
            return

        run = response.json()
        stats = run.get("statistics", {})

        print("\n" + "=" * 50)
        print(f"RUN #{run.get('run_number', '?')} STATISTICS")
        print("=" * 50)

        print(f"\nTotal Duration: {stats.get('total_duration_ms', 0) / 1000:.2f}s")
        print(f"Checkpoints Hit: {stats.get('total_checkpoints', 0)}")
        print(f"Total IR Toggles: {stats.get('total_ir_toggles', 0)}")
        print(f"Avg Dodge Distance: {stats.get('avg_dodge_distance', 0):.1f}cm")

        print("\nSection Breakdown:")
        for section_id, section_data in stats.get("section_stats", {}).items():
            print(f"  {section_data['name']:20} : {section_data['duration_ms']/1000:.2f}s")

        print("=" * 50)

    except requests.RequestException as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    import sys

    print("=" * 50)
    print("UTRA-DA Fake Data Seeder")
    print("=" * 50)
    print(f"API URL: {API_URL}")
    print()

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python seed_fake_data.py runs       - Seed 5 fake runs")
        print("  python seed_fake_data.py telemetry  - Seed 20 telemetry readings")
        print("  python seed_fake_data.py live       - Simulate live telemetry (30s)")
        print("  python seed_fake_data.py analyze    - Analyze the latest run")
        print("  python seed_fake_data.py stats      - Show latest run statistics")
        print("  python seed_fake_data.py all        - Seed runs + telemetry + stats")
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "runs":
        seed_runs(5)
    elif command == "telemetry":
        seed_telemetry(20)
    elif command == "live":
        simulate_live_telemetry(30, 0.5)
    elif command == "analyze":
        analyze_latest_run()
    elif command == "stats":
        show_run_stats()
    elif command == "all":
        seed_runs(5)
        print()
        seed_telemetry(20)
        print()
        show_run_stats()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
