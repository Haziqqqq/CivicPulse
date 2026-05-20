'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Navbar from '../../components/Navbar'

const MapView = dynamic(() => import('../../components/MapView'), { ssr: false })

interface Report {
  id: string
  issue_type: string
  severity: string
  status: string
  description: string
  address: string
  department: string
  sla_deadline: string
  created_at: string
  latitude: number
  longitude: number
  duplicate_count: number
  original_report_id: string | null
}

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selected, setSelected] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchReports = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`)
      .then(r => r.json())
      .then(data => { setReports(data); setLoading(false) })
  }

  useEffect(() => {
    fetchReports()
    const interval = setInterval(fetchReports, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)

  const severityColor = (sev: string) => {
    if (sev === 'critical') return '#e63329'
    if (sev === 'high') return '#f97316'
    if (sev === 'medium') return '#eab308'
    return '#1a7a4a'
  }

  const isOverdue = (deadline: string) => new Date() > new Date(deadline)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        :root { --ink:#0d0d0d; --paper:#f5f0e8; --accent:#e63329; --muted:#9a9486; --border:#ddd8ce; --green:#1a7a4a; }
        body { font-family:'DM Sans',sans-serif; }
        .mono { font-family:'DM Mono',monospace; }
        .display { font-family:'Bebas Neue',sans-serif; }
        .filter-btn { padding:8px 16px; border:1px solid var(--border); border-radius:2px; background:white; font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; cursor:pointer; transition:all 0.15s; color:var(--muted); font-family:'DM Sans',sans-serif; }
        .filter-btn.active { background:var(--ink); color:white; border-color:var(--ink); }
        .filter-btn:hover:not(.active) { border-color:var(--ink); color:var(--ink); }
        .panel { position:absolute; right:0; top:0; bottom:0; width:340px; background:var(--paper); border-left:1px solid var(--border); overflow-y:auto; z-index:500; transform:translateX(100%); transition:transform 0.3s ease; }
        .panel.open { transform:translateX(0); }
        .panel-header { padding:24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:flex-start; }
        .panel-close { background:none; border:1px solid var(--border); border-radius:2px; padding:6px 12px; cursor:pointer; font-size:12px; color:var(--muted); font-family:'DM Sans',sans-serif; }
        .panel-field { padding:16px 24px; border-bottom:1px solid var(--border); }
        .panel-label { font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); font-weight:500; margin-bottom:6px; }
        .panel-value { font-size:14px; font-weight:500; }
        .sev-pill { display:inline-block; padding:3px 10px; border-radius:2px; font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; color:white; }
        .countdown { font-size:13px; font-weight:500; }
        .countdown.overdue { color:var(--accent); }
        .countdown.ok { color:var(--green); }
      `}</style>

      <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'var(--paper)'}}>
        <Navbar active="map" />

        {/* Filter bar */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 24px',borderBottom:'1px solid var(--border)',background:'var(--paper)',zIndex:100,position:'relative'}}>
          <div style={{display:'flex',gap:'8px'}}>
            {['all','open','resolved'].map(f => (
              <button key={f} className={`filter-btn ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
                {f==='all'?`All (${reports.length})`:f==='open'?`Open (${reports.filter(r=>r.status==='open').length})`:`Resolved (${reports.filter(r=>r.status==='resolved').length})`}
              </button>
            ))}
          </div>
          <a href="/report" style={{background:'var(--accent)',color:'white',padding:'8px 20px',borderRadius:'2px',textDecoration:'none',fontSize:'11px',fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase'}}>
            + Report
          </a>
        </div>

        <div style={{flex:1,position:'relative',overflow:'hidden'}}>
          {loading ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--muted)',fontSize:'14px'}}>
              Loading map...
            </div>
          ) : (
            <MapView reports={filtered} onSelect={(r) => setSelected(r)} severityColor={severityColor} />
          )}

          {/* Count badge */}
          <div style={{position:'absolute',bottom:'24px',left:'24px',background:'var(--paper)',border:'1px solid var(--border)',borderRadius:'4px',padding:'12px 20px',zIndex:500}}>
            <div style={{fontSize:'10px',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:'4px'}}>Showing</div>
            <div className="mono" style={{fontSize:'24px',fontWeight:300}}>{filtered.length} <span style={{fontSize:'13px',color:'var(--muted)'}}>reports</span></div>
          </div>

          {/* Legend */}
          <div style={{position:'absolute',bottom:'24px',left:'180px',background:'var(--paper)',border:'1px solid var(--border)',borderRadius:'4px',padding:'12px 20px',zIndex:500}}>
            {[['critical','#e63329'],['high','#f97316'],['medium','#eab308'],['low','#1a7a4a']].map(([label,color]) => (
              <div key={label} style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                <div style={{width:'10px',height:'10px',borderRadius:'50%',background:color,flexShrink:0}} />
                <div style={{fontSize:'11px',textTransform:'capitalize',color:'var(--muted)',fontWeight:500,letterSpacing:'0.04em'}}>{label}</div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div className={`panel ${selected?'open':''}`}>
            {selected && (
              <>
                <div className="panel-header">
                  <div>
                    <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:'8px'}}>Report Detail</div>
                    <div className="display" style={{fontSize:'28px',textTransform:'capitalize'}}>{selected.issue_type}</div>
                    {selected.duplicate_count > 0 && (
                      <div style={{marginTop:'6px',display:'inline-flex',alignItems:'center',gap:'6px',background:'#fff7ed',border:'1px solid #fde68a',borderRadius:'4px',padding:'3px 10px',fontSize:'12px',color:'#d97706',fontWeight:500}}>
                        🔁 {selected.duplicate_count + 1} citizens reported this
                      </div>
                    )}
                  </div>
                  <button className="panel-close" onClick={() => setSelected(null)}>✕ Close</button>
                </div>

                <div className="panel-field">
                  <div className="panel-label">Severity</div>
                  <div className="sev-pill" style={{background:severityColor(selected.severity)}}>{selected.severity}</div>
                </div>

                <div className="panel-field">
                  <div className="panel-label">Status</div>
                  <div className="panel-value" style={{color:selected.status==='resolved'?'#1a7a4a':'#e63329',textTransform:'uppercase',fontSize:'13px',letterSpacing:'0.06em'}}>{selected.status}</div>
                </div>

                <div className="panel-field">
                  <div className="panel-label">Department</div>
                  <div className="panel-value">{selected.department}</div>
                </div>

                <div className="panel-field">
                  <div className="panel-label">SLA Deadline</div>
                  <div className={`countdown ${isOverdue(selected.sla_deadline)&&selected.status!=='resolved'?'overdue':'ok'} mono`}>
                    {new Date(selected.sla_deadline).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                    {isOverdue(selected.sla_deadline)&&selected.status!=='resolved'&&' ⚠ OVERDUE'}
                  </div>
                </div>

                {selected.description && (
                  <div className="panel-field">
                    <div className="panel-label">Description</div>
                    <div style={{fontSize:'13px',color:'#444',fontWeight:300,lineHeight:1.6}}>{selected.description}</div>
                  </div>
                )}

                {selected.duplicate_count > 0 && (
                  <div className="panel-field">
                    <div className="panel-label">Community Reports</div>
                    <div style={{background:'#fff7ed',border:'1px solid #fde68a',borderRadius:'4px',padding:'10px 12px'}}>
                      <div style={{fontSize:'13px',fontWeight:600,color:'#d97706',marginBottom:'4px'}}>
                        🔁 {selected.duplicate_count + 1} people reported this issue
                      </div>
                      <div style={{fontSize:'12px',color:'#92400e',fontWeight:300,lineHeight:1.5}}>
                        Multiple reports from the same area indicate a significant problem.
                      </div>
                    </div>
                  </div>
                )}

                <div className="panel-field">
                  <div className="panel-label">Location</div>
                  <div style={{fontSize:'12px',color:'var(--muted)',fontWeight:300,lineHeight:1.5}}>{selected.address}</div>
                </div>

                <div className="panel-field">
                  <div className="panel-label">Filed</div>
                  <div className="mono" style={{fontSize:'12px',color:'var(--muted)'}}>{new Date(selected.created_at).toLocaleString('en-GB')}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
