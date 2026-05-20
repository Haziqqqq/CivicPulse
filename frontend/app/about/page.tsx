import Link from 'next/link'
import Navbar from '../../components/Navbar'

export default function AboutPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=DM+Mono:wght@400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        :root { --ink:#0d0d0d; --paper:#f5f0e8; --accent:#e63329; --muted:#9a9486; --border:#ddd8ce; --green:#1a7a4a; }
        body { background:var(--paper); color:var(--ink); font-family:'DM Sans',sans-serif; }
        .display { font-family:'Bebas Neue',sans-serif; }
        .mono { font-family:'DM Mono',monospace; }
        .nav { display:flex; align-items:center; justify-content:space-between; padding:20px 48px; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--paper); z-index:100; }
        .nav-logo { display:flex; align-items:center; gap:10px; text-decoration:none; color:var(--ink); }
        .nav-dot { width:10px; height:10px; background:var(--accent); border-radius:50%; }
        .nav-brand { font-size:15px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; }
        .nav-links { display:flex; align-items:center; gap:32px; }
        .nav-link { font-size:13px; color:var(--muted); text-decoration:none; letter-spacing:0.05em; text-transform:uppercase; font-weight:500; transition:color 0.2s; }
        .nav-link:hover { color:var(--ink); }
        .nav-cta { background:var(--ink); color:var(--paper); padding:10px 24px; border-radius:2px; font-size:12px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; text-decoration:none; transition:background 0.2s; }
        .nav-cta:hover { background:var(--accent); }
        .hero { padding:80px 48px; border-bottom:1px solid var(--border); display:grid; grid-template-columns:1fr 1fr; gap:64px; }
        .section { display:grid; grid-template-columns:1fr 1fr; border-bottom:1px solid var(--border); }
        .section-left { padding:64px 48px; border-right:1px solid var(--border); }
        .section-right { padding:64px 48px; }
        .eyebrow { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); font-weight:500; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .eyebrow-line { width:32px; height:1px; background:var(--muted); }
        .body-text { font-size:16px; line-height:1.8; color:#444; font-weight:300; }
        .body-text strong { font-weight:500; color:var(--ink); }
        .value-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:32px; }
        .value-card { border:1px solid var(--border); border-radius:2px; padding:24px; }
        .value-icon { font-size:24px; margin-bottom:12px; }
        .value-title { font-size:14px; font-weight:500; margin-bottom:8px; }
        .value-desc { font-size:13px; color:var(--muted); line-height:1.6; font-weight:300; }
        .team-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; }
        .team-card { border:1px solid var(--border); border-radius:2px; padding:24px; }
        .team-avatar { width:48px; height:48px; border-radius:50%; background:var(--ink); display:flex; align-items:center; justify-content:center; color:var(--paper); font-size:18px; font-weight:500; margin-bottom:16px; }
        .team-name { font-size:15px; font-weight:500; margin-bottom:4px; }
        .team-role { font-size:12px; color:var(--muted); letter-spacing:0.04em; }
        .cta-section { padding:80px 48px; display:flex; align-items:center; justify-content:space-between; }
        .btn-primary { background:var(--accent); color:white; padding:16px 36px; border-radius:2px; font-size:13px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; text-decoration:none; transition:all 0.2s; display:inline-flex; align-items:center; gap:8px; }
        .btn-primary:hover { background:#c4251c; }
        .btn-secondary { color:var(--ink); padding:16px 36px; font-size:13px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; text-decoration:none; border:1px solid var(--border); border-radius:2px; transition:all 0.2s; }
        .btn-secondary:hover { border-color:var(--ink); }
        .bottom { display:grid; grid-template-columns:1fr 1fr 1fr; border-top:1px solid var(--border); }
        .bottom-cell { padding:28px 36px; border-right:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
        .bottom-cell:last-child { border-right:none; }
        .bottom-label { font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted); font-weight:500; }
        .bottom-value { font-size:13px; font-weight:500; }
        .bottom-link { font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink); text-decoration:none; font-weight:500; border-bottom:1px solid var(--ink); padding-bottom:1px; transition:color 0.2s; }
        .bottom-link:hover { color:var(--accent); border-color:var(--accent); }
        @media(max-width:900px) {
          .nav { padding:16px 24px; }
          .hero,.section { grid-template-columns:1fr; }
          .section-left { border-right:none; border-bottom:1px solid var(--border); padding:48px 24px; }
          .section-right { padding:48px 24px; }
          .hero { padding:48px 24px; gap:32px; }
          .cta-section { flex-direction:column; gap:24px; padding:48px 24px; }
          .bottom { grid-template-columns:1fr; }
          .bottom-cell { border-right:none; border-bottom:1px solid var(--border); }
        }
      `}</style>

      <div style={{minHeight:'100vh',background:'var(--paper)'}}>
        {/* Nav */}
        <Navbar active="about" />

        {/* Hero */}
        <div className="hero">
          <div>
            <div className="eyebrow"><div className="eyebrow-line" />About CivicPulse</div>
            <h1 className="display" style={{fontSize:'clamp(56px,6vw,96px)',lineHeight:0.92,marginBottom:'32px'}}>
              BUILT FOR<br/>
              BETTER<br/>
              <span style={{color:'var(--accent)'}}>CITIES.</span>
            </h1>
            <p className="body-text">
              CivicPulse is a civic infrastructure platform that turns citizen frustration into government accountability.
              We use AI to ensure every infrastructure problem reaches the right hands, gets fixed on time,
              and is publicly tracked so no authority can ignore it.
            </p>
          </div>
          <div style={{display:'flex',flexDirection:'column',justifyContent:'flex-end',gap:'32px'}}>
            {[
              { num:'01', label:'Problem', text:'Citizens have no effective way to report infrastructure issues and hold authorities accountable.' },
              { num:'02', label:'Solution', text:'AI-powered reporting that auto-classifies, auto-routes, and publicly tracks every issue until it\'s fixed.' },
              { num:'03', label:'Impact', text:'Faster resolution times, transparent government accountability, and safer streets for everyone.' },
            ].map(s => (
              <div key={s.num} style={{display:'flex',gap:'16px'}}>
                <div className="mono" style={{fontSize:'11px',color:'var(--muted)',paddingTop:'3px',flexShrink:0}}>{s.num}</div>
                <div>
                  <div style={{fontSize:'13px',fontWeight:500,marginBottom:'6px'}}>{s.label}</div>
                  <div style={{fontSize:'13px',color:'var(--muted)',lineHeight:1.6,fontWeight:300}}>{s.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="section">
          <div className="section-left">
            <div className="eyebrow"><div className="eyebrow-line" />The Platform</div>
            <h2 className="display" style={{fontSize:'56px',lineHeight:0.92,marginBottom:'32px'}}>
              HOW IT<br/>
              <span style={{color:'var(--accent)'}}>WORKS</span>
            </h2>
            <p className="body-text">
              CivicPulse connects three key actors — citizens, government departments, and the public —
              through a single transparent platform powered by AI.
            </p>
          </div>
          <div className="section-right">
            <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
              {[
                { step:'01', icon:'📷', title:'Citizen Reports', desc:'Any citizen can snap a photo of an infrastructure issue and submit it in under 60 seconds. No account needed.' },
                { step:'02', icon:'🤖', title:'AI Classification', desc:'Our AI analyses the photo and automatically identifies the issue type, severity level, and which department is responsible.' },
                { step:'03', icon:'📨', title:'Auto-Routing', desc:'The report is instantly routed to the correct department with a legally binding SLA deadline based on severity.' },
                { step:'04', icon:'⏱️', title:'Public Tracking', desc:'Every report is publicly visible on the map. If the deadline is missed, it escalates and the authority\'s scorecard reflects it.' },
              ].map((s, i) => (
                <div key={s.step} style={{display:'flex',gap:'20px',padding:'24px 0',borderBottom: i < 3 ? '1px solid var(--border)' : 'none'}}>
                  <div className="mono" style={{fontSize:'11px',color:'var(--muted)',paddingTop:'4px',flexShrink:0,width:'24px'}}>{s.step}</div>
                  <div style={{fontSize:'24px',flexShrink:0}}>{s.icon}</div>
                  <div>
                    <div style={{fontSize:'14px',fontWeight:500,marginBottom:'6px'}}>{s.title}</div>
                    <div style={{fontSize:'13px',color:'var(--muted)',lineHeight:1.6,fontWeight:300}}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values */}
        <div style={{padding:'64px 48px',borderBottom:'1px solid var(--border)'}}>
          <div className="eyebrow" style={{marginBottom:'32px'}}><div className="eyebrow-line" />Our Values</div>
          <div className="value-grid">
            {[
              { icon:'🔍', title:'Transparency', desc:'Every report, every deadline, every resolution is publicly visible. No backroom deals, no ignored complaints.' },
              { icon:'⚡', title:'Speed', desc:'AI classification means reports reach the right department in seconds, not days of manual triage.' },
              { icon:'📊', title:'Accountability', desc:'The public scorecard creates positive pressure on departments to resolve issues on time, every time.' },
              { icon:'🌍', title:'Scalability', desc:'Built to work in any city, starting with Bandar Seri Begawan and expanding across the region.' },
            ].map(v => (
              <div key={v.title} className="value-card">
                <div className="value-icon">{v.icon}</div>
                <div className="value-title">{v.title}</div>
                <div className="value-desc">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section">
          <div>
            <div className="eyebrow" style={{marginBottom:'16px'}}><div className="eyebrow-line" />Get Involved</div>
            <h2 className="display" style={{fontSize:'56px',lineHeight:0.92}}>
              SEE AN ISSUE?<br/>
              <span style={{color:'var(--accent)'}}>REPORT IT.</span>
            </h2>
          </div>
          <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
            <Link href="/report" className="btn-primary">📷 Report an Issue</Link>
            <Link href="/map" className="btn-secondary">View Live Map →</Link>
          </div>
        </div>

        {/* Footer */}
        <div className="bottom">
          <div className="bottom-cell">
            <div>
              <div className="bottom-label">Location</div>
              <div className="bottom-value">Bandar Seri Begawan, Brunei</div>
            </div>
          </div>
          <div className="bottom-cell">
            <div>
              <div className="bottom-label">Platform</div>
              <div className="bottom-value">Claude API · Next.js · Supabase</div>
            </div>
          </div>
          <div className="bottom-cell">
            <Link href="/scorecard" className="bottom-link">View Authority Scorecard →</Link>
          </div>
        </div>
      </div>
    </>
  )
}