import { BaseMode } from './BaseMode.js';
import { COLORS } from '../utils/constants.js';

export class FlickingMode extends BaseMode {
  constructor(preset) {
    super(preset);
    this.name = 'Flicking';
    this.description = '随机目标快速射击';
    this.defaultDuration = 45;
    this.targetCount = preset.flickTargetCount || 60;
    this.targetsCleared = 0;
    this.lastPosition = { x: 0, y: 1.5, z: -7 };
    this.currentTargetPos = null;
  }

  getDuration() {
    return this.defaultDuration;
  }

  getSpawnConfig() {
    const pos = this._randomPosition();
    this.currentTargetPos = pos;
    return {
      positions: [pos],
      size: this.preset.targetRadius,
      lifetime: this.preset.flickTargetDuration,
      color: COLORS.target,
      interval: 0.1,
    };
  }

  _randomPosition() {
    const rangeX = 3.5;
    const rangeY = 2.5;
    let x, y, iterations = 0;
    do {
      x = (Math.random() - 0.5) * 2 * rangeX;
      y = (Math.random() - 0.5) * 2 * rangeY + 1.5;
      iterations++;
    } while (
      iterations < 100 &&
      this.lastPosition &&
      Math.hypot(x - this.lastPosition.x, y - this.lastPosition.y) < 1.2
    );
    this.lastPosition = { x, y, z: -7 };
    return { x, y, z: -7 };
  }

  onHit(target, reactionTime) {
    this.targetsCleared++;
  }

  isComplete(elapsed, targets, scoreManager) {
    return this.targetsCleared >= this.targetCount || elapsed >= this.getDuration();
  }
}
