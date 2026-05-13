import * as THREE from 'three';
import { COLORS } from './utils/constants.js';

const POOL_SIZE = 120;

class Particle {
  constructor() {
    const geo = new THREE.SphereGeometry(0.04, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.visible = false;
    this.velocity = new THREE.Vector3();
    this.life = 0;
    this.age = 0;
    this.alive = false;
  }

  init(position, velocity, color, size, life) {
    this.mesh.position.copy(position);
    this.mesh.scale.setScalar(size / 0.04);
    this.mesh.material.color.set(color);
    this.mesh.material.opacity = 1;
    this.mesh.visible = true;
    this.velocity.copy(velocity);
    this.life = life;
    this.age = 0;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;
    this.age += dt;
    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.y += this.velocity.y * dt;
    this.mesh.position.z += this.velocity.z * dt;
    this.velocity.y += -9.8 * dt;
    const t = this.age / this.life;
    this.mesh.material.opacity = Math.max(0, 1 - t);
    this.mesh.scale.setScalar(Math.max(0.01, (1 - t) * (this.mesh.scale.x * 0.04)));
    if (this.age >= this.life) {
      this.alive = false;
      this.mesh.visible = false;
    }
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = new Particle();
      this.scene.add(p.mesh);
      this.pool.push(p);
    }
  }

  emit(position, count = 8, color = COLORS.targetHit) {
    let emitted = 0;
    for (const p of this.pool) {
      if (!p.alive && emitted < count) {
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3 + 1,
          (Math.random() - 0.5) * 3,
        );
        const size = 0.03 + Math.random() * 0.04;
        const life = 0.3 + Math.random() * 0.4;
        p.init(position, velocity, color, size, life);
        emitted++;
      }
      if (emitted >= count) break;
    }
  }

  update(dt) {
    for (const p of this.pool) {
      if (p.alive) p.update(dt);
    }
  }

  clear() {
    for (const p of this.pool) {
      p.alive = false;
      p.mesh.visible = false;
      p.mesh.material.opacity = 0;
    }
  }

  dispose() {
    for (const p of this.pool) {
      p.dispose();
      this.scene.remove(p.mesh);
    }
    this.pool = [];
  }
}

export class ScreenShake {
  constructor(camera) {
    this.camera = camera;
    this.intensity = 0;
    this.duration = 0;
    this.elapsed = 0;
    this.originalPosition = camera.position.clone();
  }

  trigger(intensity = 0.3, duration = 0.15) {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = duration;
    this.elapsed = 0;
  }

  update(dt) {
    if (this.elapsed >= this.duration) {
      this.intensity = 0;
      return;
    }
    this.elapsed += dt;
    const decay = 1 - this.elapsed / this.duration;
    const shakeX = (Math.random() - 0.5) * 2 * this.intensity * decay;
    const shakeY = (Math.random() - 0.5) * 2 * this.intensity * decay;
    this.camera.position.x = this.originalPosition.x + shakeX;
    this.camera.position.y = this.originalPosition.y + shakeY;
  }

  reset() {
    this.camera.position.copy(this.originalPosition);
    this.intensity = 0;
    this.elapsed = this.duration;
  }
}
