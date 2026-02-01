// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModelViewer from '../components/ModelViewer';
import '../App.css';

// CONFIG
const API_URL = "http://localhost:5000";

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('live');
  const [telemetry, setTelemetry] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // POLL TELEMETRY (Every 500ms)
  useEffect(() => {
    if (activeTab === 'live') {
      const interval = setInterval(fetchTelemetry, 500);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch(`${API_URL}/telemetry/latest`);
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchLatestRun = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/runs?limit=1`);
      const data = await res.json();
      if (data.runs && data.runs.length > 0) {
        const runId = data.runs[0]._id;
        const detailRes = await fetch(`${API_URL}/runs/${runId}`);
        const detailData = await detailRes.json();
        setAnalysis(detailData);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className="dashboard-container">
      <header>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <button className="nav-btn" onClick={() => navigate('/')}>← BACK</button>
          <div>
            <h1>MISSION CONTROL</h1>
            <small style={{color: 'var(--text-secondary)'}}>REAL-TIME TELEMETRY LINK</small>
          </div>
        </div>
        <div className="status-badge">LIVE FEED ACTIVE</div>
      </header>

      {/* TABS */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
          Live Operations
        </button>
        <button className={`tab-btn ${activeTab === 'debrief' ? 'active' : ''}`} onClick={() => { setActiveTab('debrief'); fetchLatestRun(); }}>
          Mission Debrief
        </button>
        <button className={`tab-btn ${activeTab === 'model' ? 'active' : ''}`} onClick={() => setActiveTab('model')}>
          3D Model
        </button>
      </div>

      {/* LIVE TAB */}
      {activeTab === 'live' && (
        <div className="telemetry-grid">
          <div className="panel">
            <h2>SENSOR ARRAY (RGB)</h2>
            {telemetry ? (
              <>
                <SensorBar label="R" value={telemetry.sensors?.rgb?.r || 0} color="var(--neon-red)" />
                <SensorBar label="G" value={telemetry.sensors?.rgb?.g || 0} color="var(--neon-green)" />
                <SensorBar label="B" value={telemetry.sensors?.rgb?.b || 0} color="var(--neon-blue)" />
                <div className="zone-display" style={{ color: getZoneColor(telemetry.sensors?.zone), borderColor: getZoneColor(telemetry.sensors?.zone) }}>
                  {telemetry.sensors?.zone || "NO SIGNAL"}
                </div>
              </>
            ) : <div className="loading">WAITING FOR ROBOT...</div>}
          </div>
          <div className="panel">
            <h2>SYSTEM HEALTH</h2>
            <StatusRow label="Battery" value={`${telemetry?.sensors?.battery_voltage || 0} V`} />
            <StatusRow label="Last Update" value={telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString() : "--:--:--"} />
            <StatusRow label="Robot ID" value={telemetry?.robot_id || "Unknown"} />
          </div>
        </div>
      )}

      {/* DEBRIEF TAB */}
      {activeTab === 'debrief' && (
        <div className="panel">
          <h2>AI COACH ANALYSIS</h2>
          {loading ? <div className="loading">DOWNLOADING DATA...</div> : analysis ? (
            <div className="chat-window">
              {/* SYSTEM MESSAGE */}
              <div className="chat-bubble system">
                <strong>SYSTEM LOG:</strong> Run #{analysis.run_number} loaded.<br/>
                Total Events: {analysis.logs_count} | ID: {analysis._id}
              </div>

              {/* AI MESSAGE */}
              {analysis.analysis ? (
                <div className="chat-bubble ai">
                  <strong>AI COACH:</strong>
                  <p style={{whiteSpace: 'pre-wrap'}}>{analysis.analysis.summary}</p>

                  {analysis.analysis.issues && analysis.analysis.issues.length > 0 && (
                    <div style={{marginTop: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px'}}>
                      <strong>DETECTED ISSUES:</strong>
                      <ul style={{margin: '5px 0', paddingLeft: '20px'}}>
                        {analysis.analysis.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="chat-bubble system">No analysis data found for this run.</div>
              )}
            </div>
          ) : <div className="loading">NO DATA AVAILABLE</div>}
          <button className="refresh-btn" onClick={fetchLatestRun}>REFRESH DATA</button>
        </div>
      )}

      {/* 3D MODEL TAB */}
      {activeTab === 'model' && (
        <div className="panel">
          <h2>ROBOT 3D MODEL</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '14px' }}>
            Interactive 3D visualization of the competition robot. Drag to rotate, scroll to zoom.
          </p>
          <ModelViewer
            modelUrl="/models/44bot.obj"
            height="400px"
            showControls={true}
          />
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="model-stat">
              <span className="label">Chassis</span>
              <span className="value">Arduino Uno</span>
            </div>
            <div className="model-stat">
              <span className="label">Sensors</span>
              <span className="value">RGB + Ultrasonic + IR</span>
            </div>
            <div className="model-stat">
              <span className="label">Motors</span>
              <span className="value">2x DC w/ Encoder</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- HELPER COMPONENTS ---
function SensorBar({ label, value, color }) {
  const width = Math.min(100, Math.max(0, (value / 255) * 100));
  return (
    <div className="sensor-row">
      <span className="label" style={{color: color}}>{label}</span>
      <div className="bar-container"><div className="bar-fill" style={{ width: `${width}%`, backgroundColor: color }}></div></div>
      <span style={{width: '30px', textAlign: 'right'}}>{value}</span>
    </div>
  );
}

function StatusRow({ label, value }) {
  return (
    <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', padding: '8px 0'}}>
      <span style={{color: '#94a3b8'}}>{label}</span>
      <span style={{fontFamily: 'monospace'}}>{value}</span>
    </div>
  );
}

function getZoneColor(zone) {
  if (!zone) return '#fff';
  if (zone.includes("Red")) return 'var(--neon-red)';
  if (zone.includes("Green")) return 'var(--neon-green)';
  if (zone.includes("Blue")) return 'var(--neon-blue)';
  return '#fff';
}

export default Dashboard;
