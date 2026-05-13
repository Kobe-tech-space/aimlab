import * as THREE from 'three';
import { BaseMode } from './BaseMode.js';
import { COLORS } from '../utils/constants.js';

export class TrackingMode extends BaseMode {
  constructor(preset) {
    super(preset);
    this.name = 'Tracking';
    this.description = '持续跟随移动目标';
    this.defaultDuration = 30;
    this.speed = preset.trackingSpeed || 2.5;
    this.pathType = preset.gridSize >= 5 ? 'bezier' : preset.gridSize >= 4 ? 'figure8' : 'circle';
    this._pos = new THREE.Vector3();
  }

  getDuration() {
    return this.defaultDuration;
  }

  getSpawnConfig() {
    return {
      positions: [{ x: 0, y: 1.5, z: -7 }],
      size: this.preset.targetRadius * 1.2,
      lifetime: 999,
      color: COLORS.targetTracking,
      interval: 0.1,
    };
  }

  getTargetPosition(target, elapsed) {
    const t = elapsed * this.speed;
    let pos;

    switch (this.pathType) {
      case 'circle':
        pos = this._circlePath(t);
        break;
      case 'figure8':
        pos = this._figure8Path(t);
        break;
      case 'bezier':
        pos = this._bezierPath(t);
        break;
      default:
        pos = this._circlePath(t);
    }

    return this._pos.set(pos.x, pos.y, pos.z);
  }

  _circlePath(t) {
    const radius = 2.5;
    return {
      x: Math.cos(t) * radius,
      y: Math.sin(t * 1.3) * 1.8 + 1.5,
      z: -7,
    };
  }

  _figure8Path(t) {
    const scale = 2.8;
    return {
      x: Math.sin(t) * scale,
      y: Math.sin(t * 2) * 1.2 + 1.5,
      z: -7,
    };
  }

  _bezierPath(t) {
    const points = [
      { x: -3, y: 0.5 },
      { x: 3, y: 2.5 },
      { x: -3, y: 2.5 },
      { x: 3, y: 0.5 },
    ];
    const i = Math.floor(t % points.length);
    const next = (i + 1) % points.length;
    const frac = (t % 1);
    const eased = frac < 0.5
      ? 2 * frac * frac
      : 1 - Math.pow(-2 * frac + 2, 2) / 2;

    return {
      x: points[i].x + (points[next].x - points[i].x) * eased,
      y: points[i].y + (points[next].y - points[i].y) * eased + 1,
      z: -7,
    };
  }

  onHit(target, reactionTime) {
    // Tracking score is accumulated per frame, not per click
  }

  isComplete(elapsed, targets, scoreManager) {
    if (elapsed >= this.getDuration()) return true;
    return false;
  }
}
