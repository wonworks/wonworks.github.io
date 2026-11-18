/* (예전 상세 페이지용 3D 렌더러는 개인 웹사이트로 대체되어 제거) */


/* =====================================================================
   제품 개인 페이지 : 제품마다 고유 템플릿 · 4개 제품 사이 이동 · 축제 지도로 복귀
   ===================================================================== */
(function(){
const H=document.documentElement,P=(typeof PRODUCTS!=='undefined'?PRODUCTS:[]).slice(0,4),N=P.length;if(N<4)return;
const IM=k=>(typeof PDIMG!=='undefined'&&PDIMG[k])||(typeof IMG!=='undefined'&&IMG[k])||'';
const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const AR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const root=document.createElement('div');root.id='pd';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-hidden','true');document.body.appendChild(root);
let cur=-1,stages=[],timers=[],retFocus=null;
const sw=i=>`<div class="pdsw" role="group" aria-label="제품 선택">${P.map((p,k)=>`<button type="button" data-p="${k}" class="${k===i?'on':''}" aria-label="${esc(p.name)}">0${k+1}</button>`).join('')}</div>`;
const nx=(i,cls)=>{const a=(i+N-1)%N,b=(i+1)%N;return `<div class="${cls}"><button type="button" data-p="${a}"><small>PREV · 0${a+1}</small><b>${esc(P[a].name)}</b></button><button type="button" data-p="${b}"><small>NEXT · 0${b+1}</small><b>${esc(P[b].name)}</b></button></div>`};

/* ---------- 제품별 내용 (가림막은 제공된 개인 사이트 문구 그대로) ---------- */
const D=[
 {brand:'비상 컨트롤 배지',crumb:'현장 안전 관리 / 제품 상세',k:'1구역 · 역 앞 진입로와 현장 전역',title:'비상 컨트롤 배지',sub:'네트워크가 끊겨도 현장에서 바로 작동하는 안전 요원용 비상 통신 배지.',
  info:[['주요 기능','음성을 재난 문자로 바꿔 전체 공지'],['핵심 특징','외부 통신 없이 자체 네트워크로 작동'],['사용 위치','역 앞 진입로와 축제 현장 전역']],
  views:[['사선','b_persp'],['정면','b_front'],['측면','b_side'],['후면','b_back']],
  ovH:'위기 순간에도 끊기지 않는 현장 통신',ovP:P[0].desc,feats:P[0].points,
  exp:'pv',expDesc:'안전 요원이 배지로 공지를 보내고 위치를 알리는 다섯 단계를 3D로 확인합니다.',
  steps:P[0].scen.map(x=>[x[0],x[1]]),strip:'b_scen',locH:'사용 위치 및 기대 효과',locP:P[0].loc,locPics:['b_front','b_side','b_back'],
  spec:P[0].spec,specImg:'b_front'},
 null,  /* TIME DIAL 은 B형 */
 {brand:'Echo Ring',crumb:'관람객 연결 / 제품 상세',k:P[2].info[2][1],title:P[2].full||P[2].name,sub:P[2].one,info:P[2].info,
  views:(P[2].imgs||[]).filter(x=>IM(x[0])).map((x,k)=>[['제품','착용','상세','구성'][k]||('0'+(k+1)),x[0]]),
  ovH:P[2].one,ovP:P[2].desc,feats:P[2].points,exp:'pv',expDesc:'두 사람이 링으로 서로를 느끼는 과정을 3D로 확인합니다.',
  steps:(P[2].scen||[]).map(x=>[x[0],x[1]]),locH:'사용 위치 및 기대 효과',locP:P[2].loc,spec:P[2].spec,specImg:(P[2].imgs&&P[2].imgs[0]||[])[0]},
 {brand:'동선 가림막',crumb:'공연장 동선 관리 / 제품 상세',k:'공연장 · 관람 구역과 이동 통로',title:'회전형 동선 가림막',sub:'공연 중에는 공간을 나누고, 휴식 시간에는 통로를 엽니다.',
  info:[['주요 기능','관람 구역과 이동 통로 분리'],['핵심 특징','90° 회전 패널과 퍼플 LED 라인'],['사용 위치','공연장 출입구와 구역 경계']],
  model:'fence',ovH:'공연 흐름에 맞춰 공간을 전환합니다',ovP:'공연 중에는 패널을 펼쳐 관람 구역과 통로를 분리합니다. 휴식이나 종료 후에는 인파 밀도와 정체 구간을 확인해 필요한 통로를 엽니다.',
  feats:[['90° 회전 패널','패널을 돌려 차단과 개방 상태를 전환합니다.'],['반투명 폴리카보네이트','확산 처리한 패널과 화이트 알루미늄 기둥을 사용합니다.'],['퍼플 LED 라인','패널 가장자리를 표시해 어두운 공간에서도 경계를 알아보기 쉽게 합니다.']],
  exp:'fence',expDesc:'나란히 배치한 가림막 6대가 관람 구역과 통로를 나눕니다.',
  steps:[['공연 시작 전','공연 일정과 인파를 확인합니다.'],['공연 진행 중','패널을 펼쳐 관람 구역과 통로를 분리합니다.'],['공연 종료·휴식','인파 밀도와 정체 구간을 살펴 개방 구간을 정합니다.'],['통로 개방','기둥 상단과 패널을 함께 90° 돌려 이동 통로를 연결합니다.'],['다음 공연 준비','통로 상태를 확인한 뒤 패널을 차단 상태로 되돌립니다.']],
  locH:'사용 위치 및 기대 효과',locP:'관람 구역과 공용 통로가 만나는 지점에 배치해 공연과 휴식 시간에 동선을 전환합니다.',diag:['관람 구역','공용 통로','두 구역이 만나는 경계에 가림막 배치'],
  spec:[['전체 크기','1,920 × 280 × 1,917 mm (너비 × 깊이 × 높이)'],['패널 크기','880 × 1,200 mm (1개 기준)'],['기둥 / 베이스','지름 160 mm / 280 mm'],['패널 재질','반투명 PC (확산 처리)'],['본체 재질','알루미늄 (화이트 분체 도장)'],['조명','퍼플 LED 라인 라이트']],specModel:true}];

/* ---------- A형 ---------- */
function A(i){const d=D[i];
  const stage=d.model?`<div class="pa-stage" id="pa3"><canvas tabindex="0" data-orbit aria-label="${esc(d.title)} 3D 모델 — 드래그 또는 방향키로 회전"></canvas><span class="pa-hint">드래그 또는 방향키로 제품 회전</span>
      <div class="pa-views"><button type="button" data-v="front" class="on">정면</button><button type="button" data-v="side">측면</button><button type="button" data-v="top">상단</button></div></div>`
    :`<div class="pa-stage pa-photo"><div class="ph zoomable"><img src="${IM(d.views[0][1])}" alt="${esc(d.title)} ${esc(d.views[0][0])}"></div><span class="pa-hint">마우스를 올리면 확대</span>
      <div class="pa-views">${d.views.map((v,k)=>`<button type="button" data-img="${v[1]}" class="${k?'':'on'}">${esc(v[0])}</button>`).join('')}</div></div>`;
  const exp=d.exp==='fence'?`<div class="pa-exp"><div class="pa-stage" id="paex"><span class="pa-chip" id="pachip">차단 모드</span><canvas tabindex="0" data-orbit aria-label="가림막 6대 체험"></canvas></div>
      <div class="pa-ex-b"><p id="paexd">${esc(d.expDesc)}</p><div class="pa-btns"><button type="button" class="pa-btn f" id="pago">체험 시작</button><button type="button" class="pa-btn o" id="parst">초기화</button></div></div></div>`
    :`<div class="pa-exp"><div class="pa-stage" id="papv"><span class="pa-chip" id="pachip">시나리오</span></div><div class="pa-ex-b"><p id="paexd">${esc(d.expDesc)}</p></div></div>`;
  return `<div class="pa">
  <header class="pa-top"><div class="pa-w in">
    <div class="pa-l"><button type="button" class="pdx" data-close>${AR}축제 지도</button><span class="pa-brand"><i></i>${esc(d.brand)}</span></div>
    <div class="pa-r"><nav class="pa-nav"><a href="#pa-s1" data-jump>제품 소개</a><a href="#pa-s2" data-jump>제품 체험</a><a href="#pa-s3" data-jump>사용 안내</a></nav>${sw(i)}</div></div></header>
  <main class="pa-w">
    <p class="pa-crumb">${esc(d.crumb)}</p>
    <section class="pa-hero"><div><p class="pa-k">${esc(d.k)}</p><h1>${esc(d.title)}</h1><p class="pa-sub">${esc(d.sub)}</p><a class="pa-ob" href="#pa-s1" data-jump>핵심 특징 ↓</a></div>
      <dl class="pa-info">${d.info.map(r=>`<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl></section>
    ${stage}
    <section class="pa-sec" id="pa-s1"><h2 class="pa-h"><b>01</b>제품 개요</h2><div class="pa-ov"><div><h3>${esc(d.ovH)}</h3><p>${esc(d.ovP)}</p></div>
      <div class="pa-ft">${(d.feats||[]).map(f=>`<div><b>${esc(f[0])}</b><span>${esc(f[1])}</span></div>`).join('')}</div></div></section>
    <section class="pa-sec" id="pa-s2"><h2 class="pa-h"><b>02</b>제품 체험</h2>${exp}</section>
    <section class="pa-sec" id="pa-s3"><h2 class="pa-h"><b>03</b>사용 안내</h2>
      <ol class="pa-steps" id="pasteps">${d.steps.map((s,k)=>`<li><em>0${k+1}</em><b>${esc(s[0])}</b><span>${esc(s[1])}</span></li>`).join('')}</ol>
      ${d.strip?`<figure class="pa-strip zoomable"><img src="${IM(d.strip)}" alt="사용 시나리오 다섯 장면"></figure>`:''}
      <div class="pa-loc"><div><h3>${esc(d.locH)}</h3><p>${esc(d.locP)}</p></div>
        ${d.diag?`<div class="pa-dg"><span>${esc(d.diag[0])}</span><span>${esc(d.diag[1])}</span><strong>${esc(d.diag[2])}</strong></div>`
          :d.locPics?`<div class="pa-dg pics">${d.locPics.map(k=>`<img class="zoomable-i" src="${IM(k)}" alt="">`).join('')}</div>`:'<div></div>'}</div></section>
    <section class="pa-sec" id="pa-s4"><h2 class="pa-h"><b>04</b>제품 상세</h2><div class="pa-spec">
      ${d.specModel?`<div class="pa-stage" id="pasp"><canvas aria-hidden="true"></canvas></div>`:`<div class="pa-stage pa-photo"><div class="ph zoomable"><img src="${IM(d.specImg)}" alt=""></div></div>`}
      <table><tbody>${(d.spec||[]).map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table></div>
      <div class="pa-end"><button type="button" data-jumpto="pa-s3">사용 안내</button><button type="button" data-jumpto="pa-s2">제품 체험</button></div></section>
    ${nx(i,'pa-nx')}
  </main></div>`}

/* ---------- B형 : TIME DIAL ---------- */
function B(i){return `<div class="pb">
  <header class="pb-w pb-top"><span class="pb-logo"><b>G/O</b><span>GANGNAM OBJECT</span></span>
    <nav class="pb-nav"><button type="button" data-close>전체 프로젝트</button><span class="x">TEAM 01</span><a href="#pb-hero" data-jump>3D 오브제</a><a href="#pb-ab" data-jump>프로젝트 소개 ↗</a>${sw(i)}</nav></header>
  <section class="pb-hero" id="pb-hero"><p class="pb-k">GANGNAM FESTIVAL · PRODUCT DESIGN</p><h1>축제의 순간을,<em>하나의 오브제로.</em></h1><p>강남의 다채로운 감각을 담은 작은 세계.</p>
    <div class="pb-stage" id="pbst"><span class="pb-word" aria-hidden="true">GANGNAM</span><canvas tabindex="0" data-orbit aria-label="TIME DIAL 3D 오브제 — 드래그로 회전, 스크롤로 확대"></canvas>
      <span class="pb-lab l">0${i+1} / FESTIVAL OBJECT</span><span class="pb-lab r">PURPLE × SILVER</span>
      <div class="pb-ctl"><small><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 14h22M8 9l-5 5 5 5M20 9l5 5-5 5"/></svg>드래그하여 회전 · 스크롤 / 핀치로 확대</small>
        <div><button type="button" id="pbtop">위에서 보기 ↗</button><button type="button" id="pbrst">시점 초기화 ↺</button></div></div></div>
    <a class="pb-down" href="#pb-ab" data-jump>오브제 이야기<svg viewBox="0 0 20 30" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 2v25M3 20l7 7 7-7"/></svg></a></section>
  <section class="pb-ab" id="pb-ab"><div class="pb-w"><small>01 — ABOUT THE OBJECT</small>
    <div class="pb-g"><h2>하나의 원 안에,<br>강남의 다채로움.</h2>
      <div><p>음악, 패션, 음식, 그리고 함께하는 사람들.<br>강남페스티벌의 다양한 장면을 원형 오브제 안에 담았습니다.</p><p>깊은 보라색과 은빛 표면의 대비, 층을 이루는 원형 구조와 작은 아이콘들이 축제의 분위기를 전합니다.</p>
        <dl class="pb-rows"><div><dt>PROJECT</dt><dd>강남페스티벌 제품 디자인</dd></div><div><dt>PALETTE</dt><dd><span><i style="background:#3B1458"></i>Deep purple</span><span><i style="background:linear-gradient(135deg,#fff,#c9c6cf)"></i>Silver</span></dd></div><div><dt>FORMAT</dt><dd>3D 제품 모델링 · 개인 포트폴리오</dd></div></dl></div></div>
    <figure class="pb-views zoomable"><img src="${IM('d_views')}" alt="TIME DIAL 네 방향 렌더 — Top, Perspective, Front, Right"></figure>
    <div class="pb-cap"><span>FORM &amp; DETAIL</span><span>서로 다른 시선으로 만나는 오브제</span></div>
    ${nx(i,'pb-more')}</div></section>
  <footer class="pb-foot"><div class="pb-w"><span class="pb-logo"><b style="font-size:38px">G/O</b><span>GANGNAM OBJECT</span></span><span>강남페스티벌 제품 디자인 · 개인 포트폴리오</span><button type="button" data-top>맨 위로 ↑</button></div></footer>
</div>`}

/* ---------- 3D 구성 ---------- */
function mk(cv,o){if(typeof MG==='undefined')return null;try{const s=MG.Stage(cv,o);if(s)stages.push(s);return s}catch(e){console.warn(e);return null}}
function vis(el,s,fn){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)s.run(fn);else s.stop()}),{root,rootMargin:'120px'});io.observe(el);timers.push({io})}
function setupDial(){const box=root.querySelector('#pbst'),cv=box&&box.querySelector('canvas');if(!cv)return;const s=mk(cv,{dpr:2,key:[.35,1,.6]});if(!s){box.classList.add('nogl');return}
  const m=PM.dial(s),c=s.cam;Object.assign(c,{yaw:0,pitch:.62,dist:3.3,t:[0,.1,0],fov:.55});const R={yaw:0,pitch:.62,dist:3.3};
  const ob=MG.orbit(s,cv,{zoom:true,zmin:1.25,zmax:5,pmin:.05,pmax:1.55,sway:.05});
  /* 스크롤하면 오브제 쪽으로 다가감 */
  let zs=0;const onS=()=>{const r=box.getBoundingClientRect(),h=innerHeight,p=Math.max(0,Math.min(1,(h*.85-r.top)/(h*1.1)));const z=1-p*.55;if(Math.abs(z-zs)>.002){ob.G.dist=R.dist*z;ob.G.pitch=Math.max(ob.G.pitch,.62+p*.35);zs=z}};
  root.addEventListener('scroll',onS,{passive:true});timers.push({off:()=>root.removeEventListener('scroll',onS)});
  root.querySelector('#pbtop').onclick=()=>ob.set({pitch:1.52,yaw:0});root.querySelector('#pbrst').onclick=()=>{ob.set(R);};
  vis(box,s,(dt,T)=>{ob.step(dt);m.anim(T)})}
function setupFence(){const d=D[3];
  const h=root.querySelector('#pa3 canvas');if(h){const s=mk(h,{dpr:2});if(s){PM.fence(s,{n:1});Object.assign(s.cam,{yaw:0,pitch:.06,dist:4.6,t:[0,1.02,0],fov:.55});
      const ob=MG.orbit(s,h,{pmin:-.1,pmax:1.5,sway:.08});const V={front:{yaw:0,pitch:.06},side:{yaw:Math.PI/2,pitch:.06},top:{yaw:0,pitch:1.48}};
      root.querySelectorAll('#pa3 [data-v]').forEach(b=>b.onclick=()=>{ob.set(V[b.dataset.v]);root.querySelectorAll('#pa3 [data-v]').forEach(x=>x.classList.toggle('on',x===b))});
      vis(h.parentNode,s,dt=>ob.step(dt))}}
  const e=root.querySelector('#paex canvas');if(e){const s=mk(e,{dpr:1.5,grid:.9});if(s){const g=MG.Geo();g.floor(30,0);s.add(s.mesh(g,{tr:true}));
      const F=PM.fence(s,{n:6,gap:1.98});F.units.forEach(u=>F.setAng(u,0));Object.assign(s.cam,{yaw:-.62,pitch:.52,dist:13.5,t:[0,.7,0],fov:.55});
      const ob=MG.orbit(s,e,{pmin:.08,pmax:1.4});let open=0,t0=0,auto=false;
      const chip=root.querySelector('#pachip'),desc=root.querySelector('#paexd'),stp=[...root.querySelectorAll('#pasteps li')];
      const mark=k=>stp.forEach((li,j)=>li.classList.toggle('on',j===k));
      const setOpen=v=>{open=v;t0=performance.now()/1000;chip.textContent=v?'개방 모드':'차단 모드';desc.textContent=v?'패널이 90° 회전해 관람 구역과 공용 통로가 다시 이어집니다.':d.expDesc;mark(v?3:1)};
      root.querySelector('#pago').onclick=()=>setOpen(open?0:1);root.querySelector('#parst').onclick=()=>{setOpen(0);ob.set({yaw:-.62,pitch:.52})};
      vis(e.parentNode,s,(dt,T)=>{ob.step(dt);const el=T-t0;F.units.forEach(u=>{const k=Math.max(0,Math.min(1,(el-u.delay)/1.1)),ez=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
          const goal=open?Math.PI/2:0;u.ang+=(goal-u.ang)*(open?ez:1)*.18+0;if(Math.abs(goal-u.ang)<.002)u.ang=goal;F.setAng(u,u.ang)})})}}
  const sp=root.querySelector('#pasp canvas');if(sp){const s=mk(sp,{dpr:2});if(s){PM.fence(s,{n:1});Object.assign(s.cam,{yaw:0,pitch:.02,dist:5.6,t:[0,.98,0],fov:.5});
      vis(sp.parentNode,s,(dt,T)=>{s.cam.yaw=.18*Math.sin(T*.4)})}}}
function setupPV(i){const box=root.querySelector('#papv');if(!box)return;const ok=window.__pv&&window.__pv.ok()&&window.__pv.mount(box,i);if(!ok){box.style.display='none';return}
  const stp=[...root.querySelectorAll('#pasteps li')],chip=root.querySelector('#pachip'),L=window.__pv.steps(i);let last=-2;
  const t=setInterval(()=>{const ph=window.__pv.step();if(ph===last)return;last=ph;stp.forEach((li,k)=>li.classList.toggle('on',k===ph));if(L[ph])chip.textContent=String(L[ph]).replace(/^\s*(\d{1,2}|[①-⑨])\s*/,'').split('·')[0].trim()},200);timers.push({iv:t,pv:1})}
/* 사진 확대 : 커서 위치를 중심으로 확대 */
function zoomers(){root.querySelectorAll('.zoomable').forEach(z=>{const img=z.querySelector('img');if(!img)return;img.style.transition='transform .35s var(--ease)';img.style.transformOrigin='50% 50%';
  z.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=z.getBoundingClientRect();img.style.transformOrigin=`${((e.clientX-r.left)/r.width*100).toFixed(1)}% ${((e.clientY-r.top)/r.height*100).toFixed(1)}%`;img.style.transform='scale(1.85)'});
  z.addEventListener('pointerleave',()=>{img.style.transform='none'});z.style.overflow='hidden';z.style.cursor='zoom-in'})}
/* 사진 시점 버튼 */
function photoViews(){root.querySelectorAll('.pa-photo [data-img]').forEach(b=>b.onclick=()=>{const img=b.closest('.pa-stage').querySelector('img');img.style.opacity=0;
  setTimeout(()=>{img.src=IM(b.dataset.img);img.alt=b.textContent;img.style.opacity=1},180);b.parentNode.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))})}

function clean(){timers.forEach(t=>{t.io&&t.io.disconnect();t.iv&&clearInterval(t.iv);t.off&&t.off()});if(timers.some(t=>t.pv))window.__pv&&window.__pv.unmount();timers=[];stages.forEach(s=>s.destroy());stages=[]}
const SITES={0:'PRODUCT01/index.html',1:'PRODUCT02/index.html',2:'PRODUCT03/index.html',3:'PRODUCT04/index.html'};
/* 공유용 단일 파일: 개인 사이트가 이 파일 안에 들어 있으면(script#site-N) 그것을 띄우고, 없으면 옆 파일을 연다 */
/* 공유용 단일 파일: 개인 사이트는 압축(gzip)해서 담고, 공통 글꼴은 팀 페이지 것을 함께 씀 → 파일 용량 절반 */
const siteText=i=>{const el=document.getElementById('site-'+i);if(el._p)return el._p;
  el._p=(async()=>{let t;
    if(el.type==='application/x-hg-gz'){const b=atob(el.textContent.trim()),u=new Uint8Array(b.length);for(let k=0;k<b.length;k++)u[k]=b.charCodeAt(k);
      t=await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}
    else t=el.textContent.replace(/<\\\/script/gi,'</script');
    el.textContent='';const f=document.getElementById('hg-font');if(f&&t.indexOf('id="hg-font"')<0)t=t.replace(/<head[^>]*>/i,m=>m+f.outerHTML);return t})();
  return el._p};
addEventListener('load',()=>setTimeout(()=>{[0,1,2,3].forEach(i=>{if(document.getElementById('site-'+i))(window.requestIdleCallback||setTimeout)(()=>siteText(i).catch(()=>{}))})},3500));   /* 첫 화면이 뜬 뒤 미리 풀어 둠 */
const srcOf=i=>{const el=document.getElementById('site-'+i);if(!el)return SITES[i];
  if(!el._u)el._u=URL.createObjectURL(new Blob([el.textContent.replace(/<\\\/script/gi,'</script')],{type:'text/html;charset=utf-8'}));return el._u};   /* 제작자가 만든 개인 사이트를 그대로 띄우는 제품 */
addEventListener('message',e=>{const m=e.data;if(!m||!m.hg||cur<0)return;if(m.close)closeDetail();else if(m.open!=null)show(m.open)});
/* 공통 상단 바의 '제품 소개 · 제품 체험 · 사용 안내' → 각 사이트의 해당 구역 */
const SECT={0:['#about','#viewer','#scenario'],1:['#about','#object','#about'],2:['#pa-s1','#pa-s2','#pa-s3'],3:['#overview','#experience','#guide']};
function wireBar(){root.querySelectorAll('.pdbar-m [data-go]').forEach(b=>b.onclick=()=>{const g=b.dataset.go,fr=root.querySelector('iframe.pdif');
  if(fr){try{fr.contentWindow.postMessage({hg:1,go:g},'*')}catch(e){}}else{const t=root.querySelector(g);t&&t.scrollIntoView({behavior:'smooth'})}})}
const BAR=i=>`<header class="pdbar"><div class="pdbar-l"><button type="button" class="pdbk" data-close>${AR}<span>축제 지도</span></button><b><em>0${i+1}</em>${esc(P[i].name)}</b></div>
  <nav class="pdbar-m" aria-label="페이지 안 이동">${['제품 소개','제품 체험','사용 안내'].map((t,k)=>`<button type="button" data-go="${SECT[i][k]}">${t}</button>`).join('')}</nav>
  <nav class="pdbar-r" aria-label="제품 이동"><button type="button" class="pdar" data-p="${(i+N-1)%N}" aria-label="이전 제품"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>${P.map((p,k)=>`<button type="button" data-p="${k}" class="pdn${k===i?' on':''}" aria-label="${esc(p.name)}"${k===i?' aria-current="page"':''}>0${k+1}</button>`).join('')}<button type="button" class="pdar" data-p="${(i+1)%N}" aria-label="다음 제품"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></nav></header>`;
function show(i){i=(i%N+N)%N;clean();cur=i;
  if(SITES[i]){const el=document.getElementById('site-'+i);
    root.innerHTML=BAR(i)+`<iframe class="pdif" title="${esc(P[i].name)} 제품 페이지"></iframe>`;root.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDetail());root.querySelectorAll('.pdbar [data-p]').forEach(b=>b.onclick=()=>show(+b.dataset.p));wireBar();
    const fr=root.querySelector('iframe'),ld=null;    /* 이 파일 안에 든 개인 사이트는 srcdoc 으로 바로 넣고(별도 주소 없이 즉시 표시), 없으면 옆 파일을 연다 */
    if(el){siteText(i).then(t=>{if(cur===i)fr.srcdoc=t}).catch(e=>console.error(e))}else fr.src=SITES[i];return}
  root.innerHTML=BAR(i)+(i===1?B(i):A(i));root.scrollTop=0;wireBar();
  root.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDetail());
  root.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>show(+b.dataset.p));
  root.querySelectorAll('[data-jump]').forEach(a=>a.onclick=e=>{e.preventDefault();const t=root.querySelector(a.getAttribute('href'));t&&t.scrollIntoView({behavior:'smooth'})});
  root.querySelectorAll('[data-jumpto]').forEach(a=>a.onclick=()=>{const t=root.querySelector('#'+a.dataset.jumpto);t&&t.scrollIntoView({behavior:'smooth'})});
  root.querySelectorAll('[data-top]').forEach(a=>a.onclick=()=>root.scrollTo({top:0,behavior:'smooth'}));
  if(i===1)setupDial();else if(i===3)setupFence();if(D[i]&&D[i].exp==='pv')setupPV(i);zoomers();photoViews()}
window.openDetail=function(i){retFocus=document.activeElement;window.__scenePause&&window.__scenePause(1);show(i);
  root.classList.add('open');root.setAttribute('aria-hidden','false');H.classList.add('d-open');H.style.overflow='hidden';
  setTimeout(()=>{const b=root.querySelector('[data-close]')||root.querySelector('iframe');b&&b.focus({preventScroll:true})},60)};
window.closeDetail=function(){if(cur<0)return;clean();cur=-1;root.classList.remove('open');root.setAttribute('aria-hidden','true');H.classList.remove('d-open');H.style.overflow='';
  setTimeout(()=>{if(cur<0)root.innerHTML=''},400);window.__scenePause&&window.__scenePause(0);retFocus&&retFocus.focus&&retFocus.focus({preventScroll:true})};
addEventListener('keydown',e=>{if(cur>=0&&e.key==='Escape')closeDetail()});
})();
