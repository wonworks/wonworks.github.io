/* ------------------------------------------------------------
   Lightweight GLB viewer (WebGL2, no external libraries)
   - Loads a local .glb (relative path), PBR-lite shading
   - Orbit: drag / wheel / pinch, presets, auto-rotate
   - Part API: highlight(name), setEmissive(name, rgb)
   Works offline. Needs a local web server (fetch is blocked on file://).
------------------------------------------------------------ */
(function (global) {
  'use strict';

  /* ---------- math ---------- */
  const M = {
    persp(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
      return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
    },
    lookAt(e, c, up) {
      let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
      let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
      let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
      l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
        -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
    }
  };

  const VS = `#version 300 es
  layout(location=0) in vec3 aPos;
  layout(location=1) in vec3 aNor;
  uniform mat4 uView, uProj;
  out vec3 vPos; out vec3 vNor;
  void main(){ vPos=aPos; vNor=aNor; gl_Position=uProj*uView*vec4(aPos,1.0); }`;

  const FS = `#version 300 es
  precision highp float;
  in vec3 vPos; in vec3 vNor;
  uniform vec4 uColor; uniform float uMetal, uRough; uniform vec3 uEmissive; uniform vec3 uCam;
  uniform float uGlow;
  out vec4 outColor;
  vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }
  vec3 light(vec3 N, vec3 V, vec3 L, vec3 col, vec3 diff, vec3 F0, float sh){
    float nl=max(dot(N,L),0.0);
    vec3 H=normalize(L+V);
    float nh=max(dot(N,H),0.0);
    vec3 F=F0+(1.0-F0)*pow(1.0-max(dot(H,V),0.0),5.0);
    float spec=pow(nh,sh)*(sh+8.0)/25.13;
    return col*nl*(diff+F*spec);
  }
  void main(){
    vec3 N=normalize(vNor); vec3 V=normalize(uCam-vPos);
    if(dot(N,V)<0.0) N=-N;
    vec3 base=toLin(uColor.rgb);
    vec3 diff=base*(1.0-uMetal)/3.14159;
    vec3 F0=mix(vec3(0.04),base,uMetal);
    float r=max(uRough,0.06);
    float sh=clamp(2.0/(r*r*r*r)-2.0,4.0,2048.0);
    vec3 c=vec3(0.0);
    c+=light(N,V,normalize(vec3(0.55,0.75,0.65)),vec3(3.3,3.2,3.1),diff,F0,sh);
    c+=light(N,V,normalize(vec3(-0.7,0.25,0.45)),vec3(1.1,1.05,1.3),diff,F0,sh);
    c+=light(N,V,normalize(vec3(0.0,-0.4,-1.0)),vec3(0.9,0.85,1.1),diff,F0,sh);
    // hemisphere ambient + fake environment reflection
    vec3 sky=vec3(0.95,0.93,1.0), gnd=vec3(0.55,0.5,0.66);
    float h=N.y*0.5+0.5;
    c+=base*(1.0-uMetal)*mix(gnd,sky,h)*0.55;
    vec3 R=reflect(-V,N);
    float fr=pow(1.0-max(dot(N,V),0.0),5.0);
    vec3 env=mix(gnd,sky,smoothstep(-0.3,0.6,R.y));
    c+=env*(F0+(1.0-F0)*fr)*(1.0-r)*0.9;
    c+=toLin(uEmissive)*4.0;
    c+=toLin(vec3(0.53,0.32,0.87))*uGlow*(0.35+fr*1.6);
    c=c/(c+vec3(0.8))*1.35;              // soft tone map
    c=pow(c,vec3(1.0/2.2));
    float a=uColor.a;
    if(a<1.0) a=clamp(a+fr*0.25+length(uEmissive)*0.2,0.0,1.0);
    outColor=vec4(c*a,a);
  }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function parseGLB(buf) {
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('GLB 형식이 아닙니다');
    let off = 12, json = null, bin = null;
    while (off < buf.byteLength) {
      const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true);
      const chunk = buf.slice(off + 8, off + 8 + len);
      if (type === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(chunk));
      else if (type === 0x004E4942) bin = chunk;
      off += 8 + len;
    }
    return { json, bin };
  }

  function Viewer(canvas, opts) {
    opts = opts || {};
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) throw new Error('이 브라우저는 WebGL2를 지원하지 않습니다');
    this.gl = gl; this.canvas = canvas;
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    this.prog = p;
    this.u = {};
    ['uView', 'uProj', 'uColor', 'uMetal', 'uRough', 'uEmissive', 'uCam', 'uGlow'].forEach(n => this.u[n] = gl.getUniformLocation(p, n));

    this.parts = [];          // {name, vao, count, mat, center, emissive, glow}
    this.cam = { theta: 0.6, phi: 1.15, radius: 0.5 };
    this.goal = null;
    this.home = { theta: 0.6, phi: 1.15, radius: 0.5 };
    this.autoRotate = opts.autoRotate !== false;
    this.highlightName = null;
    this.hooks = [];          // per-frame callbacks (t)
    this.idleTimer = 0;
    this._bind();
    this._resize();
    if ('ResizeObserver' in global) new ResizeObserver(() => this._resize()).observe(canvas);
    this.visible = true;
    if ('IntersectionObserver' in global) {
      new IntersectionObserver(es => { this.visible = es[0].isIntersecting; }).observe(canvas);
    }
    this.reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.reduced) this.autoRotate = false;
    this._last = performance.now();
    const loop = (t) => { this._frame(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  Viewer.prototype.load = async function (url, onProgress) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('모델 파일을 찾을 수 없습니다 (' + res.status + ')');
    let buf;
    const total = +res.headers.get('content-length') || 0;
    if (res.body && total && onProgress) {
      const reader = res.body.getReader(); const chunks = []; let got = 0;
      for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; onProgress(got / total); }
      const all = new Uint8Array(got); let o = 0; chunks.forEach(c => { all.set(c, o); o += c.length; }); buf = all.buffer;
    } else buf = await res.arrayBuffer();
    this._build(parseGLB(buf));
  };

  Viewer.prototype.loadBuffer = function (buf) { this._build(parseGLB(buf)); };

  Viewer.prototype._build = function ({ json, bin }) {
    const gl = this.gl;
    const bvBuf = {};
    const getBuffer = (i, target) => {
      if (bvBuf[i]) return bvBuf[i];
      const bv = json.bufferViews[i];
      const b = gl.createBuffer(); gl.bindBuffer(target, b);
      gl.bufferData(target, new Uint8Array(bin, bv.byteOffset || 0, bv.byteLength), gl.STATIC_DRAW);
      return (bvBuf[i] = b);
    };
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    json.nodes.forEach(node => {
      if (node.mesh == null) return;
      json.meshes[node.mesh].primitives.forEach(pr => {
        const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
        const pa = json.accessors[pr.attributes.POSITION];
        gl.bindBuffer(gl.ARRAY_BUFFER, getBuffer(pa.bufferView, gl.ARRAY_BUFFER));
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, pa.byteOffset || 0);
        const na = json.accessors[pr.attributes.NORMAL];
        gl.bindBuffer(gl.ARRAY_BUFFER, getBuffer(na.bufferView, gl.ARRAY_BUFFER));
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, na.byteOffset || 0);
        const ia = json.accessors[pr.indices];
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, getBuffer(ia.bufferView, gl.ELEMENT_ARRAY_BUFFER));
        gl.bindVertexArray(null);
        const m = json.materials[pr.material] || {};
        const pbr = m.pbrMetallicRoughness || {};
        for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], pa.min[k]); max[k] = Math.max(max[k], pa.max[k]); }
        this.parts.push({
          name: node.name, vao, count: ia.count, type: ia.componentType,
          color: pbr.baseColorFactor || [0.8, 0.8, 0.8, 1], metal: pbr.metallicFactor != null ? pbr.metallicFactor : 0, rough: pbr.roughnessFactor != null ? pbr.roughnessFactor : 0.5,
          baseEmissive: m.emissiveFactor || [0, 0, 0], emissive: null, glow: 0,
          blend: m.alphaMode === 'BLEND',
          center: [(pa.min[0] + pa.max[0]) / 2, (pa.min[1] + pa.max[1]) / 2, (pa.min[2] + pa.max[2]) / 2]
        });
      });
    });
    this.target = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    const size = Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
    this.size = size;
    this.minR = size * 0.55; this.maxR = size * 4;
    this.home.radius = this.cam.radius = size * 1.75;
  };

  Viewer.prototype._resize = function () {
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr)), h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
  };

  Viewer.prototype._bind = function () {
    const c = this.canvas, pts = new Map();
    let pinch0 = 0, r0 = 0;
    const touched = () => { this.goal = null; this.idleTimer = 4000; };
    c.addEventListener('pointerdown', e => {
      c.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); touched();
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); r0 = this.cam.radius; }
      c.classList.add('is-grabbing');
    });
    c.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId); const dx = e.clientX - prev[0], dy = e.clientY - prev[1];
      pts.set(e.pointerId, [e.clientX, e.clientY]); touched();
      if (pts.size === 1) {
        this.cam.theta -= dx * 0.009;
        this.cam.phi = Math.min(Math.PI - 0.12, Math.max(0.12, this.cam.phi - dy * 0.009));
      } else if (pts.size === 2 && pinch0) {
        const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        this.cam.radius = this._clampR(r0 * pinch0 / d);
      }
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; if (!pts.size) c.classList.remove('is-grabbing'); };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', e => { e.preventDefault(); touched(); this.cam.radius = this._clampR(this.cam.radius * Math.exp(e.deltaY * 0.0012)); }, { passive: false });
    c.addEventListener('dblclick', () => this.reset());
  };
  Viewer.prototype._clampR = function (r) { return Math.min(this.maxR || 10, Math.max(this.minR || 0.01, r)); };

  Viewer.prototype.view = function (theta, phi, zoom) {
    // shortest path for theta
    let t = theta; const cur = this.cam.theta;
    while (t - cur > Math.PI) t -= Math.PI * 2;
    while (t - cur < -Math.PI) t += Math.PI * 2;
    this.goal = { theta: t, phi, radius: this.home.radius * (zoom || 1), speed: arguments[3] || 1.6 };
    this.idleTimer = 6000;
  };
  /* 진입 연출: 멀리 비스듬한 곳에서 천천히 기본 시점으로 다가옴 */
  Viewer.prototype.intro = function () {
    if (this.reduced) return;
    this.cam.theta = this.home.theta - 1.5; this.cam.phi = 1.42; this.cam.radius = this.home.radius * 2.3;
    this.view(this.home.theta, this.home.phi, 1, 0.55);
    this.idleTimer = 3200;
  };
  Viewer.prototype.reset = function () { this.view(this.home.theta, this.home.phi, 1); this.highlight(null); };
  Viewer.prototype.highlight = function (names) {
    this.highlightName = names ? (Array.isArray(names) ? names : [names]) : null;
  };
  Viewer.prototype.setEmissive = function (name, rgb) {
    this.parts.forEach(p => { if (p.name === name) p.emissive = rgb; });
  };
  Viewer.prototype.onFrame = function (fn) { this.hooks.push(fn); };

  Viewer.prototype._frame = function (t) {
    const dt = Math.min(64, t - this._last); this._last = t;
    if (!this.visible || !this.parts.length) return;
    this.hooks.forEach(fn => fn(t));
    const cam = this.cam;
    if (this.goal) {
      const k = 1 - Math.pow(0.0025, dt / 1000 * (this.goal.speed || 1.6));
      cam.theta += (this.goal.theta - cam.theta) * k;
      cam.phi += (this.goal.phi - cam.phi) * k;
      cam.radius += (this.goal.radius - cam.radius) * k;
      if (Math.abs(this.goal.theta - cam.theta) + Math.abs(this.goal.phi - cam.phi) + Math.abs(this.goal.radius - cam.radius) / this.home.radius < 0.002) this.goal = null;
    } else if (this.idleTimer > 0) this.idleTimer -= dt;
    else if (this.autoRotate) cam.theta += dt * 0.00028;

    const gl = this.gl;
    this._resize();
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.prog);
    const tg = this.target;
    const eye = [tg[0] + cam.radius * Math.sin(cam.phi) * Math.sin(cam.theta),
                 tg[1] + cam.radius * Math.cos(cam.phi),
                 tg[2] + cam.radius * Math.sin(cam.phi) * Math.cos(cam.theta)];
    gl.uniformMatrix4fv(this.u.uView, false, M.lookAt(eye, tg, [0, 1, 0]));
    const asp = this.canvas.width / this.canvas.height, half = 16 * Math.PI / 180;
    const fovy = asp < 1.1 ? 2 * Math.atan(Math.tan(half) * 1.1 / asp) : half * 2;
    gl.uniformMatrix4fv(this.u.uProj, false, M.persp(fovy, asp, this.size * 0.02, this.size * 20));
    gl.uniform3fv(this.u.uCam, eye);
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const pulse = 0.55 + 0.45 * Math.sin(t / 260);
    const hl = this.highlightName;
    const draw = p => {
      gl.uniform4fv(this.u.uColor, p.color);
      gl.uniform1f(this.u.uMetal, p.metal); gl.uniform1f(this.u.uRough, p.rough);
      gl.uniform3fv(this.u.uEmissive, p.emissive || p.baseEmissive);
      gl.uniform1f(this.u.uGlow, hl && hl.indexOf(p.name) !== -1 ? pulse * 0.9 : 0);
      gl.bindVertexArray(p.vao);
      gl.drawElements(gl.TRIANGLES, p.count, p.type, 0);
    };
    gl.depthMask(true);
    this.parts.forEach(p => { if (!p.blend) draw(p); });
    const d2 = c => (c[0] - eye[0]) ** 2 + (c[1] - eye[1]) ** 2 + (c[2] - eye[2]) ** 2;
    const tr = this.parts.filter(p => p.blend).sort((a, b) => d2(b.center) - d2(a.center));
    gl.depthMask(false);
    tr.forEach(draw);
    gl.depthMask(true);
    gl.bindVertexArray(null);
  };

  global.GLBViewer = Viewer;
})(window);
