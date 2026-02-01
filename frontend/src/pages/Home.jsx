// frontend/src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Cpu, Users, ArrowRight, Zap, Database, Brain } from 'lucide-react';
import BackgroundRobot from '../components/BackgroundRobot';
import '../App.css';

function Home() {
  const navigate = useNavigate();

  return (
    <>
      {/* Background animation - robot follows path as you scroll */}
      <BackgroundRobot /> 

      <div className="home-container">
        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-content">
            <h1 className="glitch-text">PROJECT: SENTINEL</h1>
            <p className="subtitle">AUTONOMOUS NAVIGATION & DATA ANALYTICS SYSTEM</p>
            <div className="hero-stats">
              <span>UTRA HACKATHON 2026</span>
              <span className="separator">|</span>
              <span>DIVISION: SOFTWARE</span>
            </div>
            <button className="cta-btn" onClick={() => navigate('/dashboard')}>
              ANALYTICS <ArrowRight size={20} />
            </button>
          </div>
        </section>

        {/* SYSTEM ARCHITECTURE - Vertical Stack */}
        <section className="section showcase vertical-section">
          <h2 className="section-title"><Cpu className="icon" /> SYSTEM ARCHITECTURE</h2>

          <div className="vertical-card-stack">
            <div className="vertical-card">
              <div className="card-icon"><Zap size={40} /></div>
              <div className="card-content">
                <h3>THE "BLACK BOX"</h3>
                <p>Custom C++ firmware running on Arduino Uno. Features 500-event EEPROM logging, real-time PID color tracking, and fail-safe interrupt logic.</p>
                <div className="card-tags">
                  <span className="tag">C++</span>
                  <span className="tag">Arduino</span>
                  <span className="tag">EEPROM</span>
                </div>
              </div>
            </div>

            <div className="vertical-card">
              <div className="card-icon"><Database size={40} /></div>
              <div className="card-content">
                <h3>NEURAL BRIDGE</h3>
                <p>Python-based telemetry layer that translates raw serial bytes into JSON packets, utilizing DigitalOcean for low-latency cloud ingestion.</p>
                <div className="card-tags">
                  <span className="tag">Python</span>
                  <span className="tag">Flask</span>
                  <span className="tag">MongoDB</span>
                </div>
              </div>
            </div>

            <div className="vertical-card">
              <div className="card-icon"><Brain size={40} /></div>
              <div className="card-content">
                <h3>AI COACH</h3>
                <p>Integrated OpenRouter LLM analysis that parses flight logs to provide actionable debugging advice in natural language.</p>
                <div className="card-tags">
                  <span className="tag">OpenRouter</span>
                  <span className="tag">LLM</span>
                  <span className="tag">NLP</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GALLERY - Vertical Layout */}
        <section className="section gallery vertical-section">
          <h2 className="section-title"><Terminal className="icon" /> MISSION GALLERY</h2>

          <div className="vertical-gallery">
            <div className="gallery-card">
              <div className="gallery-image">
                <img src="/images/image.webp" alt="MongoDB Database Setup" />
              </div>
              <div className="gallery-info">
                <h3>Cloud Database Infrastructure</h3>
                <p>Setting up MongoDB Atlas to store real-time telemetry data from the robot. Each sensor reading and event log is captured for post-run analysis.</p>
              </div>
            </div>

            <div className="gallery-card reverse">
              <div className="gallery-image">
                <img src="/images/IMG_6297.webp" alt="RGB Sensor Calibration" />
              </div>
              <div className="gallery-info">
                <h3>Color Sensor Calibration</h3>
                <p>Fine-tuning the RGB sensor thresholds to accurately detect colored zones on the track. Getting these values right is critical for reliable line following.</p>
              </div>
            </div>

            <div className="gallery-card">
              <div className="gallery-image">
                <img src="/images/IMG_6291.webp" alt="Team Workspace" />
              </div>
              <div className="gallery-info">
                <h3>The War Room</h3>
                <p>Our hackathon workspace where hardware meets software. Laptops and caffeine fuel 24 hours of building and debugging.</p>
              </div>
            </div>
          </div>
        </section>

        {/* TEAM INFO */}
        <section className="section team">
          <h2 className="section-title"><Users className="icon" /> OPERATIVES</h2>
          <div className="operatives-grid">
            {[
              { name: 'Matthew Wang', university: 'University of Waterloo', major: 'Computer Science' },
              { name: 'Andrew Qiu', university: 'University of Waterloo', major: 'Mathematics' },
              { name: 'Brayden Leung', university: 'Western University', major: 'Software Engineering' },
              { name: 'Yiqing Zhi', university: 'University of Waterloo', major: 'Mechanical Engineering' },
              { name: 'Matthew Xia', university: 'University of Waterloo', major: 'Mechanical Engineering' }
            ].map((operative) => (
              <div key={operative.name} className="operative-card">
                <div className="operative-avatar placeholder-img small">{operative.name.split(' ')[0].charAt(0)}</div>
                <div className="operative-name">{operative.name}</div>
                <div className="operative-university">{operative.university}</div>
                <div className="operative-major">{operative.major}</div>
              </div>
            ))}
          </div>
        </section>

        <footer>
          <p>SYSTEM STATUS: ONLINE // BUILT FOR UTRA HACKATHON 2026</p>
        </footer>
      </div>
    </>
  );
}

export default Home;