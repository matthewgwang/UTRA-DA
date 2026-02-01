// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModelViewer from '../components/ModelViewer';
import PathAnimator from '../PathAnimator';
import '../App.css';

// CONFIG
const API_URL = "http://localhost:5001";

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('path');
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch runs on mount
  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/runs?limit=20`);
      const data = await res.json();
      if (data.runs) {
        setRuns(data.runs);
        // Auto-select the first run if available
        if (data.runs.length > 0 && !selectedRun) {
          setSelectedRun(data.runs[0]);
          fetchRunDetail(data.runs[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching runs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRunDetail = async (runId) => {
    try {
      const res = await fetch(`${API_URL}/runs/${runId}`);
      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setAnalysis(null);
      }
    } catch (err) {
      console.error('Error fetching run detail:', err);
    }
  };

  const handleRunSelect = (run) => {
    setSelectedRun(run);
    setAnalysis(null);
    fetchRunDetail(run._id);
  };

  const analyzeRun = async () => {
    if (!selectedRun) return;
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: selectedRun._id })
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Error analyzing run:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="dashboard-container">
      <header>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <button className="nav-btn" onClick={() => navigate('/')}>← BACK</button>
          <div>
            <h1>ANALYTICS</h1>
            <small style={{color: 'var(--text-secondary)'}}>ROBOT PATH ANALYSIS & VISUALIZATION</small>
          </div>
        </div>
        <div className="status-badge">
          {runs.length > 0 ? `${runs.length} RUNS LOADED` : 'NO DATA'}
        </div>
      </header>

      {/* TABS */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'path' ? 'active' : ''}`} onClick={() => setActiveTab('path')}>
          Path Animation
        </button>
        <button className={`tab-btn ${activeTab === 'model' ? 'active' : ''}`} onClick={() => setActiveTab('model')}>
          3D Model
        </button>
      </div>

      {/* PATH ANIMATION TAB */}
      {activeTab === 'path' && (
        <div className="analytics-layout">
          {/* Left Panel - Run Selection */}
          <div className="runs-panel">
            <div className="panel-header">
              <h3>RUN HISTORY</h3>
              <button className="refresh-btn-small" onClick={fetchRuns}>↻</button>
            </div>
            {loading ? (
              <div className="loading">Loading runs...</div>
            ) : runs.length === 0 ? (
              <div className="no-data">
                <p>No runs found.</p>
                <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                  Run test_data.py to generate sample data
                </p>
              </div>
            ) : (
              <div className="runs-list">
                {runs.map((run) => (
                  <div
                    key={run._id}
                    className={`run-card ${selectedRun?._id === run._id ? 'selected' : ''}`}
                    onClick={() => handleRunSelect(run)}
                  >
                    <div className="run-card-header">
                      <span className="robot-id">{run.robot_id}</span>
                      <span className="run-number">Run #{run.run_number}</span>
                    </div>
                    <div className="run-card-meta">
                      <span>{run.logs_count} events</span>
                      <span>{run.analyzed ? '✓ Analyzed' : ''}</span>
                    </div>
                    <div className="run-card-date">{formatDate(run.created_at)}</div>
                    {run.metadata?.performance_profile && (
                      <div className={`performance-badge ${run.metadata.performance_profile}`}>
                        {run.metadata.performance_profile}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Center Panel - Path Animation */}
          <div className="animation-panel">
            <div className="panel">
              <h2>PATH VISUALIZATION</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '14px' }}>
                {selectedRun
                  ? `Viewing: ${selectedRun.robot_id} - Run #${selectedRun.run_number}`
                  : 'Select a run from the history to view its path'
                }
              </p>
              <PathAnimator runId={selectedRun?._id} compact={true} />
            </div>
          </div>

          {/* Right Panel - AI Analysis */}
          <div className="analysis-panel">
            <div className="panel-header">
              <h3>AI COACH ANALYSIS</h3>
            </div>

            {selectedRun ? (
              <>
                <button
                  className="analyze-btn"
                  onClick={analyzeRun}
                  disabled={analyzing}
                >
                  {analyzing ? 'ANALYZING...' : analysis ? 'RE-ANALYZE' : 'ANALYZE RUN'}
                </button>

                {analysis ? (
                  <div className="analysis-content">
                    {/* Timeline */}
                    {analysis.timeline && analysis.timeline.length > 0 && (
                      <div className="analysis-section">
                        <h4>EVENT TIMELINE</h4>
                        <div className="timeline-list-small">
                          {analysis.timeline.slice(0, 10).map((event, idx) => (
                            <div key={idx} className="timeline-item-small">
                              <span className="time">{(event.time_ms / 1000).toFixed(1)}s</span>
                              <span className="event">{event.event}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section Times */}
                    {analysis.section_times && Object.keys(analysis.section_times).length > 0 && (
                      <div className="analysis-section">
                        <h4>SECTION TIMES</h4>
                        <div className="section-times">
                          {Object.entries(analysis.section_times).map(([section, time]) => (
                            <div key={section} className="section-time-row">
                              <span className="section-name">{section}</span>
                              <span className="section-duration">{(time / 1000).toFixed(1)}s</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metrics */}
                    {(analysis.checkpoint_rate !== undefined || analysis.ultrasonic_avg !== undefined) && (
                      <div className="analysis-section">
                        <h4>METRICS</h4>
                        <div className="metrics-grid">
                          {analysis.checkpoint_rate !== undefined && (
                            <div className="metric">
                              <span className="metric-value">{analysis.checkpoint_rate.toFixed(1)}%</span>
                              <span className="metric-label">Checkpoint Rate</span>
                            </div>
                          )}
                          {analysis.ultrasonic_avg !== undefined && (
                            <div className="metric">
                              <span className="metric-value">{analysis.ultrasonic_avg.toFixed(1)}cm</span>
                              <span className="metric-label">Avg Distance</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Issues */}
                    {analysis.issues && analysis.issues.length > 0 && (
                      <div className="analysis-section issues">
                        <h4>DETECTED ISSUES</h4>
                        <ul className="issues-list">
                          {analysis.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* AI Summary */}
                    {analysis.summary && (
                      <div className="analysis-section summary">
                        <h4>AI SUMMARY</h4>
                        <div className="summary-text">
                          {analysis.summary}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-analysis">
                    <p>Click "Analyze Run" to get AI insights on this run's performance.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="no-analysis">
                <p>Select a run to view analysis</p>
              </div>
            )}
          </div>
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

export default Dashboard;
