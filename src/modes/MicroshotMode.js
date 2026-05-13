import { BaseMode } from './BaseMode.js';
import { COLORS } from '../utils/constants.js';

export class MicroshotMode extends BaseMode {
  constructor(preset) {
    super(preset);
    this.name = 'Microshot';
    this.description = '极小的精准目标';
    this.defaultDuration = 40;
    this.targetScale = preset.microTargetScale || 0.5;
    this.targetCount = preset.microTargetCount || 40;
    this.targetsCleared = 0;
    this.spawnCount = this.targetScale <= 0.3 ? 3 : this.targetScale <= 0.5 ? 2 : 1;
  }

  getDuration() {
    return this.defaultDuration;
  }

  getSpawnConfig() {
    const positions = [];
    for (let i = 0; i < this.spawnCount; i++) {
      positions.push({
        x: (Math.random() - 0.5) * 6,
        y: Math.random() * 3 + 0.3,
        z: -7 - Math.random() * 3,
      });
    }
    return {
      positions,
      size: this.preset.targetRadius * this.targetScale,
      lifetime: this.preset.targetLifetime * 1.5,
      color: COLORS.target,
      interval: 0.6,
    };
  }

  onHit(target, reactionTime) {
    this.targetsCleared++;
  }

  isComplete(elapsed, targets, scoreManager) {
    return this.targetsCleared >= this.targetCount || elapsed >= this.getDuration();
  }
}
