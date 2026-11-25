
/* =====================================================================
   MG — 상세 페이지 전용 소형 WebGL2 렌더러
   금속(은·보라) · 널링(톱니 테두리) · 캔버스 텍스처 · 바닥 그림자 · 격자 바닥 · 궤도 카메라
   ===================================================================== */
const MG=(function(){
const M4={
  I:()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
  mul(a,b){const o=new Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o},
  T:(x,y,z)=>[1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1],
  S:(x,y,z)=>[x,0,0,0,0,y==null?x:y,0,0,0,0,z==null?x:z,0,0,0,0,1],
  Rx(a){const c=Math.cos(a),s=Math.sin(a);return [1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]},
  Ry(a){const c=Math.cos(a),s=Math.sin(a);return [c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]},
  Rz(a){const c=Math.cos(a),s=Math.sin(a);return [c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]},
  P(f,a,n,r){const t=1/Math.tan(f/2);return [t/a,0,0,0,0,t,0,0,0,0,(r+n)/(n-r),-1,0,0,2*r*n/(n-r),0]},
  look(e,t,u){let z=[e[0]-t[0],e[1]-t[1],e[2]-t[2]];const zl=Math.hypot(...z);z=z.map(v=>v/zl);
    let x=[u[1]*z[2]-u[2]*z[1],u[2]*z[0]-u[0]*z[2],u[0]*z[1]-u[1]*z[0]];const xl=Math.hypot(...x)||1;x=x.map(v=>v/xl);
    const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
    return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1]}
};
const tp=(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
const tn=(m,n)=>{const v=[m[0]*n[0]+m[4]*n[1]+m[8]*n[2],m[1]*n[0]+m[5]*n[1]+m[9]*n[2],m[2]*n[0]+m[6]*n[1]+m[10]*n[2]],l=Math.hypot(...v)||1;return v.map(x=>x/l)};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nz=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l)};

/* ---------- 지오메트리 : 정점 15 float = 위치3 · 법선3 · 색4 · uv2 · 재질3(발광, 금속, 널링 수) ---------- */
function Geo(){const A=[];let C=[1,1,1,1],Mt=[0,0,0],X=null;
  const g={A,
    col(c,a){C=[c[0],c[1],c[2],a==null?1:a];return g},
    mat(e,m,k){Mt=[e||0,m||0,k||0];return g},
    xf(m){X=m;return g},
    v(p,n,uv){if(X){p=tp(X,p);n=tn(X,n)}A.push(p[0],p[1],p[2],n[0],n[1],n[2],C[0],C[1],C[2],C[3],uv?uv[0]:-1,uv?uv[1]:-1,Mt[0],Mt[1],Mt[2])},
    tri(a,b,c,na,nb,nc,ua,ub,uc){if(!na){na=nb=nc=nz(cross(sub(b,a),sub(c,a)))}g.v(a,na,ua);g.v(b,nb,ub);g.v(c,nc,uc);return g},
    quad(a,b,c,d,n){g.tri(a,b,c,n,n,n);g.tri(a,c,d,n,n,n);return g},
    box(cx,cy,cz,sx,sy,sz){const a=cx-sx/2,b=cx+sx/2,c=cy-sy/2,d=cy+sy/2,e=cz-sz/2,f=cz+sz/2;
      g.quad([a,c,f],[b,c,f],[b,d,f],[a,d,f],[0,0,1]);g.quad([b,c,e],[a,c,e],[a,d,e],[b,d,e],[0,0,-1]);
      g.quad([b,c,f],[b,c,e],[b,d,e],[b,d,f],[1,0,0]);g.quad([a,c,e],[a,c,f],[a,d,f],[a,d,e],[-1,0,0]);
      g.quad([a,d,f],[b,d,f],[b,d,e],[a,d,e],[0,1,0]);g.quad([a,c,e],[b,c,e],[b,c,f],[a,c,f],[0,-1,0]);return g},
    /* 회전체: prof=[[r,y],...] 아래에서 위로. uvR>0 이면 윗면 평면 uv (반지름 uvR 기준) */
    lathe(prof,seg,uvR){seg=seg||96;for(let i=0;i<prof.length-1;i++){const [r0,y0]=prof[i],[r1,y1]=prof[i+1];
        const dr=r1-r0,dy=y1-y0,L=Math.hypot(dr,dy)||1,nr=dy/L,ny=-dr/L;
        for(let j=0;j<seg;j++){const a0=j/seg*Math.PI*2,a1=(j+1)/seg*Math.PI*2,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
          const P=(r,y,c,s)=>[r*c,y,r*s],N=(c,s)=>[nr*c,ny,nr*s],U=(r,c,s)=>uvR?[r*c/(2*uvR)+.5,r*s/(2*uvR)+.5]:null;
          g.tri(P(r0,y0,c0,s0),P(r1,y1,c0,s0),P(r1,y1,c1,s1),N(c0,s0),N(c0,s0),N(c1,s1),U(r0,c0,s0),U(r1,c0,s0),U(r1,c1,s1));
          g.tri(P(r0,y0,c0,s0),P(r1,y1,c1,s1),P(r0,y0,c1,s1),N(c0,s0),N(c1,s1),N(c1,s1),U(r0,c0,s0),U(r1,c1,s1),U(r0,c1,s1))}}return g},
    cyl(r,y0,y1,seg,caps){g.lathe(caps?[[0,y0],[r,y0],[r,y1],[0,y1]]:[[r,y0],[r,y1]],seg||40);return g},
    sphere(cx,cy,cz,r,seg){seg=seg||24;const Q=seg/2;for(let i=0;i<Q;i++)for(let j=0;j<seg;j++){
        const f=(a,b)=>{const t=a/Q*Math.PI,p=b/seg*Math.PI*2,n=[Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)];return [[cx+n[0]*r,cy+n[1]*r,cz+n[2]*r],n]};
        const A1=f(i,j),B=f(i+1,j),C1=f(i+1,j+1),D=f(i,j+1);g.tri(A1[0],B[0],C1[0],A1[1],B[1],C1[1]);g.tri(A1[0],C1[0],D[0],A1[1],C1[1],D[1])}return g},
    torus(R,r,s1,s2){s1=s1||48;s2=s2||16;for(let i=0;i<s1;i++)for(let j=0;j<s2;j++){
        const f=(a,b)=>{const u=a/s1*Math.PI*2,v=b/s2*Math.PI*2,cx=Math.cos(u),sx=Math.sin(u),n=[Math.cos(v)*cx,Math.sin(v),Math.cos(v)*sx];return [[(R+r*Math.cos(v))*cx,r*Math.sin(v),(R+r*Math.cos(v))*sx],n]};
        const A1=f(i,j),B=f(i+1,j),C1=f(i+1,j+1),D=f(i,j+1);g.tri(A1[0],B[0],C1[0],A1[1],B[1],C1[1]);g.tri(A1[0],C1[0],D[0],A1[1],C1[1],D[1])}return g},
    /* 둥근 사각형 판 (XY 평면, 두께는 z) */
    rr(w,h,r,n){n=n||8;const P=[],cs=[[w/2-r,h/2-r,0],[-w/2+r,h/2-r,1],[-w/2+r,-h/2+r,2],[w/2-r,-h/2+r,3]];
      cs.forEach(([cx,cy,q])=>{for(let k=0;k<=n;k++){const a=(q+k/n)*Math.PI/2;P.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}});return P},
    slab(w,h,r,t,n){const P=g.rr(w,h,r,n),z0=-t/2,z1=t/2;
      for(let i=1;i<P.length-1;i++){g.tri([P[0][0],P[0][1],z1],[P[i][0],P[i][1],z1],[P[i+1][0],P[i+1][1],z1],[0,0,1],[0,0,1],[0,0,1]);g.tri([P[0][0],P[0][1],z0],[P[i+1][0],P[i+1][1],z0],[P[i][0],P[i][1],z0],[0,0,-1],[0,0,-1],[0,0,-1])}
      for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],nn=nz([b[1]-a[1],-(b[0]-a[0]),0]);g.quad([a[0],a[1],z0],[b[0],b[1],z0],[b[0],b[1],z1],[a[0],a[1],z1],nn)}return g},
    frame(w,h,r,fw,t,n){const O=g.rr(w,h,r,n),I=g.rr(w-2*fw,h-2*fw,Math.max(.002,r-fw),n),z0=-t/2,z1=t/2;
      for(let i=0;i<O.length;i++){const j=(i+1)%O.length,o0=O[i],o1=O[j],i0=I[i],i1=I[j];
        g.quad([o0[0],o0[1],z1],[i0[0],i0[1],z1],[i1[0],i1[1],z1],[o1[0],o1[1],z1],[0,0,1]);g.quad([o1[0],o1[1],z0],[i1[0],i1[1],z0],[i0[0],i0[1],z0],[o0[0],o0[1],z0],[0,0,-1]);
        g.quad([o0[0],o0[1],z0],[o1[0],o1[1],z0],[o1[0],o1[1],z1],[o0[0],o0[1],z1],nz([o1[1]-o0[1],-(o1[0]-o0[0]),0]));
        g.quad([i1[0],i1[1],z0],[i0[0],i0[1],z0],[i0[0],i0[1],z1],[i1[0],i1[1],z1],nz([-(i1[1]-i0[1]),i1[0]-i0[0],0]))}return g},
    /* 바닥 그림자 (가운데 진하고 바깥 투명) */
    blob(rx,rz,a,y){const s=48,save=C.slice(),sm=Mt.slice();g.mat(-1,0,0);for(let i=0;i<s;i++){const a0=i/s*Math.PI*2,a1=(i+1)/s*Math.PI*2;
        g.col([.32,.22,.48],a);g.v([0,y||0,0],[0,1,0]);g.col([.32,.22,.48],0);g.v([Math.cos(a1)*rx,y||0,Math.sin(a1)*rz],[0,1,0]);g.v([Math.cos(a0)*rx,y||0,Math.sin(a0)*rz],[0,1,0])}
      C=save;Mt=sm;return g},
    floor(s,y){const sm=Mt.slice();g.mat(-2,0,0);g.quad([-s,y,s],[s,y,s],[s,y,-s],[-s,y,-s],[0,1,0]);Mt=sm;return g}};
  return g}

const VS=`#version 300 es
in vec3 aP,aN;in vec4 aC;in vec2 aU;in vec3 aM;uniform mat4 uVP,uMd;out vec3 vN,vW,vL;out vec4 vC;out vec2 vU;out vec3 vM;
void main(){vec4 w=uMd*vec4(aP,1.);vW=w.xyz;vL=aP;vN=mat3(uMd)*aN;vC=aC;vU=aU;vM=aM;gl_Position=uVP*w;}`;
const FS=`#version 300 es
precision highp float;in vec3 vN,vW,vL;in vec4 vC;in vec2 vU;in vec3 vM;uniform vec3 uEye,uKey,uFill;uniform sampler2D uTex;uniform float uHasTex,uGridK;out vec4 o;
void main(){
  if(vM.x<-1.5){vec2 q=vW.xz/uGridK;vec2 gd=abs(fract(q-.5)-.5)/fwidth(q);float l=1.-min(min(gd.x,gd.y),1.);float f=1.-smoothstep(3.,16.,length(vW.xz));o=vec4(.55,.45,.78,l*.22*f);return;}
  if(vM.x<-.5){o=vC;return;}
  vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;
  if(vM.z>.5&&abs(N.y)<.7){float a=atan(vL.z,vL.x);vec3 T=vec3(-sin(a),0.,cos(a));N=normalize(N+T*sin(a*vM.z)*.55);}
  vec4 b=vC;float em=vM.x;
  if(vU.x>=0.&&uHasTex>.5){vec4 t=texture(uTex,vU);b.rgb=t.rgb;em=max(em,(t.a<.99)?(1.-t.a)*1.2:0.);}
  vec3 V=normalize(uEye-vW),L=normalize(uKey),F=normalize(uFill),H=normalize(L+V);
  float d=max(dot(N,L),0.),d2=max(dot(N,F),0.)*.35,hemi=N.y*.5+.5;
  vec3 amb=mix(vec3(.58,.55,.66),vec3(1.,.98,1.04),hemi);
  vec3 dif=b.rgb*(amb*.55+d*.62+d2);
  vec3 R=reflect(-V,N);float e=smoothstep(-.35,.95,R.y);
  vec3 env=mix(vec3(.16,.15,.2),vec3(1.02),e);
  env+=vec3(1.)*pow(max(dot(R,normalize(vec3(-.55,.55,.65))),0.),18.)*.9+vec3(.95,.9,1.)*pow(max(dot(R,normalize(vec3(.7,.35,.4))),0.),10.)*.45;
  env+=vec3(.75,.6,1.)*smoothstep(.2,-.6,R.y)*.25;
  vec3 met=env*mix(vec3(1.),b.rgb,.75)*1.08;
  float sp=pow(max(dot(N,H),0.),70.);
  vec3 c=mix(dif,met,vM.y)+vec3(1.)*sp*(.22+.6*vM.y);
  c+=vec3(.82,.72,1.)*pow(1.-max(dot(N,V),0.),3.)*.22;
  c+=b.rgb*em*1.35;
  c=c/(1.+c*.18);
  o=vec4(c,b.a);}`;

function Stage(cv,opt){opt=opt||{};
  const gl=cv.getContext('webgl2',{antialias:true,alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:!!opt.keep});if(!gl)return null;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o};
  const pg=gl.createProgram();gl.attachShader(pg,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pg,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pg);
  const U={};['uVP','uMd','uEye','uKey','uFill','uTex','uHasTex','uGridK'].forEach(n=>U[n]=gl.getUniformLocation(pg,n));
  const AT=['aP','aN','aC','aU','aM'].map(n=>gl.getAttribLocation(pg,n)),SZ=[3,3,4,2,3];
  const meshes=[],items=[];
  const st={gl,cv,items,
    cam:{yaw:0,pitch:.3,dist:4,t:[0,0,0],fov:.6},goal:null,
    mesh(geo,o){o=o||{};const vao=gl.createVertexArray(),vb=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vb);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geo.A),gl.STATIC_DRAW);let off=0;AT.forEach((a,i)=>{if(a>=0){gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,SZ[i],gl.FLOAT,false,60,off*4)}off+=SZ[i]});
      gl.bindVertexArray(null);let tex=null;if(o.tex){tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,o.tex);gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        const an=gl.getExtension('EXT_texture_filter_anisotropic');if(an)gl.texParameterf(gl.TEXTURE_2D,an.TEXTURE_MAX_ANISOTROPY_EXT,8)}
      const m={vao,vb,n:geo.A.length/15,tex,tr:!!o.tr,last:!!o.last};meshes.push(m);return m},
    add(mesh,M){const it={mesh,M:M||M4.I(),on:true};items.push(it);return it},
    eye(c){c=c||st.cam;const cp=Math.cos(c.pitch),sp=Math.sin(c.pitch);return [c.t[0]+Math.sin(c.yaw)*cp*c.dist,c.t[1]+sp*c.dist,c.t[2]+Math.cos(c.yaw)*cp*c.dist]},
    draw(views){const W=cv.width,H=cv.height;gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(pg);gl.uniform3fv(U.uKey,opt.key||[.45,.95,.55]);gl.uniform3fv(U.uFill,[-.7,.3,.5]);gl.uniform1f(U.uGridK,opt.grid||1);gl.uniform1i(U.uTex,0);
      (views||[{x:0,y:0,w:1,h:1,cam:st.cam}]).forEach(vw=>{const vx=Math.round(vw.x*W),vy=Math.round(vw.y*H),vwid=Math.round(vw.w*W),vh=Math.round(vw.h*H);
        gl.enable(gl.SCISSOR_TEST);gl.scissor(vx,vy,vwid,vh);gl.viewport(vx,vy,vwid,vh);
        const c=vw.cam,e=st.eye(c),cp=Math.cos(c.pitch),sp=Math.sin(c.pitch),up=[-sp*Math.sin(c.yaw),cp,-sp*Math.cos(c.yaw)];
        let P=M4.P(c.fov,vwid/vh,.05,200);if(c.sx||c.sy){P[8]=-(c.sx||0);P[9]=-(c.sy||0)}
        const VP=M4.mul(P,M4.look(e,c.t,up));gl.uniformMatrix4fv(U.uVP,false,VP);gl.uniform3fv(U.uEye,e);
        const pass=(tr)=>items.forEach(it=>{if(!it.on||it.mesh.tr!==tr)return;const m=it.mesh;gl.uniformMatrix4fv(U.uMd,false,it.M);
          if(m.tex){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,m.tex);gl.uniform1f(U.uHasTex,1)}else gl.uniform1f(U.uHasTex,0);
          gl.bindVertexArray(m.vao);gl.drawArrays(gl.TRIANGLES,0,m.n)});
        gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);pass(false);
        gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);pass(true);gl.depthMask(true);gl.disable(gl.SCISSOR_TEST)})},
    size(){const r=cv.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,opt.dpr||1.75),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));
      if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;return true}return false},
    destroy(){st.stop();meshes.forEach(m=>{gl.deleteBuffer(m.vb);gl.deleteVertexArray(m.vao);m.tex&&gl.deleteTexture(m.tex)});const x=gl.getExtension('WEBGL_lose_context');x&&x.loseContext()},
    raf:0,run(fn){if(st.raf)return;let last=performance.now();const loop=t=>{st.raf=requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000);last=t;st.size();fn&&fn(dt,t/1000);st.draw()};st.raf=requestAnimationFrame(loop)},
    stop(){if(st.raf){cancelAnimationFrame(st.raf);st.raf=0}}};
  return st}

/* 궤도 조작: 드래그 회전 · (선택) 휠/핀치 확대 · 방향키 */
function orbit(st,el,o){o=o||{};const c=st.cam,G={yaw:c.yaw,pitch:c.pitch,dist:c.dist};st.goal=G;let drag=null,idle=0;const pts=new Map();
  const clampP=v=>Math.max(o.pmin==null?-.1:o.pmin,Math.min(o.pmax==null?1.52:o.pmax,v));
  el.addEventListener('pointerdown',e=>{if(e.button)return;pts.set(e.pointerId,[e.clientX,e.clientY]);el.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY};idle=0;el.classList.add('grab')});
  el.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const prev=pts.get(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===2&&o.zoom){const [a,b]=[...pts.values()];const d1=Math.hypot(a[0]-b[0],a[1]-b[1]),q=[...pts.entries()].find(x=>x[0]!==e.pointerId)[1],d0=Math.hypot(prev[0]-q[0],prev[1]-q[1]);G.dist=Math.max(o.zmin,Math.min(o.zmax,G.dist*d0/Math.max(1,d1)));return}
    G.yaw-=(e.clientX-prev[0])*.008;G.pitch=clampP(G.pitch+(e.clientY-prev[1])*.006);idle=0});
  const up=e=>{pts.delete(e.pointerId);if(!pts.size){drag=null;el.classList.remove('grab')}};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  if(o.zoom)el.addEventListener('wheel',e=>{const nd=Math.max(o.zmin,Math.min(o.zmax,G.dist*(1+e.deltaY*.0012)));if(nd!==G.dist){G.dist=nd;e.preventDefault()}idle=0},{passive:false});
  el.addEventListener('keydown',e=>{const k=e.key;if(k==='ArrowLeft')G.yaw+=.18;else if(k==='ArrowRight')G.yaw-=.18;else if(k==='ArrowUp')G.pitch=clampP(G.pitch+.12);else if(k==='ArrowDown')G.pitch=clampP(G.pitch-.12);else return;e.preventDefault();idle=0});
  return {G,set(v){Object.assign(G,v);idle=0},
    step(dt){idle+=dt;if(o.sway&&idle>3&&!drag)G.yaw+=dt*o.sway;const k=1-Math.exp(-dt*7);c.yaw+=(G.yaw-c.yaw)*k;c.pitch+=(G.pitch-c.pitch)*k;c.dist+=(G.dist-c.dist)*k}}}
return {M4,Geo,Stage,orbit}})();

/* =====================================================================
   제품 모델
   ===================================================================== */
const PM=(function(){const {M4,Geo}=MG;
const SIL=[.86,.86,.9],SIL2=[.74,.74,.78],DP=[.30,.10,.50],DP2=[.20,.05,.34];
/* TIME DIAL 윗면 텍스처 : 은빛 아이콘 링 + 짙은 보라 시계판 */
function dialTex(){const N=1024,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),C=N/2,R=N/2;   /* 반지름 .84 = R */
  const k=R/.84;
  /* 바깥(보라 링 위로 보이는 부분은 쓰이지 않음) */
  x.fillStyle='#4a1c7a';x.fillRect(0,0,N,N);
  /* 은빛 링 : 방사형 브러시드 */
  const g=x.createRadialGradient(C-120,C-160,40,C,C,.82*k);g.addColorStop(0,'#f4f2f8');g.addColorStop(.6,'#c9c6d2');g.addColorStop(1,'#9d99a8');
  x.beginPath();x.arc(C,C,.82*k,0,7);x.fillStyle=g;x.fill();
  for(let i=0;i<360;i++){const a=i/360*Math.PI*2;x.strokeStyle=`rgba(255,255,255,${.05+.06*Math.random()})`;x.lineWidth=1;x.beginPath();x.arc(C,C,(.55+.27*Math.random())*k,a,a+.02);x.stroke()}
  /* 링 안쪽 테두리 하이라이트 */
  x.lineWidth=6;x.strokeStyle='rgba(255,255,255,.9)';x.beginPath();x.arc(C,C,.545*k,0,7);x.stroke();
  x.lineWidth=3;x.strokeStyle='rgba(255,255,255,.7)';x.beginPath();x.arc(C,C,.805*k,0,7);x.stroke();
  /* 시계판 */
  const f=x.createRadialGradient(C,C-60,10,C,C,.53*k);f.addColorStop(0,'#3b1a5e');f.addColorStop(1,'#1c0830');
  x.beginPath();x.arc(C,C,.53*k,0,7);x.fillStyle=f;x.fill();
  x.strokeStyle='rgba(235,225,255,.55)';x.lineWidth=4;
  for(let i=0;i<12;i++){if(i%3===0)continue;const a=i/12*Math.PI*2-Math.PI/2;x.beginPath();x.moveTo(C+Math.cos(a)*.42*k,C+Math.sin(a)*.42*k);x.lineTo(C+Math.cos(a)*.465*k,C+Math.sin(a)*.465*k);x.stroke()}
  x.fillStyle='#fff';x.font='700 '+Math.round(.11*k)+'px Pretendard, "Noto Sans KR", Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';
  [['12',0],['3',1],['6',2],['9',3]].forEach(([t,q])=>{const a=q*Math.PI/2-Math.PI/2;x.fillText(t,C+Math.cos(a)*.34*k,C+Math.sin(a)*.34*k+4)});
  /* 아이콘 8개 : 은빛 링 위에 연보라로 빛남 (알파를 낮춰 발광 표시) */
  const ic=[note,people,wave,spark,flag,bag,fork,shirt];
  ic.forEach((fn,i)=>{const a=i/8*Math.PI*2-Math.PI/2,px=C+Math.cos(a)*.68*k,py=C+Math.sin(a)*.68*k;x.save();x.translate(px,py);
    x.strokeStyle='#efe2ff';x.fillStyle='#efe2ff';x.lineWidth=7;x.lineCap='round';x.lineJoin='round';x.shadowColor='rgba(190,140,255,.9)';x.shadowBlur=16;fn(x,40);x.restore()});
  return c;
  function note(x,s){x.beginPath();x.moveTo(-s*.35,s*.55);x.lineTo(-s*.35,-s*.45);x.lineTo(s*.45,-s*.6);x.lineTo(s*.45,s*.4);x.stroke();x.beginPath();x.ellipse(-s*.5,s*.55,s*.2,s*.15,-.3,0,7);x.fill();x.beginPath();x.ellipse(s*.3,s*.42,s*.2,s*.15,-.3,0,7);x.fill()}
  function people(x,s){[-.45,0,.45].forEach((o,i)=>{x.beginPath();x.arc(o*s,-s*.38+(i===1?-.08*s:0),s*.13,0,7);x.stroke();x.beginPath();x.moveTo(o*s-s*.2,s*.5);x.lineTo(o*s-s*.2,-s*.05);x.quadraticCurveTo(o*s,-s*.2,o*s+s*.2,-s*.05);x.lineTo(o*s+s*.2,s*.5);x.stroke()})}
  function wave(x,s){[-.6,-.3,0,.3,.6].forEach((o,i)=>{const h=[.25,.55,.8,.55,.25][i]*s;x.beginPath();x.moveTo(o*s,-h);x.lineTo(o*s,h);x.stroke()});x.beginPath();x.moveTo(-.85*s,0);x.lineTo(.85*s,0);x.globalAlpha=.6;x.stroke();x.globalAlpha=1}
  function spark(x,s){x.beginPath();x.moveTo(0,-s*.75);x.quadraticCurveTo(s*.1,-s*.1,s*.75,0);x.quadraticCurveTo(s*.1,s*.1,0,s*.75);x.quadraticCurveTo(-s*.1,s*.1,-s*.75,0);x.quadraticCurveTo(-s*.1,-s*.1,0,-s*.75);x.stroke()}
  function flag(x,s){x.beginPath();x.moveTo(-s*.5,s*.75);x.lineTo(-s*.5,-s*.6);x.stroke();for(let r=0;r<3;r++){x.beginPath();x.moveTo(-s*.5,-s*.6+r*s*.32);x.bezierCurveTo(-s*.1,-s*.85+r*s*.32,s*.2,-s*.35+r*s*.32,s*.6,-s*.6+r*s*.32);x.stroke()}}
  function bag(x,s){x.beginPath();x.moveTo(-s*.55,s*.6);x.lineTo(-s*.42,-s*.15);x.lineTo(s*.42,-s*.15);x.lineTo(s*.55,s*.6);x.closePath();x.stroke();x.beginPath();x.arc(0,-s*.2,s*.25,Math.PI,0);x.stroke()}
  function fork(x,s){x.beginPath();x.moveTo(-s*.35,-s*.7);x.lineTo(-s*.35,s*.7);x.moveTo(-s*.55,-s*.7);x.lineTo(-s*.55,-s*.25);x.quadraticCurveTo(-s*.35,0,-s*.15,-s*.25);x.lineTo(-s*.15,-s*.7);x.stroke();
    x.beginPath();x.ellipse(s*.35,-s*.4,s*.14,s*.28,0,0,7);x.fill();x.beginPath();x.moveTo(s*.35,-s*.2);x.lineTo(s*.35,s*.7);x.stroke()}
  function shirt(x,s){x.beginPath();x.moveTo(-s*.25,-s*.6);x.lineTo(-s*.75,-s*.3);x.lineTo(-s*.55,0);x.lineTo(-s*.4,-s*.1);x.lineTo(-s*.4,s*.65);x.lineTo(s*.4,s*.65);x.lineTo(s*.4,-s*.1);x.lineTo(s*.55,0);x.lineTo(s*.75,-s*.3);x.lineTo(s*.25,-s*.6);x.quadraticCurveTo(0,-s*.35,-s*.25,-s*.6);x.stroke()}
}
function dial(st){
  const b=Geo();
  b.col(SIL).mat(0,1,220).lathe([[0,0],[.97,0],[1.0,.02],[1.0,.085],[.985,.1],[.93,.1]],160);           /* 은빛 널링 받침 */
  b.col(DP).mat(0,.75,170).lathe([[.93,.1],[.935,.11],[.935,.19],[.93,.2]],160);                         /* 보라 널링 링 */
  b.col(DP).mat(0,.65,0).lathe([[.93,.2],[.92,.215],[.905,.225],[.84,.232],[.835,.25]],160);              /* 보라 윗턱 */
  b.col(SIL).mat(0,1,0).lathe([[.835,.25],[.83,.262],[.82,.27]],160);
  b.col(SIL).mat(0,1,0).lathe([[.545,.27],[.535,.262],[.53,.25],[.53,.24]],160);                         /* 링 안쪽 벽 */
  const m1=st.mesh(b);st.add(m1);
  const t=Geo();t.col([1,1,1]).mat(0,.35,0).lathe([[.82,.27],[.545,.27]],160,.84).lathe([[.53,.24],[0,.24]],160,.84);   /* 윗면 (텍스처) */
  const m2=st.mesh(t,{tex:dialTex()});st.add(m2);
  const bead=Geo();bead.col([.62,.45,.9],.62).mat(.15,.7,0).sphere(0,0,0,.075,28);                      /* 유리 PUI 구슬 */
  const m3=st.mesh(bead,{tr:true});const bi=st.add(m3,M4.T(.36,.29,0));
  const sh=Geo();sh.blob(1.35,1.35,.42,-.002);st.add(st.mesh(sh,{tr:true}));
  return {anim(T){const a=T*.12;bi.M=M4.T(Math.cos(a)*.36,.29+.006*Math.sin(T*2),Math.sin(a)*.36)},center:[0,.12,0],size:1}}

/* 회전형 동선 가림막 : 기둥 1 + 패널 2 (패널은 기둥 축으로 함께 회전) */
function fenceGeo(){
  const s=Geo(),p=Geo(),f=Geo();
  s.col([.97,.96,.99]).mat(0,.35,0).lathe([[0,0],[.27,0],[.28,.012],[.27,.03],[.2,.05],[.1,.06],[.085,.07]],64);   /* 베이스 */
  s.col([.96,.95,.99]).mat(0,.18,0).lathe([[.08,.07],[.08,.8]],48);
  s.col([.45,.42,.52]).mat(0,.3,0).lathe([[.081,.8],[.081,.815]],48);
  p.col([.96,.95,.99]).mat(0,.18,0).lathe([[.08,.815],[.08,1.9],[.07,1.915],[0,1.917]],48);              /* 상단 기둥 (패널과 함께 회전) */
  p.col([1,.55,.95]).mat(1,0,0).box(0,1.33,.081,.012,.85,.006);                                          /* 기둥 LED */
  [-1,1].forEach(sd=>{const cx=sd*(.08+.035+.44);
    p.xf(M4.T(cx,1.31,0)).col([.40,.38,.46]).mat(0,.45,0).frame(.88,1.2,.07,.04,.035,6);
    p.col([1,.52,.95]).mat(1,0,0).xf(M4.mul(M4.T(cx,1.31,0),M4.T(0,0,.0185))).frame(.81,1.13,.045,.018,.002,6).xf(M4.mul(M4.T(cx,1.31,0),M4.T(0,0,-.0185))).frame(.81,1.13,.045,.018,.002,6);
    p.xf(null).col([.95,.94,.98]).mat(0,.4,0).box(sd*(.08+.018),1.62,0,.04,.05,.03).box(sd*(.08+.018),1.0,0,.04,.05,.03);
    f.xf(M4.T(cx,1.31,0)).col([.86,.74,.98],.7).mat(.05,0,0).slab(.8,1.12,.035,.012,6);f.xf(null)});
  return {s,p,f}}
function fence(st,opt){opt=opt||{};const G=fenceGeo(),ms=st.mesh(G.s),mp=st.mesh(G.p),mf=st.mesh(G.f,{tr:true});
  const sh=Geo();sh.blob(1.15,.55,.32,.001);const msh=st.mesh(sh,{tr:true});
  const units=[];const n=opt.n||1,gap=opt.gap||1.98;
  for(let i=0;i<n;i++){const x=(i-(n-1)/2)*gap;st.add(msh,M4.T(x,0,0));st.add(ms,M4.T(x,0,0));const a=st.add(mp,M4.T(x,0,0)),b=st.add(mf,M4.T(x,0,0));units.push({x,a,b,ang:0,goal:0,delay:i*.12})}
  return {units,setAng(u,ang){u.ang=ang;const M=M4.mul(M4.T(u.x,0,0),M4.Ry(ang));u.a.M=M;u.b.M=M}}}

/* 비상 컨트롤 배지 */
function badge(st){const g=Geo(),S=1;
  g.xf(M4.T(0,.42,0)).col([.96,.96,.98]).mat(0,.25,0).slab(.62,.46,.11,.2,8);                           /* 흰 상단 */
  g.xf(M4.T(0,.0,0)).col([.72,.62,.92]).mat(0,.25,0).slab(.62,.4,.11,.2,8);                               /* 라벤더 하단 */
  g.xf(M4.T(0,.68,0)).col([.18,.16,.22]).mat(0,.4,0).slab(.62,.07,.03,.21,4);                             /* 경광 밴드 */
  g.xf(null).col([1,.2,.28]).mat(1,0,0).box(-.17,.68,.107,.18,.035,.01).col([.3,.5,1]).box(.17,.68,.107,.18,.035,.01);
  g.col([.94,.94,.97]).mat(0,.3,0).xf(M4.mul(M4.T(0,.36,.1),M4.Rx(Math.PI/2))).cyl(.13,0,.03,40,true);     /* PTT */
  g.col([.82,.8,.88]).xf(M4.mul(M4.T(0,.36,.13),M4.Rx(Math.PI/2))).cyl(.1,0,.01,40,true);
  g.col([.9,.9,.95]).xf(M4.mul(M4.T(0,.58,.1),M4.Rx(Math.PI/2))).cyl(.045,0,.02,24,true);                  /* 무전 */
  g.col([.9,.88,.96]).xf(M4.mul(M4.T(0,.03,.1),M4.Rx(Math.PI/2))).cyl(.06,0,.02,24,true);                  /* 블루투스 */
  g.xf(null).col([.3,.55,1]).mat(1,0,0).box(-.1,.52,.103,.03,.012,.004).box(.1,.52,.103,.03,.012,.004).box(0,-.07,.103,.05,.012,.004);
  g.col([.55,.48,.75]).mat(0,.3,0).box(.32,.2,.0,.025,.12,.06);                                            /* 안전 잠금 */
  g.col([.85,.85,.9]).mat(0,.8,0).box(0,.4,-.13,.18,.3,.04);                                               /* 클립 */
  st.add(st.mesh(g));const sh=Geo();sh.blob(.6,.35,.35,-.2);st.add(st.mesh(sh,{tr:true}));
  return {anim(T){},center:[0,.34,0],size:.9}}

/* Echo Ring : 두 손가락 링 */
function ring(st){const g=Geo();
  g.xf(M4.T(0,.23,0)).col([.97,.97,.99]).mat(0,.35,0).xf(M4.mul(M4.T(0,.23,0),M4.Rx(-Math.PI/2))).slab(.92,.3,.14,.12,8);    /* 상판 */
  g.xf(null).col([.62,.45,.95]).mat(.9,0,0).box(0,.293,-.1,.22,.006,.025);                                          /* 상판 LED */
  [-.21,.21].forEach(x=>{g.col([.72,.58,.96]).mat(0,.35,0).xf(M4.mul(M4.T(x,.02,0),M4.Rx(Math.PI/2))).torus(.15,.045,48,16)});
  g.xf(null).col([.85,.8,.95]).mat(0,.3,0);for(let i=0;i<8;i++){const x=-.38+i*.108;g.box(x,.165,.13,.05,.03,.02)}
  st.add(st.mesh(g));const sh=Geo();sh.blob(.75,.4,.35,-.15);st.add(st.mesh(sh,{tr:true}));
  return {anim(T){},center:[0,.12,0],size:.8}}
return {dial,fence,badge,ring}})();

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
const sw=i=>`<div class="pdsw" role="group" aria-label="제품 선택">${ORD.map(k=>`<button type="button" data-p="${k}" class="${k===i?'on':''}" aria-label="${esc(P[k].name)}">0${PO(k)}</button>`).join('')}</div>`;
const PO=i=>[4,1,3,2][i],ORD=[1,3,2,0],NXT=(i,d)=>ORD[(ORD.indexOf(i)+d+4)%4];   /* 제품 순서: 01 TIME DIAL · 02 리본 스크린 펜스 · 03 Echo Ring · 04 비상 컨트롤 배지 */
const nx=(i,cls)=>{const a=NXT(i,-1),b=NXT(i,1);return `<div class="${cls}"><button type="button" data-p="${a}"><small>PREV · 0${PO(a)}</small><b>${esc(P[a].name)}</b></button><button type="button" data-p="${b}"><small>NEXT · 0${PO(b)}</small><b>${esc(P[b].name)}</b></button></div>`};

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
const SITES={0:'product-04.html',1:'product-01.html',2:'product-03.html',3:'product-02.html'};   /* TIME DIAL(G/O): 최신 개인 사이트 파일(p1/)을 열음 */
const FILE_SITE={0:1,1:1,2:1,3:1};   /* 01 배지 · 02 TIME DIAL: 최신 개인 사이트 파일(p0/ · p1/)을 열음 */   /* 2번 제품(회전형 동선 가림막): 최신 개인 사이트 파일(p2/)을 열음 */
/* 공유용 단일 파일: 개인 사이트가 이 파일 안에 들어 있으면(script#site-N) 그것을 띄우고, 없으면 옆 파일을 연다 */
/* 공유용 단일 파일: 개인 사이트는 압축(gzip)해서 담고, 공통 글꼴은 팀 페이지 것을 함께 씀 → 파일 용량 절반 */
const siteText=i=>{const el=document.getElementById('site-'+i);if(el._p)return el._p;
  el._p=(async()=>{let t;
    if(el.type==='application/x-hg-gz'){const b=atob(el.textContent.trim()),u=new Uint8Array(b.length);for(let k=0;k<b.length;k++)u[k]=b.charCodeAt(k);
      t=await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}
    else t=el.textContent.replace(/<\\\/script/gi,'</script');
    if(t.slice(0,7)==='HGDICT:'){const n=t.indexOf('\n'),D=JSON.parse(t.slice(7,n));t=t.slice(n+1).replace(/@@HGD(\d+)@@/g,(m,k)=>D[+k])}   /* 같은 그림이 여러 번 들어간 것은 한 번만 담아 둠 */
    el.textContent='';const f=document.getElementById('hg-font');if(f&&t.indexOf('id="hg-font"')<0)t=t.replace(/<head[^>]*>/i,m=>m+f.outerHTML);return t})();
  return el._p};
/* 개인 사이트는 '자세히 보기'를 누를 때만 풀어 둠 — 미리 풀면 스크롤 중 화면이 멈칫함 */
const srcOf=i=>{const el=document.getElementById('site-'+i);if(!el)return SITES[i];
  if(!el._u)el._u=URL.createObjectURL(new Blob([el.textContent.replace(/<\\\/script/gi,'</script')],{type:'text/html;charset=utf-8'}));return el._u};   /* 제작자가 만든 개인 사이트를 그대로 띄우는 제품 */
addEventListener('message',e=>{const m=e.data;if(!m||!m.hg||cur<0)return;if(m.close)closeDetail();else if(m.open!=null)show(m.open)});
/* 공통 상단 바의 '제품 소개 · 제품 체험 · 사용 안내' → 각 사이트의 해당 구역 */
const SECT={0:['#about','#viewer','#scenario'],1:['#about','#explore','#scenes'],2:['#pa-s1','#pa-s2','#pa-s3'],3:['#overview','#experience','#guide']};
function wireBar(){root.querySelectorAll('.pdbar-m [data-go]').forEach(b=>b.onclick=()=>{const g=b.dataset.go,fr=root.querySelector('iframe.pdif');
  if(fr){try{fr.contentWindow.postMessage({hg:1,go:g},'*')}catch(e){}}else{const t=root.querySelector(g);t&&t.scrollIntoView({behavior:'smooth'})}})}
const BAR=i=>`<header class="pdbar"><div class="pdbar-l"><button type="button" class="pdbk" data-close>${AR}<span>축제 지도</span></button><b><em>0${PO(i)}</em>${esc(P[i].name)}</b></div>
  <nav class="pdbar-m" aria-label="페이지 안 이동">${['제품 소개','제품 체험','사용 안내'].map((t,k)=>`<button type="button" data-go="${SECT[i][k]}">${t}</button>`).join('')}</nav>
  <nav class="pdbar-r" aria-label="제품 이동"><button type="button" class="pdar" data-p="${NXT(i,-1)}" aria-label="이전 제품"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>${ORD.map(k=>`<button type="button" data-p="${k}" class="pdn${k===i?' on':''}" aria-label="${esc(P[k].name)}"${k===i?' aria-current="page"':''}>0${PO(k)}</button>`).join('')}<button type="button" class="pdar" data-p="${NXT(i,1)}" aria-label="다음 제품"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></nav></header>`;
function show(i){i=(i%N+N)%N;clean();cur=i;
  if(SITES[i]){const el=FILE_SITE[i]?null:document.getElementById('site-'+i);
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

