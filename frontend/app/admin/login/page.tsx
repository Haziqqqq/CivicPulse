'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const login = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        :root { --ink:#0d0d0d; --paper:#f5f0e8; --accent:#e63329; --muted:#9a9486; --border:#e2ddd6; --green:#1a7a4a; --bg:#faf8f4; }
        body { background:var(--bg); color:var(--ink); font-family:'DM Sans',sans-serif; }
        .display { font-family:'Bebas Neue',sans-serif; }
        .input {
          width:100%; padding:14px 16px;
          background:white; border:1px solid var(--border);
          border-radius:2px; color:var(--ink); font-size:14px;
          font-family:'DM Sans',sans-serif; outline:none; transition:border 0.2s;
        }
        .input:focus { border-color:var(--ink); }
        .input::placeholder { color:var(--muted); }
        .btn {
          width:100%; padding:16px;
          background:var(--accent); color:white; border:none;
          border-radius:2px; font-size:13px; font-weight:500;
          letter-spacing:0.08em; text-transform:uppercase;
          cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:background 0.2s;
        }
        .btn:hover:not(:disabled) { background:#c4251c; }
        .btn:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>

      <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex'}}>
        {/* Left panel */}
        <div style={{width:'50%',background:'var(--ink)',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'48px',position:'relative',overflow:'hidden'}}>
          {/* Background texture */}
          <div style={{position:'absolute',top:'-100px',right:'-100px',width:'400px',height:'400px',border:'1px solid rgba(255,255,255,0.04)',borderRadius:'50%'}} />
          <div style={{position:'absolute',bottom:'-150px',left:'-80px',width:'500px',height:'500px',border:'1px solid rgba(255,255,255,0.03)',borderRadius:'50%'}} />

          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:'12px',position:'relative'}}>
            <div style={{width:'36px',height:'36px',background:'var(--accent)',borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>⚡</div>
            <span style={{fontSize:'14px',fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase',color:'white'}}>CivicPulse</span>
          </div>

          {/* Center text */}
          <div style={{position:'relative'}}>
            <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',fontWeight:500,marginBottom:'24px'}}>— Admin Portal</div>
            <h1 className="display" style={{fontSize:'72px',lineHeight:0.9,color:'white',marginBottom:'24px'}}>
              MANAGE.<br/>
              RESOLVE.<br/>
              <span style={{color:'var(--accent)'}}>ACCOUNT.</span>
            </h1>
            <p style={{fontSize:'14px',color:'rgba(255,255,255,0.4)',fontWeight:300,lineHeight:1.7,maxWidth:'320px'}}>
              Monitor reports, track SLA deadlines, resolve issues, and hold departments accountable — all in one place.
            </p>
          </div>

          {/* Stats */}
          <div style={{display:'flex',gap:'32px',position:'relative'}}>
            {[
              { label:'Issue Types', value:'6' },
              { label:'Departments', value:'6' },
              { label:'SLA Tracked', value:'✓' },
            ].map(s => (
              <div key={s.label}>
                <div style={{fontSize:'24px',fontWeight:300,color:'white',fontFamily:'DM Mono,monospace'}}>{s.value}</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',letterSpacing:'0.06em',textTransform:'uppercase',marginTop:'4px'}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{width:'50%',display:'flex',alignItems:'center',justifyContent:'center',padding:'48px'}}>
          <div style={{width:'100%',maxWidth:'380px'}}>
            <div style={{marginBottom:'40px'}}>
              <div style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:'12px'}}>— Sign In</div>
              <h2 className="display" style={{fontSize:'48px',lineHeight:0.9,marginBottom:'12px'}}>WELCOME<br/>BACK</h2>
              <p style={{fontSize:'14px',color:'var(--muted)',fontWeight:300}}>Sign in to access the admin dashboard.</p>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <div>
                <label style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,display:'block',marginBottom:'8px'}}>
                  Email
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="admin@civicpulse.gov.bn"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && login()}
                />
              </div>

              <div>
                <label style={{fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,display:'block',marginBottom:'8px'}}>
                  Password
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && login()}
                />
              </div>

              {error && (
                <div style={{padding:'12px 16px',background:'rgba(230,51,41,0.06)',border:'1px solid rgba(230,51,41,0.2)',borderRadius:'2px',fontSize:'13px',color:'var(--accent)'}}>
                  {error}
                </div>
              )}

              <button className="btn" onClick={login} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </div>

            <p style={{textAlign:'center',marginTop:'32px',fontSize:'12px',color:'var(--muted)',fontWeight:300}}>
              CivicPulse Admin · HACKHAZARDS '26
            </p>
          </div>
        </div>
      </div>
    </>
  )
}