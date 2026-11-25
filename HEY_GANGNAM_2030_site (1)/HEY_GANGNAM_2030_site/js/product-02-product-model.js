(() => {

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const material = (color, roughness = .35, metalness = .12) =>
  new THREE.MeshStandardMaterial({color, roughness, metalness});
const aluminum = material(0xfaf8fb);
const frame = material(0xd49ac6, .22, .18);
const seam = material(0xb0a8b4);
const glow = new THREE.MeshStandardMaterial({color: 0xffd0ef, emissive: 0xf28bd0, emissiveIntensity: 1.35});
const glass = new THREE.MeshPhysicalMaterial({
  color: 0xdcc1e9, side: THREE.DoubleSide, roughness: .38,
  transparent: true, opacity: .49, depthWrite: false
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
  const outer = roundedRect(width, height, .021);
  const inner = roundedRect(width - 2 * thickness, height - 2 * thickness, .01);
  outer.holes.push(new THREE.Path(inner.getPoints().reverse()));
  return new THREE.ExtrudeGeometry(outer, {depth, bevelEnabled: false, curveSegments: 10});
}

function product(scene) {
  // Match the front elevation: 0.43 overall width and 0.51 panel height per unit of height.
  const pivot = .923;
  const postRadius = .082;
  cylinder(scene, .102, .134, .034, aluminum, .017);
  cylinder(scene, postRadius, postRadius, pivot - .031, aluminum, (pivot + .031) / 2);
  cylinder(scene, .080, .080, .008, seam, pivot);
  const head = new THREE.Group();
  head.position.y = pivot;
  scene.add(head);
  cylinder(head, postRadius, postRadius, 1.091, aluminum, .551);
  cylinder(head, .078, postRadius, .013, aluminum, 1.102);
  cylinder(head, .069, .078, .0085, aluminum, 1.113);

  const panelWidth = .328;
  const panelHeight = 1.048;
  const panelOffset = .278;
  const panelCenter = .533;
  const edge = ringGeometry(panelWidth, panelHeight, .009, .020);
  const led = ringGeometry(panelWidth - .009, panelHeight - .009, .0045, .003);
  const insert = new THREE.ShapeGeometry(roundedRect(panelWidth - .016, panelHeight - .016, .012));
  const mount = new THREE.CylinderGeometry(.007, .007, .071, 12);
  mount.rotateZ(Math.PI / 2);
  const mountSurface = material(0xdcd8de, .24, .45);
  for (const direction of [-1, 1]) {
    const x = panelOffset * direction;
    mesh(head, edge, frame, x, panelCenter, -.010);
    mesh(head, led, glow, x, panelCenter, .010);
    mesh(head, led, glow, x, panelCenter, -.013);
    mesh(head, insert, glass, x, panelCenter, 0);
    for (const y of [.136, .342, .513, .681, .849, .984]) {
      mesh(head, mount, mountSurface, direction * .103, y, 0);
    }
  }
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
      const color = surface.emissiveIntensity > 1 ? '#fac1e7' : surface.color.getStyle();
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
        const shade = (surface.isMeshBasicMaterial || surface.emissiveIntensity > 1) ? 0 : .33 * (1 - Math.abs(normal.dot(light)));
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

function addPeople(scene) {
  const torso = new THREE.Shape();
  const outline = [
    [-.06,1.48],[-.21,1.43],[-.27,1.12],[-.27,.9],[-.20,.9],[-.16,1.19],
    [-.14,.79],[-.2,.06],[-.08,.06],[.01,.70],[.13,.06],[.25,.06],[.15,.79],
    [.15,1.19],[.22,.92],[.29,.92],[.26,1.17],[.20,1.43],[.06,1.48]
  ];
  torso.moveTo(...outline[0]);
  for (const point of outline.slice(1)) torso.lineTo(...point);
  torso.closePath();
  const head = new THREE.Shape();
  head.absellipse(0, 1.63, .106, .127, 0, Math.PI * 2);
  const silhouette = new THREE.ShapeGeometry([torso, head], 12);
  const surface = new THREE.MeshBasicMaterial({
    color: 0x645382, side: THREE.DoubleSide, transparent: true, opacity: .32, depthWrite: false
  });
  const positions = [
    [-4.9,-1.14],[-3.35,-1.74],[-1.95,-1.05],[-.62,-1.55],[.88,-1.16],[2.65,-1.63],[4.2,-1.03],
    [-4.55,1.24],[-2.45,1.55],[-.95,1.08],[1.2,1.52],[3.4,1.18],[4.65,1.5]
  ];
  return positions.map(([x,z], index) => {
    const person = mesh(scene, silhouette, surface, x, 0, z);
    person.rotation.y = .27 + (index % 4) * .24;
    person.scale.setScalar(.87 + (index % 5) * .038);
    const start = person.position.clone();
    const heading = person.rotation.y;
    return {person, start, heading};
  });
}

function viewer(id, elevation, azimuth, count = 1) {
  const canvas = document.getElementById(id);
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
    unit.position.x = (i - (count - 1) / 2) * .99;
    scene.add(unit);
    const shadowPlane = i === 0 ? floor : floor.clone();
    shadowPlane.position.x = unit.position.x;
    if (i > 0) scene.add(shadowPlane);
    heads.push(unit.children[headIndex]);
  }
  const people = count > 1 ? addPeople(scene) : [];
  const camera = new THREE.PerspectiveCamera(count > 1 ? 39 : 31, 1, .1, 30);
  const viewSize = new THREE.Vector2();
  function draw() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const radius = count > 1
      ? Math.max(13.5, 19.6 / camera.aspect)
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
    draw, people,
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

const orbitView = viewer('product-model', .14, .54);
if (orbitView) {
  const canvas = document.getElementById('product-model');
  const controls = document.querySelector('.product-view-controls');
  controls.hidden = false;
  document.querySelector('#view-caption').textContent = '드래그 또는 방향키로 제품 회전';
  const presets = {quarter: [.54, .14], front: [0, 0], side: [Math.PI / 2, 0], top: [0, 1.56]};
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
const demoView = viewer('motion-model', .49, .65, 12);
if (demoView) {
  const rotationDuration = 820;
  const walkDuration = 2200;
  const stagger = 230;
  const walkers = [0, 2, 3, 4, 6].map(index => {
    const walker = demoView.people[index];
    // The divider centers sit at half-steps, so each full step falls in a gap.
    const gapX = Math.round(walker.start.x / .99) * .99;
    return {...walker, gapX};
  });
  let frameRequest;

  function placeWalkers(elapsed) {
    return walkers.map(({person, start, heading, gapX}, index) => {
      const phase = THREE.MathUtils.clamp((elapsed - index * stagger) / walkDuration, 0, 1);
      const pace = phase * phase * (3 - 2 * phase);
      const approach = Math.min(1, pace / .28);
      const departure = Math.max(0, (pace - .78) / .22);
      person.position.x = THREE.MathUtils.lerp(start.x, gapX, approach) + .28 * departure;
      person.position.z = THREE.MathUtils.lerp(start.z, .92 + (index % 2) * .25, pace);
      const walking = phase > 0 && phase < 1;
      const stride = phase * Math.PI * 12;
      person.position.y = walking ? .032 * Math.abs(Math.sin(stride)) : 0;
      person.rotation.y = heading;
      person.rotation.z = walking ? .026 * Math.sin(stride) : 0;
      return phase;
    }).some(phase => phase < 1);
  }

  new MutationObserver(() => {
    cancelAnimationFrame(frameRequest);
    const opening = stage.dataset.open === 'true';
    const from = demoView.angle;
    const to = opening ? Math.PI / 2 : 0;
    const start = performance.now();
    const skipMotion = reducedMotion.matches;

    function animate(now) {
      const elapsed = now - start;
      const t = skipMotion ? 1 : THREE.MathUtils.clamp(elapsed / rotationDuration, 0, 1);
      const walkTime = skipMotion ? Infinity : elapsed - rotationDuration - 180;
      const walkingPending = placeWalkers(opening ? walkTime : 0);
      demoView.turn(THREE.MathUtils.lerp(from, to, t * t * (3 - 2 * t)));
      if (t < 1 || (opening && walkingPending)) {
        frameRequest = requestAnimationFrame(animate);
      }
    }

    frameRequest = requestAnimationFrame(animate);
  }).observe(stage, {attributes: true, attributeFilter: ['data-open']});
}

})();
