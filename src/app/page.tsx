import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen" style={{background:'#0a0e14',color:'#e8edf5',fontFamily:'system-ui,sans-serif'}}>

      {/* NAV */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'0 2rem',height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(10,14,20,0.9)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg,#c8973a,#e8b85a)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'13px',color:'#0a0e14'}}>TC</div>
          <span style={{fontWeight:'700',fontSize:'17px'}}>Tax<span style={{color:'#c8973a'}}>Clarity</span></span>
        </div>
        <Link href="/open1040" style={{background:'#c8973a',color:'#0a0e14',padding:'8px 18px',borderRadius:'7px',fontWeight:'600',fontSize:'14px',textDecoration:'none'}}>
          Start Free Return →
        </Link>
      </nav>

      {/* HERO */}
      <section style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'120px 2rem 80px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'60px 60px',maskImage:'radial-gradient(ellipse 80% 60% at 50% 0%,black 40%,transparent 100%)'}}/>
        <div style={{position:'absolute',top:'-200px',left:'50%',transform:'translateX(-50%)',width:'700px',height:'600px',background:'radial-gradient(ellipse,rgba(200,151,58,0.13) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',maxWidth:'800px'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(200,151,58,0.1)',border:'1px solid rgba(200,151,58,0.25)',color:'#e8b85a',padding:'6px 16px',borderRadius:'100px',fontSize:'12px',fontWeight:'500',letterSpacing:'0.8px',textTransform:'uppercase',marginBottom:'2rem'}}>
            <span style={{width:'6px',height:'6px',background:'#c8973a',borderRadius:'50%',display:'inline-block'}}/>
            Free · Open Source · No Paywalls
          </div>
          <h1 style={{fontSize:'clamp(2.8rem,7vw,5rem)',fontWeight:'800',lineHeight:'1.0',letterSpacing:'-2px',marginBottom:'1.5rem'}}>
            Tax tools that<br/>actually <span style={{background:'linear-gradient(135deg,#c8973a,#e8b85a)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>work for you.</span>
          </h1>
          <p style={{fontSize:'1.15rem',color:'#7a8898',maxWidth:'520px',margin:'0 auto 2.5rem',lineHeight:'1.7',fontWeight:'300'}}>
            Simple, transparent tax preparation and calculation tools. No upsells. No account required. Just the clarity you deserve.
          </p>
          <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/open1040" style={{background:'#c8973a',color:'#0a0e14',padding:'14px 28px',borderRadius:'8px',fontWeight:'600',fontSize:'15px',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'8px'}}>
              Start Free Return →
            </Link>
            <a href="#tools" style={{background:'transparent',color:'#7a8898',padding:'14px 28px',borderRadius:'8px',fontWeight:'400',fontSize:'15px',textDecoration:'none',border:'1px solid rgba(255,255,255,0.08)',display:'inline-flex',alignItems:'center',gap:'8px'}}>
              See All Tools
            </a>
          </div>
          <div style={{display:'flex',justifyContent:'center',gap:'3rem',marginTop:'4rem',paddingTop:'3rem',borderTop:'1px solid rgba(255,255,255,0.07)',flexWrap:'wrap'}}>
            {[['$0','Cost, forever'],['100%','Browser-based'],['0','Data stored'],['MIT','Open source']].map(([v,l])=>(
              <div key={l} style={{textAlign:'center'}}>
                <div style={{fontSize:'2rem',fontWeight:'800',letterSpacing:'-1px'}}>{v}</div>
                <div style={{fontSize:'12px',color:'#4a5568',letterSpacing:'0.5px',textTransform:'uppercase',marginTop:'4px'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section id="tools" style={{maxWidth:'1060px',margin:'0 auto',padding:'4rem 2rem 6rem'}}>
        <div style={{fontSize:'11px',fontWeight:'500',letterSpacing:'2px',textTransform:'uppercase',color:'#c8973a',marginBottom:'0.75rem'}}>Platform</div>
        <h2 style={{fontSize:'clamp(1.8rem,4vw,2.6rem)',fontWeight:'800',letterSpacing:'-1px',marginBottom:'0.75rem',lineHeight:'1.1'}}>Free tools.<br/>No strings attached.</h2>
        <p style={{color:'#7a8898',fontSize:'15px',fontWeight:'300',maxWidth:'480px',lineHeight:'1.7',marginBottom:'3rem'}}>Every tool on TaxClarity is free, open source, and runs in your browser. Your data never leaves your device.</p>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'1.25rem'}}>

          {/* Open1040 */}
          <Link href="/open1040" style={{background:'#0f1520',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'2rem',textDecoration:'none',color:'inherit',display:'block',transition:'all 0.2s',position:'relative'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.25rem'}}>
              <div style={{width:'46px',height:'46px',borderRadius:'12px',background:'rgba(45,212,191,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>📋</div>
              <span style={{fontSize:'11px',fontWeight:'500',padding:'4px 10px',borderRadius:'100px',background:'rgba(74,222,128,0.1)',color:'#4ade80',border:'1px solid rgba(74,222,128,0.2)'}}>Live</span>
            </div>
            <div style={{fontWeight:'700',fontSize:'1.2rem',letterSpacing:'-0.5px',marginBottom:'0.5rem'}}>Open1040</div>
            <div style={{fontSize:'14px',color:'#7a8898',lineHeight:'1.6',fontWeight:'300',marginBottom:'1.25rem'}}>Free federal tax preparation for simple returns. W-2 income, standard deduction, plain-English explanations of every calculation.</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
              {['Single filers','W-2 income','2025 tax year','No account'].map(t=>(
                <span key={t} style={{fontSize:'11px',color:'#4a5568',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',padding:'3px 10px',borderRadius:'100px'}}>{t}</span>
              ))}
            </div>
          </Link>

          {/* OT Calc */}
          <a href="https://overtime.taxclarity.io" style={{background:'#0f1520',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'2rem',textDecoration:'none',color:'inherit',display:'block',position:'relative'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.25rem'}}>
              <div style={{width:'46px',height:'46px',borderRadius:'12px',background:'rgba(200,151,58,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>⏱️</div>
              <span style={{fontSize:'11px',fontWeight:'500',padding:'4px 10px',borderRadius:'100px',background:'rgba(74,222,128,0.1)',color:'#4ade80',border:'1px solid rgba(74,222,128,0.2)'}}>Live</span>
            </div>
            <div style={{fontWeight:'700',fontSize:'1.2rem',letterSpacing:'-0.5px',marginBottom:'0.5rem'}}>OT Tax Calculator</div>
            <div style={{fontSize:'14px',color:'#7a8898',lineHeight:'1.6',fontWeight:'300',marginBottom:'1.25rem'}}>Calculate your net overtime pay after taxes. Enter your rate and hours — see exactly what you take home.</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
              {['Overtime pay','Net income','Instant results'].map(t=>(
                <span key={t} style={{fontSize:'11px',color:'#4a5568',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',padding:'3px 10px',borderRadius:'100px'}}>{t}</span>
              ))}
            </div>
          </a>

          {/* Tax Diagnostic */}
          <Link href="/prepare" style={{background:'#0f1520',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'2rem',textDecoration:'none',color:'inherit',display:'block',transition:'all 0.2s',position:'relative'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.25rem'}}>
              <div style={{width:'46px',height:'46px',borderRadius:'12px',background:'rgba(96,165,250,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>🔍</div>
              <span style={{fontSize:'11px',fontWeight:'500',padding:'4px 10px',borderRadius:'100px',background:'rgba(74,222,128,0.1)',color:'#4ade80',border:'1px solid rgba(74,222,128,0.2)'}}>Live</span>
            </div>
            <div style={{fontWeight:'700',fontSize:'1.2rem',letterSpacing:'-0.5px',marginBottom:'0.5rem'}}>Tax Diagnostic</div>
            <div style={{fontSize:'14px',color:'#7a8898',lineHeight:'1.6',fontWeight:'300',marginBottom:'1.25rem'}}>Answer a few questions, organize what you have, and walk into your CPA appointment with a structured summary instead of a shoebox.</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
              {['Pre-file organizer','Document checklist','CPA-ready summary'].map(t=>(
                <span key={t} style={{fontSize:'11px',color:'#4a5568',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',padding:'3px 10px',borderRadius:'100px'}}>{t}</span>
              ))}
            </div>
          </Link>

        </div>
      </section>

      {/* MISSION */}
      <section style={{borderTop:'1px solid rgba(255,255,255,0.07)',borderBottom:'1px solid rgba(255,255,255,0.07)',background:'#0d1117',padding:'5rem 2rem'}}>
        <div style={{maxWidth:'1060px',margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'center'}}>
          <div>
            <div style={{fontSize:'11px',fontWeight:'500',letterSpacing:'2px',textTransform:'uppercase',color:'#c8973a',marginBottom:'1rem'}}>Why we exist</div>
            <div style={{fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:'700',lineHeight:'1.3',letterSpacing:'-0.5px'}}>
              Simple tax prep <span style={{color:'#c8973a'}}>doesn&apos;t need</span> to cost anything.
            </div>
          </div>
          <div style={{color:'#7a8898',fontSize:'15px',fontWeight:'300',lineHeight:'1.8'}}>
            <p>TurboTax charges up to $169 for a simple return. For millions of Americans with straightforward W-2 income, that&apos;s a tax on filing your taxes.</p>
            <p style={{marginTop:'1rem'}}>TaxClarity exists to prove it doesn&apos;t have to be this way. Free, transparent, open source. No upsells. No dark patterns.</p>
            <p style={{marginTop:'1.5rem',fontSize:'12px',color:'#4a5568',letterSpacing:'0.5px',textTransform:'uppercase'}}>A Brownefield Holdings Public Service Project</p>
          </div>
        </div>
      </section>

      {/* CPA */}
      <section style={{maxWidth:'1060px',margin:'0 auto',padding:'5rem 2rem'}}>
        <div style={{background:'linear-gradient(135deg,rgba(200,151,58,0.08),rgba(45,212,191,0.04))',border:'1px solid rgba(200,151,58,0.2)',borderRadius:'18px',padding:'3rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'2rem',flexWrap:'wrap'}}>
          <div>
            <h3 style={{fontWeight:'700',fontSize:'1.5rem',letterSpacing:'-0.5px',marginBottom:'0.5rem'}}>Are you a CPA or enrolled agent?</h3>
            <p style={{color:'#7a8898',fontSize:'14px',fontWeight:'300',maxWidth:'400px',lineHeight:'1.7'}}>Send clients here before their appointment. They arrive organized with a structured summary — so you spend your time on judgment, not data gathering.</p>
          </div>
          <a href="mailto:hello@taxclarity.io" style={{background:'#c8973a',color:'#0a0e14',padding:'14px 24px',borderRadius:'8px',fontWeight:'600',fontSize:'14px',textDecoration:'none',whiteSpace:'nowrap'}}>Request Early Access →</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid rgba(255,255,255,0.07)',padding:'2.5rem 2rem'}}>
        <div style={{maxWidth:'1060px',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <span style={{fontWeight:'700',fontSize:'15px',color:'#7a8898'}}>Tax<span style={{color:'#c8973a'}}>Clarity</span></span>
            <span style={{width:'1px',height:'16px',background:'rgba(255,255,255,0.07)',display:'inline-block'}}/>
            <span style={{fontSize:'13px',color:'#334155'}}>A Brownefield Holdings project · MIT License</span>
          </div>
          <div style={{display:'flex',gap:'1.5rem'}}>
            <a href="https://github.com/brownefieldio/open1040" target="_blank" rel="noreferrer" style={{fontSize:'13px',color:'#334155',textDecoration:'none'}}>GitHub</a>
            <Link href="/open1040" style={{fontSize:'13px',color:'#334155',textDecoration:'none'}}>Open1040</Link>
            <Link href="/prepare" style={{fontSize:'13px',color:'#334155',textDecoration:'none'}}>Tax Diagnostic</Link>
            <a href="https://overtime.taxclarity.io" style={{fontSize:'13px',color:'#334155',textDecoration:'none'}}>OT Calculator</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
