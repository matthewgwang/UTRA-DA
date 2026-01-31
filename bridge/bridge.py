import serial
import serial.tools.list_ports
import requests
import json
import time
import sys

# CONFIGURATION
# If running locally, use localhost. If on DigitalOcean, use your Droplet IP.
SERVER_URL = "http://127.0.0.1:5000" 
BAUD_RATE = 9600

def find_arduino():
    """Auto-detect the Arduino UNO port."""
    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        # Arduino Uno usually shows up with "Arduino" or "USB Serial" in the description
        if "Arduino" in p.description or "USB" in p.description:
            return p.device
    return None

def main():
    print("--- UTRA DATA BRIDGE ---")
    
    # 1. Connect to Arduino
    port = find_arduino()
    if not port:
        print("❌ Arduino not found. Please plug it in.")
        # Optional: Ask user to manually enter port if auto-detect fails
        # port = input("Enter port manually (e.g., COM3): ")
        sys.exit(1)
        
    print(f"✅ Connecting to {port}...")
    try:
        ser = serial.Serial(port, BAUD_RATE, timeout=1)
        time.sleep(2) # Wait for Arduino reboot
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

    print("🚀 Bridge Active. Listening for telemetry...")

    buffer = ""
    
    while True:
        try:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                
                # Check for JSON start/end to filter out debug text
                if line.startswith("{") and line.endswith("}"):
                    try:
                        data = json.loads(line)
                        
                        # MODE A: Live Telemetry (Sensor Readings)
                        if "sensors" in data:
                            # Forward to /telemetry endpoint
                            requests.post(f"{SERVER_URL}/telemetry", json=data)
                            print(f"📡 Telemetry sent: {data['sensors']['zone']}")
                            
                        # MODE B: Bulk Log Dump (EEPROM Download)
                        elif "logs" in data:
                            print(f"💾 Log dump detected! ({len(data['logs'])} events)")
                            # Forward to /ingest endpoint
                            resp = requests.post(f"{SERVER_URL}/ingest", json=data)
                            run_id = resp.json().get('run_id')
                            print(f"✅ Run saved! ID: {run_id}")
                            
                            # Auto-trigger analysis
                            print("🧠 Triggering AI Analysis...")
                            requests.post(f"{SERVER_URL}/analyze", json={"run_id": run_id})
                            print("✅ Analysis Complete.")
                            
                    except json.JSONDecodeError:
                        print(f"⚠️ Invalid JSON: {line}")
                    except requests.RequestException as e:
                        print(f"❌ Server Error: {e}")
                else:
                    # Just debug text from Arduino (Serial.println)
                    print(f"🤖 Robot: {line}")
                    
        except KeyboardInterrupt:
            print("\nStopping Bridge...")
            ser.close()
            break

if __name__ == "__main__":
    main()