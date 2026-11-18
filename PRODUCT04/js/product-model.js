(() => {
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const material = (color, roughness = .35, metalness = .12) =>
  new THREE.MeshStandardMaterial({color, roughness, metalness});
const aluminum = material(0xf5f1fa);
const frame = material(0x847a93, .28, .28);
const seam = material(0x63536f);
const glow = new THREE.MeshStandardMaterial({color: 0xdba7ff, emissive: 0x972cff, emissiveIntensity: 2.4});
const glass = new THREE.MeshPhysicalMaterial({
  color: 0xd1b8ed, side: THREE.DoubleSide, roughness: .38,
  transparent: true, opacity: .64, depthWrite: false
});

function mesh(parent, geometry, surface, x, y, z) {
  const part = new THREE.Mesh(geometry, surface);
  part.position.set(x, y, z);
  parent.add(part);
  return part;
}

function cylinder(parent, radiusTop, radiusBottom, height, surface, y) {
  return mesh(parent, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 56), surface, 0, y, 0);
}

function roundedRect(width, height, radius) {
  const x = -width / 2, y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function ringGeometry(width, height, thickness, depth) {
  const outer = roundedRect(width, height, .075);
  const inner = roundedRect(width - 2 * thickness, height - 2 * thickness, .045);
  outer.holes.push(new THREE.Path(inner.getPoints().reverse()));
  return new THREE.ExtrudeGeometry(outer, {depth, bevelEnabled: false, curveSegments: 10});
}

function product(scene) {
  const pivot = 1.04;
  cylinder(scene, .218, .247, .055, aluminum, .032);
  cylinder(scene, .23, .23, .013, seam, .012);
  cylinder(scene, .105, .105, pivot - .053, aluminum, (.053 + pivot) / 2);
  cylinder(scene, .102, .102, .018, seam, pivot);
  const head = new THREE.Group();
  head.position.y = pivot;
  scene.add(head);
  cylinder(head, .105, .105, .938, aluminum, .481);
  cylinder(head, .09, .105, .042, aluminum, .971);
  cylinder(head, .072, .072, .004, frame, .993);
  const bezel = ringGeometry(.56, .88, .027, .034);
  const led = ringGeometry(.51, .83, .014, .005);
  const insert = new THREE.ShapeGeometry(roundedRect(.49, .81, .04));
  for (const direction of [-1, 1]) {
    const x = .395 * direction;
    mesh(head, bezel, frame, x, .49, -.017);
    mesh(head, led, glow, x, .49, .016);
    mesh(head, led, glow, x, .49, -.022);
    mesh(head, insert, glass, x, .49, 0);
    for (const y of [.24, .73]) {
      mesh(head, new THREE.BoxGeometry(.048, .047, .052), aluminum, direction * .107, y, 0);
    }
  }
  const sideLed = new THREE.BoxGeometry(.012, .66, .008);
  mesh(head, sideLed, glow, 0, .49, .106);
  return head;
}

// Project the same mesh onto Canvas 2D when WebGL is unavailable.
function softwareRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const normal = new THREE.Vector3();
  const worldNormal = new THREE.Matrix3();
  const light = new THREE.Vector3(-.58, .78, .86).normalize();
  const vertex = new THREE.Vector3();
  const combined = new THREE.Matrix4();

  return function render(scene, camera, width, height) {
    const scale = Math.min(devicePixelRatio, 2);
    if (canvas.width !== Math.round(width * scale) || canvas.height !== Math.round(height * scale)) {
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, width, height);
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    const faces = [];
    scene.traverse(part => {
      if (!part.isMesh || part.material.map) return;
      const geometry = part.geometry;
      const position = geometry.attributes.position;
      const normals = geometry.attributes.normal;
      const index = geometry.index;
      const count = index?.count ?? position.count;
      const surface = part.material;
      const color = surface.emissiveIntensity > 1 ? '#d588ff' : surface.color.getStyle();
      combined.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(part.matrixWorld);
      worldNormal.getNormalMatrix(part.matrixWorld);
      const points = Array.from({length: position.count}, (_, i) => {
        vertex.fromBufferAttribute(position, i).applyMatrix4(combined);
        return [(vertex.x + 1) * width / 2, (1 - vertex.y) * height / 2, vertex.z];
      });
      for (let i = 0; i < count; i += 3) {
        const a = index ? index.getX(i) : i;
        const b = index ? index.getX(i + 1) : i + 1;
        const c = index ? index.getX(i + 2) : i + 2;
        const [u, v, w] = [points[a], points[b], points[c]];
        const facing = (v[0]-u[0])*(w[1]-u[1]) - (v[1]-u[1])*(w[0]-u[0]);
        if (surface.side !== THREE.DoubleSide && facing >= 0) continue;
        normal.fromBufferAttribute(normals, a).applyMatrix3(worldNormal).normalize();
        const shade = surface.emissiveIntensity > 1 ? 0 : .33 * (1 - Math.abs(normal.dot(light)));
        faces.push({u, v, w, z:(u[2]+v[2]+w[2])/3, color, shade, opacity:surface.opacity});
      }
    });
    faces.sort((a,b) => b.z-a.z);
    for (const {u,v,w,color,shade,opacity} of faces) {
      ctx.beginPath();
      ctx.moveTo(u[0],u[1]); ctx.lineTo(v[0],v[1]); ctx.lineTo(w[0],w[1]); ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.fill();
      if (opacity === 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = .65;
        ctx.stroke();
      }
      ctx.fillStyle = '#483253';
      ctx.globalAlpha = shade * opacity;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
}

function viewer(id, elevation, azimuth, count = 1) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  const container = canvas.parentElement;
  let renderer;
  const gl = canvas.getContext('webgl2', {alpha: true, antialias: true});
  if (gl) {
    renderer = new THREE.WebGLRenderer({canvas, context: gl});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  }
  const drawSoftware = renderer ? null : softwareRenderer(canvas);
  if (!renderer && !drawSoftware) return null;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfdf6ff, 0x9885ba, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(-3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbe99ff, 2.5);
  rim.position.set(3, 1, -3);
  scene.add(rim);

  const shadow = new THREE.CanvasTexture(Object.assign(document.createElement('canvas'), {width: 128, height: 128}));
  const ctx = shadow.image.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, '#613d8d88');
  gradient.addColorStop(1, '#613d8d00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  shadow.needsUpdate = true;
  const floor = mesh(scene, new THREE.PlaneGeometry(1.8, 1), new THREE.MeshBasicMaterial({map: shadow, transparent: true, depthWrite: false}), 0, 0, 0);
  floor.rotation.x = -Math.PI / 2;

  const original = new THREE.Group();
  const head = product(original);
  const heads = [];
  const headIndex = original.children.indexOf(head);
  for (let i = 0; i < count; i++) {
    const unit = i === 0 ? original : original.clone();
    unit.position.x = (i - (count - 1) / 2) * 1.48;
    scene.add(unit);
    const shadowPlane = i === 0 ? floor : floor.clone();
    shadowPlane.position.x = unit.position.x;
    if (i > 0) scene.add(shadowPlane);
    heads.push(unit.children[headIndex]);
  }
  const camera = new THREE.PerspectiveCamera(count > 1 ? 39 : 31, 1, .1, 30);
  const viewSize = new THREE.Vector2();
  function draw() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const radius = count > 1
      ? Math.max(10.2, 14.6 / camera.aspect)
      : Math.max(4.5, 3.15 / camera.aspect);
    camera.position.set(
      radius * Math.cos(elevation) * Math.sin(azimuth),
      1.02 + radius * Math.sin(elevation),
      radius * Math.cos(elevation) * Math.cos(azimuth)
    );
    camera.lookAt(0, 1.02, 0);
    if (renderer) {
      if (renderer.domElement.clientWidth !== width || renderer.domElement.clientHeight !== height ||
          renderer.getSize(viewSize).x !== width || viewSize.y !== height) {
        renderer.setSize(width, height, false);
      }
      renderer.render(scene, camera);
    } else {
      drawSoftware(scene, camera, width, height);
    }
  }
  canvas.hidden = false;
  container.querySelector('.fallback').hidden = true;
  new ResizeObserver(draw).observe(container);
  draw();
  return {
    draw,
    get angle() { return heads[0].rotation.y; },
    turn(angle) {
      for (const assembly of heads) assembly.rotation.y = angle;
      draw();
    },
    orbit(yaw, pitch) {
      azimuth += yaw;
      elevation = THREE.MathUtils.clamp(elevation + pitch, -1.49, 1.56);
      draw();
    },
    preset(yaw, pitch) { azimuth = yaw; elevation = pitch; draw(); }
  };
}

const orbitView = viewer('product-model', .11, .34);
if (orbitView) {
  const canvas = document.getElementById('product-model');
  const controls = document.querySelector('.product-view-controls');
  controls.hidden = false;
  document.querySelector('#view-caption').textContent = '드래그 또는 방향키로 제품 회전';
  const presets = {front: [0, 0], side: [Math.PI / 2, 0], top: [0, 1.56]};
  for (const button of controls.querySelectorAll('button')) {
    button.addEventListener('click', () => orbitView.preset(...presets[button.dataset.view]));
  }
  let drag;
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    drag = {x: event.clientX, y: event.clientY, id: event.pointerId};
  });
  canvas.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    orbitView.orbit((drag.x - event.clientX) * .009, (event.clientY - drag.y) * .009);
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  canvas.addEventListener('lostpointercapture', () => { drag = null; });
  const arrows = {ArrowLeft: [-.16, 0], ArrowRight: [.16, 0], ArrowUp: [0, .13], ArrowDown: [0, -.13]};
  canvas.addEventListener('keydown', event => {
    if (!Object.hasOwn(arrows, event.key)) return;
    event.preventDefault();
    orbitView.orbit(...arrows[event.key]);
  });
}

const stage = document.getElementById('stage');
const demoView = viewer('motion-model', .55, .75, 6);
if (demoView) {
  let frameRequest;
  new MutationObserver(() => {
    cancelAnimationFrame(frameRequest);
    const from = demoView.angle;
    const to = stage.dataset.open === 'true' ? Math.PI / 2 : 0;
    const start = performance.now();
    function rotate(now) {
      const t = reducedMotion.matches ? 1 : Math.min(1, (now - start) / 820);
      demoView.turn(THREE.MathUtils.lerp(from, to, t * t * (3 - 2 * t)));
      if (t < 1) frameRequest = requestAnimationFrame(rotate);
    }
    frameRequest = requestAnimationFrame(rotate);
  }).observe(stage, {attributes: true, attributeFilter: ['data-open']});
}
})();
