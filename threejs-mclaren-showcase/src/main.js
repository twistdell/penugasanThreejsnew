
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

// ==========================================
// 1. SETUP HTML DAN TAMPILAN
// ==========================================

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

let container = document.getElementById('canvas-container');

if (!container) {
  container = document.createElement('div');
  container.id = 'canvas-container';
  document.body.appendChild(container);
}

Object.assign(container.style, {
  position: 'fixed',
  inset: '0',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  background: '#080a12'
});

function createElement(id, styles = {}) {
  let element = document.getElementById(id);

  if (!element) {
    element = document.createElement('div');
    element.id = id;
    document.body.appendChild(element);
  }

  Object.assign(element.style, styles);
  return element;
}

const loading = createElement('loading', {
  position: 'fixed',
  inset: '0',
  zIndex: '20',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: '12px',
  background: '#080a12',
  color: '#ffffff',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  letterSpacing: '2px',
  transition: 'opacity 0.5s'
});

loading.innerHTML = `
  <div style="font-size:12px;color:#e63946;letter-spacing:5px">
    MCLAREN
  </div>
  <div>INITIALIZING SHOWROOM...</div>
  <div style="width:160px;height:3px;background:#252938">
    <div style="width:40%;height:100%;background:#e63946"></div>
  </div>
`;

// ==========================================
// 2. SCENE, CAMERA, DAN RENDERER
// ==========================================

const scene = new THREE.Scene();
scene.background = new THREE.Color('#080a12');
scene.fog = new THREE.Fog('#080a12', 18, 65);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);

camera.position.set(8, 4.5, 9);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

// ==========================================
// 3. CAMERA CONTROLS
// ==========================================

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 22;
controls.maxPolarAngle = Math.PI / 2.02;
controls.target.set(0, 1, 0);

// ==========================================
// 4. LIGHTING
// ==========================================

const ambientLight = new THREE.AmbientLight('#ffffff', 1.2);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight('#ffffff', 3);
keyLight.position.set(5, 10, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const redLight = new THREE.PointLight('#ff2638', 35, 18);
redLight.position.set(-5, 3, 1);
scene.add(redLight);

const blueLight = new THREE.PointLight('#247bff', 30, 18);
blueLight.position.set(5, 3, -3);
scene.add(blueLight);

const rimLight = new THREE.SpotLight(
  '#ffffff',
  45,
  30,
  Math.PI / 5,
  0.5
);

rimLight.position.set(0, 9, -5);
rimLight.target.position.set(0, 0, 0);
scene.add(rimLight);
scene.add(rimLight.target);

// ==========================================
// 5. SHOWROOM FLOOR DAN PODIUM
// ==========================================

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({
    color: '#10131d',
    roughness: 0.35,
    metalness: 0.45
  })
);

floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.04;
floor.receiveShadow = true;
scene.add(floor);

const podiumMaterial = new THREE.MeshStandardMaterial({
  color: '#181b27',
  metalness: 0.65,
  roughness: 0.28
});

const podium = new THREE.Mesh(
  new THREE.CylinderGeometry(3.6, 3.9, 0.25, 96),
  podiumMaterial
);

podium.position.y = 0.08;
podium.receiveShadow = true;
podium.castShadow = true;
scene.add(podium);

const ring = new THREE.Mesh(
  new THREE.TorusGeometry(3.55, 0.025, 12, 128),
  new THREE.MeshBasicMaterial({ color: '#ff2638' })
);

ring.rotation.x = Math.PI / 2;
ring.position.y = 0.22;
scene.add(ring);

// Decorative floor grid
const grid = new THREE.GridHelper(100, 100, '#252b40', '#171c2b');
grid.position.y = -0.025;
scene.add(grid);

// ==========================================
// 6. DECORATIVE PARTICLES
// ==========================================

const particleCount = 500;
const particlePositions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  particlePositions[i * 3] = (Math.random() - 0.5) * 45;
  particlePositions[i * 3 + 1] = Math.random() * 12;
  particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 45;
}

const particleGeometry = new THREE.BufferGeometry();

particleGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(particlePositions, 3)
);

const particleMaterial = new THREE.PointsMaterial({
  color: '#e63946',
  size: 0.035,
  transparent: true,
  opacity: 0.7
});

const particles = new THREE.Points(
  particleGeometry,
  particleMaterial
);

scene.add(particles);

// ==========================================
// 7. LOAD MODEL MCLAREN
// ==========================================

const loader = new GLTFLoader();

let car = null;
let carBodyMaterials = [];
let cinematicMode = false;
let currentColor = '#e63946';

function getMaterials(material) {
  if (!material) return [];
  return Array.isArray(material) ? material : [material];
}

function loadCar() {
  loader.load(
    '/models/mclaren.glb',

    (gltf) => {
      car = gltf.scene;

      car.scale.setScalar(1);
      car.position.set(0, 0.25, 0);

      car.traverse((child) => {
        if (!child.isMesh) return;

        child.castShadow = true;
        child.receiveShadow = true;

        const materials = getMaterials(child.material);

        materials.forEach((material) => {
          if (!material) return;

          const materialName = (
            material.name || ''
          ).toLowerCase();

          if (
            materialName.includes('body') ||
            materialName.includes('paint') ||
            materialName.includes('carpaint')
          ) {
            carBodyMaterials.push(material);
          }
        });
      });

      scene.add(car);

      // Center the model and fit it to the showroom
      const box = new THREE.Box3().setFromObject(car);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      car.position.x -= center.x;
      car.position.z -= center.z;
      car.position.y -= box.min.y;
      car.position.y += 0.25;

      const maxDimension = Math.max(size.x, size.y, size.z);

      if (maxDimension > 0) {
        const scale = 6 / maxDimension;
        car.scale.setScalar(scale);
      }

      // Reposition the car after scaling
      const updatedBox = new THREE.Box3().setFromObject(car);
      car.position.y -= updatedBox.min.y - 0.25;

      loading.style.opacity = '0';

      setTimeout(() => {
        loading.style.display = 'none';
      }, 550);

      console.log('McLaren model loaded successfully!');
    },

    (progress) => {
      if (progress.total > 0) {
        const percent = Math.round(
          (progress.loaded / progress.total) * 100
        );

        loading.innerHTML = `
          <div style="color:#e63946;letter-spacing:4px">
            MCLAREN
          </div>
          <div>LOADING MODEL ${percent}%</div>
        `;
      }
    },

    (error) => {
      console.error('Failed to load McLaren model:', error);

      loading.innerHTML = `
        <div style="color:#ff5964;font-size:16px">
          MODEL NOT FOUND
        </div>
        <div style="max-width:300px;text-align:center;line-height:1.7">
          Pastikan file berada di
          <b>public/models/mclaren.glb</b>
          lalu refresh halaman.
        </div>
      `;

      const retryButton = document.createElement('button');
      retryButton.textContent = 'RETRY';
      Object.assign(retryButton.style, buttonStyle);
      retryButton.onclick = () => window.location.reload();
      loading.appendChild(retryButton);
    }
  );
}

loadCar();

// ==========================================
// 8. USER INTERFACE
// ==========================================

const buttonStyle = {
  padding: '10px 14px',
  background: 'rgba(20, 23, 35, 0.92)',
  color: '#ffffff',
  border: '1px solid #45495a',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '11px',
  letterSpacing: '1px',
  fontFamily: 'Arial, sans-serif'
};

const panel = createElement('showroom-controls', {
  position: 'fixed',
  top: '20px',
  right: '20px',
  zIndex: '10',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '14px',
  maxWidth: 'calc(100vw - 68px)',
  background: 'rgba(8, 10, 18, 0.86)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  backdropFilter: 'blur(12px)',
  color: '#ffffff',
  fontFamily: 'Arial, sans-serif'
});

panel.innerHTML = `
  <div style="font-size:12px;letter-spacing:3px;color:#ff5964">
    MCLAREN <span style="color:white">/ NEXUS</span>
  </div>
  <div style="font-size:10px;color:#9ba3b7">
    INTERACTIVE 3D SHOWROOM
  </div>
`;

function addButton(label, onClick) {
  const button = document.createElement('button');
  button.textContent = label;
  Object.assign(button.style, buttonStyle);
  button.addEventListener('click', onClick);

  button.addEventListener('mouseenter', () => {
    button.style.borderColor = '#e63946';
  });

  button.addEventListener('mouseleave', () => {
    button.style.borderColor = '#45495a';
  });

  panel.appendChild(button);
  return button;
}

function addSectionLabel(text) {
  const label = document.createElement('div');
  label.textContent = text;
  label.style.cssText =
    'font-size:10px;color:#9ba3b7;letter-spacing:2px;margin-top:5px';

  panel.appendChild(label);
}

addSectionLabel('BODY COLOR');

const colorRow = document.createElement('div');

colorRow.style.cssText =
  'display:flex;gap:8px;flex-wrap:wrap';

panel.appendChild(colorRow);

const colors = [
  { name: 'Papaya Orange', color: '#ff5900' },
  { name: 'Racing Red', color: '#e63946' },
  { name: 'Midnight Black', color: '#20232d' },
  { name: 'Ice Silver', color: '#c8d0da' },
  { name: 'Electric Blue', color: '#1769ff' }
];

colors.forEach(({ name, color }) => {
  const swatch = document.createElement('button');

  swatch.title = name;
  swatch.setAttribute('aria-label', name);

  Object.assign(swatch.style, {
    width: '27px',
    height: '27px',
    borderRadius: '50%',
    border: '2px solid #ffffff',
    background: color,
    cursor: 'pointer'
  });

  swatch.addEventListener('click', () => {
    currentColor = color;

    carBodyMaterials.forEach((material) => {
      if (material.color) {
        material.color.set(color);
      }
    });
  });

  colorRow.appendChild(swatch);
});

addSectionLabel('CAMERA VIEW');

addButton('FRONT VIEW', () => {
  camera.position.set(0, 2.5, 10);
  controls.target.set(0, 1, 0);
});

addButton('SIDE VIEW', () => {
  camera.position.set(10, 2.5, 0);
  controls.target.set(0, 1, 0);
});

addButton('TOP VIEW', () => {
  camera.position.set(0, 11, 0.1);
  controls.target.set(0, 0, 0);
});

addSectionLabel('SHOWROOM');

addButton('TOGGLE LIGHTING', () => {
  const isBright = ambientLight.intensity < 1.5;

  ambientLight.intensity = isBright ? 2 : 0.6;
  keyLight.intensity = isBright ? 4 : 1.2;
  redLight.intensity = isBright ? 15 : 45;
  blueLight.intensity = isBright ? 15 : 40;
});

addButton('CINEMATIC MODE', () => {
  cinematicMode = !cinematicMode;
  controls.enabled = !cinematicMode;

  if (cinematicMode) {
    camera.position.set(8, 3, 8);
    controls.target.set(0, 0.8, 0);
  }
});

addButton('RESET CAMERA', () => {
  cinematicMode = false;
  controls.enabled = true;

  camera.position.set(8, 4.5, 9);
  controls.target.set(0, 1, 0);
});

// ==========================================
// 9. FOOTER INFORMATION
// ==========================================

const footer = createElement('showroom-footer', {
  position: 'fixed',
  left: '20px',
  bottom: '20px',
  zIndex: '5',
  color: '#c2c7d4',
  fontFamily: 'Arial, sans-serif',
  fontSize: '10px',
  letterSpacing: '2px',
  lineHeight: '1.8',
  pointerEvents: 'none'
});

footer.innerHTML = `
  <div style="color:#ff5964">PERFORMANCE REDEFINED</div>
  <div>3D EXPERIENCE / THREE.JS</div>
  <div>DRAG TO ROTATE · SCROLL TO ZOOM</div>
`;

// ==========================================
// 10. RESPONSIVE RESIZE
// ==========================================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );
});

// ==========================================
// 11. ANIMATION LOOP
// ==========================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  controls.update();

  // Subtle showroom animation
  ring.material.opacity = 0.7 + Math.sin(elapsed * 2) * 0.2;
  ring.material.transparent = true;

  particles.rotation.y = elapsed * 0.015;

  if (cinematicMode && car) {
    car.rotation.y = Math.sin(elapsed * 0.25) * 0.35;
  }

  renderer.render(scene, camera);
}

animate();

// ==========================================
// 12. CLEANUP
// ==========================================

window.addEventListener('beforeunload', () => {
  renderer.dispose();
  controls.dispose();
  particleGeometry.dispose();
  particleMaterial.dispose();
});