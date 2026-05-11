import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import bazghoroImg from './bazghoro.jpg';
import spaceBg from './hello.jpg';
import moonImg from './moon.jpg';
import normalImg from './normal.jpg';
import './style.css';


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas : document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

renderer.render(scene, camera);

// Torus removed

const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

const lightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(gridHelper);
scene.add(lightHelper);

const controls = new OrbitControls(camera, renderer.domElement);

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
  
  star.position.set(x, y, z);
  scene.add(star);
}

Array(200).fill().forEach(addStar); 

const spaceTexture = new THREE.TextureLoader().load(spaceBg);
scene.background = spaceTexture;

// avatar
const bazghoro = new THREE.TextureLoader().load(bazghoroImg);
const bazghoroMesh = new THREE.Mesh(
  new THREE.BoxGeometry(15, 15, 15), // Made the avatar box slightly bigger
  new THREE.MeshBasicMaterial({ map: bazghoro })
);

// moon

const moonTexture = new THREE.TextureLoader().load(moonImg);
const normalTexture = new THREE.TextureLoader().load(normalImg);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    normalMap: normalTexture
  })
);

// moon.position.set(-10, 0, 10); // Changed Z from 30 to 10 so it's in front of the camera


scene.add(bazghoroMesh);
scene.add(moon);

moon.position.z = 30;
moon.position.setX(-10);


let lastScrollTop = 0;
const navbar = document.querySelector('nav');

function moveCamera() {
  const currentScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const t = document.body.getBoundingClientRect().top;
  
  // Hide navbar on scroll down, show on scroll up
  if (navbar) {
    if (currentScrollTop > lastScrollTop && currentScrollTop > 60) {
      // Scrolling down
      navbar.classList.add('nav-hidden');
    } else {
      // Scrolling up
      navbar.classList.remove('nav-hidden');
    }
    lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop; 
  }

  moon.rotation.x += 0.05;
  moon.rotation.y += 0.075;
  moon.rotation.z += 0.05;

  bazghoroMesh.rotation.y += 0.01;
  bazghoroMesh.rotation.z += 0.01;

  camera.position.z = t * -0.01 + 30; // Adjusted to keep the camera in front of the moon
  camera.position.x = t * -0.0002 - 10; // Adjusted to keep the camera centered on the moon
  camera.rotation.y = t * -0.0002; // Optional: add a slight rotation for effect
}

document.body.onscroll = moveCamera;
moveCamera();

function animate() {
  requestAnimationFrame(animate);

  // Added passive animations for greatness!
  bazghoroMesh.rotation.x += 0.005;
  bazghoroMesh.rotation.y += 0.005;
  moon.rotation.y += 0.002;

  controls.update();
  renderer.render(scene, camera);
}

// Ensure the canvas fully resizes with the browser window
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();  

