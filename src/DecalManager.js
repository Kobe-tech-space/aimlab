import * as THREE from 'three';

const MAX_DECALS = 30;

export class DecalManager {
  constructor(scene, wallZ = -8) {
    this.scene = scene;
    this.wallZ = wallZ;
    this.decals = [];

    // Shared decal texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(16, 16, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 10, 18, 0.9)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(16, 16, 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(50, 50, 70, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    this._sharedTexture = new THREE.CanvasTexture(canvas);
  }

  add(position) {
    const pos = position.clone();
    pos.z = this.wallZ + 0.01;

    const spriteMat = new THREE.SpriteMaterial({
      map: this._sharedTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      depthTest: true,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(pos);
    sprite.scale.set(0.15, 0.15, 1);
    sprite.userData.life = 2.0;
    sprite.userData.age = 0;

    this.scene.add(sprite);
    this.decals.push(sprite);

    if (this.decals.length > MAX_DECALS) {
      const old = this.decals.shift();
      this._disposeDecal(old);
    }
  }

  update(dt) {
    for (let i = this.decals.length - 1; i >= 0; i--) {
      const d = this.decals[i];
      d.userData.age += dt;
      const t = d.userData.age / d.userData.life;
      d.material.opacity = Math.max(0, 0.8 * (1 - t));
      const s = 0.15 + t * 0.05;
      d.scale.set(s, s, 1);
      if (d.userData.age >= d.userData.life) {
        this._disposeDecal(d);
        this.decals.splice(i, 1);
      }
    }
  }

  _disposeDecal(d) {
    d.material.dispose();
    this.scene.remove(d);
  }

  clear() {
    for (const d of this.decals) {
      this._disposeDecal(d);
    }
    this.decals = [];
  }
}
