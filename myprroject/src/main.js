import {
  Color3,
  Color4,
  Engine,
  FreeCamera,
  GlowLayer,
  HemisphericLight,
  Layer,
  MeshBuilder,
  ParticleSystem,
  PointLight,
  Scene,
  StandardMaterial, Texture,
  Vector3
} from '@babylonjs/core';
import bazghoroImg from './bazghoro.jpg';
import spaceBg from './hello.jpg';
import './style.css';

const canvas = document.getElementById("bg");

// Force canvas to match full screen dimensions to fix background sizing
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
// Ensure high-resolution rendering on MacBook / Retina displays
engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

const createScene = () => {
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 1);

    // Camera
    const camera = new FreeCamera("camera1", new Vector3(0, 0, -30), scene);
    camera.setTarget(Vector3.Zero());

    // Lights
    const ambientLight = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.5;

    const pointLight = new PointLight("point", new Vector3(5, 5, -5), scene);
    pointLight.intensity = 0.8;

    // Background Layer (Space Space Theme)
    const bgLayer = new Layer("bgLayer", spaceBg, scene, true);

    // Dynamic Starfield
    for (let i = 0; i < 200; i++) {
        const star = MeshBuilder.CreateSphere("star", { diameter: 0.3 }, scene);
        const mat = new StandardMaterial("starMat", scene);
        mat.emissiveColor = Color3.White();
        mat.disableLighting = true;
        star.material = mat;
        
        star.position = new Vector3(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 60 - 10
        );
    }

    // --- BABYLON.JS CINEMATIC DEVELOPER PORTRAIT ---
    const gl = new GlowLayer("glow", scene);
    gl.intensity = 0.8;

    const portraitTex = new Texture(bazghoroImg, scene);

    // 1. The Avatar Cube (Like the first original rectangular block, but fully cinematic)
    const monolith = MeshBuilder.CreateBox("monolith", { width: 9.5, height: 9.5, depth: 9.5 }, scene);
    monolith.position = new Vector3(0, 0, -5); 
    
    const pbr = new StandardMaterial("monolithMat", scene);
    pbr.diffuseTexture = portraitTex;
    pbr.emissiveTexture = portraitTex;
    pbr.emissiveColor = new Color3(0.05, 0.05, 0.05); // Much dimmer inner glow to prevent washout
    pbr.specularColor = new Color3(0.3, 0.3, 0.3); // Softer reflections
    pbr.specularPower = 64;                        
    monolith.material = pbr;

    // Add High-Tech glowing neon edges to the cube!
    monolith.enableEdgesRendering();
    monolith.edgesWidth = 15.0;
    monolith.edgesColor = new Color4(0.0, 0.82, 1.0, 0.8);

    // 2. Focal Portrait Light
    const plLight = new PointLight("portraitLight", new Vector3(0, 5, -15), scene);
    plLight.diffuse = new Color3(1, 1, 1);
    plLight.intensity = 0.3; // Lowered intensity so the picture is clearer

    // 3. Ascending Atmospheric Data Sparks (Particle System)
    const particleSystem = new ParticleSystem("particles", 200, scene);
    particleSystem.particleTexture = new Texture("https://models.babylonjs.com/flare.png", scene); 
    
    particleSystem.emitter = monolith;
    
    // Confine particles to just in front and below the cube
    particleSystem.minEmitBox = new Vector3(-8, -12, -2);
    particleSystem.maxEmitBox = new Vector3(8, -12, -3);
    
    particleSystem.color1 = new Color4(1, 1, 1, 0.8);
    particleSystem.color2 = new Color4(0.0, 0.82, 1.0, 0.6);
    particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);
    
    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.15;
    
    particleSystem.minLifeTime = 2.0;
    particleSystem.maxLifeTime = 6.0;
    
    particleSystem.emitRate = 50;
    
    particleSystem.direction1 = new Vector3(-0.2, 2.0, 0);
    particleSystem.direction2 = new Vector3(0.2, 4.0, 0);
    
    particleSystem.gravity = new Vector3(0, 0.2, 0);
    
    particleSystem.start();

    // --- INTERACTIVITY AND ANIMATIONS ---
    let lastScrollTop = 0;
    const navbar = document.querySelector('nav');
    let floatTime = 0;

    scene.onBeforeRenderObservable.add(() => {
        const top = document.documentElement.scrollTop || document.body.scrollTop;
        const rectTop = document.body.getBoundingClientRect().top;

        if (navbar) {
            if (top > lastScrollTop && top > 60) {
                navbar.classList.add('nav-hidden');
            } else {
                navbar.classList.remove('nav-hidden');
            }
            lastScrollTop = top <= 0 ? 0 : top;
        }

        // Camera parallax mapping
        camera.position.z = (rectTop * 0.01) - 30;
        camera.position.x = (rectTop * 0.0002);
        
        // Continuous Cinematic Rotation (Like the original shape!)
        monolith.rotation.y += engine.getDeltaTime() * 0.0005;
        monolith.rotation.x += engine.getDeltaTime() * 0.0003;
        monolith.rotation.z += engine.getDeltaTime() * 0.0002;

        // Cinematic floating up and down
        floatTime += engine.getDeltaTime() * 0.001 * 1.5;
        monolith.position.y = Math.sin(floatTime) * 0.6;
    });

    return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize", () => {
    // Keep canvas perfectly synced to the screen size when resizing
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});  

