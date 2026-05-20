import Link from 'next/link'

export default function Navbar({ active }: { active?: string }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        .nav { display:flex; align-items:center; justify-content:space-between; padding:20px 48px; border-bottom:1px solid #ddd8ce; position:sticky; top:0; background:#f5f0e8; z-index:100; font-family:'DM Sans',sans-serif; }
        .nav-logo { display:flex; align-items:center; gap:10px; text-decoration:none; color:#0d0d0d; }
        .nav-dot { width:10px; height:10px; background:#e63329; border-radius:50%; animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
        .nav-brand { font-size:15px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; }
        .nav-links { display:flex; align-items:center; gap:32px; }
        .nav-link { font-size:13px; color:#9a9486; text-decoration:none; letter-spacing:0.05em; text-transform:uppercase; font-weight:500; transition:color 0.2s; }
        .nav-link:hover,.nav-link.active { color:#0d0d0d; }
        .nav-cta { background:#0d0d0d; color:#f5f0e8; padding:10px 24px; border-radius:2px; font-size:12px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; text-decoration:none; transition:background 0.2s; }
        .nav-cta:hover { background:#e63329; }
        @media(max-width:768px) {
          .nav { padding:16px 24px; }
          .nav-links { gap:16px; }
          .nav-link { font-size:11px; }
        }
      `}</style>
      <nav className="nav">
        <Link href="/" className="nav-logo">
          <div className="nav-dot" />
          <span className="nav-brand">CivicPulse</span>
        </Link>
        <div className="nav-links">
          <Link href="/map" className={`nav-link ${active==='map'?'active':''}`}>Map</Link>
          <Link href="/scorecard" className={`nav-link ${active==='scorecard'?'active':''}`}>Scorecard</Link>
          <Link href="/about" className={`nav-link ${active==='about'?'active':''}`}>About</Link>
          <Link href="/report" className="nav-cta">Report Issue</Link>
        </div>
      </nav>
    </>
  )
}