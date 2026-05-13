import * as THREE from 'three';
import { Target } from './Target.js';
import { COLORS } from './utils/constants.js';

const MAX_INSTANCES = 50;

export class TargetManager {
  constructor(scene) {
    this.scene = scene;
    this.targets = [];
    this.modeInstance = null;
    this.difficulty = null;
    this.lastSpawnTime = -Infinity;

    this._useInstanced = false;
    this._instancedMesh = null;
    this._instanceData = []; // per-instance { alive, age, lifetime, spawnAnim, hitAnim, state, spawnedAt, targetRef }
    this._dummy = new THREE.Object3D();
    this._initInstanced();
  }

  _initInstanced() {
    const geo = new THREE.SphereGeometry(0.35, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.target,
      roughness: 0.3,
      metalness: 0.1,
      emissive: new THREE.Color(COLORS.target),
      emissiveIntensity: 0.4,
    });
    this._instancedMesh = new THREE.InstancedMesh(geo, mat, MAX_INSTANCES);
    this._instancedMesh.castShadow = true;
    this._instancedMesh.count = 0;
    this._instancedMesh.visible = false;
    this._instancedMesh.frustumCulled = false;
    this.scene.add(this._instancedMesh);

    // Initialize instance matrices offscreen
    for (let i = 0; i < MAX_INSTANCES; i++) {
      this._dummy.position.set(0, -999, 0);
      this._dummy.scale.set(0, 0, 0);
      this._dummy.updateMatrix();
      this._instancedMesh.setMatrixAt(i, this._dummy.matrix);
      this._instanceData.push({
        alive: false, age: 0, lifetime: 2,
        spawnAnim: 0, hitAnim: 0, spawnedAt: 0,
        targetRef: null,
      });
    }
    this._instancedMesh.instanceMatrix.needsUpdate = true;
  }

  setMode(modeInstance, difficulty) {
    this.modeInstance = modeInstance;
    this.difficulty = difficulty;
    this.clearAll();
    this.lastSpawnTime = -Infinity;
    const config = modeInstance?.getSpawnConfig();
    this._useInstanced = !!(config && config.useInstanced);
  }

  spawnWave(config, elapsed) {
    if (!config) return;
    this.lastSpawnTime = elapsed;

    const positions = config.positions;
    if (!positions || positions.length === 0) return;

    const size = config.size || 0.35;
    const lifetime = config.lifetime || 2.0;
    const color = config.color || COLORS.target;

    if (this._useInstanced) {
      this._spawnInstanced(positions, size, lifetime, color);
    } else {
      this._spawnIndividual(positions, size, lifetime, color);
    }
  }

  _spawnInstanced(positions, size, lifetime, color) {
    this._instancedMesh.visible = true;
    this._instancedMesh.material.color.set(color);
    this._instancedMesh.material.emissive.set(color);

    const now = performance.now();

    for (let i = 0; i < Math.min(positions.length, MAX_INSTANCES); i++) {
      const pos = positions[i];
      this._dummy.position.set(pos.x, pos.y, pos.z);
      this._dummy.quaternion.identity();
      this._dummy.scale.set(0.01, 0.01, 0.01);
      this._dummy.updateMatrix();
      this._instancedMesh.setMatrixAt(i, this._dummy.matrix);

      this._instanceData[i].alive = true;
      this._instanceData[i].age = 0;
      this._instanceData[i].lifetime = lifetime;
      this._instanceData[i].spawnAnim = 0;
      this._instanceData[i].hitAnim = 0;
      this._instanceData[i].spawnedAt = now;
    }

    this._instancedMesh.count = positions.length;
    this._instancedMesh.instanceMatrix.needsUpdate = true;
  }

  _spawnIndividual(positions, size, lifetime, color) {
    for (const pos of positions) {
      const target = new Target({
        position: new THREE.Vector3(pos.x, pos.y, pos.z),
        radius: size,
        color,
        lifetime,
      });
      this.scene.add(target.mesh);
      target.spawn(performance.now());
      this.targets.push(target);
    }
  }

  shouldSpawn(config, elapsed) {
    if (!config) return false;
    if (this._useInstanced) {
      const anyAlive = this._instanceData.some(d => d.alive);
      if (!anyAlive) {
        const interval = config.interval || 1.0;
        return elapsed - this.lastSpawnTime >= interval;
      }
      return false;
    }
    const aliveTargets = this.targets.filter(t => t.isAlive());
    if (aliveTargets.length === 0) {
      const interval = config.interval || 0.5;
      return elapsed - this.lastSpawnTime >= interval;
    }
    return false;
  }

  handleHit(target) {
    if (this._useInstanced) {
      // target is actually an index (instanceId)
      const idx = target;
      const data = this._instanceData[idx];
      if (!data || !data.alive) return;
      data.hitAnim = 0.01; // start hit animation
    } else {
      target.hit();
    }
  }

  update(dt, elapsed, modeInstance) {
    if (this._useInstanced) {
      return this._updateInstanced(dt, elapsed, modeInstance);
    }

    const expired = [];
    for (const target of this.targets) {
      target.update(dt);

      if (target.isAlive() && target.age > target.lifetime) {
        target.despawn();
        expired.push(target);
        if (modeInstance && modeInstance.onMiss) {
          modeInstance.onMiss(target);
        }
      }

      if (target.isAlive() && modeInstance && modeInstance.getTargetPosition) {
        const pos = modeInstance.getTargetPosition(target, elapsed);
        if (pos) {
          target.mesh.position.lerp(pos, 0.3);
        }
      }
    }

    const deadTargets = this.targets.filter(t => t.isDead());
    for (const target of deadTargets) {
      this.scene.remove(target.mesh);
      target.dispose();
    }
    this.targets = this.targets.filter(t => !t.isDead());

    return expired;
  }

  _updateInstanced(dt, elapsed, modeInstance) {
    const expired = [];
    let needsUpdate = false;
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < this._instancedMesh.count; i++) {
      const data = this._instanceData[i];
      if (!data.alive) continue;

      // Spawn animation
      if (data.spawnAnim < 1 && data.hitAnim === 0) {
        data.spawnAnim += dt * 6;
        if (data.spawnAnim >= 1) data.spawnAnim = 1;
        const s = this._easeOutBack(data.spawnAnim);
        this._instancedMesh.getMatrixAt(i, this._dummy.matrix);
        this._dummy.matrix.decompose(pos, quat, scale);
        scale.setScalar(s);
        this._dummy.matrix.compose(pos, quat, scale);
        this._instancedMesh.setMatrixAt(i, this._dummy.matrix);
        needsUpdate = true;
      }

      // Hit animation
      if (data.hitAnim > 0) {
        data.hitAnim += dt * 10;
        const s = Math.max(0, 1 - data.hitAnim);
        this._instancedMesh.getMatrixAt(i, this._dummy.matrix);
        this._dummy.matrix.decompose(pos, quat, scale);
        scale.setScalar(s);
        this._dummy.matrix.compose(pos, quat, scale);
        this._instancedMesh.setMatrixAt(i, this._dummy.matrix);
        needsUpdate = true;
        if (data.hitAnim >= 1) {
          data.alive = false;
          // Move offscreen
          this._dummy.position.set(0, -999, 0);
          this._dummy.scale.set(0, 0, 0);
          this._dummy.updateMatrix();
          this._instancedMesh.setMatrixAt(i, this._dummy.matrix);
          needsUpdate = true;
        }
        continue;
      }

      // Age
      data.age += dt;
      if (data.age > data.lifetime) {
        data.alive = false;
        if (modeInstance?.onMiss) modeInstance.onMiss({ index: i });
        // Despawn: move offscreen
        this._dummy.position.set(0, -999, 0);
        this._dummy.scale.set(0, 0, 0);
        this._dummy.updateMatrix();
        this._instancedMesh.setMatrixAt(i, this._dummy.matrix);
        needsUpdate = true;
        expired.push({ index: i });
      }
    }

    // Hide instanced mesh if no alive instances
    const anyAlive = this._instanceData.some(d => d.alive);
    if (!anyAlive && this._instancedMesh.visible) {
      this._instancedMesh.visible = false;
      this._instancedMesh.count = 0;
    }

    if (needsUpdate) {
      this._instancedMesh.instanceMatrix.needsUpdate = true;
    }

    return expired;
  }

  getTargets() {
    if (this._useInstanced) {
      // Return the instanced mesh wrapped for raycaster
      return [{ mesh: this._instancedMesh, isAlive: () => true }];
    }
    return this.targets;
  }

  /**
   * For InputManager compatibility — check if a hit was on an alive instanced target.
   */
  isInstancedHitAlive(instanceId) {
    return instanceId !== undefined && this._instanceData[instanceId]?.alive;
  }

  getInstancedPosition(instanceId) {
    if (!this._useInstanced || instanceId === undefined) return null;
    const m = new THREE.Matrix4();
    this._instancedMesh.getMatrixAt(instanceId, m);
    const pos = new THREE.Vector3();
    pos.setFromMatrixPosition(m);
    return pos;
  }

  clearAll() {
    if (this._instancedMesh) {
      for (let i = 0; i < MAX_INSTANCES; i++) {
        this._instanceData[i].alive = false;
        this._dummy.position.set(0, -999, 0);
        this._dummy.scale.set(0, 0, 0);
        this._dummy.updateMatrix();
        this._instancedMesh.setMatrixAt(i, this._dummy.matrix);
      }
      this._instancedMesh.count = 0;
      this._instancedMesh.visible = false;
      this._instancedMesh.instanceMatrix.needsUpdate = true;
    }

    for (const target of this.targets) {
      this.scene.remove(target.mesh);
      target.dispose();
    }
    this.targets = [];
  }

  dispose() {
    this.clearAll();
    if (this._instancedMesh) {
      this._instancedMesh.geometry.dispose();
      this._instancedMesh.material.dispose();
      this.scene.remove(this._instancedMesh);
    }
  }

  _easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
}
