const GLB_DATA='';
/* GitHub 링크 */
if(GITHUB_URL){document.querySelectorAll('[data-gh]').forEach(e=>{e.hidden=false;if(e.tagName==='A')e.href=GITHUB_URL});
  const t=document.querySelector('[data-gh-text]');t.href=GITHUB_URL;t.textContent=GITHUB_URL.replace(/^https?:\/\//,'').replace(/\/$/,'')}
/* 모션: 첫 화면은 CSS로 한 번, 섹션 제목은 화면에 들어올 때 한 번 */
(function(){
setTimeout(()=>document.documentElement.classList.remove('ld'),1600);
if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
document.documentElement.classList.add('rv');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -12% 0px'});
document.querySelectorAll('.sec-h').forEach(h=>io.observe(h));
document.querySelectorAll('[data-r]').forEach(e=>{if(e.closest('.hero'))return;const r=+e.dataset.r;e.style.transitionDelay=(r<=1?0:Math.min(.18+(r-2)*.12,.9)).toFixed(2)+'s';io.observe(e)});
/* 현재 섹션을 메뉴에 표시 */
const links=[...document.querySelectorAll('.nav a[href^="#pa-s"]')];
const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id))}),{rootMargin:'-40% 0px -55% 0px'});
document.querySelectorAll('.sec').forEach(s=>so.observe(s));
})();

/* 사진 확대 */
document.querySelectorAll('.zoomable').forEach(z=>{const im=z.querySelector('img');im.style.transition='transform .35s cubic-bezier(.22,.7,.2,1)';
  z.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=z.getBoundingClientRect();im.style.transformOrigin=((e.clientX-r.left)/r.width*100).toFixed(1)+'% '+((e.clientY-r.top)/r.height*100).toFixed(1)+'%';im.style.transform='scale(1.8)'});
  z.addEventListener('pointerleave',()=>{im.style.transform='none'})});
document.getElementById('totop').onclick=()=>scrollTo({top:0,behavior:'smooth'});

/* 제품 사진 시점 전환 */
const VIEW_IMG=["assets/images/p03-view-diagonal.jpg","assets/images/p03-view-top.jpg","assets/images/p03-view-front.jpg","assets/images/p03-view-side.jpg"];
document.querySelectorAll('#kvviews [data-img]').forEach(b=>b.onclick=()=>{const im=document.getElementById('kvimg'),k=+b.dataset.img;im.style.opacity=0;
  setTimeout(()=>{im.src=VIEW_IMG[k];im.alt='Echo Ring 제품 사진 — '+VIEW_N[k];im.style.opacity=1},150);document.querySelectorAll('#kvviews button').forEach(x=>x.classList.toggle('on',x===b))});
/* 히어로 3D 모델 (GLB) */
(function(){
const box=document.getElementById('hero3d'),cv=document.getElementById('m3d'),msg=document.getElementById('m3dmsg');
let V=null;
const setMode=m=>{box.dataset.mode=m;box.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===m));if(m==='3d'&&V)V.kick()};
box.querySelectorAll('button[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
const say=(h,t)=>{msg.hidden=false;msg.innerHTML='<div><b>'+h+'</b>'+t+'</div>';box.classList.add('nomodel')};
try{V=GLBV.create(cv,{capture:/[?&]capture/.test(location.search)})}catch(e){console.warn(e)}
if(!V){say('3D를 표시할 수 없는 브라우저입니다','키비주얼로 확인해 주세요.');return}
window.__m3d=V;
box.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{V.view(b.dataset.v);box.querySelectorAll('[data-v]').forEach(x=>x.classList.toggle('on',x===b))});
const ok=()=>{msg.hidden=true;box.classList.remove('nomodel');setMode('3d')};
const fromBuf=buf=>V.load(buf).then(ok,e=>{say('3D 모델을 불러오지 못했습니다',String(e&&e.message||e));setMode('3d')});
if(GLB_DATA){const b=atob(GLB_DATA),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);fromBuf(u.buffer)}
else fetch(GLB_PATH).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(fromBuf)
  .catch(()=>say('3D 모델이 없습니다','GLB 파일을 '+GLB_PATH+'에 두거나, 이 영역에 끌어다 놓으세요.'));
['dragenter','dragover'].forEach(t=>box.addEventListener(t,e=>{e.preventDefault();box.classList.add('drag')}));
['dragleave','drop'].forEach(t=>box.addEventListener(t,()=>box.classList.remove('drag')));
box.addEventListener('drop',e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)f.arrayBuffer().then(fromBuf)});
})();

/* 03 스토리텔링: 타임라인을 스크롤하면 왼쪽 패널(지도 · 거리 · 상태)이 따라 바뀜 */
(function(){
const S=[["19:02", "연결 유지", "연결 유지", [150, 130], [178, 130], 1.2], ["19:09", "떨어짐 감지", "떨어짐 감지", [104, 152], [268, 92], 3.8], ["19:09", "방향 안내", "방향 안내", [104, 152], [268, 92], 3.8], ["19:10", "부르는 중", "부르는 중", [126, 142], [238, 104], 3.2], ["19:12", "재회, 신호 종료", "재회, 신호 종료", [168, 124], [184, 124], 1.4]];
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',PX=20,TH=5;   /* 20px = 1m, 5m 이상 멀어지면 감지 */
const crowd=$('stCrowd');let seed=7;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
const dots=[...Array(64)].map(()=>{const c=document.createElementNS(NS,'circle');c.setAttribute('cx',(12+rnd()*336).toFixed(1));c.setAttribute('cy',(14+rnd()*190).toFixed(1));c.setAttribute('r',3.6);c.setAttribute('fill','#C9C3D6');crowd.appendChild(c);return c});
const cur={ax:150,ay:130,bx:178,by:130,cr:1.2};let tgt=S[0],k=-1,raf=0,t0=0;
const items=[...document.querySelectorAll('#stList .st-i')];
function set(i){if(i===k)return;k=i;tgt=S[i];t0=performance.now();items.forEach((li,j)=>li.classList.toggle('on',j===i));
  const live=$('stLive');live.lastChild.nodeValue=S[i][1];live.className='st-live'+(i===1?' warn':i===4?' ok':'');
  $('stT').textContent=S[i][0];$('stS').textContent=S[i][2];
  $('stA').classList.toggle('buzz',i===1||i===3||i===4);$('stB').classList.toggle('buzz',i===1||i===4);
  const show=Math.round(S[i][5]/3.8*dots.length);dots.forEach((d,j)=>d.style.opacity=j<show?1:0);d0();if(!raf)raf=requestAnimationFrame(tick)}
function d0(){dots.forEach(d=>d.style.transition='opacity .6s')}
function tick(t){raf=0;const e=.12;cur.ax+=(tgt[3][0]-cur.ax)*e;cur.ay+=(tgt[3][1]-cur.ay)*e;cur.bx+=(tgt[4][0]-cur.bx)*e;cur.by+=(tgt[4][1]-cur.by)*e;cur.cr+=(tgt[5]-cur.cr)*e;
  const A=$('stA'),B=$('stB');A.setAttribute('transform',`translate(${cur.ax},${cur.ay})`);B.setAttribute('transform',`translate(${cur.bx},${cur.by})`);
  const th=$('stTh');th.setAttribute('cx',cur.ax);th.setAttribute('cy',cur.ay);th.setAttribute('r',TH*PX);$('stThT').setAttribute('x',cur.ax+TH*PX*.71+4);$('stThT').setAttribute('y',cur.ay-TH*PX*.71);
  const ln=$('stLn');ln.setAttribute('x1',cur.ax);ln.setAttribute('y1',cur.ay);ln.setAttribute('x2',cur.bx);ln.setAttribute('y2',cur.by);
  const dx=cur.bx-cur.ax,dy=cur.by-cur.ay,L=Math.hypot(dx,dy),m=L/PX,ux=dx/(L||1),uy=dy/(L||1);
  $('stD').textContent=m.toFixed(1);$('stCr').textContent=cur.cr.toFixed(1);
  $('stBar').style.width=Math.min(100,m/(TH*2)*100)+'%';$('stBar').parentNode.classList.toggle('over',m>TH);
  const ar=$('stArr'),ph=((t-t0)/1000)%1.6/1.6;   /* ③ 상대 쪽으로 흐르는 진동 */
  ar.setAttribute('opacity',k===2?1:0);ar.setAttribute('x1',cur.ax+ux*16);ar.setAttribute('y1',cur.ay+uy*16);ar.setAttribute('x2',cur.ax+ux*(22+40*ph));ar.setAttribute('y2',cur.ay+uy*(22+40*ph));
  const cl=$('stCall');cl.setAttribute('opacity',k===3?1-ph*.4:0);cl.setAttribute('cx',cur.ax+dx*ph);cl.setAttribute('cy',cur.ay+dy*ph);   /* ④ 부르는 신호가 B로 전달 */
  raf=requestAnimationFrame(tick)}
if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)set(+e.target.dataset.k)}),{rootMargin:innerWidth<=900?'-62% 0px -28% 0px':'-45% 0px -45% 0px'});items.forEach(li=>io.observe(li))}
set(0);
})();

/* 02 사용 시나리오 3D — 두 사람이 링으로 신호를 주고받는 장면 */
(function(){
'use strict';
const idx=2;let SPEED=0;
const el=document.getElementById('pv');
const cv2=el.querySelector('canvas'),g=cv2.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:false});
let ok=!!g,prog,vao,vbo,NV2=0,U2={};
const NP=26;
function sh2(t,s){const o=g.createShader(t);g.shaderSource(o,s);g.compileShader(o);if(!g.getShaderParameter(o,g.COMPILE_STATUS))throw g.getShaderInfoLog(o);return o}
if(ok){try{
  prog=g.createProgram();
  g.attachShader(prog,sh2(g.VERTEX_SHADER,`#version 300 es
in vec3 aP;in vec3 aN;in vec3 aC;in float aQ;in float aE;uniform mat4 uVP,uM[${NP}];uniform float uG[${NP}];out vec3 vN,vC,vW;out float vE;
void main(){int q=int(aQ+.5);vec4 w=uM[q]*vec4(aP,1.);vW=w.xyz;vN=mat3(uM[q])*aN;vC=aC;vE=aE*uG[q];gl_Position=uVP*w;}`));
  g.attachShader(prog,sh2(g.FRAGMENT_SHADER,`#version 300 es
precision highp float;in vec3 vN,vC,vW;in float vE;uniform vec3 uEye;out vec4 o;
void main(){if(vE<-.5){float r=length(vW.xz);float a=.22*(1.-smoothstep(.0,.62,r));o=vec4(.16,.12,.24,a);return;}
  vec3 N=normalize(vN),V=normalize(uEye-vW),L=normalize(vec3(.45,.85,.55)),F=normalize(vec3(-.6,.3,.4));
  float d=max(dot(N,L),0.),f=max(dot(N,F),0.)*.35,rim=pow(1.-max(dot(N,V),0.),3.)*.28,hm=.5+.5*N.y;
  vec3 c=pow(vC,vec3(2.2));vec3 col=c*(mix(vec3(.30,.29,.36),vec3(.62,.62,.68),hm)+vec3(1.,.97,.94)*d*.95+vec3(.75,.8,1.)*f)+vec3(.85,.8,1.)*rim;
  vec3 H=normalize(L+V);col+=vec3(1.)*pow(max(dot(N,H),0.),40.)*.12;
  col+=c*max(vE,0.)*2.2;col=col/(1.+col*.6);o=vec4(pow(col,vec3(1./2.2)),1.);}`));
  ['aP','aN','aC','aQ','aE'].forEach((n,i)=>g.bindAttribLocation(prog,i,n));g.linkProgram(prog);
  if(!g.getProgramParameter(prog,g.LINK_STATUS))throw g.getProgramInfoLog(prog);
  ['uVP','uM','uG','uEye'].forEach(n=>U2[n]=g.getUniformLocation(prog,n));
  vao=g.createVertexArray();vbo=g.createBuffer();g.bindVertexArray(vao);g.bindBuffer(g.ARRAY_BUFFER,vbo);
  [[0,3,0],[1,3,12],[2,3,24],[3,1,36],[4,1,40]].forEach(a=>{g.enableVertexAttribArray(a[0]);g.vertexAttribPointer(a[0],a[1],g.FLOAT,false,44,a[2])});
}catch(e){console.log('showcase gl',e);ok=false}}

/* 지오메트리 도구 (파트별 로컬 좌표) */
let GV=[];
function tri3(q,a,b,c,n0,n1,n2,col,e){GV.push(...a,...n0,...col,q,e,...b,...n1,...col,q,e,...c,...n2,...col,q,e)}
function nrm3(a){const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l]}
function bx(q,cx,cy,cz,sx,sy,sz,col,e){e=e||0;const a=cx-sx/2,b=cx+sx/2,c=cy-sy/2,d=cy+sy/2,f=cz-sz/2,h=cz+sz/2;
  const F=(p0,p1,p2,p3,n)=>{tri3(q,p0,p1,p2,n,n,n,col,e);tri3(q,p0,p2,p3,n,n,n,col,e)};
  F([a,c,h],[b,c,h],[b,d,h],[a,d,h],[0,0,1]);F([b,c,f],[a,c,f],[a,d,f],[b,d,f],[0,0,-1]);F([b,c,h],[b,c,f],[b,d,f],[b,d,h],[1,0,0]);
  F([a,c,f],[a,c,h],[a,d,h],[a,d,f],[-1,0,0]);F([a,d,h],[b,d,h],[b,d,f],[a,d,f],[0,1,0]);F([a,c,f],[b,c,f],[b,c,h],[a,c,h],[0,-1,0])}
function sph(q,cx,cy,cz,r,col,e,sy){sy=sy||1;const NU=16,NV=10;for(let i=0;i<NV;i++)for(let j=0;j<NU;j++){
  const P=(ii,jj)=>{const th=ii/NV*Math.PI,ph=jj/NU*6.2832;return [Math.sin(th)*Math.cos(ph),Math.cos(th),Math.sin(th)*Math.sin(ph)]};
  const A=P(i,j),B=P(i+1,j),C=P(i+1,j+1),D=P(i,j+1),W=v=>[cx+v[0]*r,cy+v[1]*r*sy,cz+v[2]*r];
  tri3(q,W(A),W(B),W(C),A,B,C,col,e||0);tri3(q,W(A),W(C),W(D),A,C,D,col,e||0)}}
/* 축(a→b) 방향 원기둥 (+ 선택적 둥근 끝) */
function cyl(q,a,b,r,col,e,cap,n){n=n||16;const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],Ln=Math.hypot(...d),w=d.map(v=>v/Ln),
  u=nrm3(Math.abs(w[1])<.9?[w[2],0,-w[0]]:[0,-w[2],w[1]]),v=[w[1]*u[2]-w[2]*u[1],w[2]*u[0]-w[0]*u[2],w[0]*u[1]-w[1]*u[0]];
  for(let i=0;i<n;i++){const t0=i/n*6.2832,t1=(i+1)/n*6.2832,R0=[0,1,2].map(k=>u[k]*Math.cos(t0)+v[k]*Math.sin(t0)),R1=[0,1,2].map(k=>u[k]*Math.cos(t1)+v[k]*Math.sin(t1));
    const p=(P,R)=>[0,1,2].map(k=>P[k]+R[k]*r);tri3(q,p(a,R0),p(b,R0),p(b,R1),R0,R0,R1,col,e||0);tri3(q,p(a,R0),p(b,R1),p(a,R1),R0,R1,R1,col,e||0);
    if(!cap){const mw=w.map(x=>-x);tri3(q,a,p(a,R1),p(a,R0),mw,mw,mw,col,e||0);tri3(q,b,p(b,R0),p(b,R1),w,w,w,col,e||0)}}
  if(cap){sph(q,...a,r,col,e);sph(q,...b,r,col,e)}}
function ring(q,cx,cy,cz,r,t,col,e,n){n=n||32;for(let i=0;i<n;i++){const a0=i/n*6.2832,a1=(i+1)/n*6.2832;cyl(q,[cx+Math.cos(a0)*r,cy,cz+Math.sin(a0)*r],[cx+Math.cos(a1)*r,cy,cz+Math.sin(a1)*r],t,col,e,false,6)}}

/* 재질 (산업 디자인 렌더 톤) */
const SKIN=[.86,.7,.58],HAIR=[.16,.13,.14],TOP=[.9,.89,.93],TOP2=[.62,.56,.82],PANT=[.28,.28,.33],SHOE=[.94,.94,.96],DG=[.18,.18,.21],WH=[.96,.96,.98],LIL=[.72,.62,.98];
const PA={body:0,lua:1,lfa:2,rua:3,rfa:4,ll:5,rl:6,prod:7,x1:8,x2:9,x3:10,fx:11,x4:12,gnd:13};
const PB={body:16,lua:17,lfa:18,rua:19,rfa:20,ll:21,rl:22,prod:23,fx:24};   /* Echo Ring 두 번째 사람 */
/* 사람: 매끈한 마네킹 스타일 */
/* 회전체: 높이별 반지름 프로필(prof=[[y,r],...]), 단면은 sx·sz 비율의 타원 → 몸통 · 팔다리를 유기적으로 */
function rbx(q,sx,sy,sz,col){bx(q,0,0,0,sx-.02,sy,sz,col);bx(q,0,0,0,sx,sy,sz-.02,col);[-1,1].forEach(a=>[-1,1].forEach(b=>cyl(q,[a*(sx/2-.01),-sy/2,b*(sz/2-.01)],[a*(sx/2-.01),sy/2,b*(sz/2-.01)],.01,col,0,false,8)))}
function cylY_(q,x,y,z,r,h,col){cyl(q,[x,y,z],[x,y+h,z],r,col,0,false,28)}
function lathe(q,cx,cz,prof,col,sx,sz,e,n){n=n||20;sx=sx||1;sz=sz||1;
  for(let i=0;i<prof.length-1;i++){const [y0,r0]=prof[i],[y1,r1]=prof[i+1],sl=(r0-r1)/Math.max(1e-4,Math.hypot(y1-y0,r1-r0));
    for(let j=0;j<n;j++){const a0=j/n*6.2832,a1=(j+1)/n*6.2832,P=(y,r,a)=>[cx+Math.cos(a)*r*sx,y,cz+Math.sin(a)*r*sz],
      N=a=>nrm3([Math.cos(a)/sx,sl,Math.sin(a)/sz]);
      tri3(q,P(y0,r0,a0),P(y1,r1,a0),P(y1,r1,a1),N(a0),N(a0),N(a1),col,e||0);tri3(q,P(y0,r0,a0),P(y1,r1,a1),P(y0,r0,a1),N(a0),N(a1),N(a1),col,e||0)}}}
/* 사람: 축제 장면의 사람과 같은 블록형 — 정육면체 머리 · 상자 몸통 · 상자 팔다리 */
function figure(top,opt,P){opt=opt||{};P=P||PA;const B=P.body,hair=opt.hair||HAIR,TOPD=top.map(v=>v*.85);
  bx(B,0,1.0,0,.36,.16,.22,PANT);                                                  /* 골반 */
  bx(B,0,1.27,0,.42,.44,.24,top);                                                  /* 몸통 */
  if(opt.tie){bx(B,0,1.36,.123,.05,.2,.01,opt.tie)}
  if(opt.vest){bx(B,0,1.28,0,.44,.4,.26,opt.vest);[1.2,1.33].forEach(y=>bx(B,0,y,0,.445,.03,.265,[1,1,.9],.55))}
  bx(B,0,1.51,0,.1,.06,.1,SKIN);                                                   /* 목 */
  bx(B,0,1.66,0,.25,.26,.25,SKIN);                                                 /* 머리 */
  bx(B,0,1.8,-.012,.27,.06,.27,hair);bx(B,0,1.71,-.12,.27,.16,.04,hair);           /* 머리카락 */
  if(opt.style==='bob')[-1,1].forEach(sd=>bx(B,sd*.13,1.66,-.03,.04,.22,.22,hair));
  if(opt.beard)bx(B,0,1.57,.1,.25,.08,.06,hair);
  if(opt.glasses){const GC=[.12,.12,.14];[-1,1].forEach(sd=>bx(B,sd*.06,1.68,.128,.08,.05,.01,GC));bx(B,0,1.69,.128,.04,.012,.01,GC)}
  if(opt.cap){bx(B,0,1.82,-.01,.28,.07,.28,opt.cap);bx(B,0,1.8,.17,.22,.02,.1,opt.cap)}
  [[P.lua,P.lfa],[P.rua,P.rfa]].forEach(([u,f])=>{
    bx(u,0,-.13,0,.12,.3,.13,opt.short?SKIN:top);if(opt.short)bx(u,0,-.06,0,.13,.14,.14,top);   /* 위팔 */
    bx(f,0,-.11,0,.11,.26,.12,opt.short?SKIN:TOPD);                                 /* 아래팔 */
    bx(f,0,-.27,.005,.1,.09,.1,SKIN)});                                             /* 손 */
  [P.ll,P.rl].forEach(l=>{bx(l,0,-.42,0,.15,.86,.16,PANT);bx(l,0,-.88,.03,.16,.07,.24,SHOE)})}
/* 제품별 장면 */
function BUILD(i){GV=[];
  if(i===0){figure([.92,.92,.95],{vest:[.36,.34,.46],cap:[.2,.2,.28],hair:[.18,.14,.12]});
    /* 비상 컨트롤 배지: 왼쪽 가슴. 본체 · PTT · 상단 무전 버튼 · 경광등 · 잠금 슬라이드 */
    const q=PA.prod,LV2=[.66,.5,.92];bx(q,0,.03,0,.1,.07,.032,[.95,.95,.97]);bx(q,0,-.035,0,.1,.06,.032,LV2);bx(q,0,.07,0,.1,.012,.034,[.2,.18,.22]);   /* 흰 상단 · 라벤더 하단 · 상단 경광 밴드 */
    cyl(q,[0,.03,.016],[0,.03,.024],.03,[.6,.45,.9],0,false,24);cyl(q,[0,-.04,.016],[0,-.04,.022],.022,LV2.map(v=>v*.8),0,false,20);   /* PTT · 블루투스 버튼 */
    cyl(q,[0,-.065,.016],[0,-.065,.022],.008,[.95,.95,.97],0,false,12);for(let k=0;k<5;k++)bx(q,-.02+k*.01,-.012,.017,.004,.004,.004,[.3,.3,.35]);   /* 마이크 구멍 */
    bx(PA.x3,0,0,0,.012,.028,.02,LV2.map(v=>v*.7));                                                     /* 우측 안전 잠금 슬라이드 */
    bx(PA.x1,0,0,0,.09,.008,.008,[1,.2,.25],1);bx(PA.x2,0,0,0,.09,.008,.008,[.3,.5,1],1);
    ring(PA.fx,0,0,0,.06,.004,[.4,.6,1],1,40)}
  else if(i===1){figure([.52,.36,.86],{style:'bob',hair:[.95,.5,.52],buttons:[.95,.9,1],trim:[.96,.94,.99]});
    /* TIME DIAL: 이중 다이얼 · 원형 LED 링 · 반투명 노즐 */
    const q=PA.prod;cyl(q,[0,-.012,0],[0,.012,0],.072,WH,0,false,40);cyl(q,[0,.012,0],[0,.02,0],.058,[.88,.86,.94],0,false,40);
    cyl(q,[0,.02,0],[0,.024,0],.044,[.15,.15,.2],0,false,40);bx(q,0,.026,.02,.004,.002,.03,WH,.6);
    ring(PA.x1,0,.0,0,.075,.007,[.86,.86,.9],0,40);for(let k=0;k<24;k++){const a=k/24*6.2832;bx(PA.x2,Math.cos(a)*.062,.025,Math.sin(a)*.062,.008,.004,.008,LIL,1)}
    /* 휴대폰: 다이얼이 뒷면에 붙어 있음, 화면은 사용자 쪽 */
    rbx(PA.x3,.17,.014,.32,[.16,.16,.2]);bx(PA.x3,0,.0075,0,.15,.002,.29,[.62,.55,.95],.55);bx(PA.x3,0,.0085,-.1,.1,.001,.03,[.95,.95,1],.7)
    sph(PA.x4,0,0,0,.013,[.92,.9,1],.45);                                                              /* 유리 PUI 구슬 */
    const tile=(q,f)=>{rbx(q,.16,.16,.02,[.97,.96,1]);f(q)};                                          /* AI 추천 아이콘 타일: 공연 · 체험 · 전시 · 확정 */
    tile(16,q=>{bx(q,.015,.0,.012,.012,.07,.004,LIL,.9);sph(q,-.005,-.035,.012,.018,LIL,.9)});
    tile(17,q=>{for(let k=0;k<6;k++)bx(q,-.035+k*.014,-.03+(k<3?k:5-k)*.022,.012,.016,.012,.004,LIL,.9)});
    tile(18,q=>{bx(q,0,0,.012,.09,.07,.003,LIL,.6);bx(q,-.02,-.01,.014,.03,.03,.003,[.95,.95,1],.9)});
    tile(19,q=>{cyl(q,[-.04,0,.012],[-.012,-.03,.012],.008,[.45,.85,.6],1,true,8);cyl(q,[-.012,-.03,.012],[.045,.035,.012],.008,[.45,.85,.6],1,true,8)})}
  else if(i===2){   /* Echo Ring: 두 사람이 각자 검지 · 중지에 링을 끼고, 떨어져 있어도 햅틱 신호로 연결 */
    figure([.97,.97,.98],{short:1,glasses:1,hair:[.62,.27,.24]},PA);figure([.98,.7,.76],{style:'bob',hair:[.22,.16,.14]},PB);
    [PA,PB].forEach(P=>{const q=P.prod;[-.016,.016].forEach(x=>cyl(q,[x,0,0],[x,-.075,0],.012,SKIN,0,true));
      bx(q,0,-.03,0,.06,.024,.032,[.94,.94,.97]);bx(q,0,-.03,.017,.05,.016,.004,[.72,.6,1],.9);ring(P.fx,0,0,0,.06,.004,[.42,1,.8],1,36)})}
  else{
    /* 회전형 리본 스크린 펜스 (CAD 형태): 둥근 캡의 원기둥 폴 · 돔형 받침 · 폴 양옆 위쪽에 짧은 암으로 붙은 둥근 모서리 패널 2장 */
    const X0=.62,PW=[.93,.93,.96],PN=[.84,.78,1],ZS=[-1.15,0,1.15];
    const pole=(z)=>{lathe(PA.x4,X0,z,[[0,.12],[.02,.115],[.05,.09],[.07,.072],[.08,0]],PW,1,1,0,24);cyl(PA.x4,[X0,.06,z],[X0,1.64,z],.068,PW,0,false,24);
      lathe(PA.x4,X0,z,[[1.64,.068],[1.67,.062],[1.69,.04],[1.70,0]],PW,1,1,0,24);lathe(PA.x4,X0,z,[[.82,.07],[.84,.07]],[.82,.82,.86],1,1,0,24)};
    const panel=(q,ox,oy,oz,sd)=>{const zc=oz+sd*.235,W=.28,Hh=.83,T=.022;                     /* 둥근 모서리 패널 + 짧은 사선 암 */
      bx(q,ox,oy,zc,T,Hh-.03,W,PN);bx(q,ox,oy,zc,T,Hh,W-.03,PN);
      [-1,1].forEach(a=>[-1,1].forEach(b=>cyl(q,[ox-T/2,oy+a*(Hh/2-.015),zc+b*(W/2-.015)],[ox+T/2,oy+a*(Hh/2-.015),zc+b*(W/2-.015)],.015,PN,0,false,8)));
      bx(q,ox+.013,oy,zc,.004,Hh-.06,W-.05,[.72,.6,1],.3);
      cyl(q,[ox,oy-.06,oz+sd*.06],[ox,oy+.0,oz+sd*.095],.01,[.62,.62,.66],0,true,8)};
    ZS.forEach(z=>pole(z));
    panel(PA.x1,0,0,0,1);panel(PA.x2,0,0,0,-1);                                                     /* 가운데: 회전 */
    [[20,-1.15,1],[21,-1.15,-1],[22,1.15,1],[25,1.15,-1]].forEach(p=>panel(p[0],0,0,0,p[2]));      /* 양옆 폴의 패널도 회전 */
    const TP=[[.86,.86,.9],[.3,.3,.4],[.62,.5,.86],[.95,.62,.7],[.4,.62,.85],[.9,.8,.55],[.2,.2,.24],[.55,.75,.6]],HC=[[.15,.12,.1],[.35,.22,.15],[.9,.7,.35],[.1,.1,.12]];
    const mini=(x,z,k,qq,mute)=>{const q=qq===undefined?PA.x3:qq,tp=TP[k%TP.length],hc=HC[k%HC.length],sc=.9+(k*.37%1)*.15;   /* 블록형 관객 */
      const GR=[.8,.79,.83],dim=c=>mute?c.map((v,j)=>v*.12+GR[j]*.88-(c===hc?.06:0)):c;   /* 가만히 있는 관객은 색을 빼 회색 톤으로 → 움직이는 사람에게 시선 */
      const B=(cx,cy,cz,sx,sy,sz,c)=>bx(q,x+cx*sc,cy*sc,z+cz*sc,sx*sc,sy*sc,sz*sc,dim(c));
      B(-.085,.42,0,.15,.86,.16,PANT);B(.085,.42,0,.15,.86,.16,PANT);B(0,1.0,0,.36,.16,.22,PANT);B(0,1.27,0,.42,.44,.24,tp);
      B(-.27,1.2,0,.12,.52,.13,tp);B(.27,1.2,0,.12,.52,.13,tp);B(-.27,.9,0,.1,.09,.1,SKIN);B(.27,.9,0,.1,.09,.1,SKIN);
      B(0,1.51,0,.1,.06,.1,SKIN);B(0,1.66,0,.25,.26,.25,SKIN);B(0,1.8,-.012,.27,.06,.27,hc);B(0,1.71,-.12,.27,.16,.04,hc)};
    [[1.45,-1.4],[1.45,-.47],[1.45,.47],[1.45,1.4],[2.25,-.93],[2.25,0],[2.25,.93]].forEach((p,k)=>mini(p[0],p[1],k,undefined,1));
    [16,17,18,19].forEach((q,k)=>mini(0,0,k+3,q))                                                   /* 이동객 4명 */;   /* 펜스 너머 관람 공간 */
}
  /* 바닥 그림자 원 */
  const n=40;for(let k=0;k<n;k++){const a0=k/n*6.2832,a1=(k+1)/n*6.2832;tri3(PA.gnd,[0,0,0],[Math.cos(a1)*.9,0,Math.sin(a1)*.9],[Math.cos(a0)*.9,0,Math.sin(a0)*.9],[0,1,0],[0,1,0],[0,1,0],[0,0,0],-1)}
  if(!ok)return;const A=new Float32Array(GV);NV2=A.length/11;g.bindBuffer(g.ARRAY_BUFFER,vbo);g.bufferData(g.ARRAY_BUFFER,A,g.STATIC_DRAW)}

/* 행렬 */
const I4=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const mm=(a,b)=>{const o=new Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o};
const Tm=(x,y,z)=>{const m=I4();m[12]=x;m[13]=y;m[14]=z;return m};
const Rx=a=>{const c=Math.cos(a),s=Math.sin(a);return [1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]};
const Ry=a=>{const c=Math.cos(a),s=Math.sin(a);return [c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]};
const Rz=a=>{const c=Math.cos(a),s=Math.sin(a);return [c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]};
const Sc=s=>{const m=I4();m[0]=m[5]=m[10]=s;return m};
const ch=(...ms)=>ms.reduce((a,b)=>mm(a,b));
function persp2(f,a,n,fa){const t=1/Math.tan(f/2);return [t/a,0,0,0,0,t,0,0,0,0,(fa+n)/(n-fa),-1,0,0,2*fa*n/(n-fa),0]}
function look(e,c){const z=nrm3([e[0]-c[0],e[1]-c[1],e[2]-c[2]]),x=nrm3([z[2],0,-z[0]]),y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
  return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1]}

/* 자세: 어깨(앞으로 p · 옆으로 r) · 팔꿈치(e) */
/* Echo Ring 시나리오 (12초 반복): ① 함께 걷기 → ② 감지 → ③ 방향 → ④ 부르고 대답하기 → ⑤ 다시 함께 */
const SCN={1:{d:2.2,st:['01 행사 탐색 · 휴대폰 뒤 다이얼을 돌려 행사를 둘러봄','02 일정 설정 · 다이얼을 집어 돌려 원하는 시간에 맞춤','03 PUI 이동 · 유리 구슬이 시간에 따라 다이얼 위를 이동',
    '04 AI 일정 추천 · 현장 상황에 맞춰 공연 → 체험 → 전시 순서를 제안','05 일정 확정 · 다이얼을 눌러 일정을 확정','06 행사장 이동 · 휴대폰을 내리고 다음 장소로 이동']},
  0:{d:2.6,st:['① 잠금 해제 · 우측 슬라이드를 밀어 버튼을 켜고, 상·하단 파란 LED로 연결 점검','② 자체 네트워크 · 블루투스 버튼으로 주변 시민 기기를 배지 망에 통합',
    '③ 긴급 공지 · PTT를 길게 눌러 말하면 AI가 재난 안내 문자로 바꿔 즉시 송출','④ 현장 통제 · 경광등으로 위치를 알리고, AI 신호기가 도시 인프라와 위치 공유','⑤ 실시간 무전 · 상단 무전 버튼으로 요원끼리 상황을 조율하고 종료']},
  3:{d:3.2,st:['01 공연 시작 전 · 가림막이 90° 회전해 열리고, 관람객과 이동객이 자유롭게 이동','02 공연 진행 중 · 가림막이 정렬되어 공연 공간을 가리고, 관람객은 공연에 집중',
    '03 공연 진행 중 · 이동객은 분리된 통로를 따라 멈춤 없이 이동','04 공연 종료 · 휴식 · 가림막이 다시 회전해 안과 밖을 연결']}};
const scnAt=t=>{const c=idx===2?{d:2.4,st:ESTEP}:SCN[idx];if(!c)return null;const n=c.st.length,T=t%(c.d*n),ph=Math.floor(T/c.d);return {ph,u:(T-ph*c.d)/c.d,c}};
function scnCap(ph,c){if(ph===ESI)return;ESI=ph;const st=document.querySelector('.sxst');if(st){st.textContent=c.st[ph];st.classList.remove('in');void st.offsetWidth;st.classList.add('in')}}
const ESTEP=['① 함께 걷기 · 손을 놓고 각자 둘러보는 두 사람','② 감지 · 인파에 멀어지는 순간, 두 링이 동시에 진동','③ 방향 · 상판 위에서 상대가 있는 쪽으로 진동이 흐름','④ 부르고 대답하기 · 두 손가락을 오므리면 상대가 돌아봄','⑤ 다시 함께 · 손을 맞잡으면 두 링이 나란히'];
const EP=[{xa:-1.05,xb:1.05,ra:-1.05,rb:1.05,aa:[.35,.05,.9],ab:[.35,.05,.9]},{xa:-1.05,xb:1.05,ra:-1.05,rb:1.05,aa:[.85,-.1,1.35],ab:[.85,-.1,1.35]},
  {xa:-1.05,xb:1.05,ra:.85,rb:1.05,aa:[1.0,-.25,1.3],ab:[.85,-.1,1.35]},{xa:-1.05,xb:1.05,ra:.85,rb:-.85,aa:[1.05,-.2,1.6],ab:[.95,-.15,1.35]},
  {xa:-.26,xb:.26,ra:0,rb:0,aa:[.12,-.42,.12],ab:[.12,-.42,.12]}];
let ESI=-1;const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
function pose(t){const M=new Array(NP).fill(null).map(I4),G=new Array(NP).fill(1);const s=Math.sin;
  let body=ch(Tm(0,.012*s(t*1.6),0),Ry(.04*s(t*.5)));let la=[.08,.12,.15],ra=[.08,.12,.15],legs=[0,0];   /* 기본: 팔을 자연스럽게 */
  let BQ=null;
  let DQ=null;
  if(idx===0){const q=scnAt(t);scnCap(q.ph,q.c);BQ=q;const k=ease(q.u/.35),AR=[[.6,-.68,1.9],[.55,-.62,1.82],[.62,-.58,1.95],[.1,.1,.2],[.7,-.55,2.05]],LA=[[.08,.12,.15],[.08,.12,.15],[.08,.12,.15],[2.75,.2,.15],[.08,.12,.15]];
    const p0=AR[(q.ph+4)%5],p1=AR[q.ph],l0=LA[(q.ph+4)%5],l1=LA[q.ph];ra=p0.map((v,i)=>v+(p1[i]-v)*k);la=l0.map((v,i)=>v+(l1[i]-v)*k);
    if(q.ph===2)ra=[ra[0],ra[1],ra[2]+.02*s(t*20)];if(q.ph===4&&q.u>.35)ra[2]+=.06*Math.max(0,s(t*7))}
  else if(idx===1){const q=scnAt(t);scnCap(q.ph,q.c);DQ=q;const k=ease(q.u/.35);
    const RA=[[.78,.34,1.05],[.8,.3,1.15],[.78,.34,1.0],[.78,.34,1.0],[.82,.3,1.12],[.35,.12,.75]],LA=[[.78,.34,1.0],[.78,.34,1.0],[.78,.34,1.0],[.78,.34,1.0],[.78,.34,1.0],[.08,.1,.15]];
    const r0=RA[(q.ph+5)%6],r1=RA[q.ph],l0=LA[(q.ph+5)%6],l1=LA[q.ph];ra=r0.map((v,i)=>v+(r1[i]-v)*k);la=l0.map((v,i)=>v+(l1[i]-v)*k);
    if(q.ph<2)ra[2]+=.05*s(t*5);                                                                      /* 손가락으로 다이얼을 돌림 */
    if(q.ph===5){const sw=.36*s(t*8);legs=[sw,-sw];la=[.08-sw*.6,.1,.15];body=ch(Tm(0,.02*Math.abs(s(t*8)),0),Ry(.04*s(t*.5)))}}   /* 06 행사장으로 걸어감 */
  let EQ=null;
  if(idx===2){const T=t%12,ph=Math.floor(T/2.4),u=(T-ph*2.4)/2.4,k=ease(u/.45),A=EP[(ph+4)%5],Bq=EP[ph],L=(a,b)=>a+(b-a)*k,LV=(a,b)=>a.map((v,i)=>v+(b[i]-v)*k);
    const mv=Math.abs(Bq.xa-A.xa)>.01&&u<.45,sw=mv?.38*Math.sin(t*9):0;   /* 걸어서 이동할 때 다리 스윙 */
    EQ={ph,u,xa:L(A.xa,Bq.xa),xb:L(A.xb,Bq.xb),ra:L(A.ra,Bq.ra),rb:L(A.rb,Bq.rb),aa:LV(A.aa,Bq.aa),ab:LV(A.ab,Bq.ab),sw};
    ra=EQ.aa;la=[.06,.1,.12];legs=[sw,-sw];body=ch(Tm(EQ.xa,.012*s(t*1.6),0),Ry(EQ.ra));
    scnCap(ph,{st:ESTEP})}
  else if(idx===3){la=[.18,.1,.25];ra=[.95+.05*s(t*.8),-.05,.35];body=mm(body,Ry(.35))}
  M[PA.body]=body;
  const arm=(sx,a,u,f)=>{const S=ch(body,Tm(sx*.205,1.43,0),Rz(-sx*a[1]),Rx(-a[0]));const F=ch(S,Tm(0,-.27,0),Rx(-a[2]));M[u]=S;M[f]=F;return F};
  const LF=arm(-1,la,PA.lua,PA.lfa),RF=arm(1,ra,PA.rua,PA.rfa);
  M[PA.ll]=ch(body,Tm(-.085,.98,0),Rx(-legs[0]));M[PA.rl]=ch(body,Tm(.085,.98,0),Rx(-legs[1]));
  if(idx===0){const P=ch(body,Tm(-.085,1.3,.13));M[PA.prod]=P;const q=BQ,u=q.u,ph=q.ph;
    M[PA.x3]=ch(P,Tm(.056,ph===0?-.015+.03*ease(u/.5):.015,0));                                         /* ① 슬라이드를 위로 */
    M[PA.x1]=ch(P,Tm(0,.071,.018));M[PA.x2]=ch(P,Tm(0,-.067,.018));
    const bl=(t*2.4)%1;G[PA.x1]=ph===3?(bl<.5?1.6:0):0;G[PA.x2]=ph===0?.6+.6*s(t*6):ph===3?(bl<.5?0:1.6):ph===4?.9:.35;   /* 파란 연결 LED · ④ 빨강/파랑 경광 */
    const f=(t*.9)%1;G[PA.fx]=0;
    if(ph===1){M[PA.fx]=ch(P,Tm(0,0,0),Sc(1+f*14));G[PA.fx]=(1-f)*1.4}                                   /* ② 블루투스 망이 주변으로 퍼짐 */
    else if(ph===2){M[PA.fx]=ch(P,Tm(0,0,.03),Rx(1.5708),Sc(1+f*5));G[PA.fx]=(1-f)*1.5}                  /* ③ 음성 공지 송출 */
    else if(ph===3){M[PA.fx]=ch(body,Tm(0,1.95+f*.9,0),Sc(2+f*6));G[PA.fx]=(1-f)*1.2}                    /* ④ AI 신호기 ↔ 도시 인프라 */
    else if(ph===4){const g=(t*1.8)%1;M[PA.fx]=ch(P,Tm(0,.07,.02),Rx(1.5708),Sc(.6+g*1.6));G[PA.fx]=(1-g)*1.2}}
  else if(idx===1){const hp=m=>[m[12]-m[4]*.27,m[13]-m[5]*.27,m[14]-m[6]*.27],hl=hp(LF),hr=hp(RF);   /* 두 손 사이에 휴대폰을 쥠 */
    const PH=ch(Tm((hl[0]+hr[0])/2,(hl[1]+hr[1])/2+.04,(hl[2]+hr[2])/2+.02),Rx(-.62));M[PA.x3]=PH;const D=ch(PH,Tm(0,-.012,.02),Rx(Math.PI));M[PA.prod]=D;   /* 뒷면의 다이얼을 엄지로 돌림 */
    const q=DQ,ph=q.ph,u=q.u,tw=ph===0?.5*s(t*1.4):ph===1?1.4*ease(u):ph===4?1.4:0;M[PA.x1]=ch(D,Ry(tw));M[PA.x2]=ch(D,Ry(-t*.8));G[PA.x2]=.7+.5*s(t*3);
    const ang=ph===2?ease(u)*1.5708:ph===3?1.5708+ease(u)*1.5708:ph===4?3.1416:0;                       /* 03 시간에 따라 PUI 이동 12 → 3 → 6 */
    M[PA.x4]=ch(D,Tm(Math.sin(ang)*.046,.03-(ph===4&&u>.4&&u<.6?.006:0),Math.cos(ang)*.046));
    const T=(q,i,show)=>{const sc=show?ease(show):0;M[q]=sc>0?ch(PH,Tm(-.22+i*.22,.05,.42-.03*Math.abs(i-1)),Rx(.62),Sc(sc)):Sc(0)};
    [16,17,18].forEach((q,i)=>T(q,i,ph===3?Math.min(1,Math.max(0,(u-i*.22)/.18)):0));                   /* 04 AI 추천: 공연 → 체험 → 전시 */
    T(19,1,ph===4?Math.min(1,Math.max(0,(u-.45)/.15)):0)}                                              /* 05 일정 확정 */
  else if(idx===2){const HA=ch(RF,Tm(0,-.3,.02));M[PA.prod]=ch(HA,Tm(0,-.02,0));const E=EQ;
    const b2=ch(Tm(E.xb,.012*s(t*1.6+1.3),0),Ry(E.rb));M[PB.body]=b2;const a2=(sx,a,u,f)=>{const S=ch(b2,Tm(sx*.205,1.43,0),Rz(-sx*a[1]),Rx(-a[0]));const F=ch(S,Tm(0,-.27,0),Rx(-a[2]));M[u]=S;M[f]=F;return F};
    a2(1,[.06,.1,.12],PB.rua,PB.rfa);const LB=a2(-1,E.ab,PB.lua,PB.lfa);M[PB.ll]=ch(b2,Tm(-.085,.98,0),Rx(E.sw));M[PB.rl]=ch(b2,Tm(.085,.98,0),Rx(-E.sw));
    const HB=ch(LB,Tm(0,-.3,.02));M[PB.prod]=ch(HB,Tm(0,-.02,0));
    const pulse=(q,H,f)=>{M[q]=ch(H,Tm(0,-.03,0),Rx(1.5708),Sc(1+f*3));G[q]=(1-f)*1.6};const f=(t*1.6)%1;G[PA.fx]=G[PB.fx]=0;
    if(E.ph===1){pulse(PA.fx,HA,f);pulse(PB.fx,HB,f)}                                                   /* ② 동시에 진동 */
    else if(E.ph===2){const w=ease(E.u/.9),pa=[HA[12],HA[13]-.03,HA[14]],pb=[HB[12],HB[13]-.03,HB[14]];   /* ③ 상대 쪽으로 흐르는 진동 */
      M[PA.fx]=ch(Tm(pa[0]+(pb[0]-pa[0])*w,pa[1]+(pb[1]-pa[1])*w+.12*Math.sin(w*3.1416),pa[2]+(pb[2]-pa[2])*w),Ry(Math.atan2(pb[0]-pa[0],pb[2]-pa[2])),Sc(1.4+.6*Math.sin(t*12)));G[PA.fx]=1.6*Math.sin(Math.min(1,E.u/.9)*3.1416)}
    else if(E.ph===3){pulse(PA.fx,HA,(t*2.2)%1);if(E.u>.3)pulse(PB.fx,HB,(t*2.2+.4)%1)}                 /* ④ 부르면 상대 링이 대답 */
    else if(E.ph===4&&E.u>.5){M[PA.fx]=ch(HA,Tm(0,-.03,0),Rx(1.5708),Sc(1.2));G[PA.fx]=.6;M[PB.fx]=ch(HB,Tm(0,-.03,0),Rx(1.5708),Sc(1.2));G[PB.fx]=.6}}   /* ⑤ 나란히 */
  else{const q=scnAt(t);scnCap(q.ph,q.c);const ph=q.ph,u=q.u;   /* 01 열림 → 02 닫힘 → 03 분리 통행 → 04 다시 열림 */
    const open=ph===0?1:ph===1?1-ease(u/.35):ph===2?0:ease(u/.35);
    [[PA.x1,0,1],[PA.x2,0,-1],[20,-1.15,1],[21,-1.15,-1],[22,1.15,1],[25,1.15,-1]].forEach(p=>{M[p[0]]=ch(Tm(.62,1.14,p[1]),Ry(p[2]*open*1.5708))});M[PA.x4]=I4();
    M[PA.x3]=Tm(0,(ph===1||ph===2)?.018*Math.max(0,s(t*4.2)):0,0);                                     /* 공연 중 관객 들썩임 */
    [16,17,18,19].forEach((qq,k)=>{const fr=(u+k*.25)%1,bob=.025*Math.abs(s(t*8+k));let x,z,ry;
      if(ph===0){x=-1.6+3.6*fr;z=k%2?.575:-.575;ry=1.5708}                                             /* 열린 틈으로 자유롭게 오감 */
      else if(ph===3){x=2.0-3.6*fr;z=k%2?-.575:.575;ry=-1.5708}
      else{x=-.35-.35*(k%2);z=-2.4+4.8*fr;ry=0}                                                         /* 분리된 통로를 따라 이동 */
      M[qq]=ch(Tm(x,bob,z),Ry(ry))});}   /* 패널이 폴을 축으로 회전 */
  [PA.fx,PB.fx].concat(idx===0?[PA.x1,PA.x2]:[]).forEach(q=>{if(G[q]<=.01)M[q]=Sc(0)});
  M[PA.gnd]=Tm(0,.001,0);return {M,G}}

let yaw=-.35,yawT=-.35,pit=0,pitT=0,inside=false;
const c3=el.querySelector('.sxc');
c3.addEventListener('pointermove',e=>{const r=c3.getBoundingClientRect();yawT=-.35+((e.clientX-r.left)/r.width*2-1)*1.1;pitT=((e.clientY-r.top)/r.height*2-1)*.18;inside=true});
c3.addEventListener('pointerleave',()=>{inside=false;yawT=-.35;pitT=0});
let last2=performance.now(),T2=0;
function render(){if(!ok)return;const now=performance.now(),dt=Math.min(.1,(now-last2)/1000);last2=now;T2+=dt*SPEED;
  if(!inside)yawT=-.35+.28*Math.sin(T2*.35);yaw+=(yawT-yaw)*(1-Math.exp(-dt*3));pit+=(pitT-pit)*(1-Math.exp(-dt*3));
  const r=cv2.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
  if(cv2.width!==w||cv2.height!==h){cv2.width=w;cv2.height=h}
  g.viewport(0,0,w,h);g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.enable(g.DEPTH_TEST);g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);
  const cx=idx===3?.75:0,ty=1.0,tgt=[cx,ty-.08,0],D=idx===3?6.4:idx===2?5.6:4.0,el2=.12+pit+(idx===3?.14:0),yw=yaw+(idx===3?-.75:0),eye=[cx+Math.sin(yw)*Math.cos(el2)*D,ty+Math.sin(el2)*D,Math.cos(yw)*Math.cos(el2)*D];   /* 펜스: 사람 쪽에서 펜스 너머 관객이 보이게 */
  const VP=mm(persp2(.55,w/h,.1,30),look(eye,tgt)),P=pose(T2);
  g.useProgram(prog);g.uniformMatrix4fv(U2.uVP,false,VP);g.uniformMatrix4fv(U2.uM,false,P.M.flat());g.uniform1fv(U2.uG,P.G);g.uniform3fv(U2.uEye,eye);
  g.bindVertexArray(vao);g.drawArrays(g.TRIANGLES,0,NV2)}
if(!ok){el.querySelector('.sxc').innerHTML='<p class="nogl">이 브라우저에서는 3D(WebGL2)를 표시할 수 없습니다. 아래 사용 안내에서 단계를 확인하세요.</p>';}
BUILD(2);
const xs=[...document.querySelectorAll('#xs li')],chip=document.getElementById('chip'),go=document.getElementById('go'),
  NAMES=["함께 걷기", "감지", "방향", "부르고 대답하기", "다시 함께"];
let last=-1,raf=0,vis=true;
const mark=()=>{const ph=Math.floor((T2%12)/2.4);if(ph===last)return;last=ph;xs.forEach((li,k)=>li.classList.toggle('on',k===ph));chip.textContent=NAMES[ph]};
const loop=()=>{raf=0;if(!vis)return;render();mark();raf=requestAnimationFrame(loop)};
const kick=()=>{if(!raf&&vis)raf=requestAnimationFrame(loop)};
const play=v=>{SPEED=v?1:0;go.textContent=v?'일시 정지':(T2>0.01?'이어서 재생':'재생');last2=performance.now()};
go.onclick=()=>{play(!SPEED);kick()};
document.getElementById('rst').onclick=()=>{T2=0;last=-1;play(false);kick()};
xs.forEach((li,k)=>li.querySelector('button').onclick=()=>{T2=k*2.4+0.05;last=-1;kick()});
window.__scn={at:t=>{T2=t;last=-1},render:()=>{render();mark()},play};
if('IntersectionObserver' in window)new IntersectionObserver(es=>es.forEach(e=>{vis=e.isIntersecting;if(vis){last2=performance.now();kick()}})).observe(el);
mark();kick();
})();
