import * as THREE from 'three';

export class WeaponModel {
  constructor(camera) {
    this.camera = camera;
    this.group = new THREE.Group();
    this.camera.add(this.group);

    this.group.position.set(0.5, -0.55, -1.2);
    this.group.rotation.set(0.05, -0.15, 0);
    this.group.scale.setScalar(0.06);

    this._build();
  }

  _build() {
    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x1a1a22, roughness: 0.4, metalness: 0.9,
    });
    const accentMetal = new THREE.MeshStandardMaterial({
      color: 0x2a2a35, roughness: 0.3, metalness: 0.95,
    });

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.8, 0.9, 8, 12);
    const barrel = new THREE.Mesh(barrelGeo, darkMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, -4);
    this.group.add(barrel);

    // Slide (main body)
    const slideGeo = new THREE.BoxGeometry(2, 1.8, 5);
    const slide = new THREE.Mesh(slideGeo, accentMetal);
    slide.position.set(0, 0.2, -0.5);
    this.group.add(slide);

    // Grip
    const gripGeo = new THREE.BoxGeometry(1.6, 3.5, 2);
    const grip = new THREE.Mesh(gripGeo, darkMetal);
    grip.position.set(0, -2.6, 0.3);
    grip.rotation.x = 0.3;
    this.group.add(grip);

    // Trigger guard
    const guardGeo = new THREE.TorusGeometry(1, 0.3, 8, 8, Math.PI);
    const guard = new THREE.Mesh(guardGeo, accentMetal);
    guard.position.set(0, -1.2, 0.5);
    guard.rotation.y = Math.PI / 2;
    this.group.add(guard);

    // Muzzle
    const muzzleGeo = new THREE.CylinderGeometry(0.7, 0.9, 0.6, 12);
    const muzzle = new THREE.Mesh(muzzleGeo, new THREE.MeshStandardMaterial({
      color: 0x3a3a44, roughness: 0.3, metalness: 0.9,
    }));
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0, -7.8);
    this.group.add(muzzle);

    // Sight (front)
    const sightGeo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
    const sight = new THREE.Mesh(sightGeo, new THREE.MeshStandardMaterial({
      color: 0x4a4a55, roughness: 0.3, metalness: 0.8, emissive: 0x111111, emissiveIntensity: 0.3,
    }));
    sight.position.set(0, 1.15, -2.5);
    this.group.add(sight);

    // Trigger
    const triggerGeo = new THREE.BoxGeometry(0.4, 0.8, 0.2);
    const trigger = new THREE.Mesh(triggerGeo, accentMetal);
    trigger.position.set(0, -1.2, 0.9);
    this.group.add(trigger);
  }

  /**
   * Apply slight idle sway + recoil kick.
   * @param {number} dt
   * @param {{ mouseX: number, mouseY: number }} mouse NDC coords
   * @param {number} recoilAmount 0-1 momentary recoil
   */
  update(dt, mouse, recoilAmount) {
    const targetRotX = mouse.y * 0.015 + 0.05;
    const targetRotY = mouse.x * 0.02 - 0.15;
    const targetRotZ = -mouse.x * 0.01;

    this.group.rotation.x += (targetRotX - this.group.rotation.x) * dt * 8;
    this.group.rotation.y += (targetRotY - this.group.rotation.y) * dt * 8;
    this.group.rotation.z += (targetRotZ - this.group.rotation.z) * dt * 8;

    // Recoil kick (rotate up then recover)
    if (recoilAmount > 0) {
      this.group.rotation.x -= recoilAmount * 0.12;
      this.group.position.z += recoilAmount * 0.08;
    }
    // Recover position
    this.group.position.z += (-1.2 - this.group.position.z) * dt * 12;
  }

  dispose() {
    this.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    this.camera.remove(this.group);
  }
}
