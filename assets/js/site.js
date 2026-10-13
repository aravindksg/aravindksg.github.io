const YEARS = (window.SITE && window.SITE.timeline) || [];

const scrub = document.getElementById('scrub');
const panel = document.getElementById('panel');
const railfill = document.getElementById('railfill');
let idx = YEARS.length - 1;

YEARS.forEach((d,i)=>{
  const b = document.createElement('button');
  b.className='yr'; b.type='button'; b.role='tab'; b.dataset.era=d.era;
  b.textContent=d.y; b.setAttribute('aria-selected', i===idx);
  b.addEventListener('click',()=>select(i));
  scrub.appendChild(b);
});

function select(i){
  idx=i;
  [...scrub.children].forEach((b,n)=>b.setAttribute('aria-selected', n===i));
  const d=YEARS[i];
  railfill.style.left=(i/YEARS.length*100)+'%';
  railfill.style.width=(1/YEARS.length*100)+'%';
  panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
  panel.innerHTML=`
    <div>
      <h3>${d.t}</h3>
      <ul>${d.b.map(x=>`<li>${x}</li>`).join('')}</ul>
    </div>
    <aside class="sidecard">
      <div class="big">${d.big}</div>
      ${d.cap ? `<div class="cap">${d.cap}</div>` : ''}
      <div class="stack">
        <span class="era" data-era="${d.era}">${d.era==='a'?'HPC Fabrics &amp; MPI':'GPU Compute'}</span>
        ${d.tags.map(t=>`<span class="tag">${t}</span>`).join('')}
      </div>
    </aside>`;
  scrub.children[i].scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});
}
scrub.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'&&idx<YEARS.length-1){select(idx+1);scrub.children[idx].focus();}
  if(e.key==='ArrowLeft'&&idx>0){select(idx-1);scrub.children[idx].focus();}
});
select(idx);

/* ---------- filterable work ---------- */
const WORK = (window.SITE && window.SITE.work) || [];
const GROUPS = (window.SITE && window.SITE.groups) || ["All"];
const filters=document.getElementById('filters'), cards=document.getElementById('cards');
GROUPS.forEach((g,i)=>{
  const b=document.createElement('button');
  b.className='f'; b.type='button'; b.textContent=g; b.setAttribute('aria-pressed', i===0);
  b.addEventListener('click',()=>{
    [...filters.children].forEach(x=>x.setAttribute('aria-pressed', x===b));
    [...cards.children].forEach(c=>{ c.hidden = !(g==='All' || c.dataset.g.split('|').includes(g)); });
  });
  filters.appendChild(b);
});
WORK.forEach(w=>{
  const c=document.createElement('article');
  c.className='card'; c.dataset.g=(w.groups||[]).join('|');
  c.innerHTML=`<span class="k">${w.k}</span><h3>${w.t}</h3><p>${w.p}</p>`;
  cards.appendChild(c);
});

/* ---------- theme toggle ---------- */
const tbtn=document.getElementById('theme');
const sysDark=()=>matchMedia('(prefers-color-scheme: dark)').matches;
function label(){ const t=document.documentElement.dataset.theme;
  const dark = t ? t==='dark' : sysDark(); tbtn.textContent = dark ? 'Light' : 'Dark'; }
tbtn.addEventListener('click',()=>{
  const t=document.documentElement.dataset.theme;
  const dark = t ? t==='dark' : sysDark();
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
  label(); readTokens();
});
label();

/* ---------- count-up ---------- */
if(matchMedia('(prefers-reduced-motion: no-preference)').matches){
  document.querySelectorAll('#metrics b').forEach(el=>{
    const to=+el.dataset.to, pre=el.dataset.prefix||'', suf=el.dataset.suffix||'';
    const t0=performance.now(), dur=900;
    const step=t=>{ const p=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-p,3);
      el.textContent=pre+Math.round(to*e)+suf; if(p<1)requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

/* ---------- scroll reveal ---------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);} }),{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* =====================================================================
   Hero: a die drawn as a yantra. Interlocking triangles and a lotus ring
   around a floorplanned core; three rings of nodes for the cluster; work
   leaves the core as pulses that light each rank as they pass.
   ===================================================================== */
const cv=document.getElementById('yantra'), ctx=cv.getContext('2d');
const MOTION = matchMedia('(prefers-reduced-motion: no-preference)').matches;
const RINGS=[{r:0.52,n:8,s:7.5},{r:0.72,n:16,s:6},{r:0.92,n:24,s:4.5}];
let W=0,H=0,CX=0,CY=0,U=1,t=0,nodes=[],C={};

/* Two rendering models for one drawing: on dark it is light emitted from
   the core (additive, low alphas, glow); on light it is ink printed on
   paper (multiply, heavier strokes, no glow). INK holds the weights. */
const INK = {
  dark:  {glow:.10, ring:.85, ringCol:'line', trace:.13, traceLit:.50, wave:.32, waveOp:'lighter',
          node:.45, nodeLit:.55, halo:.35, lotusA:.45, lotusB:.30, dieFill:.10,
          dieEdge:.95, grid:.45, pad:.70, triA:.90, triB:.80, triC:.65,
          bindu:.55, lw:1},
  light: {glow:.06, ring:.40, ringCol:'muted', trace:.34, traceLit:.55, wave:.58, waveOp:'multiply',
          node:.85, nodeLit:.15, halo:.45, lotusA:.75, lotusB:.50, dieFill:.07,
          dieEdge:1,   grid:.70, pad:.95, triA:1,   triB:.95, triC:.85,
          bindu:.40, lw:1.25}
};
let K = INK.dark;

function readTokens(){
  const s=getComputedStyle(document.documentElement);
  C.gold=s.getPropertyValue('--gold').trim()||'#F0B429';
  C.verm=s.getPropertyValue('--vermilion').trim()||'#F2653D';
  C.acc=s.getPropertyValue('--accent').trim()||'#2DD4BF';
  C.acc2=s.getPropertyValue('--accent-2').trim()||'#818CF8';
  C.line=s.getPropertyValue('--line').trim()||'#272B44';
  C.muted=s.getPropertyValue('--muted').trim()||'#9A99AE';
  const set=document.documentElement.dataset.theme;
  const dark = set ? set==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  K = dark ? INK.dark : INK.light;
  if(!MOTION) frame(0);
}
function size(){
  const r=cv.getBoundingClientRect(), dpr=Math.min(2,devicePixelRatio||1);
  W=Math.max(1,r.width); H=Math.max(1,r.height);
  cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
  /* sits right of the headline on wide screens, centred once the hero stacks */
  const wide = W>880;
  CX = wide ? W*0.68 : W*0.5;
  CY = H/2;
  U  = (wide ? Math.min(H*0.52, W*0.26) : Math.min(H*0.42, W*0.44));
  nodes=[];
  RINGS.forEach((ring,ri)=>{
    for(let i=0;i<ring.n;i++){
      const a=(i/ring.n)*Math.PI*2 + (ri%2?Math.PI/ring.n:0);
      nodes.push({a,r:ring.r*U,size:ring.s,ri,lit:0});
    }
  });
}

/* petal ring — lotus around the die */
function lotus(radius,petals,bloom,color,alpha){
  ctx.save(); ctx.translate(CX,CY); ctx.rotate(bloom);
  ctx.strokeStyle=color; ctx.globalAlpha=alpha; ctx.lineWidth=1.1;
  for(let i=0;i<petals;i++){
    const a=(i/petals)*Math.PI*2, w=Math.PI/petals*0.92;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a-w)*radius*0.74, Math.sin(a-w)*radius*0.74);
    ctx.quadraticCurveTo(Math.cos(a)*radius*1.3, Math.sin(a)*radius*1.3,
                         Math.cos(a+w)*radius*0.74, Math.sin(a+w)*radius*0.74);
    ctx.stroke();
  }
  ctx.restore();
}
function tri(radius,rot,color,alpha,lw){
  ctx.save(); ctx.translate(CX,CY); ctx.rotate(rot);
  ctx.strokeStyle=color; ctx.globalAlpha=alpha; ctx.lineWidth=lw||1.2;
  ctx.beginPath();
  for(let i=0;i<3;i++){
    const a=-Math.PI/2+i*2*Math.PI/3;
    i?ctx.lineTo(Math.cos(a)*radius,Math.sin(a)*radius):ctx.moveTo(Math.cos(a)*radius,Math.sin(a)*radius);
  }
  ctx.closePath(); ctx.stroke(); ctx.restore();
}
function chip(x,y,s,rot,color,alpha,fill){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
  ctx.globalAlpha=alpha; ctx.lineWidth=1;
  if(fill){ ctx.fillStyle=color; ctx.fillRect(-s/2,-s/2,s,s); }
  else { ctx.strokeStyle=color; ctx.strokeRect(-s/2,-s/2,s,s); }
  ctx.strokeStyle=color; ctx.globalAlpha=alpha*0.75;
  for(let i=-1;i<=1;i++){                       /* package pins */
    ctx.beginPath(); ctx.moveTo(i*s*0.3,-s/2); ctx.lineTo(i*s*0.3,-s/2-s*0.28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i*s*0.3, s/2); ctx.lineTo(i*s*0.3, s/2+s*0.28); ctx.stroke();
  }
  ctx.restore();
}

function frame(time){
  const dieR=U*0.30;
  ctx.clearRect(0,0,W,H);

  /* ambient glow from the core */
  const g=ctx.createRadialGradient(CX,CY,0,CX,CY,U);
  g.addColorStop(0,C.gold); g.addColorStop(1,'transparent');
  ctx.globalCompositeOperation=K.waveOp;
  ctx.globalAlpha=K.glow; ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;

  /* concentric rank circles */
  RINGS.forEach(ring=>{
    ctx.beginPath(); ctx.arc(CX,CY,ring.r*U,0,6.2832);
    ctx.strokeStyle=C[K.ringCol]; ctx.globalAlpha=K.ring; ctx.lineWidth=K.lw; ctx.stroke();
  });
  ctx.globalAlpha=1;

  /* interconnect traces, core out to every node */
  nodes.forEach(n=>{
    const x=CX+Math.cos(n.a)*n.r, y=CY+Math.sin(n.a)*n.r;
    ctx.beginPath();
    ctx.moveTo(CX+Math.cos(n.a)*dieR*1.05, CY+Math.sin(n.a)*dieR*1.05);
    ctx.lineTo(x,y);
    ctx.strokeStyle=C.gold; ctx.globalAlpha=K.trace+n.lit*K.traceLit; ctx.lineWidth=K.lw; ctx.stroke();
  });
  ctx.globalAlpha=1;

  /* dispatch waves leaving the core — soft bands, one heartbeat each */
  const WAVES=2, period=7.2, band=U*0.11;
  ctx.globalCompositeOperation=K.waveOp;
  for(let w=0;w<WAVES;w++){
    const p=((t/period)+w/WAVES)%1;
    const r=dieR + p*(U*0.98-dieR);
    const g2=ctx.createRadialGradient(CX,CY,Math.max(0,r-band),CX,CY,r+band);
    g2.addColorStop(0,'transparent');
    g2.addColorStop(0.5, w%2?C.acc:C.gold);
    g2.addColorStop(1,'transparent');
    ctx.fillStyle=g2;
    /* fade in off the die, out at the rim, so the core never blooms */
    ctx.globalAlpha=K.wave*Math.pow(1-p,1.7)*Math.min(1,0.18+p*2.4);
    ctx.beginPath(); ctx.arc(CX,CY,r+band,0,6.2832); ctx.fill();
    nodes.forEach(n=>{ if(Math.abs(n.r-r)<band*0.5) n.lit=1; });
  }
  ctx.globalCompositeOperation='source-over';
  ctx.globalAlpha=1;

  /* nodes — each a packaged die */
  nodes.forEach(n=>{
    const x=CX+Math.cos(n.a)*n.r, y=CY+Math.sin(n.a)*n.r;
    const col = n.lit>0.25 ? C.acc : C.gold;
    chip(x,y,n.size*(1+n.lit*0.3),n.a,col,K.node+n.lit*K.nodeLit,n.lit>0.5);
    if(n.lit>0.02){
      ctx.beginPath(); ctx.arc(x,y,n.size*1.9,0,6.2832);
      ctx.strokeStyle=C.acc; ctx.globalAlpha=n.lit*K.halo; ctx.lineWidth=K.lw; ctx.stroke();
    }
    n.lit*=0.962;
  });
  ctx.globalAlpha=1;

  /* lotus rings around the package */
  lotus(dieR*1.62, 12,  t*0.05, C.gold, K.lotusA);
  lotus(dieR*1.34, 24, -t*0.08, C.verm, K.lotusB);

  /* the die: floorplan inside a square package, corner notch for pin 1 */
  const d=dieR*1.14;
  ctx.save(); ctx.translate(CX,CY);
  ctx.fillStyle=C.acc2; ctx.globalAlpha=K.dieFill; ctx.fillRect(-d/2,-d/2,d,d);
  ctx.strokeStyle=C.gold; ctx.globalAlpha=K.dieEdge; ctx.lineWidth=2;
  ctx.strokeRect(-d/2,-d/2,d,d);
  ctx.globalAlpha=K.grid; ctx.lineWidth=K.lw;         /* floorplan: 4×4 tiles */
  for(let i=1;i<4;i++){
    ctx.beginPath(); ctx.moveTo(-d/2+i*d/4,-d/2); ctx.lineTo(-d/2+i*d/4,d/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-d/2,-d/2+i*d/4); ctx.lineTo(d/2,-d/2+i*d/4); ctx.stroke();
  }
  ctx.globalAlpha=0.9; ctx.lineWidth=1.6;             /* pin-1 notch */
  ctx.beginPath(); ctx.moveTo(-d/2,-d/2+d*0.16); ctx.lineTo(-d/2+d*0.16,-d/2); ctx.stroke();
  ctx.globalAlpha=K.pad; ctx.lineWidth=K.lw;          /* package pads */
  for(let i=1;i<4;i++){
    const o=-d/2+i*d/4, e=d*0.09;
    ctx.beginPath(); ctx.moveTo(o,-d/2); ctx.lineTo(o,-d/2-e); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(o, d/2); ctx.lineTo(o, d/2+e); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-d/2,o); ctx.lineTo(-d/2-e,o); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( d/2,o); ctx.lineTo( d/2+e,o); ctx.stroke();
  }
  ctx.restore();

  /* interlocking triangles — the yantra at the core */
  tri(dieR*0.72,  0,            C.verm, K.triA, 1.5);
  tri(dieR*0.72,  Math.PI,      C.acc2, K.triB, 1.5);
  tri(dieR*0.44,  Math.PI/6,    C.gold, K.triC, 1.2);
  tri(dieR*0.44, -Math.PI/6+Math.PI, C.gold, K.triC, 1.2);

  /* bindu — the core itself, breathing */
  const pulse=1+Math.sin(t*2*Math.PI/7.2)*0.14;
  const bg2=ctx.createRadialGradient(CX,CY,0,CX,CY,dieR*0.42*pulse);
  bg2.addColorStop(0,C.gold); bg2.addColorStop(1,'transparent');
  ctx.globalAlpha=K.bindu; ctx.fillStyle=bg2;
  ctx.beginPath(); ctx.arc(CX,CY,dieR*0.42*pulse,0,6.2832); ctx.fill();
  ctx.globalAlpha=1; ctx.fillStyle=C.verm;
  ctx.beginPath(); ctx.arc(CX,CY,dieR*0.1,0,6.2832); ctx.fill();

  if(MOTION){ t+=0.016; requestAnimationFrame(frame); }
}

addEventListener('resize',()=>{ size(); if(!MOTION) frame(0); });
size(); readTokens();
if(MOTION) requestAnimationFrame(frame); else { nodes.forEach(n=>{ n.lit = n.ri===1?0.9:0.25; }); frame(0); }

/* ---------- nav highlight ---------- */
const links=[...document.querySelectorAll('.navlinks a')];
const spy=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting) links.forEach(l=>l.classList.toggle('on', l.getAttribute('href')==='#'+e.target.id));
}),{rootMargin:'-45% 0px -50% 0px'});
['timeline','work','writing'].forEach(id=>spy.observe(document.getElementById(id)));
