'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import axios from 'axios'
import Navbar from '../../components/Navbar'

export default function ReportPage() {
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<'idle' | 'locating' | 'submitting' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const getLocation = () => {
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLocation({ lat, lng })
        // Reverse geocode using free API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await res.json()
          setAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        } catch {
          setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        }
        setStatus('idle')
      },
      () => {
        // Fallback to BSB coords if denied
        setLocation({ lat: 4.9400, lng: 114.9480 })
        setAddress('Bandar Seri Begawan, Brunei')
        setStatus('idle')
      }
    )
  }

  const submit = async () => {
    if (!photo) { alert('Please upload a photo'); return }
    if (!location) { alert('Please get your location first'); return }

    setStatus('submitting')
    try {
      const form = new FormData()
      form.append('photo', photo)
      form.append('description', description)
      form.append('latitude', String(location.lat))
      form.append('longitude', String(location.lng))
      form.append('address', address)

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reports`, form)
      setResult(res.data)
      setStatus('success')
    } catch (err) {
      setStatus('error')
    }
  }

  if (status === 'success' && result) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          :root { --ink:#0d0d0d; --paper:#f5f0e8; --accent:#e63329; --muted:#9a9486; --border:#ddd8ce; --green:#1a7a4a; }
          body { background:var(--paper); color:var(--ink); font-family:'DM Sans',sans-serif; }
          .mono { font-family:'DM Mono',monospace; }
          .display { font-family:'Bebas Neue',sans-serif; }
        `}</style>
        <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 24px',textAlign:'center'}}>
          <div style={{fontSize:'64px',marginBottom:'24px'}}>✅</div>
          <h1 className="display" style={{fontSize:'56px',marginBottom:'16px'}}>REPORT FILED</h1>
          <p style={{color:'var(--muted)',marginBottom:'40px',fontSize:'16px',fontWeight:300}}>
            Your report has been submitted and routed to the right department.
          </p>
          <div style={{background:'white',border:'1px solid var(--border)',borderRadius:'4px',padding:'32px',maxWidth:'480px',width:'100%',textAlign:'left',marginBottom:'32px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
              {[
                { label: 'Issue Type', value: result.issue_type?.toUpperCase() },
                { label: 'Severity', value: result.severity?.toUpperCase() },
                { label: 'Department', value: result.department },
                { label: 'SLA Deadline', value: new Date(result.sla_deadline).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'}) },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{fontSize:'10px',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'6px',fontWeight:500}}>{item.label}</div>
                  <div className="mono" style={{fontSize:'14px',fontWeight:500}}>{item.value}</div>
                </div>
              ))}
            </div>
            {result.ai_notes && (
              <div style={{marginTop:'24px',paddingTop:'24px',borderTop:'1px solid var(--border)'}}>
                <div style={{fontSize:'10px',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'6px',fontWeight:500}}>AI Notes</div>
                <div style={{fontSize:'13px',color:'#444',fontWeight:300,lineHeight:1.6}}>{result.ai_notes}</div>
              </div>
            )}
          </div>
          <div style={{display:'flex',gap:'16px'}}>
            <Link href="/map" style={{background:'var(--ink)',color:'var(--paper)',padding:'14px 32px',borderRadius:'2px',textDecoration:'none',fontSize:'12px',fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase'}}>
              View on Map →
            </Link>
            <button onClick={() => { setStatus('idle'); setPhoto(null); setPreview(null); setDescription(''); setResult(null) }}
              style={{padding:'14px 32px',border:'1px solid var(--border)',borderRadius:'2px',background:'transparent',cursor:'pointer',fontSize:'12px',fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase'}}>
              Report Another
            </button>
          </div>
        </div>
      </>
    )
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
        .upload-zone {
          border: 2px dashed var(--border); border-radius:4px;
          padding: 64px 32px; text-align:center; cursor:pointer;
          transition: all 0.2s; background: white;
        }
        .upload-zone:hover { border-color: var(--ink); background: var(--paper); }
        .upload-icon { font-size:48px; margin-bottom:16px; }
        .upload-label { font-size:15px; font-weight:500; margin-bottom:8px; }
        .upload-sub { font-size:13px; color:var(--muted); font-weight:300; }
        .field-label { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; font-weight:500; color:var(--muted); margin-bottom:10px; display:block; }
        .field-input {
          width:100%; padding:14px 16px; border:1px solid var(--border);
          border-radius:2px; font-size:14px; font-family:'DM Sans',sans-serif;
          background:white; color:var(--ink); transition:border 0.2s;
          outline:none;
        }
        .field-input:focus { border-color:var(--ink); }
        .field-textarea { resize:vertical; min-height:100px; line-height:1.6; font-weight:300; }
        .loc-btn {
          display:flex; align-items:center; gap:8px;
          padding:14px 20px; border:1px solid var(--border);
          border-radius:2px; background:white; cursor:pointer;
          font-size:13px; font-weight:500; letter-spacing:0.04em;
          color:var(--ink); transition:all 0.2s; width:100%;
        }
        .loc-btn:hover { border-color:var(--ink); }
        .loc-btn.got { border-color:var(--green); color:var(--green); }
        .submit-btn {
          width:100%; padding:18px; background:var(--accent); color:white;
          border:none; border-radius:2px; font-size:13px; font-weight:500;
          letter-spacing:0.08em; text-transform:uppercase; cursor:pointer;
          transition:all 0.2s; font-family:'DM Sans',sans-serif;
        }
        .submit-btn:hover:not(:disabled) { background:#c4251c; }
        .submit-btn:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>

      <div style={{minHeight:'100vh',background:'var(--paper)'}}>
        {/* Nav */}
        <Navbar active="report" />

        <div style={{maxWidth:'560px',margin:'0 auto',padding:'64px 24px'}}>
          {/* Header */}
          <div style={{marginBottom:'48px'}}>
            <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:'16px'}}>
              — New Report
            </div>
            <h1 className="display" style={{fontSize:'64px',lineHeight:0.9,marginBottom:'16px'}}>
              REPORT AN<br/>
              <span style={{color:'var(--accent)'}}>ISSUE</span>
            </h1>
            <p style={{fontSize:'15px',color:'var(--muted)',fontWeight:300,lineHeight:1.6}}>
              Take a photo and our AI will classify it, route it to the right department, and track the fix.
            </p>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'28px'}}>
            {/* Photo upload */}
            <div>
              <label className="field-label">Photo of the issue *</label>
              {preview ? (
                <div style={{position:'relative'}}>
                  <img src={preview} alt="Preview" style={{width:'100%',height:'240px',objectFit:'cover',borderRadius:'4px',border:'1px solid var(--border)'}} />
                  <button onClick={() => { setPhoto(null); setPreview(null) }}
                    style={{position:'absolute',top:'12px',right:'12px',background:'var(--ink)',color:'white',border:'none',borderRadius:'2px',padding:'6px 12px',cursor:'pointer',fontSize:'11px',fontWeight:500,letterSpacing:'0.06em'}}>
                    REMOVE
                  </button>
                </div>
              ) : (
                <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                  <div className="upload-icon">📷</div>
                  <div className="upload-label">Click to upload a photo</div>
                  <div className="upload-sub">JPG, PNG, WEBP — AI will auto-classify it</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}} />
            </div>

            {/* Description */}
            <div>
              <label className="field-label">Description</label>
              <textarea
                className="field-input field-textarea"
                placeholder="Describe the issue — e.g. large pothole near the traffic light..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Location */}
            <div>
              <label className="field-label">Location *</label>
              <button className={`loc-btn ${location ? 'got' : ''}`} onClick={getLocation} disabled={status === 'locating'}>
                {status === 'locating' ? '⏳ Getting location...' : location ? `✓ ${address.slice(0, 60)}...` : '📍 Use my current location'}
              </button>
            </div>

            {/* Submit */}
            <button
              className="submit-btn"
              onClick={submit}
              disabled={status === 'submitting' || !photo || !location}
            >
              {status === 'submitting' ? '⏳ Analysing & Submitting...' : '📨 Submit Report'}
            </button>

            {status === 'error' && (
              <div style={{padding:'16px',background:'#fee',border:'1px solid #fcc',borderRadius:'2px',fontSize:'13px',color:'var(--accent)'}}>
                Something went wrong. Make sure your backend is running on port 4000.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}