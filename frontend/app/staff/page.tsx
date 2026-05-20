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
  photo_url: string
  notes: string
}

interface StaffProfile {
  email: string
  name: string
  department: string
  role: string
}

export default function StaffDashboard() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState<StaffProfile | null>(null)
  const [selected, setSelected] = useState<Report | null>(null)
  const [updating, setUpdating] = useState(false)
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/staff/login'); return }

      // Get staff profile
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/staff/me?email=${data.user.email}`)
      const profile = res.data
      setStaff(profile)

      // If admin redirect to admin dashboard
      if (profile.role === 'admin') { router.push('/admin'); return }

      // Load department reports
      fetchReports(profile.department)
    }).catch(() => router.push('/staff/login'))
  }, [])

  const fetchReports = async (department: string) => {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports/department/${encodeURIComponent(department)}`)
    setReports(res.data)
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true)
    await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/status`, { status })
    await fetchReports(staff!.department)
    setSelected(prev => prev ? { ...prev, status } : null)
    setUpdating(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/staff/login')
  }

  const open = reports.filter(r => r.status === 'open')
  const inProgress = reports.filter(r => r.status === 'in_progress')
  const resolved = reports.filter(r => r.status === 'resolved')
  const overdue = reports.filter(r => r.status === 'open' && new Date() > new Date(r.sla_deadline))

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
  const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f9fafb',fontFamily:'DM Sans,sans-serif'}}>
      <div style={{fontSize:'14px',color:'#6b7280'}}>Loading your dashboard...</div>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        :root { --ink:#111827; --accent:#e63329; --muted:#6b7280; --border:#f3f4f6; --green:#16a34a; --bg:#f9fafb; }
        body { background:var(--bg); color:var(--ink); font-family:'DM Sans',sans-serif; }
        .mono { font-family:'DM Mono',monospace; }
        .topbar { background:white; border-bottom:1px solid var(--border); padding:16px 32px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
        .dept-badge { background:#f3f4f6; color:var(--ink); padding:6px 14px; border-radius:99px; font-size:12px; font-weight:500; }
        .btn { padding:8px 16px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; border:1px solid var(--border); background:white; color:var(--muted); transition:all 0.15s; }
        .btn:hover { border-color:#d1d5db; color:var(--ink); }
        .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; padding:24px 32px 0; }
        .stat { background:white; border:1px solid var(--border); border-radius:10px; padding:20px; }
        .stat-label { font-size:12px; color:var(--muted); font-weight:500; margin-bottom:8px; }
        .stat-value { font-size:32px; font-weight:300; font-family:'DM Mono',monospace; line-height:1; }
        .content { padding:24px 32px; }
        .filter-tabs { display:flex; gap:4px; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:4px; margin-bottom:16px; width:fit-content; }
        .tab { padding:7px 16px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; border:none; background:transparent; color:var(--muted); font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .tab.active { background:white; color:var(--ink); box-shadow:0 1px 3px rgba(0,0,0,0.08); }
        .table-wrap { background:white; border:1px solid var(--border); border-radius:10px; overflow:hidden; }
        .table-header { padding:16px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
        table { width:100%; border-collapse:collapse; }
        thead th { font-size:11px; letter-spacing:0.05em; text-transform:uppercase; color:var(--muted); font-weight:500; padding:12px 16px; border-bottom:1px solid var(--border); text-align:left; background:#fafafa; }
        tbody td { padding:14px 16px; border-bottom:1px solid var(--border); font-size:13px; vertical-align:middle; }
        tbody tr:last-child td { border-bottom:none; }
        tbody tr:hover td { background:#fafafa; cursor:pointer; }
        .overdue-row td { background:#fff8f8 !important; }
        .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:500; }
        .action-btn { padding:7px 14px; color:white; border:none; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; white-space:nowrap; }
        .detail-panel { position:fixed; right:0; top:0; bottom:0; width:400px; background:white; border-left:1px solid var(--border); z-index:200; transform:translateX(100%); transition:transform 0.25s ease; display:flex; flex-direction:column; box-shadow:-8px 0 24px rgba(0,0,0,0.06); }
        .detail-panel.open { transform:translateX(0); }
        .detail-header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; align-items:flex-start; justify-content:space-between; }
        .detail-close { width:28px; height:28px; border-radius:6px; border:1px solid var(--border); background:white; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; color:var(--muted); }
        .detail-body { padding:24px; flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:20px; }
        .field-label { font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--muted); font-weight:500; margin-bottom:6px; }
        .field-value { font-size:14px; font-weight:500; }
        .detail-footer { padding:20px 24px; border-top:1px solid var(--border); display:flex; flex-direction:column; gap:10px; }
        .status-btn { flex:1; padding:10px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; border:1px solid; transition:all 0.15s; }
      `}</style>

      <div style={{minHeight:'100vh',background:'var(--bg)'}}>
        {/* Topbar */}
        <div className="topbar">
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'32px',height:'32px',background:'#e63329',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>⚡</div>
            <div>
              <div style={{fontSize:'13px',fontWeight:600}}>CivicPulse</div>
              <div style={{fontSize:'11px',color:'var(--muted)'}}>Staff Portal</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <span className="dept-badge">{staff?.department}</span>
            <Link href="/map" target="_blank" className="btn">Public Map ↗</Link>
            <button className="btn" onClick={logout}>Sign Out</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats">
          {[
            { label:'Total Assigned', value: reports.length, color:'var(--ink)' },
            { label:'Open', value: open.length, color:'#dc2626' },
            { label:'In Progress', value: inProgress.length, color:'#d97706' },
            { label:'Resolved', value: resolved.length, color:'#16a34a' },
          ].map(s => (
            <div key={s.label} className="stat">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="content">
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
              <span style={{fontSize:'14px',fontWeight:600}}>
                {staff?.department} — Reports
              </span>
              <span style={{fontSize:'12px',color:'var(--muted)',background:'var(--bg)',padding:'3px 10px',borderRadius:'99px',fontFamily:'DM Mono,monospace'}}>
                {filtered.length} reports
              </span>
            </div>

            {filtered.length === 0 ? (
              <div style={{padding:'48px',textAlign:'center',color:'var(--muted)',fontSize:'14px'}}>
                No reports found. 🎉
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Severity</th>
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
                          <div style={{fontWeight:500,textTransform:'capitalize'}}>{r.issue_type}</div>
                          {r.description && <div style={{fontSize:'11px',color:'var(--muted)',marginTop:'2px',maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.description}</div>}
                        </td>
                        <td><span className="badge" style={{background:severityBg(r.severity),color:severityColor(r.severity)}}>{r.severity}</span></td>
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
                            <button className="action-btn" style={{background:'#d97706'}} onClick={(e) => { e.stopPropagation(); updateStatus(r.id,'in_progress') }}>
                              🔧 Start
                            </button>
                          )}
                          {r.status==='in_progress' && (
                            <button className="action-btn" style={{background:'#16a34a'}} onClick={(e) => { e.stopPropagation(); updateStatus(r.id,'resolved') }} disabled={updating}>
                              ✓ Resolve
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

      {/* Detail panel */}
      <div className={`detail-panel ${selected?'open':''}`}>
        {selected && (
          <>
            <div className="detail-header">
              <div>
                <div style={{fontSize:'11px',letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'6px'}}>Report Detail</div>
                <div style={{fontSize:'18px',fontWeight:600,textTransform:'capitalize'}}>{selected.issue_type}</div>
              </div>
              <button className="detail-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="detail-body">
              {selected.photo_url && (
                <div>
                  <div className="field-label">Photo</div>
                  <img src={`${process.env.NEXT_PUBLIC_API_URL}${selected.photo_url}`} alt="Report" style={{width:'100%',height:'180px',objectFit:'cover',borderRadius:'8px',border:'1px solid var(--border)'}} />
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                <div>
                  <div className="field-label">Severity</div>
                  <span className="badge" style={{background:severityBg(selected.severity),color:severityColor(selected.severity)}}>{selected.severity}</span>
                </div>
                <div>
                  <div className="field-label">Status</div>
                  <span className="badge" style={{background:statusBadge(selected.status).bg,color:statusBadge(selected.status).color}}>{statusBadge(selected.status).label}</span>
                </div>
              </div>
              <div>
                <div className="field-label">SLA Deadline</div>
                <div className="field-value" style={{color:isOverdue(selected)?'#dc2626':'#16a34a'}}>
                  {new Date(selected.sla_deadline).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
                  {isOverdue(selected) && selected.status!=='resolved' && <span style={{fontSize:'12px',marginLeft:'8px',color:'#dc2626'}}>⚠ OVERDUE</span>}
                </div>
              </div>
              {selected.description && (
                <div>
                  <div className="field-label">Description</div>
                  <div style={{fontSize:'14px',color:'#374151',lineHeight:1.6,fontWeight:300}}>{selected.description}</div>
                </div>
              )}
              <div>
                <div className="field-label">Location</div>
                <div style={{fontSize:'13px',color:'var(--muted)',lineHeight:1.5}}>{selected.address}</div>
              </div>
              <div>
                <div className="field-label">Filed On</div>
                <div className="mono" style={{fontSize:'13px'}}>{new Date(selected.created_at).toLocaleString('en-GB')}</div>
              </div>
            </div>

            <div className="detail-footer">
              {selected.status === 'resolved' ? (
                <div style={{textAlign:'center',fontSize:'13px',color:'#16a34a',fontWeight:500}}>✓ This report has been resolved</div>
              ) : (
                <>
                  <div style={{fontSize:'11px',letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500}}>Update Status</div>
                  <div style={{display:'flex',gap:'8px'}}>
                    {selected.status === 'open' && (
                      <button className="status-btn" onClick={() => updateStatus(selected.id,'in_progress')} disabled={updating} style={{background:'#fffbeb',color:'#d97706',borderColor:'#fde68a'}}>
                        🔧 Mark In Progress
                      </button>
                    )}
                    <button className="status-btn" onClick={() => updateStatus(selected.id,'resolved')} disabled={updating} style={{background:'#16a34a',color:'white',border:'none'}}>
                      {updating ? 'Updating...' : '✓ Mark Resolved'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}