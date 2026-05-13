import * as THREE from 'three';
import { COLORS } from './utils/constants.js';

const TARGET_STATE = { IDLE: 'idle', SPAWNING: 'spawning', ALIVE: 'alive', HIT: 'hit', DEAD: 'dead' };

export class Target {
  constructor({ position, radius = 0.35, color = COLORS.target, lifetime = 2.0 }) {
    this.state = TARGET_STATE.IDLE;
    this.radius = radius;
    this.lifetime = lifetime;
    this.age = 0;
    this.spawnedAt = 0;
    this.spawnAnim = 0;
    this.hitAnim = 0;

    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.1,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.4,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(position);
    this.mesh.scale.set(0.01, 0.01, 0.01);
    this.mesh.castShadow = true;
    this.mesh.userData.targetRef = this;

    // Outer ring
    const ringGeo = new THREE.TorusGeometry(radius * 1.2, radius * 0.12, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.2,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.7,
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.mesh.add(this.ring);
  }

  spawn(timestamp) {
    this.state = TARGET_STATE.SPAWNING;
    this.spawnAnim = 0;
    this.age = 0;
    this.spawnedAt = timestamp || performance.now();
  }

  hit() {
    if (this.state !== TARGET_STATE.ALIVE) return;
    this.state = TARGET_STATE.HIT;
    this.hitAnim = 0;
    this.mesh.material.color.set(COLORS.targetHit);
    this.mesh.material.emissive.set(COLORS.targetHit);
    this.mesh.material.emissiveIntensity = 1.5;
  }

  update(dt) {
    if (this.state === TARGET_STATE.DEAD || this.state === TARGET_STATE.IDLE) return;

    if (this.state === TARGET_STATE.SPAWNING) {
      this.spawnAnim += dt * 6;
      if (this.spawnAnim >= 1) {
        this.spawnAnim = 1;
        this.state = TARGET_STATE.ALIVE;
      }
      const scale = this._easeOutBack(this.spawnAnim);
      this.mesh.scale.setScalar(scale);
      this.ring.scale.setScalar(1);
    }

    if (this.state === TARGET_STATE.ALIVE) {
      this.age += dt;
      if (this.age > this.lifetime) {
        this.despawn();
      }
      // Pulse ring
      const pulse = 1 + Math.sin(this.age * 4) * 0.05;
      this.ring.scale.setScalar(pulse);
    }

    if (this.state === TARGET_STATE.HIT) {
      this.hitAnim += dt * 10;
      const scale = Math.max(0, 1 - this.hitAnim);
      this.mesh.scale.setScalar(scale);
      this.mesh.material.opacity = 1 - this.hitAnim;
      this.mesh.material.transparent = true;
      if (this.hitAnim >= 1) {
        this.state = TARGET_STATE.DEAD;
      }
    }
  }

  despawn() {
    this.state = TARGET_STATE.DEAD;
  }

  isAlive() {
    return this.state === TARGET_STATE.ALIVE || this.state === TARGET_STATE.SPAWNING;
  }

  isDead() {
    return this.state === TARGET_STATE.DEAD;
  }

  dispose() {
    if (this.ring) {
      if (this.ring.geometry) this.ring.geometry.dispose();
      if (this.ring.material) this.ring.material.dispose();
    }
    if (this.mesh) {
      if (this.mesh.material) this.mesh.material.dispose();
      if (this.mesh.geometry) this.mesh.geometry.dispose();
    }
  }

  _easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
}
