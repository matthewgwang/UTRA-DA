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
          {/* 2D Simulation - Path Animation */}
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

          {/* Run History */}
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

          {/* AI Coach Analysis */}
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

                    {/* Speed Over Time Chart */}
                    {analysis.speed_over_time && analysis.speed_over_time.length > 0 && (
                      <div className="analysis-section">
                        <h4>SPEED OVER TIME</h4>
                        <div className="speed-chart">
                          <svg viewBox="0 0 320 130" className="chart-svg">
                            {(() => {
                              const data = analysis.speed_over_time;
                              const maxSpeed = Math.max(...data.map(d => d.speed), 1);
                              const maxTime = Math.max(...data.map(d => d.time_ms), 1);
                              const chartLeft = 40;
                              const chartRight = 310;
                              const chartTop = 10;
                              const chartBottom = 100;
                              const chartWidth = chartRight - chartLeft;
                              const chartHeight = chartBottom - chartTop;

                              // Generate points for the line
                              const points = data.map((d) => {
                                const x = chartLeft + (d.time_ms / maxTime) * chartWidth;
                                const y = chartBottom - (d.speed / maxSpeed) * chartHeight;
                                return `${x},${y}`;
                              }).join(' ');

                              // Y-axis ticks (5 ticks)
                              const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
                                value: Math.round(maxSpeed * ratio),
                                y: chartBottom - ratio * chartHeight
                              }));

                              // X-axis ticks (5 ticks)
                              const xTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
                                value: Math.round((maxTime * ratio) / 1000),
                                x: chartLeft + ratio * chartWidth
                              }));

                              return (
                                <>
                                  {/* Grid lines */}
                                  {yTicks.map((tick, i) => (
                                    <line key={`ygrid-${i}`} x1={chartLeft} y1={tick.y} x2={chartRight} y2={tick.y}
                                      stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="2,2" />
                                  ))}
                                  {xTicks.map((tick, i) => (
                                    <line key={`xgrid-${i}`} x1={tick.x} y1={chartTop} x2={tick.x} y2={chartBottom}
                                      stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="2,2" />
                                  ))}

                                  {/* Axes */}
                                  <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartBottom} stroke="var(--text-secondary)" strokeWidth="1" />
                                  <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke="var(--text-secondary)" strokeWidth="1" />

                                  {/* Y-axis labels */}
                                  {yTicks.map((tick, i) => (
                                    <text key={`ylabel-${i}`} x={chartLeft - 5} y={tick.y + 3}
                                      fill="var(--text-secondary)" fontSize="7" textAnchor="end">{tick.value}</text>
                                  ))}

                                  {/* X-axis labels */}
                                  {xTicks.map((tick, i) => (
                                    <text key={`xlabel-${i}`} x={tick.x} y={chartBottom + 12}
                                      fill="var(--text-secondary)" fontSize="7" textAnchor="middle">{tick.value}s</text>
                                  ))}

                                  {/* Axis titles */}
                                  <text x="15" y="55" fill="var(--text-secondary)" fontSize="7"
                                    transform="rotate(-90, 15, 55)" textAnchor="middle">Speed (u/s)</text>
                                  <text x={(chartLeft + chartRight) / 2} y="125"
                                    fill="var(--text-secondary)" fontSize="7" textAnchor="middle">Time</text>

                                  {/* Data line */}
                                  <polyline
                                    points={points}
                                    fill="none"
                                    stroke="var(--neon-blue)"
                                    strokeWidth="1.5"
                                  />
                                </>
                              );
                            })()}
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Acceleration Stats */}
                    {analysis.acceleration_stats && (
                      <div className="analysis-section">
                        <h4>ACCELERATION PATTERNS</h4>
                        <div className="metrics-grid" style={{marginBottom: '15px'}}>
                          <div className="metric">
                            <span className="metric-value">{analysis.acceleration_stats.max}</span>
                            <span className="metric-label">Max Accel</span>
                          </div>
                          <div className="metric">
                            <span className="metric-value">{analysis.acceleration_stats.min}</span>
                            <span className="metric-label">Max Decel</span>
                          </div>
                          <div className="metric">
                            <span className="metric-value" style={{color: analysis.acceleration_stats.jerky_count > 5 ? 'var(--neon-red)' : 'var(--neon-green)'}}>
                              {analysis.acceleration_stats.jerky_count}
                            </span>
                            <span className="metric-label">Jerky Moves</span>
                          </div>
                          <div className="metric">
                            <span className="metric-value">{analysis.acceleration_stats.avg}</span>
                            <span className="metric-label">Avg Accel</span>
                          </div>
                        </div>

                        {/* Acceleration Chart */}
                        {analysis.acceleration_data && analysis.acceleration_data.length > 0 && (
                          <div className="speed-chart">
                            <svg viewBox="0 0 320 130" className="chart-svg">
                              {(() => {
                                const data = analysis.acceleration_data;
                                const maxAccel = Math.max(...data.map(d => Math.abs(d.acceleration)), 1);
                                const maxTime = Math.max(...data.map(d => d.time_ms), 1);
                                const chartLeft = 45;
                                const chartRight = 310;
                                const chartTop = 10;
                                const chartBottom = 100;
                                const chartMid = (chartTop + chartBottom) / 2;
                                const chartWidth = chartRight - chartLeft;
                                const chartHalfHeight = (chartBottom - chartTop) / 2;

                                // Generate points for the line (centered on 0)
                                const points = data.map((d) => {
                                  const x = chartLeft + (d.time_ms / maxTime) * chartWidth;
                                  const y = chartMid - (d.acceleration / maxAccel) * chartHalfHeight * 0.9;
                                  return `${x},${y}`;
                                }).join(' ');

                                // Y-axis ticks (symmetric around 0)
                                const yTicks = [-1, -0.5, 0, 0.5, 1].map(ratio => ({
                                  value: Math.round(maxAccel * ratio),
                                  y: chartMid - ratio * chartHalfHeight * 0.9
                                }));

                                // X-axis ticks
                                const xTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
                                  value: Math.round((maxTime * ratio) / 1000),
                                  x: chartLeft + ratio * chartWidth
                                }));

                                // Find jerky points (|accel| > 100)
                                const jerkyPoints = data.filter(d => Math.abs(d.acceleration) > 100);

                                return (
                                  <>
                                    {/* Grid lines */}
                                    {yTicks.map((tick, i) => (
                                      <line key={`ygrid-${i}`} x1={chartLeft} y1={tick.y} x2={chartRight} y2={tick.y}
                                        stroke={tick.value === 0 ? "var(--text-secondary)" : "var(--border-color)"}
                                        strokeWidth={tick.value === 0 ? "1" : "0.5"}
                                        strokeDasharray={tick.value === 0 ? "none" : "2,2"} />
                                    ))}

                                    {/* Axes */}
                                    <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartBottom} stroke="var(--text-secondary)" strokeWidth="1" />
                                    <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke="var(--text-secondary)" strokeWidth="1" />

                                    {/* Y-axis labels */}
                                    {yTicks.map((tick, i) => (
                                      <text key={`ylabel-${i}`} x={chartLeft - 5} y={tick.y + 3}
                                        fill="var(--text-secondary)" fontSize="7" textAnchor="end">{tick.value}</text>
                                    ))}

                                    {/* X-axis labels */}
                                    {xTicks.map((tick, i) => (
                                      <text key={`xlabel-${i}`} x={tick.x} y={chartBottom + 12}
                                        fill="var(--text-secondary)" fontSize="7" textAnchor="middle">{tick.value}s</text>
                                    ))}

                                    {/* Axis titles */}
                                    <text x="12" y="55" fill="var(--text-secondary)" fontSize="7"
                                      transform="rotate(-90, 12, 55)" textAnchor="middle">Accel (u/s²)</text>
                                    <text x={(chartLeft + chartRight) / 2} y="125"
                                      fill="var(--text-secondary)" fontSize="7" textAnchor="middle">Time</text>

                                    {/* Highlight jerky regions (red zones) */}
                                    {jerkyPoints.slice(0, 20).map((d, i) => {
                                      const x = chartLeft + (d.time_ms / maxTime) * chartWidth;
                                      return (
                                        <line key={`jerky-${i}`} x1={x} y1={chartTop} x2={x} y2={chartBottom}
                                          stroke="rgba(239, 68, 68, 0.3)" strokeWidth="3" />
                                      );
                                    })}

                                    {/* Data line */}
                                    <polyline
                                      points={points}
                                      fill="none"
                                      stroke="var(--neon-green)"
                                      strokeWidth="1.5"
                                    />
                                  </>
                                );
                              })()}
                            </svg>
                            <div className="chart-legend">
                              <span><span className="legend-line green"></span> Acceleration</span>
                              <span><span className="legend-line red"></span> Jerky Movement</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stuck Detection */}
                    {analysis.stuck_frequency && (
                      <div className="analysis-section" style={{background: analysis.stuck_frequency.total_stuck_events > 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-dark)'}}>
                        <h4>STUCK DETECTION</h4>
                        <div className="stuck-summary">
                          <div className="stuck-stat">
                            <span className="stuck-value" style={{color: analysis.stuck_frequency.total_stuck_events > 3 ? 'var(--neon-red)' : 'var(--neon-green)'}}>
                              {analysis.stuck_frequency.total_stuck_events}
                            </span>
                            <span className="stuck-label">Stuck Events</span>
                          </div>
                          <div className="stuck-stat">
                            <span className="stuck-value">
                              {(analysis.stuck_frequency.total_stuck_time_ms / 1000).toFixed(1)}s
                            </span>
                            <span className="stuck-label">Total Stuck Time</span>
                          </div>
                        </div>
                        {analysis.stuck_frequency.stuck_locations && analysis.stuck_frequency.stuck_locations.length > 0 && (
                          <div className="stuck-locations">
                            <small style={{color: 'var(--text-secondary)'}}>Stuck Locations:</small>
                            {analysis.stuck_frequency.stuck_locations.slice(0, 5).map((loc, idx) => (
                              <div key={idx} className="stuck-location-item">
                                <span>{loc.section}</span>
                                <span>({loc.x.toFixed(0)}, {loc.y.toFixed(0)})</span>
                                <span className="stuck-duration">{(loc.duration_ms / 1000).toFixed(1)}s</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Heatmap */}
                    {analysis.heatmap_data && analysis.heatmap_data.length > 0 && (
                      <div className="analysis-section">
                        <h4>POSITION HEATMAP</h4>
                        <div className="heatmap-container">
                          <svg viewBox="-1200 -2200 1400 2400" className="heatmap-svg">
                            {/* Background */}
                            <rect x="-1200" y="-2200" width="1400" height="2400" fill="#1e293b" />
                            {/* Heatmap cells */}
                            {analysis.heatmap_data.map((cell, idx) => {
                              const intensity = cell.count / analysis.heatmap_max_count;
                              const r = Math.round(59 + intensity * 180);
                              const g = Math.round(130 - intensity * 80);
                              const b = Math.round(246 - intensity * 200);
                              return (
                                <circle
                                  key={idx}
                                  cx={cell.x}
                                  cy={cell.y}
                                  r={15 + intensity * 20}
                                  fill={`rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.5})`}
                                />
                              );
                            })}
                            {/* Stuck markers */}
                            {analysis.stuck_frequency?.stuck_locations?.map((loc, idx) => (
                              <g key={`stuck-${idx}`}>
                                <circle cx={loc.x} cy={loc.y} r="12" fill="rgba(239, 68, 68, 0.8)" />
                                <text x={loc.x} y={loc.y + 4} textAnchor="middle" fill="white" fontSize="10">!</text>
                              </g>
                            ))}
                          </svg>
                          <div className="heatmap-legend">
                            <span>Low</span>
                            <div className="heatmap-gradient"></div>
                            <span>High</span>
                          </div>
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
