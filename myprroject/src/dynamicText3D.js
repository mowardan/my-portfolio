import {
  Color3,
  Color4,
  DynamicTexture,
  MeshBuilder,
  ParticleSystem,
  StandardMaterial,
  Texture,
  Vector3
} from '@babylonjs/core';

/**
 * Creates 3D text meshes with glow effects and particle systems
 */
export class Dynamic3DText {
  constructor(scene, glowLayer) {
    this.scene = scene;
    this.glowLayer = glowLayer;
    this.textMeshes = [];
    this.particles = [];
  }

  /**
   * Create a 3D text mesh with glowing effect
   * @param {string} text - Text to render in 3D
   * @param {Vector3} position - Position in 3D space
   * @param {number} size - Size of the text
   * @param {Color3} color - Color of the text
   * @param {string} id - Unique identifier for the text
   */
  createGlow3DText(text, position, size, color, id) {
    // Create a plane for the text texture
    const textPlane = MeshBuilder.CreatePlane(
      `textPlane_${id}`,
      { width: size * 2.5, height: size },
      this.scene
    );

    // Create dynamic texture for text
    const dynamicTexture = new DynamicTexture(`texture_${id}`, 1024, this.scene);
    const ctx = dynamicTexture.getContext();

    // Draw text on the dynamic texture
    ctx.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
    ctx.font = 'Bold 120px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 512);
    ctx.strokeStyle = `rgb(${Math.min(color.r + 0.3, 1) * 255}, ${Math.min(color.g + 0.3, 1) * 255}, ${Math.min(color.b + 0.3, 1) * 255})`;
    ctx.lineWidth = 4;
    ctx.strokeText(text, 512, 512);
    dynamicTexture.update();

    // Create material with the text texture
    const textMaterial = new StandardMaterial(`textMat_${id}`, this.scene);
    textMaterial.emissiveTexture = dynamicTexture;
    textMaterial.emissiveColor = color;
    textMaterial.backFaceCulling = false;

    textPlane.material = textMaterial;
    textPlane.position = position;

    // Add to glow layer for that premium effect
    this.glowLayer.addIncludedOnlyMesh(textPlane);

    // Animate the text plane
    this._animateTextPlane(textPlane);

    this.textMeshes.push(textPlane);
    return textPlane;
  }

  /**
   * Animate the 3D text with floating and rotation
   */
  _animateTextPlane(plane) {
    const startPos = plane.position.clone();
    let time = 0;

    this.scene.registerBeforeRender(() => {
      time += 0.016;
      // Gentle floating animation
      plane.position.y = startPos.y + Math.sin(time * 0.5) * 0.5;
      // Subtle rotation
      plane.rotation.z = Math.sin(time * 0.3) * 0.1;
    });
  }

  /**
   * Create a particle system around text
   */
  createTextParticles(position, color, id) {
    const particleSystem = new ParticleSystem(`particles_${id}`, 100, this.scene);

    // Use a simple sphere as emitter
    const emitter = MeshBuilder.CreateSphere(`emitter_${id}`, { diameter: 0.5 }, this.scene);
    emitter.position = position;
    emitter.isVisible = false;

    particleSystem.emitter = emitter;

    // Particle texture
    try {
      particleSystem.particleTexture = new Texture(
        'https://models.babylonjs.com/flare.png',
        this.scene
      );
    } catch (e) {
      console.warn('Particle texture not loaded, using white particles');
    }

    // Configure particle behavior
    particleSystem.minEmitBox = new Vector3(-1, -1, -1);
    particleSystem.maxEmitBox = new Vector3(1, 1, 1);

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;

    particleSystem.minLifeTime = 1;
    particleSystem.maxLifeTime = 3;

    particleSystem.emitRate = 20;

    particleSystem.gravity = new Vector3(0, -0.5, 0);
    particleSystem.direction1 = new Vector3(-2, 3, -2);
    particleSystem.direction2 = new Vector3(2, 5, 2);

    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;

    particleSystem.addColorGradient(0, new Color4(color.r, color.g, color.b, 0.8));
    particleSystem.addColorGradient(0.5, new Color4(color.r, color.g, color.b, 0.4));
    particleSystem.addColorGradient(1, new Color4(color.r, color.g, color.b, 0));

    particleSystem.start();

    this.particles.push(particleSystem);
    return { particleSystem, emitter };
  }

  /**
   * Dispose all text meshes and particles
   */
  dispose() {
    this.textMeshes.forEach((mesh) => mesh.dispose());
    this.particles.forEach((ps) => ps.dispose());
    this.textMeshes = [];
    this.particles = [];
  }
}

/**
 * Handles intersection detection and text visibility
 */
export class TextVisibilityController {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.visibleTexts = new Set();
  }

  /**
   * Check which section is in viewport and update 3D text visibility
   */
  updateTextVisibility(textElements) {
    textElements.forEach(({ element, textMesh, id }) => {
      const rect = element.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.2;

      if (isInViewport && !this.visibleTexts.has(id)) {
        textMesh.isVisible = true;
        this.visibleTexts.add(id);
      } else if (!isInViewport && this.visibleTexts.has(id)) {
        textMesh.isVisible = false;
        this.visibleTexts.delete(id);
      }
    });
  }
}
