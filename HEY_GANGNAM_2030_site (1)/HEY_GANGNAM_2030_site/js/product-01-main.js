/* GANGNAM OBJECT — 페이지 동작 */
(function(){
  // 모델 데이터를 한 번만 디코딩해서 두 뷰어가 같이 씀
  var story=document.getElementById('story-model'),explore=document.getElementById('explore-model');
  var err=document.getElementById('error');
  story.addEventListener('error',function(){err.hidden=false});

  // 3D 모델 연결
  // - 웹사이트로 올렸을 때: assets/models/p01-object.glb 를 바로 불러옴
  // - 컴퓨터에서 index.html 을 더블클릭해 열었을 때(file://): 브라우저 보안 때문에 .glb 를
  //   직접 못 읽어서, 같은 모델을 담은 assets/models/p01-object-data.js 를 대신 사용
  function setModel(src){story.setAttribute('src',src);explore.setAttribute('src',src)}
  if(location.protocol==='file:'){
    var s=document.createElement('script');s.src='assets/models/p01-object-data.js';
    s.onload=function(){setModel('data:model/gltf-binary;base64,'+window.GO_MODEL_B64)};
    s.onerror=function(){err.hidden=false};
    document.head.appendChild(s);
  }else{
    setModel('assets/models/p01-object.glb');
  }
  // 축제장 3D 공간도 같은 방식으로 연결
  var festEl=document.getElementById('fest-model');
  if(location.protocol==='file:'){
    var s2=document.createElement('script');s2.src='assets/models/p01-festival-data.js';
    s2.onload=function(){festEl.setAttribute('src','data:model/gltf-binary;base64,'+window.GO_FEST_B64)};
    document.head.appendChild(s2);
  }else{
    festEl.setAttribute('src','assets/models/p01-festival.glb');
  }
  // 1인칭으로 손에 든 휴대폰
  var phEl=document.getElementById('phone-model');
  if(location.protocol==='file:'){
    var s3=document.createElement('script');s3.src='assets/models/p01-phone-data.js';
    s3.onload=function(){phEl.setAttribute('src','data:model/gltf-binary;base64,'+window.GO_PHONE_B64)};
    document.head.appendChild(s3);
  }else{
    phEl.setAttribute('src','assets/models/p01-phone.glb');
  }
  document.getElementById('reload').onclick=function(){location.reload()};
  setTimeout(function(){if(!customElements.get('model-viewer'))err.hidden=false},15000);

  // 헤더
  var hdr=document.getElementById('hdr');

  // 스크롤 스토리: 카메라 키프레임 [theta, phi, radius%, 모델 x위치%]
  var K=[[35,62,108,62],[0,0.01,150,62],[0,88,104,62],[-50,68,112,62]];
  var sec=document.getElementById('story'),chs=[].slice.call(document.querySelectorAll('.ch')),
      bars=[].slice.call(document.querySelectorAll('#progress i')),hud=document.getElementById('hudLabel'),
      bw=document.getElementById('bigword');
  var labels=['01 / FESTIVAL OBJECT','02 / TOP VIEW','03 / SIDE VIEW','04 / PURPLE × SILVER'];
  var cur=-1,spin=0,last=performance.now();
  function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
  function frame(now){
    var dt=Math.min(.05,(now-last)/1000);last=now;
    hdr.classList.toggle('solid',scrollY>40);
    var r=sec.getBoundingClientRect(),len=sec.offsetHeight-innerHeight;
    var p=Math.min(1,Math.max(0,-r.top/len));
    if(r.bottom>0&&r.top<innerHeight){
      var seg=p*(K.length-1),i=Math.min(K.length-2,Math.floor(seg)),t=seg-i;
      // 각 구간의 앞 45%는 머무르고 나머지에서 이동
      t=ease(Math.min(1,Math.max(0,(t-.45)/.55)));
      var a=K[i],b=K[i+1];
      var th=a[0]+(b[0]-a[0])*t,ph=a[1]+(b[1]-a[1])*t,rd=a[2]+(b[2]-a[2])*t;
      // 첫 장면에서는 천천히 자전
      var idle=Math.max(0,1-p*6);spin+=dt*14*idle;
      story.cameraOrbit=(th+spin*idle)+'deg '+ph+'deg '+rd+'%';
      bw.style.setProperty('--wy',(p*-120)+'px');
      var c=Math.min(K.length-1,Math.round(seg-.05));
      if(c!==cur){cur=c;
        chs.forEach(function(el,j){el.classList.toggle('on',j===c)});
        bars.forEach(function(el,j){el.classList.toggle('on',j===c)});
        hud.textContent=labels[c];
      }
    }
    requestAnimationFrame(frame);
  }
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){story.setAttribute('interpolation-decay','200')}
  requestAnimationFrame(frame);

  // 등장 애니메이션
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.15});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});

  // 4면 뷰 탭
  var img=document.getElementById('viewsImg'),cap=document.getElementById('viewsCap'),
      names=['TOP VIEW','PERSPECTIVE','FRONT VIEW','RIGHT VIEW'],tabs=[].slice.call(document.querySelectorAll('#tabs button'));
  function show(q){
    tabs.forEach(function(t){t.classList.toggle('on',+t.dataset.q===q)});
    if(q<0){img.style.transform='scale(.5)';cap.textContent='ALL VIEWS';return}
    var x=q%2,y=q>1?1:0;img.style.transform='translate('+(-50*x)+'%,'+(-50*y)+'%)';cap.textContent=names[q];
  }
  tabs.forEach(function(t){t.onclick=function(){show(+t.dataset.q)}});
  document.getElementById('viewsAll').onclick=function(){show(-1)};
  show(0);

  // 3D 체험 시점 버튼
  var btns=[].slice.call(document.querySelectorAll('#camBtns button[data-o]')),sp=document.getElementById('spin');
  btns.forEach(function(bt){bt.onclick=function(){
    btns.forEach(function(x){x.classList.toggle('on',x===bt)});
    explore.cameraOrbit=bt.dataset.o;explore.fieldOfView='28deg';
  }});

  // ── 다이얼 인터랙션 ──────────────────────────────
  // 보라 다이얼: 돌리면 유리판이 시계 가장자리를 따라 돌아감
  // 실버 다이얼: 돌리면 아이콘 불빛이 하나씩 켜짐 (45도마다 한 칸)
  // 아이콘 번호(0~7)는 3시 방향부터 시계 방향
  var ICONS=[
    {id:'sound',name:'EDM 파티',time:'10.03 (금) · 21:30 – 22:30'},
    {id:'spark',name:'K-POP 콘서트',time:'10.04 (토) · 18:00 – 21:00'},
    {id:'flag',name:'그랜드 퍼레이드',time:'10.03 (금) · 16:00 – 18:00'},
    {id:'bag',name:'쇼핑백 아이콘',time:'프로그램 정보 준비 중'},
    {id:'food',name:'글로벌 푸드 경연대회',time:'10.04 (토) · 14:00 – 15:00'},
    {id:'shirt',name:'패션 · 뷰티 페스타',time:'10.04 (토) · 13:00 – 17:00'},
    {id:'music',name:'패밀리 콘서트',time:'10.03 (금) · 19:00 – 21:30'},
    {id:'people',name:'사람 아이콘',time:'프로그램 정보 준비 중'}
  ];
  var START=6; // 처음엔 12시 방향(음악) 아이콘이 켜짐
  var D={p:0,pT:0,s:0,sT:0,active:-1,glow:[]};
  var rig=null;
  function deg(r){return r*180/Math.PI}
  // ── 리퀴드 글래스 돋보기 ──
  // 유리판 안 원판에 시계면 이미지를 굴절시켜 보여줌:
  // 가운데는 크게 확대, 가장자리로 갈수록 바깥 화면이 휘어 빨려 들어오고, 테두리엔 색 번짐과 빛 반사
  var LENS={mag:1.6,edge:1.06,ca:0.012,L0:[0.86114,0.5],R:0.1072};
  function sceneOf(v){var s=Object.getOwnPropertySymbols(v).find(function(x){return x.description==='scene'});return s&&v[s]}
  function liquidLens(scene){
    var o=scene&&scene.getObjectByName&&scene.getObjectByName('lens_mag'),U=null;
    if(!o)return null;
    o.traverse(function(c){
      if(!c.material||!c.material.map||U)return;
      var m=c.material.clone();c.material=m;
      U={uAng:{value:0},uMag:{value:LENS.mag},uEdge:{value:LENS.edge},uCA:{value:LENS.ca},uL0:{value:{x:LENS.L0[0],y:LENS.L0[1]}},uR:{value:LENS.R}};
      m.onBeforeCompile=function(sh){
        for(var key in U)sh.uniforms[key]=U[key];
        sh.fragmentShader='uniform float uAng,uMag,uEdge,uCA,uR;uniform vec2 uL0;\n'+sh.fragmentShader.replace('#include <map_fragment>',[
          '#ifdef USE_MAP',
          'vec2 d=(vMapUv-0.5)*2.0; float r=min(length(d),1.0);',
          'vec2 dir=r>1e-4?d/max(length(d),1e-4):vec2(0.0);',
          'float s=r/uMag+(uEdge-1.0/uMag)*pow(r,2.2);',
          'float cs=cos(uAng),sn=sin(uAng); mat2 rot=mat2(cs,-sn,sn,cs);',
          'vec2 base=uL0-0.5; float ca=uCA*r*r*r;',
          'float cr=texture2D(map,0.5+rot*(base+dir*(s*(1.0+ca))*uR)).r;',
          'vec4 cg=texture2D(map,0.5+rot*(base+dir*s*uR));',
          'float cb=texture2D(map,0.5+rot*(base+dir*(s*(1.0-ca))*uR)).b;',
          'vec3 col=vec3(cr,cg.g,cb);',
          'vec2 wdir=rot*dir;',
          'float rim=smoothstep(0.72,1.0,r);',
          'float lit=max(dot(wdir,normalize(vec2(-0.55,-0.83))),0.0);',
          'float back=max(dot(wdir,normalize(vec2(0.55,0.83))),0.0);',
          'col*=1.0-0.18*smoothstep(0.88,1.0,r);',
          'col+=vec3(1.0,0.97,1.0)*(pow(rim,3.0)*(0.08+0.55*pow(lit,2.0))+pow(rim,5.0)*0.25*back);',
          'col+=vec3(0.9,0.85,1.0)*0.05*(1.0-r);',
          'diffuseColor.rgb*=col;',
          '#endif'].join('\n'));
      };
      m.customProgramCacheKey=function(){return 'liquid-lens'};
      m.needsUpdate=true;
    });
    return U;
  }
  // 위쪽 스크롤 장면의 렌즈에도 같은 효과 (유리판은 3시에 고정)
  function storyLens(){var sc=sceneOf(story);if(liquidLens(sc)&&sc.queueRender)sc.queueRender()}
  story.addEventListener('load',storyLens);if(story.loaded)storyLens();

  function setupRig(){
    var sym=Object.getOwnPropertySymbols(explore).find(function(s){return s.description==='scene'});
    var scene=sym&&explore[sym];
    if(!scene||!scene.getObjectByName)return;
    var pp=scene.getObjectByName('purple_pivot'),spv=scene.getObjectByName('silver_pivot');
    if(!pp||!spv)return;
    var mats=[];
    for(var k=0;k<8;k++){
      var o=scene.getObjectByName('icon_'+k),list=[];
      if(o)o.traverse(function(c){if(c.material&&list.indexOf(c.material)<0)list.push(c.material)});
      mats.push(list);D.glow[k]=k===START?1:0;
    }
    var lensU=liquidLens(scene);
    var halos=[];
    for(var k2=0;k2<8;k2++){var ho=scene.getObjectByName('icon_halo_'+k2),hm=null;
      if(ho)ho.traverse(function(c){if(c.material&&!hm){c.material=c.material.clone();hm=c.material;hm.transparent=true;hm.depthWrite=false;hm.blending=2;hm.toneMapped=false;hm.needsUpdate=true}});
      halos.push(hm)}
    rig={scene:scene,pp:pp,sp:spv,mats:mats,lensU:lensU,halos:halos};
    updateActive(true);apply();
  }
  explore.addEventListener('load',setupRig);
  if(explore.loaded)setupRig();

  var glassEl=document.getElementById('glassPos'),roUse=document.getElementById('roUse'),
      roName=document.getElementById('roName'),roTime=document.getElementById('roTime');
  function activeIndex(){return(((START+Math.round(D.sT/45))%8)+8)%8}
  function updateActive(force){
    var a=activeIndex();if(a===D.active&&!force)return;D.active=a;
    [].forEach.call(document.querySelectorAll('.pg'),function(p){var on=+p.dataset.icon===a;p.classList.toggle('on',on);p.setAttribute('aria-pressed',on);if(on&&!force&&p.scrollIntoView&&p.parentNode.parentNode.scrollWidth>p.parentNode.parentNode.clientWidth){var L=p.parentNode.parentNode;L.scrollTo({left:p.offsetLeft-L.offsetLeft-20,behavior:'smooth'})}});
    var it=ICONS[a];roUse.setAttribute('href','#i-'+it.id);roName.textContent=it.name;roTime.textContent=it.time;
  }
  function apply(){
    if(!rig)return;
    // 화면에서 시계 방향 = three.js 의 -Y 회전
    rig.pp.rotation.y=-D.p*Math.PI/180;
    if(rig.lensU)rig.lensU.uAng.value=rig.pp.rotation.y;
    rig.sp.rotation.y=-D.s*Math.PI/180;
    for(var k=0;k<8;k++){
      var g=D.glow[k];
      rig.mats[k].forEach(function(m){m.emissiveIntensity=0.04+g*2.6});
      if(rig.halos[k])rig.halos[k].opacity=g*0.75;
    }
    rig.scene.queueRender();
  }
    function glassText(){var hr=(((3+Math.round(D.pT/30))%12)+12)%12;glassEl.textContent='유리판 · '+(hr===0?12:hr)+'시 방향'}
  var animating=false;
  function tick(){
    var moving=false;
    D.p+=(D.pT-D.p)*.18;D.s+=(D.sT-D.s)*.18;
    if(Math.abs(D.pT-D.p)>.05||Math.abs(D.sT-D.s)>.05)moving=true;else{D.p=D.pT;D.s=D.sT}
    for(var k=0;k<8;k++){var tg=k===D.active?1:0;D.glow[k]+=(tg-D.glow[k])*.15;if(Math.abs(tg-D.glow[k])>.005)moving=true;else D.glow[k]=tg}
    apply();
    if(moving)requestAnimationFrame(tick);else animating=false;
  }
  function kick(){updateActive();glassText();if(!animating){animating=true;requestAnimationFrame(tick)}}

  [].forEach.call(document.querySelectorAll('.dc button'),function(b){b.onclick=function(){
    var v=+b.dataset.v;setAuto(false);coachFinish();
    if(b.dataset.d==='p')D.pT+=v;else D.sT=Math.round(D.sT/45)*45+v;
    kick();
  }});

  // 모델 위에서 직접 돌리기
  var drag=null,tip=document.getElementById('dragTip'),hoverQ=false;
  function partAt(x,y){
    if(!rig)return null;
    var m=explore.materialFromPoint(x,y);if(!m)return null;
    return m.name==='purple_dial'?'p':m.name==='silver_dial'?'s':null;
  }
  function screenAngle(e){
    var r=explore.getBoundingClientRect();
    return deg(Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2)));
  }
  var used={p:false,s:false};
  function startDrag(e,part){
    coachFinish();
    e.stopPropagation();e.preventDefault();setAuto(false);
    var phi=deg(explore.getCameraOrbit().phi);
    drag={moved:0,part:part,a:screenAngle(e),x:e.clientX,twist:phi<55,flip:phi>90?-1:1,id:e.pointerId};
    try{explore.setPointerCapture(e.pointerId)}catch(_){}
    explore.classList.add('grabbing');
    tip.hidden=false;tip.textContent=part==='p'?'보라 다이얼 — 유리판이 움직여요':'실버 다이얼 — 아이콘 불빛이 바뀌어요';
  }
  explore.addEventListener('pointerdown',function(e){
    var hs=e.target.closest&&e.target.closest('.hs');
    if(hs){startDrag(e,hs.dataset.part);return}
    var part=partAt(e.clientX,e.clientY);if(part)startDrag(e,part);
  },true);
  // 힌트를 키보드로 누르면 한 칸 돌리기
  [].forEach.call(document.querySelectorAll('.hs'),function(h){h.addEventListener('click',function(e){
    if(e.detail!==0)return;setAuto(false);
    if(h.dataset.part==='p')D.pT+=30;else D.sT=Math.round(D.sT/45)*45+45;kick();
  })});
  window.addEventListener('pointermove',function(e){
    if(drag){
      var d;
      if(drag.twist){var a=screenAngle(e);d=a-drag.a;if(d>180)d-=360;if(d<-180)d+=360;drag.a=a;d*=drag.flip}
      else{d=-(e.clientX-drag.x)*.6;drag.x=e.clientX}
      drag.moved+=d;
      if(drag.part==='p')D.pT+=d;else D.sT+=d;
      kick();return;
    }
    if(e.target!==explore||hoverQ||!rig)return;
    hoverQ=true;requestAnimationFrame(function(){hoverQ=false;explore.classList.toggle('grab',!!partAt(e.clientX,e.clientY))});
  });
  function endDrag(){
    if(!drag)return;
    if(drag.part==='s')D.sT=Math.round(D.sT/45)*45;
    if(Math.abs(drag.moved)>8&&!used[drag.part]){used[drag.part]=true;document.querySelector('.hs[data-part="'+drag.part+'"]').classList.add('used')}
    drag=null;explore.classList.remove('grabbing');tip.hidden=true;kick();
  }
  window.addEventListener('pointerup',endDrag);window.addEventListener('pointercancel',endDrag);

  // 자동 회전: 보라 다이얼은 천천히 계속 돌고(유리판 이동), 실버 다이얼은 2.4초마다 한 칸씩(아이콘 불빛 이동)
  var auto=false,autoLast=0,autoNext=0,PURPLE_SPEED=14,STEP_MS=2400;
  function autoLoop(now){
    if(!auto)return;
    var dt=autoLast?Math.min(.25,(now-autoLast)/1000):0;autoLast=now;
    D.pT+=dt*PURPLE_SPEED;
    if(!autoNext)autoNext=now+STEP_MS;
    if(now>=autoNext){D.sT=Math.round(D.sT/45)*45+45;autoNext=now+STEP_MS}
    kick();requestAnimationFrame(autoLoop);
  }
  var userOff=false;
  function setAuto(on,sys){
    if(!sys)userOff=!on;
    if(on===auto)return;auto=on;
    sp.textContent=on?'자동 회전 ⏸':'자동 회전 ▶';sp.classList.toggle('on',on);sp.setAttribute('aria-pressed',on);
    if(on){autoLast=0;autoNext=0;requestAnimationFrame(autoLoop)}
  }
  sp.onclick=function(){setAuto(!auto)};
  // 체험란이 처음 화면에 보이면 자동 회전 시작 (움직임 줄이기 설정이면 시작 안 함)
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var exIO=new IntersectionObserver(function(es){
    if(es[0].isIntersecting&&!userOff&&!reduce)setAuto(true,1);
    else if(!es[0].isIntersecting&&auto)setAuto(false,1);
  },{threshold:.35});
  exIO.observe(explore);

  // ── 딸깍 소리 + 진동: 직접 돌릴 때만 (자동 회전 중엔 조용히) ──
  var actx=null,soundOn=true,sndBtn=document.getElementById('snd');
  try{soundOn=localStorage.getItem('go-sound')!=='off'}catch(_){}
  function sndLabel(){sndBtn.textContent=soundOn?'소리 켜짐':'소리 꺼짐';sndBtn.setAttribute('aria-pressed',soundOn)}
  sndLabel();
  sndBtn.onclick=function(){soundOn=!soundOn;sndLabel();try{localStorage.setItem('go-sound',soundOn?'on':'off')}catch(_){}};
  function audio(){
    if(!actx){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;actx=new AC()}
    if(actx.state==='suspended')actx.resume();return actx;
  }
  ['pointerdown','keydown'].forEach(function(ev){window.addEventListener(ev,function(){if(soundOn)audio()},{once:true,capture:true})});
  // kind: 's' 실버 한 칸(묵직한 딸깍), 'p' 보라 한 시간(가벼운 틱)
  function click(kind){
    if(auto)return;
    if(navigator.vibrate)try{navigator.vibrate(kind==='s'?12:5)}catch(_){}
    if(!soundOn)return;var a=audio();if(!a)return;
    var t0=a.currentTime,heavy=kind==='s';
    var len=Math.floor(a.sampleRate*.03),buf=a.createBuffer(1,len,a.sampleRate),d=buf.getChannelData(0);
    for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,heavy?3:5);
    var n=a.createBufferSource();n.buffer=buf;
    var bp=a.createBiquadFilter();bp.type='bandpass';bp.frequency.value=heavy?2300:4200;bp.Q.value=heavy?4:7;
    var g=a.createGain();g.gain.setValueAtTime(heavy?.55:.22,t0);
    n.connect(bp);bp.connect(g);g.connect(a.destination);n.start(t0);
    var o=a.createOscillator(),og=a.createGain();o.type='sine';o.frequency.setValueAtTime(heavy?950:1900,t0);o.frequency.exponentialRampToValueAtTime(heavy?380:900,t0+.04);
    og.gain.setValueAtTime(heavy?.18:.06,t0);og.gain.exponentialRampToValueAtTime(.0001,t0+.06);
    o.connect(og);og.connect(a.destination);o.start(t0);o.stop(t0+.07);
  }
  var lastHour=Math.floor(D.p/30),lastActive=activeIndex();
  function soundWatch(){
    var h=Math.floor((D.p+15)/30);if(h!==lastHour){lastHour=h;click('p')}
    var a=activeIndex();if(a!==lastActive){lastActive=a;click('s')}
    requestAnimationFrame(soundWatch);
  }
  requestAnimationFrame(soundWatch);

  // ── 시간표 카드 → 3D: 그 아이콘을 켜고, 유리판을 시작 시간으로 ──
  var pendingCard=null;
  function goToProgram(idx,hour){
    setAuto(false);coachFinish();
    var cur=Math.round(D.sT/45),dl=((idx-START-cur)%8+8)%8;if(dl>4)dl-=8;D.sT=(cur+dl)*45;
    var want=(hour-3)*30,dp=((want-D.pT)%360+360)%360;if(dp>180)dp-=360;D.pT+=dp;
    kick();
    var ro=document.querySelector('.readout');ro.classList.remove('flash');void ro.offsetWidth;ro.classList.add('flash');
  }
  [].forEach.call(document.querySelectorAll('.timetable .scene[data-icon]'),function(card){
    function go(){
      var idx=+card.dataset.icon,hour=+card.dataset.hour;
      document.getElementById('explore').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
      if(soundOn)audio();
      if(rig)setTimeout(function(){goToProgram(idx,hour)},reduce?0:700);else pendingCard=[idx,hour];
    }
    card.addEventListener('click',go);
    card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
  });
  [].forEach.call(document.querySelectorAll('.pg'),function(p){p.addEventListener('click',function(){
    if(soundOn)audio();
    if(rig)goToProgram(+p.dataset.icon,+p.dataset.hour);else pendingCard=[+p.dataset.icon,+p.dataset.hour];
  })});
  explore.addEventListener('load',function(){if(pendingCard){var p=pendingCard;pendingCard=null;setTimeout(function(){goToProgram(p[0],p[1])},400)}});

  // ── 돌리기 시범: 손가락이 실버 링을 따라 쓸어 돌리는 동작 (직접 한 번 돌리면 사라짐) ──
  var coach=document.getElementById('coach'),cArc=document.getElementById('coachArc'),cHead=document.getElementById('coachHead'),
      cHand=document.getElementById('coachHand'),cPress=document.getElementById('coachPress'),cTxt=document.getElementById('coachTxt'),
      stage=document.querySelector('.explore-stage'),coachDone=false,coachOn=false,coachT0=0;
  function pr(slot){var e=explore.querySelector('[slot="hotspot-'+slot+'"]').getBoundingClientRect(),s=stage.getBoundingClientRect();return [e.left+e.width/2-s.left,e.top+e.height/2-s.top]}
  var A0=1.05,A1=2.15,CYCLE=2600;
  function coachFrame(now){
    if(!coachOn)return;
    if(!rig){requestAnimationFrame(coachFrame);return}
    var c=pr('c'),x=pr('px'),z=pr('pz'),ax=[x[0]-c[0],x[1]-c[1]],bz=[z[0]-c[0],z[1]-c[1]];
    function P(th){return [c[0]+ax[0]*Math.cos(th)+bz[0]*Math.sin(th),c[1]+ax[1]*Math.cos(th)+bz[1]*Math.sin(th)]}
    var d='',k,p;
    for(k=0;k<=24;k++){p=P(A0+(A1-A0)*k/24);d+=(k?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)}
    cArc.setAttribute('d',d);
    var e=P(A1),e0=P(A1-.06),tx=e[0]-e0[0],ty=e[1]-e0[1],tl=Math.hypot(tx,ty)||1;tx/=tl;ty/=tl;
    var nx=-ty,ny=tx,L=11;
    cHead.setAttribute('d','M'+(e[0]-tx*L+nx*L*.7)+' '+(e[1]-ty*L+ny*L*.7)+'L'+e[0]+' '+e[1]+'L'+(e[0]-tx*L-nx*L*.7)+' '+(e[1]-ty*L-ny*L*.7));
    var u=((now-coachT0)%CYCLE)/CYCLE,move=Math.min(1,Math.max(0,(u-.15)/.6)),ease=move<.5?2*move*move:1-Math.pow(-2*move+2,2)/2;
    var h=P(A0+(A1-A0)*ease),vis=u<.08?u/.08:u>.88?Math.max(0,(1-u)/.12):1,down=u>.1&&u<.8;
    cHand.style.transform='translate('+(h[0]-19)+'px,'+(h[1]-8)+'px) scale('+(down?.92:1)+')';
    cHand.style.opacity=vis;
    cPress.style.transform='translate('+h[0]+'px,'+h[1]+'px) scale('+(down?1:.4)+')';
    cPress.style.opacity=down?vis:0;
    // 안내 문구: 아래 공간이 있으면 호 아래, 없으면 화살표 끝 옆
    var mid=P((A0+A1)/2),sw=stage.clientWidth,sh=stage.clientHeight,tw=cTxt.offsetWidth,th=cTxt.offsetHeight,txx,tyy;
    if(mid[1]+30+th+12<=sh){txx=mid[0]-tw/2;tyy=mid[1]+30}
    else{txx=e[0]-tw-26;tyy=e[1]-th/2;if(txx<12){txx=Math.min(sw-tw-12,Math.max(12,mid[0]-tw/2));tyy=Math.min(sh-th-12,mid[1]-th-40)}}
    txx=Math.min(sw-tw-12,Math.max(12,txx));
    cTxt.style.transform='translate('+txx+'px,'+tyy+'px)';
    requestAnimationFrame(coachFrame);
  }
  function showCoach(on){
    if(coachDone)on=false;
    if(on===coachOn)return;coachOn=on;
    if(on){coach.hidden=false;coach.classList.remove('fade');coachT0=performance.now();requestAnimationFrame(coachFrame)}
    else{coach.classList.add('fade');setTimeout(function(){if(!coachOn)coach.hidden=true},500)}
  }
  function coachFinish(){if(coachDone)return;showCoach(false);coachDone=true}
  new IntersectionObserver(function(es){showCoach(es[0].isIntersecting)},{threshold:.35}).observe(explore);


  // ── 시나리오 영상: assets/videos/p01-scenario.mp4 가 있으면 자리표시를 숨기고, 화면에 보일 때 소리 없이 재생 ──
  (function(){
    var v=document.getElementById('scVideo'),fr=document.getElementById('scFrame'),snd=document.getElementById('scSound');
    if(!v)return;
    function ready(){fr.classList.add('has-video');snd.hidden=false}
    v.addEventListener('loadeddata',ready);if(v.readyState>=2)ready();
    new IntersectionObserver(function(es){if(!fr.classList.contains('has-video'))return;
      if(es[0].isIntersecting){var p=v.play();if(p&&p.catch)p.catch(function(){})}else v.pause()},{threshold:.4}).observe(fr);
    snd.addEventListener('click',function(){v.muted=false;v.loop=false;v.controls=true;v.currentTime=0;v.play();snd.hidden=true});
  })();

  // ════════════════════════════════════════════════════
  // 축제장 걷기 (1인칭): WASD · 마우스 시선 · 손에 든 폰의 다이얼로 일정 담기
  // ════════════════════════════════════════════════════
  var FEST={"coll":[["circ",0,0,8.4],["box",12.364,4.017,1.1,0.3,1.2566],["box",-12.364,4.017,1.1,0.3,-1.2566],["box",-12.364,-4.017,1.1,0.3,-1.885],["box",-0.0,-13.0,1.1,0.3,-3.1416],["box",12.364,-4.017,1.1,0.3,1.885],["circ",8.639,9.028,0.28],["circ",8.917,-4.352,0.28],["circ",-8.46,-8.103,0.28],["circ",9.213,10.842,0.28],["circ",5.179,-11.7,0.28],["circ",-11.556,1.211,0.28],["circ",4.701,-13.932,0.28],["circ",12.895,7.417,0.28],["circ",-4.982,-9.484,0.28],["circ",3.531,11.023,0.28],["circ",-3.77,-10.902,0.28],["circ",-13.206,3.437,0.28],["circ",7.354,-10.753,0.28],["circ",4.51,8.528,0.28],["circ",9.721,9.985,0.28],["circ",7.645,-5.907,0.28],["circ",-6.709,19.221,0.2],["circ",-13.291,15.421,0.2],["circ",-7.581,17.373,0.28],["circ",-11.761,22.858,0.28],["circ",-20.0,3.8,0.2],["circ",-20.0,-3.8,0.2],["circ",-26.805,-1.94,0.28],["circ",-24.719,2.024,0.28],["circ",-13.291,-15.421,0.2],["circ",-6.709,-19.221,0.2],["circ",-8.787,-18.258,0.28],["circ",-11.044,-21.603,0.28],["circ",6.709,-19.221,0.2],["circ",13.291,-15.421,0.2],["circ",10.46,-21.253,0.28],["circ",10.646,-22.528,0.28],["circ",20.0,-3.8,0.2],["circ",20.0,3.8,0.2],["circ",26.989,-1.566,0.28],["circ",25.833,0.6,0.28],["circ",13.291,15.421,0.2],["circ",6.709,19.221,0.2],["circ",8.931,16.446,0.28],["circ",10.977,20.218,0.28],["circ",3.8,20.0,0.2],["circ",-3.8,20.0,0.2],["circ",3.8,27.0,0.2],["circ",-3.8,27.0,0.2],["circ",3.8,34.0,0.2],["circ",-3.8,34.0,0.2],["circ",3.8,41.0,0.2],["circ",-3.8,41.0,0.2],["circ",3.8,48.0,0.2],["circ",-3.8,48.0,0.2],["circ",1.625,29.97,0.28],["circ",1.821,21.932,0.28],["circ",-0.881,48.847,0.28],["circ",0.154,22.894,0.28],["circ",-1.34,42.434,0.28],["circ",1.593,26.472,0.28],["circ",-0.465,27.718,0.28],["circ",-1.033,30.147,0.28],["circ",-0.234,32.114,0.28],["box",-20.5,-35.507,10.0,4.0,0.5236],["box",-29.507,-30.307,0.3,0.3,0.5236],["box",-11.493,-40.707,0.3,0.3,0.5236],["box",-29.825,-26.659,0.8,0.7,0.5236],["box",-8.175,-39.159,0.8,0.7,0.5236],["circ",-9.308,-32.421,0.28],["circ",-15.912,-29.23,0.28],["circ",-9.209,-26.125,0.28],["circ",-7.812,-27.193,0.28],["circ",-13.257,-27.887,0.28],["circ",-17.833,-26.971,0.28],["circ",-10.968,-25.471,0.28],["circ",-10.793,-28.314,0.28],["circ",-20.97,-21.448,0.28],["circ",-10.511,-25.195,0.28],["circ",-10.703,-31.503,0.28],["circ",-18.281,-27.287,0.28],["circ",-15.701,-25.661,0.28],["circ",-19.615,-21.659,0.28],["circ",-14.336,-25.792,0.28],["circ",-13.125,-23.141,0.28],["circ",-23.672,-24.391,0.28],["circ",-9.588,-32.738,0.28],["circ",-15.739,-28.486,0.28],["circ",-18.202,-21.577,0.28],["circ",-18.85,-25.44,0.28],["circ",-11.086,-28.253,0.28],["circ",-9.371,-24.305,0.28],["circ",-20.32,-23.604,0.28],["circ",-22.846,-24.998,0.28],["circ",-15.472,-22.921,0.28],["circ",-23.501,-24.698,0.28],["circ",-7.571,-25.859,0.28],["circ",-7.33,-25.867,0.28],["circ",-11.666,-28.572,0.28],["circ",-15.297,-29.052,0.28],["circ",-8.536,-25.298,0.28],["circ",-18.773,-19.507,0.28],["circ",-7.49,-28.871,0.28],["circ",-17.883,-26.666,0.28],["circ",-12.201,-28.636,0.28],["circ",-14.922,-25.919,0.28],["circ",-19.717,-22.798,0.28],["circ",-8.355,-29.345,0.28],["circ",-19.257,-22.077,0.28],["circ",-22.109,-25.619,0.28],["circ",-13.45,-26.124,0.28],["circ",-6.945,-26.024,0.28],["circ",-14.984,-25.193,0.28],["circ",-18.063,-27.87,0.28],["circ",-20.372,-26.65,0.28],["box",20.5,-35.507,6.5,3.25,-0.5236],["circ",13.477,-30.844,0.28],["circ",16.075,-29.344,0.28],["circ",17.375,-28.594,0.28],["circ",18.674,-27.844,0.28],["circ",19.973,-27.094,0.28],["circ",21.272,-26.344,0.28],["box",16.75,-29.012,6.0,0.3,-0.5236],["circ",11.378,-30.208,0.28],["circ",15.275,-27.958,0.28],["circ",16.575,-27.208,0.28],["circ",17.874,-26.458,0.28],["box",15.95,-27.626,6.0,0.3,-0.5236],["circ",13.176,-27.322,0.28],["circ",14.475,-26.572,0.28],["box",15.15,-26.241,6.0,0.3,-0.5236],["circ",9.778,-27.437,0.28],["circ",11.077,-26.687,0.28],["circ",12.376,-25.937,0.28],["circ",14.975,-24.437,0.28],["circ",16.274,-23.687,0.28],["circ",18.872,-22.187,0.28],["box",14.35,-24.855,6.0,0.3,-0.5236],["box",12.618,-37.055,0.6,0.5,-0.5236],["box",25.782,-29.455,0.6,0.5,-0.5236],["box",41.0,-0.0,7.0,3.5,-1.5708],["box",40.0,-8.6,1.1,1.0,-1.5708],["box",40.0,8.6,1.1,1.0,-1.5708],["circ",33.266,-2.928,0.28],["circ",32.583,4.039,0.28],["circ",29.111,-2.521,0.28],["circ",33.311,-1.442,0.28],["circ",31.468,-2.85,0.28],["circ",30.678,-2.654,0.28],["circ",32.144,-4.173,0.28],["circ",27.651,5.152,0.28],["circ",29.177,2.542,0.28],["circ",29.184,-2.037,0.28],["circ",27.145,5.669,0.28],["circ",27.498,-1.37,0.28],["circ",27.434,0.211,0.28],["circ",28.781,1.523,0.28],["circ",32.103,6.002,0.28],["circ",28.939,1.852,0.28],["circ",26.819,-1.661,0.28],["circ",31.596,-3.139,0.28],["circ",29.039,4.788,0.28],["circ",29.24,3.542,0.28],["circ",28.741,-0.671,0.28],["circ",29.942,2.295,0.28],["circ",26.764,6.322,0.28],["circ",31.788,-4.354,0.28],["circ",26.5,-6.26,0.28],["circ",27.927,-0.591,0.28],["circ",32.769,0.459,0.28],["circ",29.187,-2.282,0.28],["circ",33.409,4.307,0.28],["circ",28.747,4.752,0.28],["box",-35.5,0.0,1.6,8.5,1.5708],["box",-44.6,0.0,5.5,0.3,1.5708],["box",-41.0,6.2,0.4,1.3,1.5708],["box",-35.0,6.2,0.4,1.3,1.5708],["box",-29.0,6.2,0.4,1.3,1.5708],["box",-41.0,-6.2,0.4,1.3,1.5708],["box",-35.0,-6.2,0.4,1.3,1.5708],["box",-29.0,-6.2,0.4,1.3,1.5708],["circ",-38.361,-4.348,0.28],["circ",-30.041,3.894,0.28],["circ",-37.682,-2.687,0.28],["circ",-33.269,4.32,0.28],["circ",-27.292,-3.231,0.28],["circ",-34.049,2.902,0.28],["circ",-41.378,-3.875,0.28],["circ",-31.948,4.351,0.28],["circ",-39.896,-4.139,0.28],["circ",-28.85,3.429,0.28],["circ",-31.33,-4.209,0.28],["circ",-40.68,4.444,0.28],["circ",-31.703,-4.414,0.28],["circ",-35.276,2.805,0.28],["circ",-37.908,-3.777,0.28],["circ",-40.394,3.148,0.28],["circ",-37.835,-2.903,0.28],["circ",-29.354,3.261,0.28],["circ",-39.292,-3.051,0.28],["circ",-27.611,4.48,0.28],["circ",-33.708,-4.475,0.28],["circ",-36.062,4.214,0.28],["box",24.6,28.579,1.4,0.4,-1.5708],["box",26.0,28.579,1.5,1.0,-1.5708],["circ",23.385,27.649,0.28],["circ",22.8,28.771,0.28],["box",23.9,31.873,1.4,0.4,-1.9897],["box",25.179,32.443,1.5,1.0,-1.9897],["circ",21.98,31.984,0.28],["circ",22.673,31.518,0.28],["box",21.92,34.598,1.4,0.4,-2.4086],["box",22.857,35.639,1.5,1.0,-2.4086],["circ",21.137,32.839,0.28],["circ",21.549,32.713,0.28],["box",19.003,36.282,1.4,0.4,-2.8274],["box",19.436,37.614,1.5,1.0,-2.8274],["circ",19.011,34.76,0.28],["circ",18.197,35.142,0.28],["box",15.653,36.634,1.4,0.4,3.0369],["box",15.507,38.027,1.5,1.0,3.0369],["circ",14.901,35.256,0.28],["circ",16.41,35.33,0.28],["box",12.45,35.594,1.4,0.4,2.618],["box",11.75,36.806,1.5,1.0,2.618],["circ",13.642,34.69,0.28],["circ",12.94,34.155,0.28],["box",18.964,24.847,1.0,0.4,-2.618],["circ",19.624,25.332,0.28],["box",14.75,25.548,1.0,0.4,-2.618],["circ",14.777,24.666,0.28],["box",12.036,28.847,1.0,0.4,-2.618],["circ",12.253,29.588,0.28],["circ",11.5,28.29,0.28],["box",15.155,21.85,1.0,0.4,-2.618],["circ",15.044,21.048,0.28],["box",11.345,24.05,1.0,0.4,-2.618],["circ",11.304,24.939,0.28],["circ",23.16,20.115,0.3],["circ",5.84,30.115,0.3],["box",-13.737,34.793,0.6,0.6,2.618],["box",-23.263,29.293,0.6,0.6,2.618],["circ",-13.773,42.855,0.3],["circ",-30.227,33.355,0.3],["circ",-29.351,35.048,0.28],["circ",-16.788,42.704,0.28],["circ",-29.229,34.617,0.28],["circ",-14.527,41.518,0.28],["circ",-11.973,39.737,0.3],["circ",-28.427,30.237,0.3],["circ",-27.567,31.941,0.28],["circ",-26.982,31.566,0.28],["circ",-13.867,38.942,0.28],["circ",-13.065,39.517,0.28],["circ",-10.173,36.62,0.3],["circ",-26.627,27.12,0.3],["circ",-24.724,28.95,0.28],["circ",-24.339,27.696,0.28],["circ",-25.769,28.169,0.28],["circ",-25.446,28.541,0.28],["circ",-8.373,33.502,0.3],["circ",-24.827,24.002,0.3],["circ",-24.351,25.787,0.28],["circ",-10.511,32.608,0.28],["circ",-23.432,25.163,0.28],["circ",-9.231,32.645,0.28],["circ",-6.573,30.384,0.3],["circ",-23.027,20.884,0.3],["circ",-7.22,29.154,0.28],["circ",-22.315,22.117,0.28],["circ",-20.982,22.468,0.28],["circ",-9.399,29.395,0.28],["circ",-4.773,27.267,0.3],["circ",-21.227,17.767,0.3],["circ",-19.131,17.988,0.28],["circ",-19.832,18.362,0.28],["circ",-7.227,27.083,0.28],["circ",-18.865,18.693,0.28],["box",-21.0,36.373,1.5,2.5,2.618],["box",-16.25,28.146,1.5,2.5,2.618],["box",-6.0,52.0,0.7,0.7,-0.0],["box",6.0,52.0,0.7,0.7,-0.0],["circ",59.426,2.974,0.5],["circ",60.629,11.446,0.5],["circ",60.592,20.294,0.5],["circ",53.321,26.403,0.5],["circ",51.05,34.653,0.5],["circ",47.491,42.753,0.5],["circ",38.388,45.46,0.5],["circ",33.017,52.122,0.5],["circ",26.526,58.134,0.5],["circ",17.098,56.99,0.5],["circ",-15.557,59.707,0.5],["circ",-24.381,59.066,0.5],["circ",-29.98,51.395,0.5],["circ",-38.056,48.566,0.5],["circ",-45.895,44.462,0.5],["circ",-47.974,35.196,0.5],["circ",-54.254,29.383,0.5],["circ",-59.809,22.497,0.5],["circ",-58.024,13.169,0.5],["circ",-61.469,5.336,0.5],["circ",-63.82,-3.194,0.5],["circ",-58.467,-11.038,0.5],["circ",-58.506,-19.595,0.5],["circ",-57.264,-28.355,0.5],["circ",-49.229,-33.417,0.5],["circ",-45.855,-41.282,0.5],["circ",-41.227,-48.822,0.5],["circ",-31.84,-50.264,0.5],["circ",-25.613,-56.133,0.5],["circ",-18.363,-61.205,0.5],["circ",-9.179,-58.788,0.5],["circ",-1.129,-61.69,0.5],["circ",7.541,-63.453,0.5],["circ",15.002,-57.578,0.5],["circ",23.542,-57.032,0.5],["circ",32.197,-55.196,0.5],["circ",36.699,-46.834,0.5],["circ",44.315,-42.931,0.5],["circ",51.521,-37.799,0.5],["circ",52.32,-28.336,0.5],["circ",57.75,-21.722,0.5],["circ",62.315,-14.143,0.5],["circ",59.277,-5.146,0.5],["circ",18.546,6.026,0.5],["circ",-18.546,6.026,0.5],["circ",-18.546,-6.026,0.5],["circ",-0.0,-19.5,0.5],["circ",18.546,-6.026,0.5],["circ",-23.832,14.49,0.5],["circ",-1.362,-44.294,0.5],["circ",36.531,-24.17,0.5],["circ",-24.018,-12.822,0.5]],"zones":[{"id":"parade","icon":2,"x":-17.5,"z":30.31},{"id":"fashion","icon":5,"x":-35.0,"z":0.0},{"id":"kpop","icon":1,"x":-17.5,"z":-30.31},{"id":"concert","icon":6,"x":17.5,"z":-30.31},{"id":"edm","icon":0,"x":35.0,"z":0.0},{"id":"food","icon":4,"x":17.5,"z":30.31}],"singer":{"x":19.8,"z":-34.29}};
  var ZINFO={
    parade:{icon:'flag',name:'그랜드 퍼레이드',day:'10.03 (금)',t:'16:00',end:'18:00',hour:16,ord:316},
    concert:{icon:'music',name:'패밀리 콘서트',day:'10.03 (금)',t:'19:00',end:'21:30',hour:19,ord:319},
    edm:{icon:'sound',name:'EDM 파티',day:'10.03 (금)',t:'21:30',end:'22:30',hour:21.5,ord:321.5},
    fashion:{icon:'shirt',name:'패션 · 뷰티 페스타',day:'10.04 (토)',t:'13:00',end:'17:00',hour:13,ord:413},
    food:{icon:'food',name:'글로벌 푸드 경연대회',day:'10.04 (토)',t:'14:00',end:'15:00',hour:14,ord:414},
    kpop:{icon:'spark',name:'K-POP 콘서트',day:'10.04 (토)',t:'18:00',end:'21:00',hour:18,ord:418}
  };
  var ZONE_BY_ICON={};FEST.zones.forEach(function(z){ZONE_BY_ICON[z.icon]=z.id;ZINFO[z.id].x=z.x;ZINFO[z.id].z=z.z});
  var $=function(id){return document.getElementById(id)};
  var fest=$('fest-model'),phoneEl=$('phone-model'),fStage=$('festStage'),fStart=$('fStart'),fEnter=$('fEnter'),fLoading=$('fLoading'),
      fZone=$('fZone'),fLock=$('fLock'),fJoy=$('fJoy'),fKnob=$('fKnob'),fMap=$('fMap'),mctx=fMap.getContext('2d'),fPhone=$('fPhone'),
      fPick=$('fPick'),fToast=$('fToast');
  var coarse=matchMedia('(pointer:coarse)').matches;
  var EYE=1.62;
  var F={x:0,z:45.4,yaw:0,pitch:Math.PI/2,speed:0,phase:0,active:false,inView:false,ready:false,phoneReady:false,raise:false};
  var keys={},fw=null,lastF=0,frameN=0;
  // 패밀리 콘서트 무대 가수 (이스터에그)
  var SG={lights:[],found:false,near:false};
  fEnter.disabled=true;

  // ── 월드 준비 ──
  function festReady(){
    var sc=sceneOf(fest);if(!sc||!sc.getObjectByName)return;
    var g=function(n){return sc.getObjectByName(n)};
    fw={sc:sc,anchor:g('monument_anchor'),mon:null,monPivot:null,beams:{}};
    var pl=g('player');if(pl)pl.visible=false;   // 1인칭이라 캐릭터는 숨김
    Object.keys(ZINFO).forEach(function(id){var b=g('beam_'+id);if(b){b.visible=false;fw.beams[id]=b}});
    // 빛 웅덩이·빛줄기는 가산 혼합, 그림자 데칼은 깊이 쓰기 끔 → 빛이 번지는 느낌
    var fogColor=null;
    sc.traverse(function(o){
      if(!o.material)return;var m=o.material,n=m.name||'';
      if(/^(pool_|shaft_|beam|spot_|fw_)/.test(n)){m.blending=2;m.depthWrite=false;m.transparent=true;m.fog=false}
      if(n==='spot_singer'||n==='pool_singer')SG.lights.push(m);
      if(n==='ao'){m.depthWrite=false;m.transparent=true}
      if(!fogColor&&m.color)fogColor=m.color.clone();
    });
    // 안개: 멀리 있는 것일수록 해 질 녘 지평선 색으로 흐려짐 (공기감)
    if(fogColor){fogColor.setRGB(0.10,0.06,0.13);
      sc.fog={isFog:true,name:'',color:fogColor,near:28,far:135,clone:function(){return this},toJSON:function(){return{}}};
      sc.traverse(function(o){if(o.material)o.material.needsUpdate=true});}
    fw.fws=[];for(var q=0;q<5;q++){var fn=g('fw_'+q);if(fn){var fm=null;fn.traverse(function(o){if(o.material&&!fm)fm=o.material});fn.visible=false;fw.fws.push({n:fn,m:fm})}}
    SG.root=g('singer');SG.body=g('singer_body');SG.head=g('singer_head');SG.al=g('singer_arm_l');SG.ar=g('singer_arm_r');
    if(SG.body){SG.by=SG.body.position.y;SG.hy=SG.head.position.y}
    F.ready=true;checkReady();attachMonument();placeCam();
  }
  fest.addEventListener('load',festReady);
  function checkReady(){
    if(F.ready&&F.phoneReady){fEnter.disabled=false;fLoading.textContent=coarse?'':'입장하면 마우스가 시선 조작에 쓰여요 · Esc로 풀기'}
  }
  function storyRoot(cb){
    var ss=sceneOf(story),src=ss&&ss.getObjectByName&&ss.getObjectByName('purple_pivot');
    if(src)cb(src.parent);else story.addEventListener('load',function(){storyRoot(cb)},{once:true});
  }
  // 광장 조형물: 위쪽 장면에 이미 불러온 오브제를 복제해 크게 세움
  function attachMonument(){
    if(!fw||fw.mon)return;
    storyRoot(function(root){
      if(fw.mon)return;
      var mon=root.clone(true),Hold=root.constructor,holder=new Hold(),S=215;
      mon.scale.set(S,S,S);mon.rotation.set(Math.PI/2,0,0);mon.position.set(-0.005*S,-0.0098*S,-0.0068*S);
      holder.position.set(0,5.45,0);holder.add(mon);fw.anchor.add(holder);
      fw.mon=holder;fw.monPivot=mon.getObjectByName('purple_pivot');
      fw.monLens=liquidLens(mon);   // 조형물 유리판 돋보기도 다이얼 회전에 맞춰 바뀌도록
      fw.sc.queueRender();
    });
  }

  // ── 손에 든 폰: 오브제를 복제해 폰 뒷면에 붙이고, 다이얼을 따로 조작 ──
  var PH={s:0,sT:0,p:0,pT:0,glow:[],rig:null};
  var PSTART=6;   // 처음엔 음악(패밀리 콘서트) 아이콘
  function phoneReady(){
    var sc=sceneOf(phoneEl);if(!sc||!sc.getObjectByName)return;
    var mount=sc.getObjectByName('dial_mount');if(!mount)return;
    storyRoot(function(root){
      if(PH.rig)return;
      var d=root.clone(true);
      d.traverse(function(o){if(o.material&&/icon_light|icon_halo/.test(o.material.name||'')){o.material=o.material.clone()}});
      mount.add(d);
      var lensU=liquidLens(sc);
      var mats=[],halos=[];
      for(var k=0;k<8;k++){
        var il=d.getObjectByName('icon_'+k),hl=d.getObjectByName('icon_halo_'+k),ml=[],hm=null;
        if(il)il.traverse(function(c){if(c.material&&ml.indexOf(c.material)<0)ml.push(c.material)});
        if(hl)hl.traverse(function(c){if(c.material&&!hm){hm=c.material;hm.transparent=true;hm.depthWrite=false;hm.blending=2;hm.toneMapped=false;hm.needsUpdate=true}});
        mats.push(ml);halos.push(hm);PH.glow[k]=k===PSTART?1:0;
      }
      PH.rig={sc:sc,pp:d.getObjectByName('purple_pivot'),sp:d.getObjectByName('silver_pivot'),mats:mats,halos:halos,lensU:lensU};
      PH.pT=PH.p=snapHour(progOf(PSTART)?progOf(PSTART).hour:3,0);
      phoneApply();F.phoneReady=true;checkReady();updatePick(true);
    });
  }
  phoneEl.addEventListener('load',phoneReady);
  function phoneApply(){
    var r=PH.rig;if(!r)return;
    r.pp.rotation.y=-PH.p*Math.PI/180;r.sp.rotation.y=-PH.s*Math.PI/180;
    if(r.lensU)r.lensU.uAng.value=r.pp.rotation.y;
    for(var k=0;k<8;k++){var g=PH.glow[k];r.mats[k].forEach(function(m){m.emissiveIntensity=0.04+g*2.6});if(r.halos[k])r.halos[k].opacity=g*0.8}
    r.sc.queueRender();
  }
  var phoneMoving=false;
  function phoneTick(){
    var mv=false;
    PH.p+=(PH.pT-PH.p)*.2;PH.s+=(PH.sT-PH.s)*.2;
    if(Math.abs(PH.pT-PH.p)>.05||Math.abs(PH.sT-PH.s)>.05)mv=true;else{PH.p=PH.pT;PH.s=PH.sT}
    var a=selIdx();
    for(var k=0;k<8;k++){var tg=k===a?1:0;PH.glow[k]+=(tg-PH.glow[k])*.18;if(Math.abs(tg-PH.glow[k])>.005)mv=true;else PH.glow[k]=tg}
    phoneApply();return mv;
  }
  function phoneKick(){if(!phoneMoving){phoneMoving=true;(function loop(){if(phoneTick())requestAnimationFrame(loop);else phoneMoving=false})()}}

  // ── 일정 ──
  function selIdx(){return(((PSTART+Math.round(PH.sT/45))%8)+8)%8}
  function progOf(i){var id=ZONE_BY_ICON[i];return id?Object.assign({id:id},ZINFO[id]):null}
  function snapHour(h,cur){var want=(h-3)*30,dp=((want-cur)%360+360)%360;if(dp>180)dp-=360;return cur+dp}
  var SCHED={},VISITED={},STAMPS={};
  // 시간 계산: 같은 날 시간이 겹치는지
  function mins(s){var p=s.split(':');return +p[0]*60+(+p[1])}
  Object.keys(ZINFO).forEach(function(id){var p=ZINFO[id];p.s=mins(p.t);p.e=mins(p.end);p.dk=p.day.slice(0,5)});
  function clashOf(id,set){var a=ZINFO[id];return Object.keys(set||SCHED).filter(function(o){var b=ZINFO[o];return o!==id&&a.dk===b.dk&&a.s<b.e&&b.s<a.e})}
  var schedList=$('fSchedList'),schedN=$('fSchedN'),schedE=$('fSchedE');
  function renderSched(){
    var ids=Object.keys(SCHED).sort(function(a,b){return ZINFO[a].ord-ZINFO[b].ord});
    var lastDay='';
    schedList.innerHTML=ids.map(function(id){var p=ZINFO[id],c=clashOf(id),h='';
      if(p.day!==lastDay){lastDay=p.day;h='<li class="dh">'+p.day+'</li>'}
      return h+'<li class="'+(VISITED[id]?'done ':'')+(c.length?'clash ':'')+(curZone&&curZone.id===id?'here':'')+'"><svg><use href="#i-'+p.icon+'"/></svg><b>'+p.name+'<small>'+p.t+' – '+p.end+(c.length?' <span class="warn">겹침</span>':'')+'</small></b><span class="tm">'+p.t+'</span></li>'}).join('');
    schedN.textContent=ids.length;schedE.hidden=ids.length>0;
    signs.forEach(function(s){var id=s.dataset.zone;s.classList.toggle('sel',!!SCHED[id]);s.classList.toggle('done',!!VISITED[id])});
    if(fw)Object.keys(fw.beams).forEach(function(id){fw.beams[id].visible=!!SCHED[id]&&!VISITED[id]});
    if(fw)fw.sc.queueRender();
  }
  function updatePick(silent){
    var i=selIdx(),p=progOf(i),it=ICONS[i];
    $('fPickUse').setAttribute('href','#i-'+it.id);
    $('fPickName').textContent=p?p.name:it.name;
    $('fPickTime').textContent=p?p.day+' · '+p.t+' – '+p.end:'프로그램 정보 준비 중';
    var inS=p&&SCHED[p.id];
    $('fPickAct').textContent=!p?'일정에 담을 수 없는 아이콘이에요':inS?(coarse?'담은 일정 · 버튼으로 빼기':'담은 일정 · 클릭해서 빼기'):(coarse?"'일정 담기'를 눌러 추가":'클릭해서 일정에 담기');
    fPick.classList.toggle('in',!!inS);
    var w=$('fPickWarn'),cl=p?clashOf(p.id):[];
    if(cl.length){w.hidden=false;w.textContent=(inS?'':'담으면 ')+cl.map(function(o){return ZINFO[o].name}).join(', ')+'와(과) 시간이 겹쳐요'}else w.hidden=true;
    var mb=fStage.querySelector('.f-add');if(mb)mb.textContent=inS?'일정 빼기':'일정 담기';
    signs.forEach(function(s){s.classList.toggle('aim',p&&s.dataset.zone===p.id)});
    if(!silent){fPick.classList.remove('bump');void fPick.offsetWidth;fPick.classList.add('bump')}
  }
  function turnSilver(dir){
    PH.sT=Math.round(PH.sT/45)*45+45*dir;
    var p=progOf(selIdx());if(p)PH.pT=snapHour(p.hour,PH.pT);
    click('s');phoneKick();updatePick();
  }
  function turnPurple(dir){PH.pT+=30*dir;click('p');phoneKick()}
  function toggleSched(){
    var p=progOf(selIdx());
    if(!p){toast('이 아이콘은 아직 프로그램이 없어요');return}
    if(SCHED[p.id]){delete SCHED[p.id];toast(p.name+' — 일정에서 뺐어요')}
    else{
      var cl=clashOf(p.id);SCHED[p.id]=1;delete VISITED[p.id];
      if(cl.length){toast('주의: '+cl.map(function(o){return ZINFO[o].name+'('+ZINFO[o].t+'–'+ZINFO[o].end+')'}).join(', ')+'와(과) 시간이 겹쳐요');warnTone()}
      else{toast('일정에 담았어요 · '+p.name+' '+p.t+' — 나침반을 따라가 보세요');chime()}
    }
    renderSched();updatePick(true);
  }
  var toastT=0;
  var toastImpT=0;
  function toast(msg,low){var now=performance.now();if(low&&now-toastImpT<2600)return;if(!low)toastImpT=now;fToast.textContent=msg;fToast.hidden=false;fToast.style.animation='none';void fToast.offsetWidth;fToast.style.animation='';clearTimeout(toastT);toastT=setTimeout(function(){fToast.hidden=true},2600)}
  function warnTone(){
    if(!soundOn)return;var a=audio();if(!a)return;var t0=a.currentTime;
    [520,390].forEach(function(f,i){var o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=f;
      g.gain.setValueAtTime(.05,t0+i*.14);g.gain.exponentialRampToValueAtTime(.0001,t0+i*.14+.13);o.connect(g);g.connect(a.destination);o.start(t0+i*.14);o.stop(t0+i*.14+.14)});
  }
  function chime(){
    if(!soundOn)return;var a=audio();if(!a)return;var t0=a.currentTime;
    [880,1320].forEach(function(f,i){var o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(0,t0+i*.09);g.gain.linearRampToValueAtTime(.12,t0+i*.09+.01);g.gain.exponentialRampToValueAtTime(.0001,t0+i*.09+.35);
      o.connect(g);g.connect(a.destination);o.start(t0+i*.09);o.stop(t0+i*.09+.4)});
  }

  // ── 카메라 (1인칭) ──
  function placeCam(bob){
    var r=0.6,sp=Math.sin(F.pitch),tx=F.x-r*sp*Math.sin(F.yaw),ty=EYE+(bob||0)-r*Math.cos(F.pitch),tz=F.z-r*sp*Math.cos(F.yaw);
    fest.cameraTarget=tx.toFixed(3)+'m '+ty.toFixed(3)+'m '+tz.toFixed(3)+'m';
    fest.cameraOrbit=F.yaw.toFixed(4)+'rad '+F.pitch.toFixed(4)+'rad '+r+'m';
    if(fest.jumpCameraToGoal)fest.jumpCameraToGoal();
  }

  // ── 입장 / 포인터 잠금 ──
  function enter(){
    if(!F.ready||!F.phoneReady)return;
    F.active=true;fStart.classList.add('hide');fStage.classList.add('playing');fStage.focus({preventScroll:true});
    if(coarse){fJoy.hidden=false;$('fMbtn').hidden=false}else requestLock();
    if(soundOn)audio();
    renderSched();updatePick(true);toast('휠을 굴려 다이얼을 돌리고, 클릭해서 일정에 담아보세요');
    lastF=0;requestAnimationFrame(festLoop);
  }
  fEnter.addEventListener('click',enter);
  var lockFailed=false;
  function lockFail(){lockFailed=true;fLock.hidden=false;fLock.textContent='드래그해서 시선을 돌리고, Space로 일정을 담아요'}
  function requestLock(){try{var p=fest.requestPointerLock&&fest.requestPointerLock();if(p&&p.catch)p.catch(lockFail)}catch(_){lockFail()}}
  function locked(){return document.pointerLockElement===fest}
  document.addEventListener('pointerlockchange',function(){var on=locked();fStage.classList.toggle('locked',on);fLock.hidden=on||!F.active||coarse;if(!on)setRaise(false)});
  new IntersectionObserver(function(es){F.inView=es[0].isIntersecting;if(!F.inView){keys={};if(locked())document.exitPointerLock()}else if(F.active){lastF=0;requestAnimationFrame(festLoop)}},{threshold:.25}).observe(fStage);

  // ── 마우스: 시선 / 클릭 = 일정 담기 / 오른쪽 = 폰 들기 / 휠 = 실버 다이얼 ──
  var drag2=null;
  function look(dx,dy){F.yaw-=dx*0.0026;F.pitch=Math.min(2.45,Math.max(0.75,F.pitch-dy*0.0026))}
  document.addEventListener('mousemove',function(e){if(locked())look(e.movementX,e.movementY)});
  fest.addEventListener('mousedown',function(e){
    if(!F.active||!locked())return;
    if(e.button===0)toggleSched();else if(e.button===2)setRaise(true);
  });
  window.addEventListener('mouseup',function(e){if(e.button===2)setRaise(false)});
  fest.addEventListener('contextmenu',function(e){if(F.active)e.preventDefault()});
  fest.addEventListener('click',function(){if(F.active&&!coarse&&!locked()&&!lockFailed)requestLock()});
  fest.addEventListener('pointerdown',function(e){
    if(!F.active||locked()||(e.pointerType==='mouse'&&!lockFailed))return;
    drag2={id:e.pointerId,x:e.clientX,y:e.clientY};try{fest.setPointerCapture(e.pointerId)}catch(_){}
  });
  fest.addEventListener('pointermove',function(e){if(drag2&&e.pointerId===drag2.id){look((e.clientX-drag2.x)*1.6,(e.clientY-drag2.y)*1.6);drag2.x=e.clientX;drag2.y=e.clientY}});
  fest.addEventListener('pointerup',function(){drag2=null});fest.addEventListener('pointercancel',function(){drag2=null});
  var wheelAcc=0,wheelT=0;
  fest.addEventListener('wheel',function(e){
    if(!F.active)return;e.preventDefault();
    var now=performance.now();if(now-wheelT>250)wheelAcc=0;wheelT=now;wheelAcc+=e.deltaY;
    if(Math.abs(wheelAcc)>=60){turnSilver(wheelAcc>0?1:-1);wheelAcc=0}
  },{passive:false});
  function setRaise(on){if(F.raise===on)return;F.raise=on;fStage.classList.toggle('raise',on)}

  // ── 키보드 ──
  var MOVE_KEYS={KeyW:1,KeyA:1,KeyS:1,KeyD:1,ArrowUp:1,ArrowDown:1,ArrowLeft:1,ArrowRight:1,ShiftLeft:1,ShiftRight:1};
  window.addEventListener('keydown',function(e){
    if(!F.active||!F.inView)return;
    var tag=(e.target&&e.target.tagName)||'';if(tag==='INPUT'||tag==='TEXTAREA')return;
    if(MOVE_KEYS[e.code]){keys[e.code]=true;e.preventDefault();return}
    if(e.repeat&&e.code!=='KeyQ'&&e.code!=='KeyE')return;
    if(e.code==='KeyE'){turnSilver(1);e.preventDefault()}
    else if(e.code==='KeyQ'){turnSilver(-1);e.preventDefault()}
    else if(e.code==='KeyR'){turnPurple(1);e.preventDefault()}
    else if(e.code==='KeyF'){turnPurple(-1);e.preventDefault()}
    else if(e.code==='Space'||e.code==='Enter'){toggleSched();e.preventDefault()}
    else if(e.code==='Tab'){setRaise(!F.raise);e.preventDefault()}
  });
  window.addEventListener('keyup',function(e){keys[e.code]=false});
  window.addEventListener('blur',function(){keys={}});

  // ── 모바일: 조이스틱 + 버튼 ──
  var joy={x:0,y:0,id:null};
  fJoy.addEventListener('pointerdown',function(e){joy.id=e.pointerId;fJoy.setPointerCapture(e.pointerId);joyMove(e);e.stopPropagation()});
  fJoy.addEventListener('pointermove',function(e){if(e.pointerId===joy.id)joyMove(e)});
  function joyEnd(){joy.id=null;joy.x=joy.y=0;fKnob.style.transform=''}
  fJoy.addEventListener('pointerup',joyEnd);fJoy.addEventListener('pointercancel',joyEnd);
  function joyMove(e){
    var r=fJoy.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=Math.hypot(dx,dy),R=r.width/2-10;
    if(m>R){dx*=R/m;dy*=R/m}joy.x=dx/R;joy.y=dy/R;fKnob.style.transform='translate('+dx+'px,'+dy+'px)';
  }
  [].forEach.call(document.querySelectorAll('#fMbtn button'),function(b){b.addEventListener('click',function(){
    if(soundOn)audio();var m=b.dataset.m;if(m==='prev')turnSilver(-1);else if(m==='next')turnSilver(1);else toggleSched();
  })});

  // ── 충돌 ──
  var PR=0.38;
  function collide(){
    var C=FEST.coll;
    for(var it=0;it<2;it++)for(var i=0;i<C.length;i++){
      var c=C[i];
      if(c[0]==='circ'){
        var dx=F.x-c[1],dz=F.z-c[2],d=dx*dx+dz*dz,m=c[3]+PR;
        if(d<m*m&&d>1e-12){d=Math.sqrt(d);F.x=c[1]+dx/d*m;F.z=c[2]+dz/d*m}
      }else{
        var ex=F.x-c[1],ez=F.z-c[2];if(ex*ex+ez*ez>(c[3]+c[4]+PR)*(c[3]+c[4]+PR))continue;
        var ca=Math.cos(c[5]),sa=Math.sin(c[5]),lx=ex*ca-ez*sa,lz=ex*sa+ez*ca;
        var qx=Math.max(-c[3],Math.min(c[3],lx)),qz=Math.max(-c[4],Math.min(c[4],lz)),ddx=lx-qx,ddz=lz-qz,dd=Math.hypot(ddx,ddz);
        if(dd<PR){
          if(dd>1e-6){lx=qx+ddx/dd*PR;lz=qz+ddz/dd*PR}
          else{var px=c[3]-Math.abs(lx),pz=c[4]-Math.abs(lz);if(px<pz)lx=(lx<0?-1:1)*(c[3]+PR);else lz=(lz<0?-1:1)*(c[4]+PR)}
          F.x=c[1]+lx*ca+lz*sa;F.z=c[2]-lx*sa+lz*ca;
        }
      }
    }
    var R=Math.hypot(F.x,F.z);if(R>54){F.x*=54/R;F.z*=54/R}
  }

  // ── 구역 ──
  var signs=[].slice.call(fest.querySelectorAll('.zsign'));
  function zoneAt(){
    for(var i=0;i<FEST.zones.length;i++){var z=FEST.zones[i];var dx=F.x-z.x,dz=F.z-z.z;if(dx*dx+dz*dz<13.5*13.5)return z}
    var r=Math.hypot(F.x,F.z);
    if(r<17.5)return {id:'plaza'};if(F.z>40&&Math.abs(F.x)<10)return {id:'gate'};
    return {id:'walk'};
  }
  var curZone=null;
  function setZone(z){
    if(curZone&&curZone.id===z.id)return;curZone=z;
    signs.forEach(function(s){s.classList.toggle('on',s.dataset.zone===z.id)});
    var info=ZINFO[z.id];
    fZone.textContent=info?info.name:z.id==='plaza'?'중앙 광장 · GANGNAM OBJECT':z.id==='gate'?'입구':'축제장';
    if(info&&F.active){
      var newStamp=!STAMPS[z.id];if(newStamp){STAMPS[z.id]=1;renderStamps(z.id)}
      var nS=Object.keys(STAMPS).length;
      if(SCHED[z.id]&&!VISITED[z.id]){VISITED[z.id]=1;toast('도착! '+info.name+' · '+info.day+' '+info.t+' ✓'+(newStamp?'  ·  스탬프 '+nS+'/6':''));chime()}
      else if(newStamp)toast('스탬프 획득 '+nS+'/6 · '+info.name+(SCHED[z.id]?'':' — 다이얼을 '+info.icon_hint+'에 맞춰 일정에 담아보세요'),nS<6);
      else if(!SCHED[z.id])toast(info.name+' 구역 · 다이얼을 '+info.icon_hint+'에 맞춰 일정에 담아보세요',true);
      if(newStamp&&nS===6)setTimeout(startFinale,1200);
      click('s');
    }
    renderSched();
  }
  Object.keys(ZINFO).forEach(function(id){var n=ICONS.findIndex(function(x){return x.id===ZINFO[id].icon});ZINFO[id].icon_hint=['3시','4시 반','6시','7시 반','9시','10시 반','12시','1시 반'][n]+' 아이콘'});

  // ── 스탬프 ──
  var stampRow=$('fStampRow'),STAMP_ORDER=['parade','concert','edm','fashion','food','kpop'];
  stampRow.innerHTML=STAMP_ORDER.map(function(id){return '<i data-z="'+id+'" title="'+ZINFO[id].name+'"><svg><use href="#i-'+ZINFO[id].icon+'"/></svg></i>'}).join('');
  function renderStamps(){
    [].forEach.call(stampRow.children,function(el){el.classList.toggle('on',!!STAMPS[el.dataset.z])});
    $('fStampN').textContent=Object.keys(STAMPS).length+' / 6';
  }
  // ── 나침반: 담은 일정 중 아직 안 간 가장 이른 프로그램으로 안내 ──
  var fNav=$('fNav'),fNavAr=$('fNavAr'),navId='';
  function updateNav(){
    var ids=Object.keys(SCHED).filter(function(id){return !VISITED[id]}).sort(function(a,b){return ZINFO[a].ord-ZINFO[b].ord});
    if(!ids.length){fNav.hidden=true;navId='';return}
    var id=ids[0],p=ZINFO[id],dx=p.x-F.x,dz=p.z-F.z,d=Math.hypot(dx,dz);
    var fx=-Math.sin(F.yaw),fz=-Math.cos(F.yaw),rx=Math.cos(F.yaw),rz=-Math.sin(F.yaw);
    var ang=Math.atan2(dx*rx+dz*rz,dx*fx+dz*fz);
    fNav.hidden=false;fNavAr.style.transform='rotate('+ang.toFixed(3)+'rad)';
    if(navId!==id){navId=id;$('fNavName').textContent=p.name}
    $('fNavMeta').textContent=p.day+' '+p.t+' · '+Math.max(0,Math.round(d-13))+'m';
    fNav.classList.toggle('arrive',d<20);
  }
  // ── 피날레 불꽃놀이 ──
  var FIN={on:false,t0:0,slots:[]};
  function startFinale(){
    if(!fw||!fw.fws.length)return;
    FIN.on=true;FIN.t0=performance.now();FIN.slots=fw.fws.map(function(f,k){return {f:f,off:k*0.42,cyc:-1}});
    toast('축제 완주! 여섯 구역 스탬프를 모두 모았어요 · 하늘을 올려다보세요');
    var a=soundOn&&audio();if(a){[523,659,784,1047,1319].forEach(function(f,i){var o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.value=f;var t0=a.currentTime+i*.12;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.1,t0+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+.6);o.connect(g);g.connect(a.destination);o.start(t0);o.stop(t0+.62)})}
  }
  function pop(){
    if(!soundOn)return;var a=audio();if(!a)return;var t0=a.currentTime,len=Math.floor(a.sampleRate*.5),buf=a.createBuffer(1,len,a.sampleRate),d=buf.getChannelData(0);
    for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,4)*(Math.random()<.04?1:.35);
    var n=a.createBufferSource(),lp=a.createBiquadFilter(),g=a.createGain();n.buffer=buf;lp.type='lowpass';lp.frequency.value=1800;g.gain.value=.25;
    n.connect(lp);lp.connect(g);g.connect(a.destination);n.start(t0);
  }
  function animateFinale(now){
    if(!FIN.on)return;var T=(now-FIN.t0)/1000,P=1.7,kp=ZINFO.kpop,any=false;
    FIN.slots.forEach(function(s){
      var t=T-s.off;if(t<0||T>16){s.f.n.visible=false;return}any=true;
      var c=Math.floor(t/P),u=(t%P)/P;
      if(c!==s.cyc){s.cyc=c;var a=Math.random()*6.28,r=Math.random()*14;s.x=kp.x*0.8+Math.cos(a)*r;s.z=kp.z*0.8+Math.sin(a)*r;s.y=24+Math.random()*12;s.sz=9+Math.random()*7;s.f.n.visible=true;pop()}
      var e=1-Math.pow(1-u,3),sc=Math.max(0.01,s.sz*e);
      s.f.n.position.set(s.x,s.y-u*u*3,s.z);s.f.n.scale.set(sc,sc,sc);s.f.n.rotation.y=u;s.f.m.opacity=Math.pow(1-u,1.4);
    });
    if(!any&&T>16){FIN.on=false;fw.fws.forEach(function(f){f.n.visible=false})}
  }

  // ── 무대 가수: 박자(120BPM)에 맞춰 들썩이고, 마이크를 들었다 내렸다, 관객에게 손 흔들기 ──
  function animateSinger(now){
    if(!SG.body)return;
    var t=now/1000,beat=t*2,b=Math.abs(Math.sin(Math.PI*beat));
    var dSq=(F.x-FEST.singer.x)*(F.x-FEST.singer.x)+(F.z-FEST.singer.z)*(F.z-FEST.singer.z),near=dSq<7.5*7.5;
    var hype=near?1:0.55;
    SG.body.position.y=SG.by+b*0.05*hype;SG.head.position.y=SG.hy+b*0.05*hype;
    SG.body.rotation.z=Math.sin(Math.PI*beat)*0.05*hype;SG.body.rotation.y=Math.sin(t*0.7)*0.35;
    SG.head.rotation.x=-0.08+Math.sin(Math.PI*beat*2)*0.06*hype;SG.head.rotation.y=SG.body.rotation.y*0.8;
    // 오른팔: 노래하는 구간(4박)엔 마이크를 입가로, 쉬는 구간엔 내림
    var phrase=(beat%8)/8,up=phrase<0.62?1:0;SG.micUp=(SG.micUp||0)+(up-(SG.micUp||0))*0.12;
    SG.ar.rotation.x=-0.25-1.55*SG.micUp;SG.ar.rotation.z=0.12+0.35*SG.micUp;SG.ar.rotation.y=SG.body.rotation.y;
    // 왼팔: 관객을 향해 크게 흔들기 (가까이 오면 더 신나게)
    SG.al.rotation.z=-(0.5+(near?1.9:0.9)*(0.5+0.5*Math.sin(t*(near?6:3))));SG.al.rotation.x=-0.3;SG.al.rotation.y=SG.body.rotation.y;
    // 핀 조명이 박자에 맞춰 번쩍
    var flash=near?(0.45+0.55*Math.pow(b,3)):0.6;SG.lights.forEach(function(m){m.opacity=(m.name==='pool_singer'?0.8:0.55)*flash});
    if(near&&!SG.near){
      if(!SG.found){SG.found=true;toast('히든 무대 발견! 패밀리 콘서트 스페셜 무대가 시작돼요');jingle()}
    }
    SG.near=near;
  }
  // 오리지널 짧은 멜로디
  function jingle(){
    if(!soundOn)return;var a=audio();if(!a)return;var t0=a.currentTime+0.05;
    var notes=[[523,0],[659,.18],[784,.36],[1047,.54],[988,.9],[784,1.08],[880,1.26],[1047,1.5]];
    notes.forEach(function(n){var o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.value=n[0];
      g.gain.setValueAtTime(0,t0+n[1]);g.gain.linearRampToValueAtTime(.09,t0+n[1]+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+n[1]+.34);
      o.connect(g);g.connect(a.destination);o.start(t0+n[1]);o.stop(t0+n[1]+.36)});
  }

  // ── 미니맵 (3프레임마다) ──
  function drawMap(){
    var W=fMap.width,H=fMap.height,s=W/2/60;mctx.clearRect(0,0,W,H);
    mctx.save();mctx.translate(W/2,H/2);
    // 시선이 항상 위쪽을 향하도록 지도를 회전
    mctx.rotate(F.yaw);
    mctx.translate(-F.x*s,-F.z*s);
    mctx.fillStyle='rgba(58,44,76,.9)';mctx.beginPath();mctx.arc(0,0,17*s,0,7);mctx.fill();
    mctx.strokeStyle='rgba(58,44,76,.9)';mctx.lineWidth=6*s;
    FEST.zones.concat([{x:0,z:52}]).forEach(function(z){mctx.beginPath();mctx.moveTo(0,0);mctx.lineTo(z.x*s,z.z*s);mctx.stroke()});
    FEST.zones.forEach(function(z){
      var sel=SCHED[z.id],done=VISITED[z.id];
      mctx.fillStyle=sel?(done?'rgba(80,160,110,.85)':'rgba(165,107,224,.95)'):'rgba(58,44,76,.95)';mctx.strokeStyle=sel?'#f3e8ff':'rgba(201,168,240,.5)';mctx.lineWidth=sel?3:2;
      mctx.beginPath();mctx.arc(z.x*s,z.z*s,13*s,0,7);mctx.fill();mctx.stroke();
    });
    mctx.fillStyle='#c9c6cf';mctx.beginPath();mctx.arc(0,0,8*s,0,7);mctx.fill();
    mctx.restore();
    mctx.save();mctx.translate(W/2,H/2);
    mctx.fillStyle='rgba(240,235,246,.22)';mctx.beginPath();mctx.moveTo(0,0);mctx.arc(0,0,40,-Math.PI/2-.55,-Math.PI/2+.55);mctx.closePath();mctx.fill();
    mctx.fillStyle='#fff';mctx.strokeStyle='#7b4bb0';mctx.lineWidth=4;mctx.beginPath();mctx.arc(0,0,9,0,7);mctx.fill();mctx.stroke();
    mctx.restore();
  }

  // ── 메인 루프 ──
  function festLoop(now){
    if(!F.active||!F.inView||!fw)return;
    var dt=lastF?Math.min(.1,(now-lastF)/1000):0;lastF=now;frameN++;
    var ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x,
        iz=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y;
    var il=Math.hypot(ix,iz);if(il>1){ix/=il;iz/=il;il=1}
    var run=keys.ShiftLeft||keys.ShiftRight||(coarse&&il>.92),target=il*(run?6.8:3.6);
    F.speed+=(target-F.speed)*Math.min(1,dt*10);
    if(il>0.05){
      var fx=-Math.sin(F.yaw),fz=-Math.cos(F.yaw),rx=Math.cos(F.yaw),rz=-Math.sin(F.yaw);
      var mx=fx*iz+rx*ix,mz=fz*iz+rz*ix,ml=Math.hypot(mx,mz)||1;
      F.x+=mx/ml*F.speed*dt;F.z+=mz/ml*F.speed*dt;
    }
    collide();
    var mv=Math.min(1,F.speed/3.6);F.phase+=dt*(5+F.speed*1.3)*(mv>.05?1:0.2);
    var bob=Math.sin(F.phase*2)*0.035*mv;
    // 폰 흔들림 (CSS 변환이라 가벼움)
    var sx=Math.sin(F.phase)*10*mv,sy=Math.abs(Math.cos(F.phase))*9*mv+Math.sin(now/900)*2*(1-mv);
    fPhone.style.transform='translate('+sx.toFixed(1)+'px,'+sy.toFixed(1)+'px) rotate('+(-4+Math.sin(F.phase)*1.2*mv).toFixed(2)+'deg)';
    if(fw.mon){fw.mon.rotation.y+=dt*0.25;if(fw.monPivot){fw.monPivot.rotation.y-=dt*0.6;if(fw.monLens)fw.monLens.uAng.value=fw.monPivot.rotation.y}}
    animateSinger(now);animateFinale(now);
    if(frameN%4===0)setZone(zoneAt());
    placeCam(bob);fw.sc.queueRender();
    if(frameN%3===0){drawMap();updateNav()}
    requestAnimationFrame(festLoop);
  }
  drawMap();
})();
