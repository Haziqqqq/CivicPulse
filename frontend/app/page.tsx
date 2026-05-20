'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'

interface Report {
  id: string
  issue_type: string
  severity: string
  status: string
  address: string
  department: string
  created_at: string
}

export default function Home() {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState({ total: 0, resolved: 0, open: 0 })
  const [count, setCount] = useState(0)
  const [time, setTime] = useState('')

  useEffect(() => {
    // Fetch real reports
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`)
      .then(r => r.json())
      .then(data => {
        setReports(data.slice(0, 5))
        setStats({
          total: data.length,
          resolved: data.filter((r: Report) => r.status === 'resolved').length,
          open: data.filter((r: Report) => r.status === 'open').length,
        })
        // Animate counter
        let start = 0
        const end = data.length
        if (end === 0) return
        const step = Math.max(1, Math.floor(end / 60))
        const timer = setInterval(() => {
          start += step
          if (start >= end) { setCount(end); clearInterval(timer) }
          else setCount(start)
        }, 16)
      })
      .catch(() => {})

    // Live clock
    const clock = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'Asia/Brunei'
      }))
    }, 1000)

    return () => clearInterval(clock)
  }, [])

  const severityColor = (s: string) =>
    s === 'critical' ? '#e63329' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#1a7a4a'

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(mins / 60)
    const days = Math.floor(hrs / 24)
    if (days > 0) return `${days}d ago`
    if (hrs > 0) return `${hrs}hr ago`
    return `${mins}m ago`
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=DM+Mono:wght@400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        :root { --ink:#0d0d0d; --paper:#f5f0e8; --accent:#e63329; --muted:#9a9486; --border:#ddd8ce; --green:#1a7a4a; }
        body { background:var(--paper); color:var(--ink); font-family:'DM Sans',sans-serif; }
        .display { font-family:'Bebas Neue',sans-serif; letter-spacing:0.02em; }
        .mono { font-family:'DM Mono',monospace; }
        .page { min-height:100vh; display:flex; flex-direction:column; }
        .nav { display:flex; align-items:center; justify-content:space-between; padding:20px 48px; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--paper); z-index:100; }
        .nav-logo { display:flex; align-items:center; gap:10px; text-decoration:none; color:var(--ink); }
        .nav-dot { width:10px; height:10px; background:var(--accent); border-radius:50%; animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
        .nav-brand { font-size:15px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; }
        .nav-links { display:flex; align-items:center; gap:32px; }
        .nav-link { font-size:13px; color:var(--muted); text-decoration:none; letter-spacing:0.05em; text-transform:uppercase; font-weight:500; transition:color 0.2s; }
        .nav-link:hover { color:var(--ink); }
        .nav-cta { background:var(--ink); color:var(--paper); padding:10px 24px; border-radius:2px; font-size:12px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; text-decoration:none; transition:background 0.2s; }
        .nav-cta:hover { background:var(--accent); }
        .ticker { background:var(--ink); color:var(--paper); padding:10px 0; overflow:hidden; font-size:12px; letter-spacing:0.06em; text-transform:uppercase; font-weight:500; }
        .ticker-inner { display:flex; gap:64px; white-space:nowrap; animation:scroll 25s linear infinite; width:max-content; }
        @keyframes scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .ticker-sep { color:var(--accent); }
        .hero { display:grid; grid-template-columns:1fr 1fr; border-bottom:1px solid var(--border); flex:1; }
        .hero-left { padding:80px 48px; border-right:1px solid var(--border); display:flex; flex-direction:column; justify-content:space-between; }
        .hero-eyebrow { display:flex; align-items:center; gap:8px; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-bottom:40px; font-weight:500; }
        .hero-eyebrow-line { width:32px; height:1px; background:var(--muted); }
        .hero-title { font-size:clamp(72px,8vw,120px); line-height:0.92; margin-bottom:48px; }
        .hero-title-accent { color:var(--accent); }
        .hero-desc { font-size:17px; line-height:1.7; color:#444; max-width:480px; font-weight:300; margin-bottom:48px; }
        .hero-actions { display:flex; gap:16px; align-items:center; flex-wrap:wrap; }
        .btn-primary { background:var(--accent); color:white; padding:16px 36px; border-radius:2px; font-size:13px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; text-decoration:none; transition:all 0.2s; display:inline-flex; align-items:center; gap:8px; }
        .btn-primary:hover { background:#c4251c; transform:translateY(-1px); }
        .btn-secondary { color:var(--ink); padding:16px 36px; font-size:13px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; text-decoration:none; border:1px solid var(--border); border-radius:2px; transition:all 0.2s; }
        .btn-secondary:hover { border-color:var(--ink); }
        .hero-right { display:flex; flex-direction:column; }
        .hero-stat-grid { display:grid; grid-template-columns:1fr 1fr; flex:1; }
        .stat-cell { padding:40px 36px; border-right:1px solid var(--border); border-bottom:1px solid var(--border); display:flex; flex-direction:column; justify-content:space-between; }
        .stat-cell:nth-child(even) { border-right:none; }
        .stat-cell:nth-child(3),.stat-cell:nth-child(4) { border-bottom:none; }
        .stat-label { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); font-weight:500; margin-bottom:24px; }
        .stat-value { font-size:56px; font-weight:300; line-height:1; }
        .stat-sub { font-size:12px; color:var(--muted); margin-top:8px; }
        .live-section { display:grid; grid-template-columns:2fr 1fr; border-bottom:1px solid var(--border); }
        .feed-left { border-right:1px solid var(--border); }
        .section-header { display:flex; align-items:center; justify-content:space-between; padding:20px 36px; border-bottom:1px solid var(--border); }
        .section-title { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; font-weight:500; color:var(--muted); display:flex; align-items:center; gap:8px; }
        .live-badge { background:var(--accent); color:white; font-size:9px; padding:2px 6px; border-radius:2px; letter-spacing:0.08em; }
        .feed-item { display:flex; align-items:center; gap:0; border-bottom:1px solid var(--border); transition:background 0.15s; }
        .feed-item:hover { background:rgba(0,0,0,0.02); }
        .feed-item:last-child { border-bottom:none; }
        .feed-severity { width:4px; align-self:stretch; flex-shrink:0; }
        .feed-content { padding:18px 24px; flex:1; }
        .feed-type { font-size:13px; font-weight:500; margin-bottom:4px; text-transform:capitalize; }
        .feed-meta { font-size:11px; color:var(--muted); display:flex; gap:12px; }
        .feed-status { padding:18px 24px; font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--muted); font-weight:500; white-space:nowrap; }
        .how-right { padding:36px; }
        .how-step { display:flex; gap:16px; margin-bottom:32px; }
        .how-step:last-child { margin-bottom:0; }
        .how-num { font-size:11px; font-weight:500; color:var(--muted); letter-spacing:0.06em; padding-top:2px; flex-shrink:0; width:24px; }
        .how-text { font-size:14px; line-height:1.6; color:#333; font-weight:300; }
        .how-text strong { font-weight:500; color:var(--ink); }
        .bottom { display:grid; grid-template-columns:1fr 1fr 1fr; border-top:1px solid var(--border); }
        .bottom-cell { padding:28px 36px; border-right:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
        .bottom-cell:last-child { border-right:none; }
        .bottom-label { font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted); font-weight:500; }
        .bottom-value { font-size:13px; font-weight:500; }
        .bottom-link { font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink); text-decoration:none; font-weight:500; display:flex; align-items:center; gap:6px; border-bottom:1px solid var(--ink); padding-bottom:1px; transition:color 0.2s; }
        .bottom-link:hover { color:var(--accent); border-color:var(--accent); }
        @media(max-width:900px) {
          .nav { padding:16px 24px; }
          .hero { grid-template-columns:1fr; }
          .hero-left { padding:48px 24px; border-right:none; }
          .hero-right { border-top:1px solid var(--border); }
          .live-section { grid-template-columns:1fr; }
          .feed-left { border-right:none; }
          .bottom { grid-template-columns:1fr; }
          .bottom-cell { border-right:none; border-bottom:1px solid var(--border); }
        }
      `}</style>

      <div className="page">
        {/* NAV */}
        <Navbar />

        {/* TICKER */}
        <div className="ticker">
          <div className="ticker-inner">
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{display:'flex',gap:'64px'}}>
                <span>Infrastructure Accountability Platform <span className="ticker-sep">✦</span></span>
                <span>AI-Powered Issue Classification <span className="ticker-sep">✦</span></span>
                <span>Real-Time SLA Tracking <span className="ticker-sep">✦</span></span>
                <span>Bandar Seri Begawan, Brunei <span className="ticker-sep">✦</span></span>
                <span>Public Authority Scorecard <span className="ticker-sep">✦</span></span>
                <span>Smart City Solutions <span className="ticker-sep">✦</span></span>
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
                Civic Infrastructure Platform · BSB, Brunei
              </div>
              <h1 className="hero-title display">
                BROKEN<br />
                CITY.<br />
                <span className="hero-title-accent">FIXED.</span>
              </h1>
              <p className="hero-desc">
                Snap a photo of a pothole, broken streetlight, or flood.
                Our AI instantly classifies it, routes it to the right department,
                and publicly tracks whether they fix it on time.
              </p>
            </div>
            <div className="hero-actions">
              <Link href="/report" className="btn-primary">📷 Report an Issue</Link>
              <Link href="/map" className="btn-secondary">View Live Map →</Link>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-stat-grid">
              <div className="stat-cell">
                <div className="stat-label">Reports Filed</div>
                <div>
                  <div className="stat-value accent mono" style={{color:'var(--accent)'}}>{count}</div>
                  <div className="stat-sub">Since launch</div>
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Resolved</div>
                <div>
                  <div className="stat-value mono" style={{color:'var(--green)'}}>{stats.resolved}</div>
                  <div className="stat-sub">Issues fixed</div>
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Open Issues</div>
                <div>
                  <div className="stat-value mono" style={{color:'#f97316'}}>{stats.open}</div>
                  <div className="stat-sub">Awaiting resolution</div>
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Current Time</div>
                <div>
                  <div className="stat-value mono" style={{fontSize:'32px'}}>{time || '--:--:--'}</div>
                  <div className="stat-sub">Brunei Time (BNT)</div>
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
            {reports.length === 0 ? (
              <div style={{padding:'48px',textAlign:'center',color:'var(--muted)',fontSize:'14px',fontWeight:300}}>
                No reports yet. <Link href="/report" style={{color:'var(--accent)',textDecoration:'none'}}>Be the first to report an issue →</Link>
              </div>
            ) : reports.map((r, i) => (
              <div key={r.id} className="feed-item">
                <div className="feed-severity" style={{background: severityColor(r.severity)}} />
                <div className="feed-content">
                  <div className="feed-type">{r.issue_type}</div>
                  <div className="feed-meta">
                    <span>{r.address}</span>
                    <span>·</span>
                    <span>{r.department}</span>
                  </div>
                </div>
                <div className="feed-status" style={{color: r.status === 'resolved' ? 'var(--green)' : 'var(--accent)'}}>
                  {r.status === 'resolved' ? 'RESOLVED' : 'OPEN'}
                </div>
                <div className="feed-status" style={{color:'var(--muted)',paddingLeft:0}}>
                  {timeAgo(r.created_at)}
                </div>
              </div>
            ))}
          </div>

          <div className="how-right">
            <div className="section-header" style={{padding:'0 0 20px 0',marginBottom:'28px',borderBottom:'1px solid var(--border)'}}>
              <div className="section-title">How it works</div>
            </div>
            {[
              { n:'01', text: <><strong>Snap a photo</strong> of any public infrastructure issue — pothole, broken light, flooding, garbage.</> },
              { n:'02', text: <><strong>Claude AI classifies it</strong> instantly — issue type, severity, confidence score.</> },
              { n:'03', text: <><strong>Auto-routed</strong> to the right department with a legally binding SLA deadline.</> },
              { n:'04', text: <><strong>Publicly tracked.</strong> Miss the deadline? It escalates and hits their scorecard.</> },
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

        {/* BOTTOM */}
        <div className="bottom">
          <div className="bottom-cell">
            <Link href="/staff/login" style={{fontSize:'11px',color:'var(--muted)',textDecoration:'none'}}>
  Staff login →
</Link>
            <div>
              <div className="bottom-label">Serving</div>
              <div className="bottom-value">Bandar Seri Begawan</div>
            </div>
          </div>
          <div className="bottom-cell">
            <div>
              <div className="bottom-label">Powered by</div>
              <div className="bottom-value">Claude API · Next.js · Supabase</div>
            </div>
          </div>
          <div className="bottom-cell">
            <Link href="/report" className="bottom-link">Report an issue now →</Link>
          </div>
        </div>
      </div>
    </>
  )
}
