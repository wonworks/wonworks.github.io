/* =====================================================================
   GLB 3D 뷰어 — 외부 라이브러리 없이 WebGL2로 직접 그림 (인터넷 없이 작동)
   · glTF 2.0 바이너리(.glb): 메시 · 노드 계층(TRS/행렬) · 기본색 · 텍스처 · 버텍스 컬러 · 투명(BLEND) 지원
   · Draco 압축 GLB는 지원하지 않음 → 내보낼 때 압축을 끄고 저장
   · 조작: 드래그/방향키 회전 · 휠/핀치/+− 확대 · 정면/측면/상단/사선 버튼
   ===================================================================== */
const GLBV=(function(){
'use strict';
const VS=`#version 300 es
in vec3 aP;in vec3 aN;in vec2 aU;in vec4 aC;uniform mat4 uVP;out vec3 vN,vW;out vec2 vU;out vec4 vC;
void main(){vW=aP;vN=aN;vU=aU;vC=aC;gl_Position=uVP*vec4(aP,1.);}`;
const FS=`#version 300 es
precision highp float;in vec3 vN,vW;in vec2 vU;in vec4 vC;uniform vec4 uBase;uniform vec3 uEm,uEye;uniform float uRough,uMetal,uHasT,uGround;uniform vec2 uR;uniform vec3 uC;uniform sampler2D uT;out vec4 o;
void main(){
  if(uGround>.5){float r=length((vW.xz-uC.xz)/uR);float a=.30*pow(1.-smoothstep(.0,1.,r),1.6)+.10*(1.-smoothstep(.0,.45,r));o=vec4(.16,.13,.24,a);return;}
  vec4 b=uBase*vC;if(uHasT>.5){vec4 t=texture(uT,vU);b*=vec4(pow(t.rgb,vec3(2.2)),t.a);}
  vec3 N=normalize(vN);vec3 V=normalize(uEye-vW);if(dot(N,V)<0.)N=-N;
  vec3 L=normalize(vec3(.45,.85,.55)),F=normalize(vec3(-.6,.3,.45)),B=normalize(vec3(.1,.4,-.9));
  float d=max(dot(N,L),0.),f=max(dot(N,F),0.)*.38,bk=max(dot(N,B),0.)*.25,hm=.5+.5*N.y;
  float sh=mix(60.,6.,clamp(uRough,0.,1.));vec3 H=normalize(L+V);float sp=pow(max(dot(N,H),0.),sh)*mix(.18,.5,uMetal)*(1.-uRough*.6);
  float rim=pow(1.-max(dot(N,V),0.),3.)*.22;
  vec3 amb=mix(vec3(.36,.35,.42),vec3(.70,.70,.76),hm);
  vec3 Rf=reflect(-V,N);float sb=smoothstep(.62,.95,Rf.y)*(1.-uRough*.7)*.32+smoothstep(.3,.9,dot(Rf,normalize(vec3(-.8,.35,.5))))*(1.-uRough*.8)*.12;   /* 스튜디오 소프트박스 반사 */
  float fr=pow(1.-max(dot(N,V),0.),2.);
  vec3 col=b.rgb*(amb+vec3(1.,.97,.94)*d*.95+vec3(.78,.8,1.)*(f+bk))*(1.-uMetal*.35)+vec3(1.)*(sp+sb)+vec3(.86,.82,1.)*rim+uEm*1.2;if(b.a<.999){col+=vec3(.55,.45,.95)*fr*.35;b.a=mix(b.a,1.,fr*.55);}   /* 반투명: 가장자리일수록 진하게 */
  col=col/(1.+col*.55);o=vec4(pow(col,vec3(1./2.2)),b.a);}`;

/* ---------- 행렬 · 벡터 ---------- */
const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const mul=(a,b)=>{const o=new Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o};
const trs=(t,q,s)=>{t=t||[0,0,0];q=q||[0,0,0,1];s=s||[1,1,1];const [x,y,z,w]=q,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  return [(1-(yy+zz))*s[0],(xy+wz)*s[0],(xz-wy)*s[0],0,(xy-wz)*s[1],(1-(xx+zz))*s[1],(yz+wx)*s[1],0,(xz+wy)*s[2],(yz-wx)*s[2],(1-(xx+yy))*s[2],0,t[0],t[1],t[2],1]};
const nmat=m=>{const a=m[0],b=m[1],c=m[2],d=m[4],e=m[5],f=m[6],g=m[8],h=m[9],k=m[10],A=e*k-f*h,B=-(d*k-f*g),C=d*h-e*g,det=a*A+b*B+c*C||1;
  return [A/det,B/det,C/det,-(b*k-c*h)/det,(a*k-c*g)/det,-(a*h-b*g)/det,(b*f-c*e)/det,-(a*f-c*d)/det,(a*e-b*d)/det]};   /* 역전치 3x3 (행 우선) */
const nrm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l]};
function persp(f,a,n,fa){const t=1/Math.tan(f/2);return [t/a,0,0,0,0,t,0,0,0,0,(fa+n)/(n-fa),-1,0,0,2*fa*n/(n-fa),0]}
function look(e,c){const z=nrm([e[0]-c[0],e[1]-c[1],e[2]-c[2]]),x=nrm([z[2],0,-z[0]]),y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
  return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1]}

/* ---------- GLB 해석 ---------- */
const CT={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
const NC={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
function parse(buf){const dv=new DataView(buf);
  if(dv.getUint32(0,true)!==0x46546C67)throw new Error('GLB 파일이 아닙니다 (.gltf가 아닌 .glb로 내보내 주세요)');
  let off=12,json=null,bin=null;
  while(off<buf.byteLength){const len=dv.getUint32(off,true),type=dv.getUint32(off+4,true);
    if(type===0x4E4F534A)json=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,off+8,len)));else if(type===0x004E4942)bin=buf.slice(off+8,off+8+len);off+=8+len}
  if(!json)throw new Error('GLB 안에 장면 정보가 없습니다');
  const req=json.extensionsRequired||[];
  if(req.includes('KHR_draco_mesh_compression')||req.includes('EXT_meshopt_compression'))throw new Error('압축(Draco/Meshopt)된 GLB입니다. 내보내기에서 압축을 끄고 다시 저장해 주세요');
  return {json,bin}}
function acc(G,i){const a=G.json.accessors[i],n=NC[a.type],C=CT[a.componentType],cnt=a.count,out=new Float32Array(cnt*n);
  if(a.bufferView===undefined)return {d:out,n};
  const bv=G.json.bufferViews[a.bufferView],bs=C.BYTES_PER_ELEMENT,st=bv.byteStride||n*bs,base=(bv.byteOffset||0)+(a.byteOffset||0),dv=new DataView(G.bin);
  const rd={5120:(o)=>dv.getInt8(o),5121:(o)=>dv.getUint8(o),5122:(o)=>dv.getInt16(o,true),5123:(o)=>dv.getUint16(o,true),5125:(o)=>dv.getUint32(o,true),5126:(o)=>dv.getFloat32(o,true)}[a.componentType];
  const nz=a.normalized?{5120:127,5121:255,5122:32767,5123:65535}[a.componentType]||1:1;
  for(let i=0;i<cnt;i++)for(let k=0;k<n;k++)out[i*n+k]=rd(base+i*st+k*bs)/nz;
  if(a.sparse)console.warn('sparse accessor 무시');
  return {d:out,n}}
function idx(G,i){const a=G.json.accessors[i],bv=G.json.bufferViews[a.bufferView],C=CT[a.componentType],base=(bv.byteOffset||0)+(a.byteOffset||0);
  const src=new C(G.bin.slice(base,base+a.count*C.BYTES_PER_ELEMENT));return Uint32Array.from(src)}

/* 메시를 월드 좌표로 구워서 그리기 단위(primitive)로 정리 */
function build(G){const J=G.json,prims=[],bb=[1e9,1e9,1e9,-1e9,-1e9,-1e9];
  const visit=(ni,PM)=>{const nd=J.nodes[ni],M=mul(PM,nd.matrix||trs(nd.translation,nd.rotation,nd.scale));
    if(nd.mesh!==undefined)J.meshes[nd.mesh].primitives.forEach(p=>{if(p.mode!==undefined&&p.mode!==4)return;const A=p.attributes;if(A.POSITION===undefined)return;
      const P=acc(G,A.POSITION).d,nv=P.length/3,ix=p.indices!==undefined?idx(G,p.indices):Uint32Array.from({length:nv},(_,i)=>i);
      let N=A.NORMAL!==undefined?acc(G,A.NORMAL).d:null;const U=A.TEXCOORD_0!==undefined?acc(G,A.TEXCOORD_0).d:new Float32Array(nv*2);
      let Cc=new Float32Array(nv*4).fill(1);if(A.COLOR_0!==undefined){const c=acc(G,A.COLOR_0);for(let i=0;i<nv;i++){for(let k=0;k<c.n;k++)Cc[i*4+k]=c.d[i*c.n+k]}}
      const WP=new Float32Array(nv*3),NM=nmat(M);
      for(let i=0;i<nv;i++){const x=P[i*3],y=P[i*3+1],z=P[i*3+2];for(let k=0;k<3;k++){const v=M[k]*x+M[4+k]*y+M[8+k]*z+M[12+k];WP[i*3+k]=v;if(v<bb[k])bb[k]=v;if(v>bb[3+k])bb[3+k]=v}}
      const WN=new Float32Array(nv*3);
      if(N){for(let i=0;i<nv;i++){const x=N[i*3],y=N[i*3+1],z=N[i*3+2],v=nrm([NM[0]*x+NM[1]*y+NM[2]*z,NM[3]*x+NM[4]*y+NM[5]*z,NM[6]*x+NM[7]*y+NM[8]*z]);WN.set(v,i*3)}}
      else{for(let t=0;t<ix.length;t+=3){const a=ix[t]*3,b=ix[t+1]*3,c=ix[t+2]*3,e1=[WP[b]-WP[a],WP[b+1]-WP[a+1],WP[b+2]-WP[a+2]],e2=[WP[c]-WP[a],WP[c+1]-WP[a+1],WP[c+2]-WP[a+2]],
          n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];[a,b,c].forEach(q=>{WN[q]+=n[0];WN[q+1]+=n[1];WN[q+2]+=n[2]})}
        for(let i=0;i<nv;i++)WN.set(nrm([WN[i*3],WN[i*3+1],WN[i*3+2]]),i*3)}
      const mt=p.material!==undefined?J.materials[p.material]:{},pb=mt.pbrMetallicRoughness||{};
      prims.push({P:WP,N:WN,U,C:Cc,ix,base:pb.baseColorFactor||[1,1,1,1],tex:pb.baseColorTexture?pb.baseColorTexture.index:-1,
        rough:pb.roughnessFactor!==undefined?pb.roughnessFactor:1,metal:pb.metallicFactor!==undefined?pb.metallicFactor:(pb.baseColorTexture||pb.baseColorFactor?0:0),
        em:mt.emissiveFactor||[0,0,0],blend:mt.alphaMode==='BLEND',ds:!!mt.doubleSided})});
    (nd.children||[]).forEach(c=>visit(c,M))};
  const sc=J.scenes?J.scenes[J.scene||0]:{nodes:J.nodes.map((_,i)=>i)};sc.nodes.forEach(n=>visit(n,I()));
  if(!prims.length)throw new Error('GLB 안에 그릴 메시가 없습니다');
  return {prims,bb}}
async function images(G,gl){const J=G.json,T=[];
  for(let i=0;i<(J.textures||[]).length;i++){const t=J.textures[i],im=J.images&&J.images[t.source];T[i]=null;if(!im||im.bufferView===undefined)continue;
    try{const bv=J.bufferViews[im.bufferView],bl=new Blob([new Uint8Array(G.bin,bv.byteOffset||0,bv.byteLength)],{type:im.mimeType||'image/png'}),bmp=await createImageBitmap(bl,{imageOrientation:'none'});
      const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bmp);
      gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);T[i]=tx}catch(e){console.warn('텍스처',e)}}
  return T}

/* ---------- 뷰어 ---------- */
function create(cv,opt){opt=opt||{};
  const gl=cv.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:!!opt.capture});if(!gl)return null;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(o);return o};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));
  ['aP','aN','aU','aC'].forEach((n,i)=>gl.bindAttribLocation(pr,i,n));gl.linkProgram(pr);
  const U={};['uVP','uBase','uEm','uEye','uRough','uMetal','uHasT','uT','uGround','uC','uR'].forEach(n=>U[n]=gl.getUniformLocation(pr,n));
  let draws=[],ground=null,ctr=[0,0,0],rad=1,raf=0,last=0,idle=0,touched=false,loaded=false;
  const cam={yaw:.6,pitch:.32,dist:3,gy:.6,gp:.32,gd:3};
  function vao(P,N,Uv,C,ix){const v=gl.createVertexArray();gl.bindVertexArray(v);
    [[P,3],[N,3],[Uv,2],[C,4]].forEach(([d,n],i)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,gl.FLOAT,false,0,0)});
    const e=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,e);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,ix,gl.STATIC_DRAW);return v}
  async function load(buf){const G=parse(buf),S=build(G),T=await images(G,gl),bb=S.bb;
    ctr=[(bb[0]+bb[3])/2,(bb[1]+bb[4])/2,(bb[2]+bb[5])/2];rad=Math.max(1e-6,Math.hypot(bb[3]-bb[0],bb[4]-bb[1],bb[5]-bb[2])/2);
    draws=S.prims.map(p=>({v:vao(p.P,p.N,p.U,p.C,p.ix),n:p.ix.length,base:p.base,em:p.em,rough:p.rough,metal:p.metal,tex:p.tex>=0?T[p.tex]:null,blend:p.blend||p.base[3]<.999,ds:p.ds}));
    const r=rad*1.4,y=bb[1]-rad*.002,gp=new Float32Array([ctr[0]-r,y,ctr[2]-r,ctr[0]+r,y,ctr[2]-r,ctr[0]+r,y,ctr[2]+r,ctr[0]-r,y,ctr[2]+r]);
    ground={v:vao(gp,new Float32Array([0,1,0,0,1,0,0,1,0,0,1,0]),new Float32Array(8),new Float32Array(16).fill(1),new Uint32Array([0,2,1,0,3,2])),r:[(bb[3]-bb[0])*.62,(bb[5]-bb[2])*.62+rad*.12]};
    cam.dist=cam.gd=rad*3.1;loaded=true;kick();return {verts:S.prims.reduce((s,p)=>s+p.P.length/3,0),size:[bb[3]-bb[0],bb[4]-bb[1],bb[5]-bb[2]]}}
  function frame(dt){const r=cv.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,opt.dpr||2),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
    if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
    if(!touched&&opt.sway!==false){idle+=dt;cam.gy+=dt*.12}
    const k=1-Math.exp(-dt*7);cam.yaw+=(cam.gy-cam.yaw)*k;cam.pitch+=(cam.gp-cam.pitch)*k;cam.dist+=(cam.gd-cam.dist)*k;
    gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(!loaded)return false;
    const e=[ctr[0]+Math.sin(cam.yaw)*Math.cos(cam.pitch)*cam.dist,ctr[1]+Math.sin(cam.pitch)*cam.dist,ctr[2]+Math.cos(cam.yaw)*Math.cos(cam.pitch)*cam.dist];
    const VP=mul(persp(.6,w/h,cam.dist*.02,cam.dist*10),look(e,ctr));
    gl.useProgram(pr);gl.uniformMatrix4fv(U.uVP,false,VP);gl.uniform3fv(U.uEye,e);gl.uniform1i(U.uT,0);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    if(ground&&opt.ground!==false){gl.depthMask(false);gl.uniform1f(U.uGround,1);gl.uniform3fv(U.uC,ctr);gl.uniform2fv(U.uR,ground.r);gl.bindVertexArray(ground.v);gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_INT,0);gl.depthMask(true)}
    gl.uniform1f(U.uGround,0);
    const pass=bl=>draws.forEach(d=>{if(d.blend!==bl)return;if(d.ds||bl)gl.disable(gl.CULL_FACE);else{gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK)}
      gl.uniform4fv(U.uBase,d.base);gl.uniform3fv(U.uEm,d.em);gl.uniform1f(U.uRough,d.rough);gl.uniform1f(U.uMetal,d.metal);gl.uniform1f(U.uHasT,d.tex?1:0);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,d.tex);gl.bindVertexArray(d.v);gl.drawElements(gl.TRIANGLES,d.n,gl.UNSIGNED_INT,0)});
    pass(false);gl.depthMask(false);pass(true);gl.depthMask(true);
    return !touched||Math.abs(cam.gy-cam.yaw)+Math.abs(cam.gp-cam.pitch)+Math.abs(cam.gd-cam.dist)/rad>1e-4}
  let vis=true;
  const loop=t=>{raf=0;const dt=Math.min(.1,(t-(last||t))/1000);last=t;if(frame(dt)&&vis)raf=requestAnimationFrame(loop);else last=0};
  function kick(){if(!raf&&vis)raf=requestAnimationFrame(loop)}
  const touch=()=>{touched=true;kick()};
  /* 조작 */
  const pts=new Map();let pd0=0;
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===2){const [a,b]=[...pts.values()];pd0=Math.hypot(a[0]-b[0],a[1]-b[1])}touch()});
  cv.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const p=pts.get(e.pointerId);
    if(pts.size===1){cam.gy-=(e.clientX-p[0])*.008;cam.gp=Math.max(-.2,Math.min(1.55,cam.gp+(e.clientY-p[1])*.006))}
    pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===2){const [a,b]=[...pts.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pd0)cam.gd=Math.max(rad*1.3,Math.min(rad*8,cam.gd*pd0/d));pd0=d}kick()});
  const up=e=>{pts.delete(e.pointerId);pd0=0};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{e.preventDefault();cam.gd=Math.max(rad*1.3,Math.min(rad*8,cam.gd*Math.exp(e.deltaY*.0012)));touch()},{passive:false});
  cv.addEventListener('keydown',e=>{const K={ArrowLeft:()=>cam.gy+=.25,ArrowRight:()=>cam.gy-=.25,ArrowUp:()=>cam.gp=Math.min(1.55,cam.gp+.15),ArrowDown:()=>cam.gp=Math.max(-.2,cam.gp-.15),'+':()=>cam.gd=Math.max(rad*1.3,cam.gd*.85),'=':()=>cam.gd=Math.max(rad*1.3,cam.gd*.85),'-':()=>cam.gd=Math.min(rad*8,cam.gd*1.18)}[e.key];if(K){e.preventDefault();K();touch()}});
  if('IntersectionObserver' in window)new IntersectionObserver(es=>es.forEach(x=>{vis=x.isIntersecting;if(vis)kick()})).observe(cv);
  if('ResizeObserver' in window)new ResizeObserver(kick).observe(cv);
  const V={front:[0,.06],side:[Math.PI/2,.06],top:[0,1.54],persp:[.6,.32],back:[Math.PI,.06]};
  return {load,kick,
    view(k,instant){const v=V[k];if(!v)return;touched=true;const tw=Math.PI*2,base=Math.round((cam.gy-v[0])/tw)*tw;cam.gy=v[0]+base;cam.gp=v[1];cam.gd=rad*3.1;if(instant){cam.yaw=cam.gy;cam.pitch=cam.gp;cam.dist=cam.gd}kick()},
    set(y,p,instant){touched=true;cam.gy=y;cam.gp=p;if(instant){cam.yaw=y;cam.pitch=p;cam.dist=cam.gd}kick()},
    renderNow(){frame(0)},get loaded(){return loaded}}}
return {create,parse}})();
