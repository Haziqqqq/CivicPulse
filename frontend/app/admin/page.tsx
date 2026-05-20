'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import axios from 'axios'
import Link from 'next/link'

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
  photo_url: string
  notes: string
  duplicate_count: number
  original_report_id: string | null
}

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [resolving, setResolving] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [selected, setSelected] = useState<Report | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else { setUser(data.user); fetchReports() }
    })
  }, [])

  const fetchReports = async () => {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`)
    setReports(res.data)
    setLoading(false)
  }

  const resolve = async (id: string) => {
    setResolving(id)
    await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/resolve`)
    await fetchReports()
    setResolving(null)
    setSelected(null)
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(true)
    await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/status`, { status })
    await fetchReports()
    setSelected(prev => prev ? { ...prev, status } : null)
    setUpdatingStatus(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const overdue = reports.filter(r => r.status === 'open' && new Date() > new Date(r.sla_deadline))
  const open = reports.filter(r => r.status === 'open')
  const inProgress = reports.filter(r => r.status === 'in_progress')
  const resolved = reports.filter(r => r.status === 'resolved')

  const filtered = filter === 'all' ? reports
    : filter === 'overdue' ? overdue
    : filter === 'in_progress' ? inProgress
    : reports.filter(r => r.status === filter)

  const severityColor = (s: string) => s === 'critical' ? '#dc2626' : s === 'high' ? '#ea580c' : s === 'medium' ? '#d97706' : '#16a34a'
  const severityBg = (s: string) => s === 'critical' ? '#fef2f2' : s === 'high' ? '#fff7ed' : s === 'medium' ? '#fffbeb' : '#f0fdf4'
  const isOverdue = (r: Report) => r.status === 'open' && new Date() > new Date(r.sla_deadline)

  const statusBadge = (status: string) => {
    if (status === 'resolved') return { bg: '#f0fdf4', color: '#16a34a', label: '✓ Resolved' }
    if (status === 'in_progress') return { bg: '#fffbeb', color: '#d97706', label: '🔧 In Progress' }
    return { bg: '#fef2f2', color: '#dc2626', label: '● Open' }
  }

  const daysUntil = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600&family=DM+Mono:wght@400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        :root { --ink:#111827; --accent:#e63329; --muted:#6b7280; --border:#f3f4f6; --green:#16a34a; --bg:#f9fafb; --sidebar:#111827; }
        body { background:var(--bg); color:var(--ink); font-family:'DM Sans',sans-serif; }
        .mono { font-family:'DM Mono',monospace; }
        .display { font-family:'Bebas Neue',sans-serif; }
        .layout { display:flex; min-height:100vh; }
        .sidebar { width:240px; background:var(--sidebar); flex-shrink:0; display:flex; flex-direction:column; position:sticky; top:0; height:100vh; }
        .sidebar-logo { padding:24px 20px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; gap:10px; }
        .logo-icon { width:32px; height:32px; background:var(--accent); border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
        .logo-text { font-size:13px; font-weight:600; color:white; letter-spacing:0.04em; }
        .logo-sub { font-size:10px; color:rgba(255,255,255,0.3); letter-spacing:0.06em; text-transform:uppercase; }
        .sidebar-section { padding:16px 12px 8px; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.2); font-weight:500; }
        .sidebar-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:6px; margin:2px 8px; font-size:13px; color:rgba(255,255,255,0.5); cursor:pointer; transition:all 0.15s; text-decoration:none; }
        .sidebar-item:hover { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.8); }
        .sidebar-item.active { background:rgba(255,255,255,0.1); color:white; }
        .sidebar-badge { margin-left:auto; background:var(--accent); color:white; font-size:10px; font-weight:600; padding:1px 6px; border-radius:99px; }
        .sidebar-badge.orange { background:#ea580c; }
        .sidebar-badge.yellow { background:#d97706; }
        .sidebar-footer { margin-top:auto; padding:16px; border-top:1px solid rgba(255,255,255,0.06); }
        .user-row { display:flex; align-items:center; gap:10px; padding:10px; border-radius:6px; background:rgba(255,255,255,0.04); }
        .user-avatar { width:32px; height:32px; background:var(--accent); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600; color:white; flex-shrink:0; }
        .user-email { font-size:11px; color:rgba(255,255,255,0.4); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .logout-btn { margin-top:8px; width:100%; padding:8px; background:transparent; border:1px solid rgba(255,255,255,0.08); border-radius:6px; color:rgba(255,255,255,0.3); font-size:11px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .logout-btn:hover { border-color:rgba(255,255,255,0.2); color:rgba(255,255,255,0.6); }
        .main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
        .topbar { background:white; border-bottom:1px solid var(--border); padding:16px 28px; display:flex; align-items:center; justify-content:space-between; }
        .topbar-title { font-size:16px; font-weight:600; }
        .topbar-sub { font-size:12px; color:var(--muted); margin-top:1px; }
        .btn-outline { padding:8px 16px; border:1px solid var(--border); border-radius:6px; background:white; font-size:12px; font-weight:500; color:var(--muted); cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
        .btn-outline:hover { border-color:#d1d5db; color:var(--ink); }
        .content { padding:24px 28px; flex:1; overflow-y:auto; }
        .stats-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; margin-bottom:24px; }
        .stat-card { background:white; border:1px solid var(--border); border-radius:10px; padding:20px; }
        .stat-card-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
        .stat-icon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; }
        .stat-label { font-size:12px; color:var(--muted); font-weight:500; margin-bottom:4px; }
        .stat-value { font-size:28px; font-weight:300; line-height:1; font-family:'DM Mono',monospace; }
        .stat-trend { font-size:11px; color:var(--muted); margin-top:6px; }
        .filter-tabs { display:flex; gap:4px; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:4px; margin-bottom:16px; width:fit-content; }
        .tab { padding:7px 16px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.15s; border:none; background:transparent; color:var(--muted); font-family:'DM Sans',sans-serif; }
        .tab.active { background:white; color:var(--ink); box-shadow:0 1px 3px rgba(0,0,0,0.08); }
        .tab:hover:not(.active) { color:var(--ink); }
        .table-wrap { background:white; border:1px solid var(--border); border-radius:10px; overflow:hidden; }
        .table-header { padding:16px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
        .table-title { font-size:14px; font-weight:600; }
        .table-count { font-size:12px; color:var(--muted); background:var(--bg); padding:3px 10px; border-radius:99px; font-family:'DM Mono',monospace; }
        table { width:100%; border-collapse:collapse; }
        thead th { font-size:11px; letter-spacing:0.05em; text-transform:uppercase; color:var(--muted); font-weight:500; padding:12px 16px; border-bottom:1px solid var(--border); text-align:left; background:#fafafa; }
        tbody td { padding:14px 16px; border-bottom:1px solid var(--border); font-size:13px; vertical-align:middle; }
        tbody tr:last-child td { border-bottom:none; }
        tbody tr:hover td { background:#fafafa; cursor:pointer; }
        .overdue-row td { background:#fff8f8 !important; }
        .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:500; }
        .resolve-btn { padding:7px 14px; background:var(--green); color:white; border:none; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; white-space:nowrap; }
        .resolve-btn:hover { background:#15803d; }
        .resolve-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .detail-panel { position:fixed; right:0; top:0; bottom:0; width:400px; background:white; border-left:1px solid var(--border); z-index:200; transform:translateX(100%); transition:transform 0.25s ease; display:flex; flex-direction:column; box-shadow:-8px 0 24px rgba(0,0,0,0.06); }
        .detail-panel.open { transform:translateX(0); }
        .detail-header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; align-items:flex-start; justify-content:space-between; }
        .detail-close { width:28px; height:28px; border-radius:6px; border:1px solid var(--border); background:white; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; color:var(--muted); }
        .detail-body { padding:24px; flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:20px; }
        .detail-field-label { font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--muted); font-weight:500; margin-bottom:6px; }
        .detail-field-value { font-size:14px; font-weight:500; }
        .detail-footer { padding:20px 24px; border-top:1px solid var(--border); }
        .status-btn { flex:1; padding:10px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; border:1px solid; transition:all 0.15s; }
      `}</style>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">⚡</div>
            <div>
              <div className="logo-text">CivicPulse</div>
              <div className="logo-sub">Admin Portal</div>
            </div>
          </div>

          <div className="sidebar-section">Operations</div>
          <div className={`sidebar-item ${filter==='all'?'active':''}`} onClick={() => setFilter('all')}>
            <span>📋</span>Reports
            {open.length > 0 && <span className="sidebar-badge">{open.length}</span>}
          </div>
          {inProgress.length > 0 && (
            <div className={`sidebar-item ${filter==='in_progress'?'active':''}`} onClick={(e) => { e.stopPropagation(); setFilter('in_progress') }}>
              <span>🔧</span>In Progress
              <span className="sidebar-badge yellow">{inProgress.length}</span>
            </div>
          )}
          {overdue.length > 0 && (
            <div className={`sidebar-item ${filter==='overdue'?'active':''}`} onClick={(e) => { e.stopPropagation(); setFilter('overdue') }} style={{color:filter==='overdue'?'white':'#fca5a5',cursor:'pointer'}}>
              <span>⚠️</span>Overdue
              <span className="sidebar-badge orange">{overdue.length}</span>
            </div>
          )}

          <div className="sidebar-section">Public</div>
          <Link href="/map" target="_blank" className="sidebar-item"><span>🗺️</span>Live Map</Link>
          <Link href="/scorecard" target="_blank" className="sidebar-item"><span>📊</span>Scorecard</Link>
          <Link href="/" target="_blank" className="sidebar-item"><span>🏠</span>Public Site</Link>

          <div className="sidebar-footer">
            <div className="user-row">
              <div className="user-avatar">{user?.email?.[0]?.toUpperCase() || 'A'}</div>
              <div style={{overflow:'hidden'}}>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',fontWeight:500}}>Admin</div>
                <div className="user-email">{user?.email}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>Sign Out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div>
              <div className="topbar-title">Report Management</div>
              <div className="topbar-sub">Monitor and resolve civic infrastructure reports</div>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button className="btn-outline" onClick={fetchReports}>↻ Refresh</button>
              <Link href="/report" target="_blank" className="btn-outline" style={{background:'var(--accent)',color:'white',border:'none'}}>
                + New Report
              </Link>
            </div>
          </div>

          <div className="content">
            <div className="stats-grid">
              {[
                { label:'Total', value: reports.length, icon:'📁', iconBg:'#f3f4f6', color:'var(--ink)', trend:'All reports' },
                { label:'Open', value: open.length, icon:'🔴', iconBg:'#fef2f2', color:'#dc2626', trend:'Awaiting action' },
                { label:'In Progress', value: inProgress.length, icon:'🔧', iconBg:'#fffbeb', color:'#d97706', trend:'Being worked on' },
                { label:'Overdue', value: overdue.length, icon:'⚠️', iconBg:'#fff7ed', color:'#ea580c', trend:'Past SLA deadline' },
                { label:'Resolved', value: resolved.length, icon:'✅', iconBg:'#f0fdf4', color:'#16a34a', trend:'Successfully closed' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-card-top">
                    <div>
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-value" style={{color:s.color}}>{s.value}</div>
                    </div>
                    <div className="stat-icon" style={{background:s.iconBg}}>{s.icon}</div>
                  </div>
                  <div className="stat-trend">{s.trend}</div>
                </div>
              ))}
            </div>

            <div className="filter-tabs">
              {[
                { key:'all', label:`All (${reports.length})` },
                { key:'open', label:`Open (${open.length})` },
                { key:'in_progress', label:`In Progress (${inProgress.length})` },
                { key:'resolved', label:`Resolved (${resolved.length})` },
                ...(overdue.length > 0 ? [{ key:'overdue', label:`⚠ Overdue (${overdue.length})` }] : []),
              ].map(t => (
                <button key={t.key} className={`tab ${filter===t.key?'active':''}`} onClick={() => setFilter(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="table-wrap">
              <div className="table-header">
                <span className="table-title">
                  {filter==='all'?'All Reports':filter==='open'?'Open Reports':filter==='in_progress'?'In Progress':filter==='overdue'?'⚠ Overdue':'Resolved Reports'}
                </span>
                <span className="table-count">{filtered.length} reports</span>
              </div>

              {loading ? (
                <div style={{padding:'48px',textAlign:'center',color:'var(--muted)'}}>Loading...</div>
              ) : filtered.length === 0 ? (
                <div style={{padding:'48px',textAlign:'center',color:'var(--muted)'}}>No reports found.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Issue</th>
                      <th>Severity</th>
                      <th>Department</th>
                      <th>Location</th>
                      <th>SLA</th>
                      <th>Status</th>
                      <th>Filed</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const days = daysUntil(r.sla_deadline)
                      const over = isOverdue(r)
                      const badge = statusBadge(r.status)
                      return (
                        <tr key={r.id} className={over?'overdue-row':''} onClick={() => setSelected(r)}>
                          <td>
                            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                              <div style={{fontWeight:500,textTransform:'capitalize'}}>{r.issue_type}</div>
                              {r.duplicate_count > 0 && (
                                <span style={{background:'#fff7ed',color:'#d97706',fontSize:'10px',fontWeight:600,padding:'1px 6px',borderRadius:'99px',whiteSpace:'nowrap'}}>
                                  🔁 {r.duplicate_count}x
                                </span>
                              )}
                              {r.original_report_id && (
                                <span style={{background:'#f3f4f6',color:'#6b7280',fontSize:'10px',fontWeight:500,padding:'1px 6px',borderRadius:'99px',whiteSpace:'nowrap'}}>
                                  duplicate
                                </span>
                              )}
                            </div>
                            {r.description && <div style={{fontSize:'11px',color:'var(--muted)',marginTop:'2px',maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.description}</div>}
                          </td>
                          <td><span className="badge" style={{background:severityBg(r.severity),color:severityColor(r.severity)}}>{r.severity}</span></td>
                          <td style={{fontSize:'12px',color:'var(--muted)'}}>{r.department}</td>
                          <td style={{fontSize:'11px',color:'var(--muted)',maxWidth:'160px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.address}</td>
                          <td>
                            {r.status==='resolved' ? <span style={{fontSize:'12px',color:'var(--muted)'}}>—</span>
                            : over ? <span className="badge" style={{background:'#fef2f2',color:'#dc2626'}}>⚠ Overdue</span>
                            : <span style={{fontSize:'12px',color:days<=1?'#ea580c':'#16a34a',fontFamily:'DM Mono,monospace'}}>{days}d left</span>}
                          </td>
                          <td><span className="badge" style={{background:badge.bg,color:badge.color}}>{badge.label}</span></td>
                          <td className="mono" style={{fontSize:'11px',color:'var(--muted)'}}>{new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
                          <td onClick={e => e.stopPropagation()}>
                            {r.status==='open' && (
                              <button className="resolve-btn" style={{background:'#d97706'}} onClick={(e) => { e.stopPropagation(); updateStatus(r.id,'in_progress') }}>
                                🔧 Start
                              </button>
                            )}
                            {r.status==='in_progress' && (
                              <button className="resolve-btn" onClick={(e) => { e.stopPropagation(); resolve(r.id) }} disabled={resolving===r.id}>
                                {resolving===r.id?'...':'✓ Resolve'}
                              </button>
                            )}
                            {r.status==='resolved' && <span style={{fontSize:'11px',color:'var(--muted)'}}>Done</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className={`detail-panel ${selected?'open':''}`}>
          {selected && (
            <>
              <div className="detail-header">
                <div>
                  <div style={{fontSize:'11px',letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'6px'}}>Report Detail</div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{fontSize:'18px',fontWeight:600,textTransform:'capitalize'}}>{selected.issue_type}</div>
                    {selected.duplicate_count > 0 && (
                      <span style={{background:'#fff7ed',color:'#d97706',fontSize:'11px',fontWeight:600,padding:'2px 8px',borderRadius:'99px'}}>
                        🔁 {selected.duplicate_count}x reported
                      </span>
                    )}
                  </div>
                </div>
                <button className="detail-close" onClick={() => setSelected(null)}>✕</button>
              </div>

              <div className="detail-body">
                {selected.photo_url && (
                  <div>
                    <div className="detail-field-label">Photo</div>
                    <img src={`${process.env.NEXT_PUBLIC_API_URL}${selected.photo_url}`} alt="Report photo" style={{width:'100%',height:'180px',objectFit:'cover',borderRadius:'8px',border:'1px solid var(--border)'}} />
                  </div>
                )}

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                  <div>
                    <div className="detail-field-label">Severity</div>
                    <span className="badge" style={{background:severityBg(selected.severity),color:severityColor(selected.severity)}}>{selected.severity}</span>
                  </div>
                  <div>
                    <div className="detail-field-label">Status</div>
                    <span className="badge" style={{background:statusBadge(selected.status).bg,color:statusBadge(selected.status).color}}>{statusBadge(selected.status).label}</span>
                  </div>
                </div>

                <div>
                  <div className="detail-field-label">Department</div>
                  <div className="detail-field-value">{selected.department}</div>
                </div>

                <div>
                  <div className="detail-field-label">SLA Deadline</div>
                  <div className="detail-field-value" style={{color:isOverdue(selected)?'#dc2626':'#16a34a'}}>
                    {new Date(selected.sla_deadline).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
                    {isOverdue(selected) && selected.status!=='resolved' && <span style={{fontSize:'12px',marginLeft:'8px',color:'#dc2626'}}>⚠ OVERDUE</span>}
                  </div>
                </div>

                {selected.duplicate_count > 0 && (
                  <div>
                    <div className="detail-field-label">Community Reports</div>
                    <div style={{background:'#fff7ed',border:'1px solid #fde68a',borderRadius:'6px',padding:'12px'}}>
                      <div style={{fontSize:'14px',fontWeight:600,color:'#d97706',marginBottom:'4px'}}>
                        🔁 {selected.duplicate_count + 1} citizens reported this issue
                      </div>
                      <div style={{fontSize:'12px',color:'#92400e',fontWeight:300,lineHeight:1.5}}>
                        Multiple reports from the same area — this is a high-priority issue.
                      </div>
                    </div>
                  </div>
                )}

                {selected.original_report_id && (
                  <div>
                    <div className="detail-field-label">Report Type</div>
                    <span style={{background:'#f3f4f6',color:'#6b7280',fontSize:'12px',padding:'4px 10px',borderRadius:'4px',fontWeight:500}}>
                      Linked duplicate — part of a larger report cluster
                    </span>
                  </div>
                )}

                {selected.description && (
                  <div>
                    <div className="detail-field-label">Description</div>
                    <div style={{fontSize:'14px',color:'#374151',lineHeight:1.6,fontWeight:300}}>{selected.description}</div>
                  </div>
                )}

                {selected.notes && (
                  <div>
                    <div className="detail-field-label">Admin Notes</div>
                    <div style={{fontSize:'13px',color:'#374151',lineHeight:1.6,fontWeight:300,background:'#fffbeb',padding:'10px 12px',borderRadius:'6px',border:'1px solid #fde68a'}}>{selected.notes}</div>
                  </div>
                )}

                <div>
                  <div className="detail-field-label">Location</div>
                  <div style={{fontSize:'13px',color:'var(--muted)',lineHeight:1.5}}>{selected.address}</div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                  <div>
                    <div className="detail-field-label">Latitude</div>
                    <div className="mono" style={{fontSize:'13px'}}>{selected.latitude?.toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="detail-field-label">Longitude</div>
                    <div className="mono" style={{fontSize:'13px'}}>{selected.longitude?.toFixed(4)}</div>
                  </div>
                </div>

                <div>
                  <div className="detail-field-label">Filed On</div>
                  <div className="mono" style={{fontSize:'13px'}}>{new Date(selected.created_at).toLocaleString('en-GB')}</div>
                </div>
              </div>

              <div className="detail-footer">
                {selected.status === 'resolved' ? (
                  <div style={{textAlign:'center',fontSize:'13px',color:'#16a34a',fontWeight:500}}>✓ This report has been resolved</div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <div style={{fontSize:'11px',letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500}}>Update Status</div>
                    <div style={{display:'flex',gap:'8px'}}>
                      {selected.status === 'open' && (
                        <button className="status-btn" onClick={() => updateStatus(selected.id,'in_progress')} disabled={updatingStatus} style={{background:'#fffbeb',color:'#d97706',borderColor:'#fde68a'}}>
                          🔧 In Progress
                        </button>
                      )}
                      <button className="status-btn" onClick={() => resolve(selected.id)} disabled={resolving===selected.id||updatingStatus} style={{background:'#16a34a',color:'white',border:'none'}}>
                        {resolving===selected.id?'Resolving...':'✓ Mark Resolved'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
