'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [count, setCount] = useState(0)
  const [time, setTime] = useState('')

  useEffect(() => {
    // Animate counter
    let start = 0
    const end = 1247
    const duration = 2000
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)

    // Live clock
    const clock = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }, 1000)

    return () => { clearInterval(timer); clearInterval(clock) }
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=DM+Mono:wght@400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --ink: #0d0d0d;
          --paper: #f5f0e8;
          --accent: #e63329;
          --muted: #9a9486;
          --border: #ddd8ce;
          --green: #1a7a4a;
        }

        body { background: var(--paper); color: var(--ink); font-family: 'DM Sans', sans-serif; }

        .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.02em; }
        .mono { font-family: 'DM Mono', monospace; }

        .page { min-height: 100vh; display: flex; flex-direction: column; }

        /* NAV */
        .nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px;
          border-bottom: 1px solid var(--border);
          position: sticky; top: 0; background: var(--paper);
          z-index: 100;
        }
        .nav-logo { display: flex; align-items: center; gap: 10px; }
        .nav-dot { width: 10px; height: 10px; background: var(--accent); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.8)} }
        .nav-brand { font-size: 15px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-link { font-size: 13px; color: var(--muted); text-decoration: none; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: var(--ink); }
        .nav-cta {
          background: var(--ink); color: var(--paper);
          padding: 10px 24px; border-radius: 2px;
          font-size: 12px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          text-decoration: none; transition: background 0.2s;
        }
        .nav-cta:hover { background: var(--accent); }

        /* TICKER */
        .ticker {
          background: var(--ink); color: var(--paper);
          padding: 10px 0; overflow: hidden;
          font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase;
          font-weight: 500;
        }
        .ticker-inner {
          display: flex; gap: 64px; white-space: nowrap;
          animation: scroll 20s linear infinite;
          width: max-content;
        }
        @keyframes scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .ticker-item { display: flex; align-items: center; gap: 16px; }
        .ticker-sep { color: var(--accent); }

        /* HERO */
        .hero {
          display: grid; grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid var(--border);
          flex: 1;
        }
        .hero-left {
          padding: 80px 48px;
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .hero-eyebrow {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 40px; font-weight: 500;
        }
        .hero-eyebrow-line { width: 32px; height: 1px; background: var(--muted); }
        .hero-title {
          font-size: clamp(72px, 8vw, 120px);
          line-height: 0.92;
          margin-bottom: 48px;
        }
        .hero-title-accent { color: var(--accent); }
        .hero-desc {
          font-size: 17px; line-height: 1.7; color: #444;
          max-width: 480px; font-weight: 300;
          margin-bottom: 48px;
        }
        .hero-actions { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
        .btn-primary {
          background: var(--accent); color: white;
          padding: 16px 36px; border-radius: 2px;
          font-size: 13px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
          text-decoration: none; transition: all 0.2s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover { background: #c4251c; transform: translateY(-1px); }
        .btn-secondary {
          color: var(--ink); padding: 16px 36px;
          font-size: 13px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
          text-decoration: none; border: 1px solid var(--border);
          border-radius: 2px; transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: var(--ink); }

        /* HERO RIGHT */
        .hero-right {
          display: flex; flex-direction: column;
        }
        .hero-stat-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          flex: 1;
        }
        .stat-cell {
          padding: 40px 36px;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .stat-cell:nth-child(even) { border-right: none; }
        .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-bottom: none; }
        .stat-label {
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--muted); font-weight: 500; margin-bottom: 24px;
        }
        .stat-value { font-size: 56px; font-weight: 300; line-height: 1; }
        .stat-value.accent { color: var(--accent); }
        .stat-value.green { color: var(--green); }
        .stat-sub { font-size: 12px; color: var(--muted); margin-top: 8px; }

        /* LIVE FEED SECTION */
        .live-section {
          display: grid; grid-template-columns: 2fr 1fr;
          border-bottom: 1px solid var(--border);
        }
        .feed-left { border-right: 1px solid var(--border); }
        .section-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 36px;
          border-bottom: 1px solid var(--border);
        }
        .section-title {
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          font-weight: 500; color: var(--muted);
          display: flex; align-items: center; gap: 8px;
        }
        .live-badge {
          background: var(--accent); color: white;
          font-size: 9px; padding: 2px 6px; border-radius: 2px;
          letter-spacing: 0.08em;
        }
        .feed-item {
          display: flex; align-items: center; gap: 0;
          border-bottom: 1px solid var(--border);
          padding: 0;
          transition: background 0.15s;
        }
        .feed-item:hover { background: rgba(0,0,0,0.02); }
        .feed-item:last-child { border-bottom: none; }
        .feed-severity {
          width: 4px; align-self: stretch;
          flex-shrink: 0;
        }
        .sev-critical { background: var(--accent); }
        .sev-high { background: #f97316; }
        .sev-medium { background: #eab308; }
        .sev-low { background: var(--green); }
        .feed-content { padding: 18px 24px; flex: 1; }
        .feed-type {
          font-size: 13px; font-weight: 500; margin-bottom: 4px;
          text-transform: capitalize;
        }
        .feed-meta { font-size: 11px; color: var(--muted); display: flex; gap: 12px; }
        .feed-status {
          padding: 18px 24px;
          font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--muted); font-weight: 500; white-space: nowrap;
        }

        /* HOW IT WORKS */
        .how-right { padding: 36px; }
        .how-step {
          display: flex; gap: 16px; margin-bottom: 32px;
        }
        .how-step:last-child { margin-bottom: 0; }
        .how-num {
          font-size: 11px; font-weight: 500; color: var(--muted);
          letter-spacing: 0.06em; padding-top: 2px; flex-shrink: 0; width: 24px;
        }
        .how-text { font-size: 14px; line-height: 1.6; color: #333; font-weight: 300; }
        .how-text strong { font-weight: 500; color: var(--ink); }

        /* BOTTOM BAR */
        .bottom {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          border-top: 1px solid var(--border);
        }
        .bottom-cell {
          padding: 28px 36px;
          border-right: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .bottom-cell:last-child { border-right: none; }
        .bottom-label { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); font-weight: 500; }
        .bottom-value { font-size: 13px; font-weight: 500; }
        .bottom-link {
          font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--ink); text-decoration: none; font-weight: 500;
          display: flex; align-items: center; gap: 6px;
          border-bottom: 1px solid var(--ink); padding-bottom: 1px;
          transition: color 0.2s;
        }
        .bottom-link:hover { color: var(--accent); border-color: var(--accent); }

        @media (max-width: 900px) {
          .nav { padding: 16px 24px; }
          .hero { grid-template-columns: 1fr; }
          .hero-left { padding: 48px 24px; border-right: none; }
          .hero-right { border-top: 1px solid var(--border); }
          .live-section { grid-template-columns: 1fr; }
          .feed-left { border-right: none; }
          .bottom { grid-template-columns: 1fr; }
          .bottom-cell { border-right: none; border-bottom: 1px solid var(--border); }
        }
      `}</style>

      <div className="page">
        {/* NAV */}
        <nav className="nav">
          <div className="nav-logo">
            <div className="nav-dot" />
            <span className="nav-brand">CivicPulse</span>
          </div>
          <div className="nav-links">
            <Link href="/map" className="nav-link">Map</Link>
            <Link href="/scorecard" className="nav-link">Scorecard</Link>
            <Link href="/report" className="nav-cta">Report Issue</Link>
          </div>
        </nav>

        {/* TICKER */}
        <div className="ticker">
          <div className="ticker-inner">
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{display:'flex',gap:'64px'}}>
                <span className="ticker-item">Infrastructure Accountability Platform <span className="ticker-sep">✦</span></span>
                <span className="ticker-item">AI-Powered Issue Classification <span className="ticker-sep">✦</span></span>
                <span className="ticker-item">Real-Time SLA Tracking <span className="ticker-sep">✦</span></span>
                <span className="ticker-item">Bandar Seri Begawan <span className="ticker-sep">✦</span></span>
                <span className="ticker-item">Public Authority Scorecard <span className="ticker-sep">✦</span></span>
                <span className="ticker-item">HACKHAZARDS '26 <span className="ticker-sep">✦</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* HERO */}
        <div className="hero">
          <div className="hero-left">
            <div>
              <div className="hero-eyebrow">
                <div className="hero-eyebrow-line" />
                Civic Infrastructure Platform
              </div>
              <h1 className="hero-title display">
                BROKEN<br />
                CITY.<br />
                <span className="hero-title-accent">FIXED.</span>
              </h1>
              <p className="hero-desc">
                Snap a photo. Our AI classifies it, routes it to the right department,
                and publicly tracks whether they fix it — on time, every time.
              </p>
            </div>
            <div className="hero-actions">
              <Link href="/report" className="btn-primary">
                📷 Report an Issue
              </Link>
              <Link href="/map" className="btn-secondary">
                View Live Map →
              </Link>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-stat-grid">
              <div className="stat-cell">
                <div className="stat-label">Reports filed</div>
                <div>
                  <div className="stat-value accent mono">{count.toLocaleString()}</div>
                  <div className="stat-sub">Since launch</div>
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Avg. response</div>
                <div>
                  <div className="stat-value mono">36<span style={{fontSize:'24px',color:'var(--muted)'}}>hrs</span></div>
                  <div className="stat-sub">Across departments</div>
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Resolution rate</div>
                <div>
                  <div className="stat-value green mono">84<span style={{fontSize:'24px',color:'var(--muted)'}}>%</span></div>
                  <div className="stat-sub">Within SLA</div>
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Current time</div>
                <div>
                  <div className="stat-value mono" style={{fontSize:'32px'}}>{time || '--:--:--'}</div>
                  <div className="stat-sub">BSB, Brunei</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE SECTION */}
        <div className="live-section">
          <div className="feed-left">
            <div className="section-header">
              <div className="section-title">
                <span className="live-badge">LIVE</span>
                Recent Reports
              </div>
              <Link href="/map" style={{fontSize:'12px',color:'var(--muted)',textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase'}}>
                View all →
              </Link>
            </div>
            {[
              { type: 'Pothole', loc: 'Jalan Tutong', dept: 'Roads Dept', sev: 'critical', time: '4 min ago', status: 'OPEN' },
              { type: 'Broken Streetlight', loc: 'Gadong Commercial', dept: 'Utilities', sev: 'high', time: '18 min ago', status: 'IN PROGRESS' },
              { type: 'Flooding', loc: 'Kiarong Expressway', dept: 'Drainage Dept', sev: 'critical', time: '35 min ago', status: 'OPEN' },
              { type: 'Garbage Overflow', loc: 'Kiulap Circle', dept: 'Sanitation', sev: 'medium', time: '1 hr ago', status: 'RESOLVED' },
              { type: 'Road Crack', loc: 'Berakas Link Rd', dept: 'Roads Dept', sev: 'low', time: '2 hrs ago', status: 'RESOLVED' },
            ].map((item, i) => (
              <div key={i} className="feed-item">
                <div className={`feed-severity sev-${item.sev}`} />
                <div className="feed-content">
                  <div className="feed-type">{item.type}</div>
                  <div className="feed-meta">
                    <span>{item.loc}</span>
                    <span>·</span>
                    <span>{item.dept}</span>
                  </div>
                </div>
                <div className="feed-status" style={{color: item.status === 'RESOLVED' ? 'var(--green)' : item.status === 'OPEN' ? 'var(--accent)' : 'var(--muted)'}}>
                  {item.status}
                </div>
                <div className="feed-status" style={{color:'var(--muted)',paddingLeft:0}}>
                  {item.time}
                </div>
              </div>
            ))}
          </div>

          <div className="how-right">
            <div className="section-header" style={{padding:'0 0 20px 0',marginBottom:'28px',borderBottom:'1px solid var(--border)'}}>
              <div className="section-title">How it works</div>
            </div>
            {[
              { n: '01', text: <><strong>Snap a photo</strong> of any public infrastructure issue — pothole, broken light, flooding, garbage.</> },
              { n: '02', text: <><strong>Claude AI classifies it</strong> instantly — issue type, severity, confidence score.</> },
              { n: '03', text: <><strong>Auto-routed</strong> to the right department with a legally binding SLA deadline.</> },
              { n: '04', text: <><strong>Publicly tracked.</strong> Miss the deadline? It escalates and hits their scorecard.</> },
            ].map((s, i) => (
              <div key={i} className="how-step">
                <div className="how-num mono">{s.n}</div>
                <div className="how-text">{s.text}</div>
              </div>
            ))}
            <Link href="/scorecard" className="btn-primary" style={{marginTop:'32px',display:'inline-flex',fontSize:'12px',padding:'12px 24px'}}>
              View Scorecard →
            </Link>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="bottom">
          <div className="bottom-cell">
            <div>
              <div className="bottom-label">Built at</div>
              <div className="bottom-value">HACKHAZARDS '26</div>
            </div>
          </div>
          <div className="bottom-cell">
            <div>
              <div className="bottom-label">Powered by</div>
              <div className="bottom-value">Claude API · Next.js · Supabase</div>
            </div>
          </div>
          <div className="bottom-cell">
            <Link href="/report" className="bottom-link">
              Report an issue now →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
