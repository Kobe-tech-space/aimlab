import * as THREE from 'three';
import { CROSSHAIR_STYLES } from './utils/constants.js';

const STYLE_CLASS = {
  [CROSSHAIR_STYLES.PLUS]: 'crosshair--plus',
  [CROSSHAIR_STYLES.DOT]: 'crosshair--dot',
  [CROSSHAIR_STYLES.CROSS]: 'crosshair--cross',
  [CROSSHAIR_STYLES.CHEVRON]: 'crosshair--chevron',
};

export class InputManager {
  constructor(renderer, camera, crosshairStyle = CROSSHAIR_STYLES.PLUS) {
    this.renderer = renderer;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.pendingMouseX = null;
    this.pendingMouseY = null;

    this._onMouseMove = this._onMouseMove.bind(this);
    window.addEventListener('mousemove', this._onMouseMove);

    this.crosshairEl = document.createElement('div');
    this.crosshairEl.className = 'crosshair';
    document.body.appendChild(this.crosshairEl);

    this.setStyle(crosshairStyle);
  }

  setStyle(style) {
    Object.values(STYLE_CLASS).forEach(c => this.crosshairEl.classList.remove(c));
    this.crosshairEl.classList.add(STYLE_CLASS[style] || STYLE_CLASS[CROSSHAIR_STYLES.PLUS]);

    switch (style) {
      case CROSSHAIR_STYLES.PLUS:
        this.crosshairEl.textContent = '+';
        break;
      case CROSSHAIR_STYLES.DOT:
      case CROSSHAIR_STYLES.CROSS:
      case CROSSHAIR_STYLES.CHEVRON:
        this.crosshairEl.textContent = '';
        break;
      default:
        this.crosshairEl.textContent = '+';
    }
  }

  _onMouseMove(event) {
    this.pendingMouseX = event.clientX;
    this.pendingMouseY = event.clientY;
  }

  _applyMousePosition() {
    if (this.pendingMouseX == null) return;
    this.crosshairEl.style.left = this.pendingMouseX + 'px';
    this.crosshairEl.style.top = this.pendingMouseY + 'px';
    this.mouse.x = (this.pendingMouseX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(this.pendingMouseY / window.innerHeight) * 2 + 1;
  }

  /**
   * Single raycaster call per frame.
   * Returns { target, instanceId } where target is the Target or InstancedMesh,
   * and instanceId is set for InstancedMesh hits.
   */
  update(targets) {
    this._applyMousePosition();

    if (!targets || targets.length === 0) {
      this._setCrosshairState(false);
      return null;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = targets.filter(t => t.isAlive()).map(t => t.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0 && intersects[0].distance < 20) {
      this._setCrosshairState(true);
      const hit = intersects[0];
      const result = {
        target: targets.find(t => t.mesh === hit.object) || null,
        instanceId: hit.instanceId,
        point: hit.point,
      };
      return result;
    }

    this._setCrosshairState(false);
    return null;
  }

  _setCrosshairState(hovering) {
    if (hovering) {
      this.crosshairEl.classList.add('crosshair--hovering');
    } else {
      this.crosshairEl.classList.remove('crosshair--hovering');
    }
  }

  showHitMarker() {
    const el = document.createElement('div');
    el.className = 'hit-marker';
    el.textContent = '✕';
    el.style.left = (this.pendingMouseX || 0) + 'px';
    el.style.top = (this.pendingMouseY || 0) + 'px';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  /**
   * Click raycaster. Returns { target, instanceId, point } or null.
   */
  getIntersection(targets, event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(mouse, this.camera);
    const meshes = targets.filter(t => t.isAlive()).map(t => t.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0 && intersects[0].distance < 20) {
      return {
        target: targets.find(t => t.mesh === intersects[0].object) || null,
        instanceId: intersects[0].instanceId,
        point: intersects[0].point,
      };
    }
    return null;
  }
}
