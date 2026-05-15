'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Authority {
  name: string
  department: string
  resolved_count: number
  missed_sla_count: number
  score_pct: string
}

export default function ScorecardPage() {
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/authorities/scorecard`)
      .then(r => r.json())
      .then(data => { setAuthorities(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', color: '#1a7a4a' }
    if (score >= 75) return { grade: 'B', color: '#4a7a1a' }
    if (score >= 60) return { grade: 'C', color: '#eab308' }
    if (score >= 40) return { grade: 'D', color: '#f97316' }
    return { grade: 'F', color: '#e63329' }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        :root { --ink:#0d0d0d; --paper:#f5f0e8; --accent:#e63329; --muted:#9a9486; --border:#ddd8ce; --green:#1a7a4a; }
        body { background:var(--paper); color:var(--ink); font-family:'DM Sans',sans-serif; }
        .mono { font-family:'DM Mono',monospace; }
        .display { font-family:'Bebas Neue',sans-serif; }
        .nav { display:flex; align-items:center; justify-content:space-between; padding:20px 48px; border-bottom:1px solid var(--border); }
        .nav-brand { display:flex; align-items:center; gap:10px; text-decoration:none; color:var(--ink); }
        .nav-dot { width:10px; height:10px; background:var(--accent); border-radius:50%; }
        .nav-brand-text { font-size:15px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; }
        .rank-row {
          display:grid; grid-template-columns:48px 1fr 80px 80px 80px 72px;
          align-items:center; gap:16px;
          padding:24px 36px; border-bottom:1px solid var(--border);
          transition:background 0.15s;
        }
        .rank-row:hover { background:rgba(0,0,0,0.02); }
        .rank-row.header {
          background:var(--ink); color:var(--paper);
          font-size:10px; letter-spacing:0.1em; text-transform:uppercase;
          font-weight:500; padding:14px 36px;
        }
        .rank-num { font-size:24px; font-weight:300; color:var(--muted); }
        .rank-num.top { color:var(--ink); font-weight:500; }
        .dept-name { font-size:15px; font-weight:500; }
        .dept-sub { font-size:12px; color:var(--muted); margin-top:2px; font-weight:300; }
        .stat-cell { text-align:center; }
        .stat-num { font-size:20px; font-weight:300; }
        .stat-label { font-size:10px; color:var(--muted); letter-spacing:0.06em; text-transform:uppercase; margin-top:2px; }
        .grade-badge {
          width:48px; height:48px; border-radius:4px;
          display:flex; align-items:center; justify-content:center;
          font-family:'Bebas Neue',sans-serif; font-size:28px; color:white;
        }
        .bar-wrap { background:var(--border); height:4px; border-radius:2px; margin-top:6px; }
        .bar-fill { height:4px; border-radius:2px; transition:width 1s ease; }
      `}</style>

      <div style={{minHeight:'100vh',background:'var(--paper)'}}>
        <nav className="nav">
          <Link href="/" className="nav-brand">
            <div className="nav-dot" />
            <span className="nav-brand-text">CivicPulse</span>
          </Link>
          <Link href="/report" style={{fontSize:'12px',color:'var(--muted)',textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase',fontWeight:500}}>
            Report Issue →
          </Link>
        </nav>

        <div style={{maxWidth:'900px',margin:'0 auto',padding:'64px 24px'}}>
          <div style={{marginBottom:'48px'}}>
            <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:'16px'}}>
              — Public Accountability
            </div>
            <h1 className="display" style={{fontSize:'72px',lineHeight:0.9,marginBottom:'16px'}}>
              AUTHORITY<br/>
              <span style={{color:'var(--accent)'}}>SCORECARD</span>
            </h1>
            <p style={{fontSize:'15px',color:'var(--muted)',fontWeight:300,lineHeight:1.6}}>
              Ranked by resolution rate within SLA. Updated in real time.
            </p>
          </div>

          <div style={{border:'1px solid var(--border)',borderRadius:'4px',overflow:'hidden'}}>
            {/* Header */}
            <div className="rank-row header">
              <div>#</div>
              <div>Department</div>
              <div style={{textAlign:'center'}}>Resolved</div>
              <div style={{textAlign:'center'}}>Missed</div>
              <div style={{textAlign:'center'}}>Score</div>
              <div style={{textAlign:'center'}}>Grade</div>
            </div>

            {loading && (
              <div style={{padding:'48px',textAlign:'center',color:'var(--muted)',fontSize:'14px'}}>
                Loading scorecard...
              </div>
            )}

            {!loading && authorities.map((a, i) => {
              const score = Number(a.score_pct) || 0
              const { grade, color } = getGrade(score)
              const total = a.resolved_count + a.missed_sla_count
              return (
                <div key={a.department} className="rank-row">
                  <div className={`rank-num mono ${i < 3 ? 'top' : ''}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `0${i+1}`}
                  </div>
                  <div>
                    <div className="dept-name">{a.name}</div>
                    <div className="dept-sub">{a.department}</div>
                    <div className="bar-wrap">
                      <div className="bar-fill" style={{width:`${score}%`,background:color}} />
                    </div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-num mono" style={{color:'var(--green)'}}>{a.resolved_count}</div>
                    <div className="stat-label">resolved</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-num mono" style={{color: a.missed_sla_count > 0 ? 'var(--accent)' : 'var(--muted)'}}>{a.missed_sla_count}</div>
                    <div className="stat-label">missed</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-num mono">{score}%</div>
                    <div className="stat-label">{total} total</div>
                  </div>
                  <div style={{display:'flex',justifyContent:'center'}}>
                    <div className="grade-badge" style={{background:color}}>{grade}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{marginTop:'24px',fontSize:'12px',color:'var(--muted)',textAlign:'center',fontWeight:300}}>
            Grades: A ≥90% · B ≥75% · C ≥60% · D ≥40% · F below 40%
          </div>
        </div>
      </div>
    </>
  )
}