'use client'
import { useState, useRef, useEffect } from 'react'
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
  const [locationMode, setLocationMode] = useState<'gps' | 'map' | 'manual'>('gps')
  const fileRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const mapInitialized = useRef(false)

  // Initialize map when map mode is selected
  useEffect(() => {
    if (locationMode !== 'map') return
    if (mapInitialized.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (mapInitialized.current) return
      mapInitialized.current = true

      const map = L.map('report-map').setView([4.9400, 114.9480], 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map)

      mapRef.current = map

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        setLocation({ lat, lng })

        // Remove existing marker
        if (markerRef.current) markerRef.current.remove()

        // Add new marker
        markerRef.current = L.marker([lat, lng]).addTo(map)

        // Reverse geocode
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await res.json()
          setAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        } catch {
          setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        }
      })
    }

    setTimeout(initMap, 100)
  }, [locationMode])

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
        setLocation({ lat: 4.9400, lng: 114.9480 })
        setAddress('Bandar Seri Begawan, Brunei')
        setStatus('idle')
      }
    )
  }

  const submit = async () => {
    if (!location) { alert('Please set a location first'); return }
    setStatus('submitting')
    try {
      const form = new FormData()
      if (photo) form.append('photo', photo)
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

  const switchMode = (mode: 'gps' | 'map' | 'manual') => {
    setLocationMode(mode)
    setLocation(null)
    setAddress('')
    if (mode !== 'map') mapInitialized.current = false
  }

  if (status === 'success' && result) {
    return (
      <>
        <Navbar />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          :root { --ink:#0d0d0d; --paper:#f5f0e8; --accent:#e63329; --muted:#9a9486; --border:#ddd8ce; --green:#1a7a4a; }
          body { background:var(--paper); color:var(--ink); font-family:'DM Sans',sans-serif; }
          .display { font-family:'Bebas Neue',sans-serif; }
          .mono { font-family:'DM Mono',monospace; }
        `}</style>
        <div style={{minHeight:'100vh',background:'var(--paper)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 24px',textAlign:'center'}}>
          <div style={{fontSize:'64px',marginBottom:'24px'}}>✅</div>
          <h1 className="display" style={{fontSize:'56px',marginBottom:'16px'}}>REPORT FILED</h1>
          <p style={{color:'var(--muted)',marginBottom:'40px',fontSize:'16px',fontWeight:300}}>
            Your report has been submitted and routed to the right department.
          </p>
          <div style={{background:'white',border:'1px solid var(--border)',borderRadius:'4px',padding:'32px',maxWidth:'480px',width:'100%',textAlign:'left',marginBottom:'32px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
              {[
                { label:'Issue Type', value: result.issue_type?.toUpperCase() },
                { label:'Severity', value: result.severity?.toUpperCase() },
                { label:'Repair Priority', value: result.repair_priority || '—' },
                { label:'Department', value: result.department },
                { label:'SLA Deadline', value: new Date(result.sla_deadline).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) },
                { label:'Detections', value: result.detections?.length != null ? String(result.detections.length) : '—' },
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
            <button onClick={() => { setStatus('idle'); setPhoto(null); setPreview(null); setDescription(''); setResult(null); setLocation(null); setAddress('') }}
              style={{padding:'14px 32px',border:'1px solid var(--border)',borderRadius:'2px',background:'transparent',cursor:'pointer',fontSize:'12px',fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:'DM Sans,sans-serif'}}>
              Report Another
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        :root { --ink:#0d0d0d; --paper:#f5f0e8; --accent:#e63329; --muted:#9a9486; --border:#ddd8ce; --green:#1a7a4a; }
        body { background:var(--paper); color:var(--ink); font-family:'DM Sans',sans-serif; }
        .display { font-family:'Bebas Neue',sans-serif; }
        .mono { font-family:'DM Mono',monospace; }
        .upload-zone { border:2px dashed var(--border); border-radius:4px; padding:48px 32px; text-align:center; cursor:pointer; transition:all 0.2s; background:white; }
        .upload-zone:hover { border-color:var(--ink); background:var(--paper); }
        .field-label { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; font-weight:500; color:var(--muted); margin-bottom:10px; display:block; }
        .field-input { width:100%; padding:14px 16px; border:1px solid var(--border); border-radius:2px; font-size:14px; font-family:'DM Sans',sans-serif; background:white; color:var(--ink); transition:border 0.2s; outline:none; }
        .field-input:focus { border-color:var(--ink); }
        .field-textarea { resize:vertical; min-height:100px; line-height:1.6; font-weight:300; }
        .mode-btn { flex:1; padding:10px 12px; border:1px solid var(--border); border-radius:2px; font-size:12px; font-weight:500; cursor:pointer; letter-spacing:0.04em; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
        .mode-btn.active { background:var(--ink); color:white; border-color:var(--ink); }
        .mode-btn:not(.active) { background:white; color:var(--muted); }
        .mode-btn:hover:not(.active) { border-color:var(--ink); color:var(--ink); }
        .submit-btn { width:100%; padding:18px; background:var(--accent); color:white; border:none; border-radius:2px; font-size:13px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        .submit-btn:hover:not(:disabled) { background:#c4251c; }
        .submit-btn:disabled { opacity:0.4; cursor:not-allowed; }
        #report-map { height:280px; width:100%; }
      `}</style>

      <div style={{minHeight:'100vh',background:'var(--paper)'}}>
        <div style={{maxWidth:'560px',margin:'0 auto',padding:'64px 24px'}}>
          <div style={{marginBottom:'48px'}}>
            <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:'16px'}}>
              — New Report
            </div>
            <h1 className="display" style={{fontSize:'64px',lineHeight:0.9,marginBottom:'16px'}}>
              REPORT AN<br/>
              <span style={{color:'var(--accent)'}}>ISSUE</span>
            </h1>
            <p style={{fontSize:'15px',color:'var(--muted)',fontWeight:300,lineHeight:1.6}}>
              Submit a photo and our AI will classify it, route it to the right department, and track the fix.
            </p>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'28px'}}>

            {/* Photo upload */}
            <div>
              <label className="field-label">Photo of the issue</label>
              {preview ? (
                <div style={{position:'relative'}}>
                  <img src={preview} alt="Preview" style={{width:'100%',height:'240px',objectFit:'cover',borderRadius:'4px',border:'1px solid var(--border)'}} />
                  <button onClick={() => { setPhoto(null); setPreview(null) }}
                    style={{position:'absolute',top:'12px',right:'12px',background:'var(--ink)',color:'white',border:'none',borderRadius:'2px',padding:'6px 12px',cursor:'pointer',fontSize:'11px',fontWeight:500,letterSpacing:'0.06em',fontFamily:'DM Sans,sans-serif'}}>
                    REMOVE
                  </button>
                </div>
              ) : (
                <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                  <div style={{fontSize:'48px',marginBottom:'16px'}}>📷</div>
                  <div style={{fontSize:'15px',fontWeight:500,marginBottom:'8px'}}>Click to upload a photo</div>
                  <div style={{fontSize:'13px',color:'var(--muted)',fontWeight:300}}>JPG, PNG, WEBP — AI will auto-classify it</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}} />
            </div>

            {/* Description */}
            <div>
              <label className="field-label">Description</label>
              <textarea
                className="field-input field-textarea"
                placeholder="Describe the issue — e.g. large pothole near the traffic light, flooding blocking the road..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Location */}
            <div>
              <label className="field-label">Location *</label>

              {/* Mode selector */}
              <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
                <button className={`mode-btn ${locationMode==='gps'?'active':''}`} onClick={() => switchMode('gps')}>
                  📍 My Location
                </button>
                <button className={`mode-btn ${locationMode==='map'?'active':''}`} onClick={() => switchMode('map')}>
                  🗺️ Pin on Map
                </button>
                <button className={`mode-btn ${locationMode==='manual'?'active':''}`} onClick={() => switchMode('manual')}>
                  ✏️ Type Address
                </button>
              </div>

              {/* GPS mode */}
              {locationMode === 'gps' && (
                <div>
                  <button
                    onClick={getLocation}
                    disabled={status === 'locating'}
                    style={{width:'100%',padding:'14px 16px',border:'1px solid var(--border)',borderRadius:'2px',background: location ? '#f0fdf4' : 'white',cursor:'pointer',fontSize:'14px',fontWeight:500,fontFamily:'DM Sans,sans-serif',color: location ? 'var(--green)' : 'var(--ink)',textAlign:'left',transition:'all 0.2s',borderColor: location ? '#bbf7d0' : 'var(--border)'}}>
                    {status === 'locating' ? '⏳ Getting your location...' : location ? `✓ ${address.slice(0,70)}${address.length > 70 ? '...' : ''}` : '📍 Click to detect my current location'}
                  </button>
                  {!location && (
                    <div style={{fontSize:'11px',color:'var(--muted)',marginTop:'6px'}}>
                      Best used when you are at the location of the issue.
                    </div>
                  )}
                </div>
              )}

              {/* Map picker mode */}
              {locationMode === 'map' && (
                <div style={{border:'1px solid var(--border)',borderRadius:'2px',overflow:'hidden'}}>
                  <div style={{padding:'10px 14px',background:'#f9f9f7',fontSize:'12px',color:'var(--muted)',borderBottom:'1px solid var(--border)'}}>
                    🖱️ Click anywhere on the map to pin the issue location
                  </div>
                  <div id="report-map" />
                  {location && (
                    <div style={{padding:'10px 14px',background:'#f0fdf4',fontSize:'12px',color:'var(--green)',borderTop:'1px solid #bbf7d0',fontWeight:500}}>
                      ✓ {address.slice(0,80)}{address.length > 80 ? '...' : ''}
                    </div>
                  )}
                  {!location && (
                    <div style={{padding:'10px 14px',background:'#fffbeb',fontSize:'12px',color:'#d97706',borderTop:'1px solid #fde68a'}}>
                      No location pinned yet — click on the map above
                    </div>
                  )}
                </div>
              )}

              {/* Manual address mode */}
              {locationMode === 'manual' && (
                <div>
                  <input
                    className="field-input"
                    type="text"
                    placeholder="e.g. Jalan Tutong, near traffic light, BSB"
                    value={address}
                    onChange={e => {
                      setAddress(e.target.value)
                      if (!location) setLocation({ lat: 4.9400, lng: 114.9480 })
                    }}
                  />
                  <div style={{fontSize:'11px',color:'var(--muted)',marginTop:'6px',lineHeight:1.6}}>
                    Be specific — include road names, landmarks, or area names. Useful when reporting an issue you saw while driving.
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              className="submit-btn"
              onClick={submit}
              disabled={status === 'submitting' || !location}
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
