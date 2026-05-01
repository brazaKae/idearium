/* ============================================================
   KARE OS — UI components: windows, dialogs, screens
   ============================================================ */

// ── Window chrome with striped title bar ─────────────────────
function KareWindow({ title, w, h, children, x=0, y=0, position='absolute', tools=true }) {
  return (
    <div style={{
      position, left:x, top:y, width:w, height:h,
      background:'#F4EFD8', border:'2px solid #1E2D5F',
      boxShadow:'4px 4px 0 #1E2D5F',
      fontFamily:"'Pixelify Sans', monospace", color:'#1E2D5F',
      display:'flex', flexDirection:'column', overflow:'hidden',
    }}>
      <div style={{
        height:22, background:'#F4EFD8', borderBottom:'2px solid #1E2D5F',
        display:'flex', alignItems:'center', padding:'0 6px', gap:6,
        backgroundImage:`repeating-linear-gradient(0deg, #1E2D5F 0px, #1E2D5F 1px, transparent 1px, transparent 4px)`,
      }}>
        {tools && <div style={{width:14, height:14, border:'2px solid #1E2D5F', background:'#F4EFD8'}}/>}
        <div style={{
          flex:1, textAlign:'center', background:'#F4EFD8',
          fontSize:12, padding:'1px 8px', fontWeight:700,
          margin:'0 4px',
        }}>{title}</div>
        {tools && <>
          <div style={{width:14, height:14, border:'2px solid #1E2D5F', background:'#F4EFD8'}}/>
          <div style={{width:14, height:14, border:'2px solid #1E2D5F', background:'#1E2D5F'}}/>
        </>}
      </div>
      <div style={{flex:1, overflow:'hidden'}}>{children}</div>
    </div>
  );
}

// ── BOOT SCREEN ──────────────────────────────────────────────
function BootScreen() {
  return (
    <div style={{
      width:'100%', height:'100%', background:'#0A1F4D', position:'relative',
      display:'flex', alignItems:'center', justifyContent:'center',
      flexDirection:'column', gap:30, fontFamily:"'Pixelify Sans', monospace", color:'#F4EFD8',
      backgroundImage:`radial-gradient(circle at 1px 1px, rgba(255,247,224,0.06) 1px, transparent 0)`,
      backgroundSize:'4px 4px',
    }}>
      <Icon name="mac" scale={6} color="#F4EFD8" />
      <div style={{fontFamily:"'Silkscreen', monospace", fontSize:36, textShadow:'4px 4px 0 #000'}}>
        IDEARIUM
      </div>
      <div style={{fontSize:16, letterSpacing:'0.1em'}}>
        Bem-vindo ao Idearium <span style={{animation:'blink-soft 1s infinite'}}>_</span>
      </div>
      <div style={{
        width:300, height:14, border:'2px solid #F4EFD8',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{
          width:'72%', height:'100%',
          background:`repeating-linear-gradient(90deg, #F4EFD8 0px, #F4EFD8 4px, transparent 4px, transparent 8px)`,
        }}/>
      </div>
      <div style={{fontSize:11, opacity:0.7, fontFamily:"'JetBrains Mono', monospace"}}>
        carregando 64 RFCs · 12 labs · 412 cartas · system 4.7 ©2026
      </div>

      <div style={{
        position:'absolute', bottom:24, left:24, right:24,
        display:'flex', justifyContent:'space-between', fontSize:10, opacity:0.5,
      }}>
        <span>v.4.7</span>
        <span>licenciado para: leitor</span>
      </div>
    </div>
  );
}

// ── MENU BAR ─────────────────────────────────────────────────
function MenuBar() {
  return (
    <div style={{
      position:'absolute', top:0, left:0, right:0, height:22,
      background:'#F4EFD8', borderBottom:'2px solid #1E2D5F',
      display:'flex', alignItems:'center', padding:'0 12px', gap:18,
      fontSize:13, color:'#1E2D5F', fontFamily:"'Pixelify Sans', monospace", zIndex:50,
    }}>
      <Icon name="apple" scale={2} />
      <span style={{fontWeight:700}}>Idearium</span>
      <span>Arquivo</span><span>Editar</span><span>Exibir</span><span>Lab</span><span>RFC</span><span>Janela</span>
      <span style={{marginLeft:'auto'}}>Quinta · 14:32 · 64 RFCs ativos</span>
    </div>
  );
}

// ── DESKTOP — many windows open ─────────────────────────────
function Desktop() {
  return (
    <div style={{
      width:'100%', height:'100%', position:'relative', overflow:'hidden',
      background:'#D8602E',
      backgroundImage:`radial-gradient(circle at 1px 1px, rgba(255,247,224,0.18) 1px, transparent 0)`,
      backgroundSize:'4px 4px',
    }}>
      <MenuBar />

      {/* Desktop icons */}
      <DesktopIcon name="brain"  label="Lab.Cidade" x={28}  y={48} />
      <DesktopIcon name="folder" label="RFCs"       x={28}  y={150} />
      <DesktopIcon name="doc"    label="Manifesto"  x={28}  y={252} />
      <DesktopIcon name="floppy" label="Arquivo"    x={28}  y={354} />

      <DesktopIcon name="clock"  label="Pauta"      x={1170} y={48} />
      <DesktopIcon name="stamp"  label="Carimbos"   x={1170} y={150} />
      <DesktopIcon name="bomb"   label="Polêmicas"  x={1170} y={252} />
      <DesktopIcon name="trash"  label="Vetadas"    x={1170} y={580} selected />

      {/* RFC viewer window — large */}
      <KareWindow title="RFC-0011 — Enchentes urbanas e infra cinza" w={620} h={400} x={150} y={56}>
        <div style={{padding:'14px 18px', display:'grid', gridTemplateColumns:'1fr 180px', gap:14, height:'100%'}}>
          <div>
            <div style={{
              fontFamily:"'Silkscreen', monospace", fontSize:16, lineHeight:1.3,
              letterSpacing:'-0.02em',
            }}>
              ENCHENTES.<br/>URBANAS.exe
            </div>
            <div style={{marginTop:10, fontSize:13, lineHeight:1.5}}>
              Toda chuva de 50mm em São Paulo expõe um mesmo bug: a infraestrutura cinza está otimizada para o século passado. Esta proposta pede que tratemos a permeabilidade como uma camada de software a ser reinstalada. Não pede mais piscinões.
            </div>
            <div style={{marginTop:10, fontSize:13, lineHeight:1.5}}>
              <span style={{fontWeight:700}}>1.</span> Mapear as bacias.{' '}
              <span style={{fontWeight:700}}>2.</span> Substituir asfalto por blocos drenantes em áreas-piloto.{' '}
              <span style={{fontWeight:700}}>3.</span> Criar corredores ripários onde houver espaço.
            </div>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:6, fontSize:10}}>
            <div style={{background:'#1E2D5F', color:'#F4EFD8', padding:'3px 6px', textAlign:'center', fontWeight:700, letterSpacing:'0.05em'}}>METADADOS</div>
            <Row k="autor" v="m. brando"/>
            <Row k="lab" v="cidade"/>
            <Row k="status" v="discussão"/>
            <Row k="dias" v="14"/>
            <Row k="cartas" v="07"/>
            <div style={{marginTop:6, height:48, border:'1px solid #1E2D5F', position:'relative'}}>
              <svg width="100%" height="100%" viewBox="0 0 200 48" preserveAspectRatio="none">
                <path d="M 0 40 L 30 35 L 60 25 L 100 18 L 140 12 L 180 6 L 200 4" stroke="#1E2D5F" strokeWidth="2" fill="none"/>
              </svg>
              <div style={{position:'absolute', top:2, left:4, fontSize:8}}>engajamento</div>
            </div>
          </div>
        </div>
      </KareWindow>

      {/* Lab Finder small window */}
      <KareWindow title="Lab.Cidade" w={420} h={280} x={780} y={86}>
        <div style={{padding:'10px 14px', height:'100%', display:'flex', flexDirection:'column', gap:6}}>
          <div style={{display:'flex', alignItems:'center', gap:10, paddingBottom:8, borderBottom:'1px dashed #1E2D5F'}}>
            <Icon name="city" scale={3} />
            <div>
              <div style={{fontSize:13, fontWeight:700}}>Laboratório Cidade</div>
              <div style={{fontSize:10, opacity:0.7}}>14 membros · 22 RFCs · ativo desde 2024</div>
            </div>
          </div>
          {[
            {n:'RFC-0011', t:'Enchentes urbanas', s:'★'},
            {n:'RFC-0012', t:'Reflorestar o asfalto', s:'★'},
            {n:'RFC-0013', t:'Mobilidade ativa', s:'△'},
            {n:'RFC-0021', t:'Patrimônio digital', s:'★'},
          ].map((r,i)=>(
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'80px 1fr 16px', gap:8,
              fontSize:11, padding:'2px 0',
              background: i===0 ? '#6B7345' : 'transparent',
            }}>
              <span style={{fontFamily:"'JetBrains Mono', monospace"}}>{r.n}</span>
              <span>{r.t}</span>
              <span style={{textAlign:'right'}}>{r.s}</span>
            </div>
          ))}
        </div>
      </KareWindow>

      {/* Stamp dialog */}
      <KareWindow title="Aplicar Carimbo" w={300} h={220} x={200} y={480} tools={false}>
        <div style={{padding:'10px 14px'}}>
          <div style={{fontSize:11, marginBottom:8}}>Selecione o carimbo a aplicar em RFC-0011:</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6}}>
            {['EM DISCUSSÃO','APROVADA','VETADA','URGENTE','REVER','ARQUIVADA'].map((s,i)=>(
              <div key={i} style={{
                border:'1px solid #1E2D5F', padding:'5px 4px', textAlign:'center',
                fontSize:9, background: i===0 ? '#1E2D5F' : '#F4EFD8',
                color: i===0 ? '#F4EFD8' : '#1E2D5F', fontWeight:700, cursor:'pointer',
              }}>{s}</div>
            ))}
          </div>
          <div style={{marginTop:14, display:'flex', gap:6, justifyContent:'flex-end'}}>
            <button style={btnStyle()}>cancelar</button>
            <button style={btnStyle(true)}>aplicar</button>
          </div>
        </div>
      </KareWindow>

      {/* Compose mini window */}
      <KareWindow title="Carta · Sem título" w={380} h={260} x={620} y={420}>
        <div style={{padding:'10px 14px', height:'100%'}}>
          <div style={{fontSize:10, opacity:0.6, marginBottom:4}}>para: editoria@idearium</div>
          <div style={{fontSize:10, opacity:0.6, marginBottom:8, paddingBottom:6, borderBottom:'1px dashed #1E2D5F'}}>resp: rfc-0011</div>
          <div style={{fontSize:12, lineHeight:1.5}}>
            "Concordo com o diagnóstico mas discordo da escala proposta. Antes de novas obras precisamos auditar o que já existe — só na bacia do Tamanduateí há 4 piscinões subutilizados<span style={{animation:'blink-soft 1s infinite'}}>|</span>
          </div>
        </div>
      </KareWindow>

      {/* Dock */}
      <div style={{
        position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)',
        background:'#F4EFD8', border:'2px solid #1E2D5F', boxShadow:'4px 4px 0 #1E2D5F',
        padding:'6px 12px', display:'flex', gap:14, alignItems:'center', zIndex:40,
      }}>
        {['brain','folder','doc','feather','envelope','stamp','clock','mac'].map((n, i) => (
          <Icon key={i} name={n} scale={2} />
        ))}
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px dotted #1E2D5F', paddingBottom:1, fontSize:10}}>
      <span style={{opacity:0.6}}>{k}</span><span style={{fontWeight:700}}>{v}</span>
    </div>
  );
}

const btnStyle = (primary=false) => ({
  padding:'3px 12px', fontSize:11,
  background: primary ? '#1E2D5F' : '#F4EFD8',
  color: primary ? '#F4EFD8' : '#1E2D5F',
  border:'2px solid #1E2D5F',
  fontFamily:"'Pixelify Sans', monospace", cursor:'pointer', fontWeight:700,
  boxShadow: primary ? '2px 2px 0 #6B7345' : 'none',
});

// ── RFC WINDOW (standalone artboard) ─────────────────────────
function RFCWindow() {
  return (
    <div style={{
      width:'100%', height:'100%', background:'#D8602E', padding:20,
      backgroundImage:`radial-gradient(circle at 1px 1px, rgba(255,247,224,0.18) 1px, transparent 0)`,
      backgroundSize:'4px 4px',
    }}>
      <KareWindow title="RFC-0011 — Enchentes urbanas e infra cinza" w="100%" h="100%" position="relative">
        <div style={{padding:'18px 22px', display:'grid', gridTemplateColumns:'1fr 220px', gap:18, height:'100%'}}>
          <div>
            <div style={{
              fontFamily:"'Silkscreen', monospace", fontSize:18, lineHeight:1.3,
              letterSpacing:'-0.02em', color:'#1E2D5F',
            }}>
              ENCHENTES.<br/>URBANAS.exe
            </div>
            <div style={{
              marginTop:10, fontSize:11, fontFamily:"'JetBrains Mono', monospace",
              padding:'4px 8px', display:'inline-block', background:'#6B7345', border:'1px solid #1E2D5F',
            }}>
              CARIMBO: EM DISCUSSÃO · 14 dias abertos
            </div>

            <div style={{marginTop:14, fontSize:14, lineHeight:1.55}}>
              Toda chuva de 50mm em São Paulo expõe um mesmo bug: a infraestrutura cinza está otimizada para o século passado. Esta proposta pede que tratemos a permeabilidade urbana como uma camada de software a ser reinstalada — peça por peça, bacia por bacia.
            </div>

            <div style={{marginTop:14, padding:10, border:'1px solid #1E2D5F', background:'#EAE3C5'}}>
              <div style={{fontWeight:700, fontSize:12, marginBottom:6}}>// proposta em 3 passos</div>
              <div style={{fontSize:13, lineHeight:1.6}}>
                <div><b>1.</b> mapear as bacias urbanas críticas (32 em SP)</div>
                <div><b>2.</b> substituir asfalto por blocos drenantes em áreas-piloto</div>
                <div><b>3.</b> criar corredores ripários onde houver espaço</div>
              </div>
            </div>

            <div style={{marginTop:14, padding:'8px 10px', borderLeft:'3px solid #1E2D5F', background:'#6B7345', fontSize:12, fontStyle:'italic'}}>
              "se a chuva é o teste, a calçada é a interface. e nossa interface está obsoleta."<br/>
              <span style={{opacity:0.6, fontStyle:'normal'}}>— m. brando, lab.cidade</span>
            </div>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:8, fontSize:11}}>
            <div style={{background:'#1E2D5F', color:'#F4EFD8', padding:'4px 6px', textAlign:'center', fontWeight:700, letterSpacing:'0.05em'}}>METADADOS</div>
            <Row k="autor" v="m. brando"/>
            <Row k="lab" v="cidade"/>
            <Row k="status" v="discussão"/>
            <Row k="aberto há" v="14 dias"/>
            <Row k="cartas em pé" v="07"/>
            <Row k="endorses" v="22"/>
            <Row k="tags" v="clima, infra"/>

            <div style={{marginTop:8, padding:6, background:'#EAE3C5', border:'1px solid #1E2D5F'}}>
              <div style={{fontSize:9, fontWeight:700, marginBottom:3, letterSpacing:'0.05em'}}>ENGAJAMENTO ▼</div>
              <svg width="100%" height="40" viewBox="0 0 180 40" preserveAspectRatio="none">
                <path d="M 0 35 L 20 30 L 40 32 L 60 22 L 80 25 L 100 14 L 120 18 L 140 8 L 160 12 L 180 4" stroke="#1E2D5F" strokeWidth="2" fill="none"/>
                <path d="M 0 35 L 20 30 L 40 32 L 60 22 L 80 25 L 100 14 L 120 18 L 140 8 L 160 12 L 180 4 L 180 40 L 0 40 Z" fill="#1E2D5F" opacity="0.15"/>
              </svg>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:8, opacity:0.6, marginTop:2}}>
                <span>04.04</span><span>hoje</span>
              </div>
            </div>

            <div style={{marginTop:6, fontSize:9, fontWeight:700, letterSpacing:'0.05em'}}>AÇÕES ▼</div>
            <button style={btnStyle()}>+ escrever carta</button>
            <button style={btnStyle()}>★ endossar</button>
            <button style={btnStyle()}>↗ compartilhar</button>
            <button style={btnStyle(true)}>aplicar carimbo</button>
          </div>
        </div>
      </KareWindow>
    </div>
  );
}

// ── LAB FINDER ───────────────────────────────────────────────
function LabFinder() {
  const labs = [
    {name:'Lab.Cidade',    icon:'city',    n:22, members:14, color:'#1E2D5F'},
    {name:'Lab.Economia',  icon:'scale',   n:18, members:9,  color:'#1E2D5F'},
    {name:'Lab.Educação',  icon:'book',    n:14, members:11, color:'#1E2D5F'},
    {name:'Lab.Digital',   icon:'floppy',  n:11, members:7,  color:'#1E2D5F'},
    {name:'Lab.Cultura',   icon:'feather', n:9,  members:6,  color:'#1E2D5F'},
    {name:'Lab.Trabalho',  icon:'hand',    n:7,  members:8,  color:'#1E2D5F'},
  ];
  return (
    <div style={{
      width:'100%', height:'100%', background:'#D8602E', padding:20,
      backgroundImage:`radial-gradient(circle at 1px 1px, rgba(255,247,224,0.18) 1px, transparent 0)`,
      backgroundSize:'4px 4px',
    }}>
      <KareWindow title="Lab Finder" w="100%" h="100%" position="relative">
        <div style={{padding:'14px 18px', height:'100%', display:'flex', flexDirection:'column'}}>
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            paddingBottom:8, borderBottom:'2px solid #1E2D5F',
          }}>
            <div style={{fontSize:13, fontWeight:700}}>6 laboratórios encontrados</div>
            <div style={{display:'flex', gap:6}}>
              <button style={btnStyle()}>nome ↓</button>
              <button style={btnStyle(true)}>atividade</button>
            </div>
          </div>

          <div style={{
            display:'grid', gridTemplateColumns:'auto 1fr auto auto auto',
            fontSize:10, fontWeight:700, padding:'6px 0',
            borderBottom:'1px dashed #1E2D5F', letterSpacing:'0.05em', opacity:0.6,
          }}>
            <span style={{paddingRight:14}}>icon</span>
            <span>nome</span>
            <span style={{paddingLeft:14}}>RFCs</span>
            <span style={{paddingLeft:14}}>membros</span>
            <span style={{paddingLeft:14}}>status</span>
          </div>

          {labs.map((l,i)=>(
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'auto 1fr auto auto auto',
              alignItems:'center', padding:'8px 0',
              borderBottom:'1px dotted #1E2D5F',
              background: i===0 ? '#6B7345' : 'transparent',
              paddingLeft: i===0 ? 6 : 0, paddingRight: i===0 ? 6 : 0,
            }}>
              <Icon name={l.icon} scale={2} />
              <div style={{paddingLeft:14}}>
                <div style={{fontSize:13, fontWeight:700}}>{l.name}</div>
                <div style={{fontSize:9, opacity:0.6, fontFamily:"'JetBrains Mono', monospace"}}>~/labs/{l.name.toLowerCase().replace('.','-')}</div>
              </div>
              <div style={{paddingLeft:14, fontSize:12, fontFamily:"'JetBrains Mono', monospace"}}>{l.n}</div>
              <div style={{paddingLeft:14, fontSize:12, fontFamily:"'JetBrains Mono', monospace"}}>{l.members}</div>
              <div style={{paddingLeft:14}}>
                <div style={{
                  width:8, height:8, borderRadius:'50%', background:'#1E2D5F',
                  display:'inline-block', marginRight:4, animation:'blink-soft 2s infinite',
                }}/>
                <span style={{fontSize:10}}>ativo</span>
              </div>
            </div>
          ))}

          <div style={{marginTop:'auto', paddingTop:8, borderTop:'2px solid #1E2D5F', fontSize:10, display:'flex', justifyContent:'space-between'}}>
            <span>81 RFCs · 55 membros · 6 laboratórios</span>
            <span style={{opacity:0.6}}>{'>'} clique 2x para abrir</span>
          </div>
        </div>
      </KareWindow>
    </div>
  );
}

// ── STAMP DIALOG (large standalone) ──────────────────────────
function StampDialog() {
  return (
    <div style={{
      width:'100%', height:'100%', background:'#D8602E', padding:24,
      display:'flex', alignItems:'center', justifyContent:'center',
      backgroundImage:`radial-gradient(circle at 1px 1px, rgba(255,247,224,0.18) 1px, transparent 0)`,
      backgroundSize:'4px 4px',
    }}>
      <KareWindow title="Aplicar Carimbo · RFC-0011" w={380} h={340} position="relative" tools={false}>
        <div style={{padding:'16px 20px', height:'100%', display:'flex', flexDirection:'column', gap:10}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <Icon name="stamp" scale={3} />
            <div style={{fontSize:11, lineHeight:1.4}}>
              <div style={{fontWeight:700}}>Você está prestes a carimbar:</div>
              <div style={{opacity:0.7}}>RFC-0011 · Enchentes urbanas · m. brando</div>
            </div>
          </div>

          <div style={{fontSize:10, fontWeight:700, marginTop:6, letterSpacing:'0.05em'}}>SELECIONE O CARIMBO</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8}}>
            {[
              {l:'EM DISCUSSÃO', sel:true},
              {l:'APROVADA',     sel:false},
              {l:'VETADA',       sel:false},
              {l:'URGENTE',      sel:false},
              {l:'REVER',        sel:false},
              {l:'ARQUIVADA',    sel:false},
            ].map((s,i)=>(
              <div key={i} style={{
                border:'2px solid #1E2D5F', padding:'8px 10px',
                fontSize:11, fontWeight:700, letterSpacing:'0.05em',
                background: s.sel ? '#1E2D5F' : '#F4EFD8',
                color: s.sel ? '#F4EFD8' : '#1E2D5F', cursor:'pointer',
                display:'flex', alignItems:'center', gap:6,
              }}>
                <div style={{
                  width:10, height:10, border:`1.5px solid ${s.sel ? '#F4EFD8' : '#1E2D5F'}`,
                  background: s.sel ? '#6B7345' : 'transparent',
                }}/>
                {s.l}
              </div>
            ))}
          </div>

          <div style={{
            marginTop:6, padding:'6px 8px', background:'#6B7345',
            border:'1px solid #1E2D5F', fontSize:10, lineHeight:1.4,
          }}>
            <b>⚠ atenção:</b> carimbar uma RFC é uma ação editorial. Será registrado em log público com seu nome e horário.
          </div>

          <div style={{marginTop:'auto', display:'flex', gap:6, justifyContent:'flex-end'}}>
            <button style={btnStyle()}>cancelar</button>
            <button style={btnStyle(true)}>aplicar carimbo</button>
          </div>
        </div>
      </KareWindow>
    </div>
  );
}

// ── COMPOSE WINDOW ───────────────────────────────────────────
function ComposeWindow() {
  return (
    <div style={{
      width:'100%', height:'100%', background:'#D8602E', padding:20,
      backgroundImage:`radial-gradient(circle at 1px 1px, rgba(255,247,224,0.18) 1px, transparent 0)`,
      backgroundSize:'4px 4px',
    }}>
      <KareWindow title="Nova RFC · sem título.rfc" w="100%" h="100%" position="relative">
        <div style={{padding:'12px 16px', height:'100%', display:'flex', flexDirection:'column', gap:8}}>
          {/* Toolbar */}
          <div style={{display:'flex', gap:6, paddingBottom:8, borderBottom:'1px dashed #1E2D5F', flexWrap:'wrap'}}>
            <button style={btnStyle()}>B</button>
            <button style={btnStyle()}><i>I</i></button>
            <button style={btnStyle()}>H1</button>
            <button style={btnStyle()}>H2</button>
            <button style={btnStyle()}>" "</button>
            <button style={btnStyle()}>{'<>'}</button>
            <button style={btnStyle()}>fleuron</button>
            <button style={btnStyle()}>· lista</button>
            <div style={{flex:1}}/>
            <button style={btnStyle()}>↶</button>
            <button style={btnStyle()}>↷</button>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 180px', gap:12, flex:1, overflow:'hidden'}}>
            {/* Editor */}
            <div style={{background:'#EAE3C5', border:'1px solid #1E2D5F', padding:'12px 16px', overflow:'hidden'}}>
              <input style={{
                width:'100%', fontFamily:"'Silkscreen', monospace", fontSize:18,
                background:'transparent', border:'none', outline:'none', padding:0,
                letterSpacing:'-0.02em',
              }} defaultValue="RENDA.BÁSICA.exe"/>
              <div style={{borderBottom:'1px dashed #1E2D5F', paddingBottom:8, marginBottom:10}}>
                <input style={{
                  width:'100%', fontSize:11, opacity:0.7,
                  background:'transparent', border:'none', outline:'none', fontFamily:"'JetBrains Mono', monospace",
                }} defaultValue="subtítulo: uma proposta de tecnologia social"/>
              </div>

              <div style={{fontSize:13, lineHeight:1.6, color:'#1E2D5F'}}>
                Quando dizemos que renda básica é "tecnologia social", queremos dizer
                literal: é uma infraestrutura distribuída que aceita inputs (necessidade)
                e produz outputs (capacidade de agir).
                <br/><br/>
                Ela tem APIs (entrada/saída em bancos comunitários), tem versões (cadastros
                únicos vs. transferências diretas), tem casos de borda (informalidade,
                pessoas sem documento), e tem regressões.
                <span style={{animation:'blink-soft 1s infinite'}}>|</span>
              </div>
            </div>

            {/* Side panel */}
            <div style={{display:'flex', flexDirection:'column', gap:6, fontSize:10, overflow:'auto'}}>
              <div style={{background:'#1E2D5F', color:'#F4EFD8', padding:'3px 6px', textAlign:'center', fontWeight:700, letterSpacing:'0.05em'}}>RASCUNHO</div>
              <Row k="autor" v="você"/>
              <Row k="lab" v="economia"/>
              <Row k="words" v="247"/>
              <Row k="auto-save" v="há 4s"/>
              <Row k="versão" v="v.0.3"/>

              <div style={{marginTop:6, padding:6, background:'#EAE3C5', border:'1px solid #1E2D5F'}}>
                <div style={{fontWeight:700, marginBottom:4}}>checklist</div>
                {['título','3+ parágrafos','pelo menos 1 citação','tags','escolha de lab'].map((c,i)=>(
                  <div key={i} style={{display:'flex', gap:5, alignItems:'center', fontSize:9, marginBottom:2}}>
                    <span style={{
                      width:10, height:10, border:'1.5px solid #1E2D5F',
                      background: i<3 ? '#1E2D5F' : 'transparent',
                      color:'#6B7345', fontSize:8, textAlign:'center', lineHeight:'7px',
                    }}>{i<3?'✓':''}</span>
                    {c}
                  </div>
                ))}
              </div>

              <button style={{...btnStyle(), marginTop:8}}>salvar rascunho</button>
              <button style={btnStyle(true)}>publicar RFC</button>
            </div>
          </div>

          <div style={{
            paddingTop:6, borderTop:'1px solid #1E2D5F',
            fontSize:9, display:'flex', justifyContent:'space-between',
            fontFamily:"'JetBrains Mono', monospace",
          }}>
            <span>linha 18 · col 24</span>
            <span>auto-save ativo</span>
            <span>plain text · markdown</span>
          </div>
        </div>
      </KareWindow>
    </div>
  );
}

// ── ABOUT BOX ────────────────────────────────────────────────
function AboutBox() {
  return (
    <div style={{
      width:'100%', height:'100%', background:'#D8602E', padding:24,
      display:'flex', alignItems:'center', justifyContent:'center',
      backgroundImage:`radial-gradient(circle at 1px 1px, rgba(255,247,224,0.18) 1px, transparent 0)`,
      backgroundSize:'4px 4px',
    }}>
      <KareWindow title="Sobre o Idearium" w={380} h={340} position="relative" tools={false}>
        <div style={{padding:'18px 20px', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:8}}>
          <Icon name="mac" scale={4} />
          <div style={{
            fontFamily:"'Silkscreen', monospace", fontSize:20,
            letterSpacing:'-0.02em', marginTop:6,
          }}>IDEARIUM</div>
          <div style={{fontSize:11}}>System 4.7 · build 2026.04</div>
          <div style={{fontSize:11, opacity:0.7, lineHeight:1.5, marginTop:6}}>
            Periódico aberto.<br/>
            Um sistema operacional para ideias.
          </div>

          <div style={{
            marginTop:8, fontSize:10, lineHeight:1.6,
            paddingTop:10, borderTop:'1px dashed #1E2D5F', width:'100%',
          }}>
            64 RFCs ativas · 412 cartas trocadas<br/>
            6 laboratórios · 55 membros<br/>
            licenciado para: leitor
          </div>

          <div style={{marginTop:'auto', display:'flex', gap:8}}>
            <button style={btnStyle()}>créditos</button>
            <button style={btnStyle(true)}>OK</button>
          </div>
        </div>
      </KareWindow>
    </div>
  );
}

Object.assign(window, {
  BootScreen, Desktop, RFCWindow, LabFinder, StampDialog, ComposeWindow, AboutBox,
});
