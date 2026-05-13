import { BaseMode } from './BaseMode.js';
import { COLORS } from '../utils/constants.js';

export class GridshotMode extends BaseMode {
  constructor(preset) {
    super(preset);
    this.name = 'Gridshot';
    this.description = '消灭网格中的目标';
    this.gridSize = preset.gridSize || 4;
    this.defaultDuration = 60;
    this.wavesCompleted = 0;
    this._buildGridPositions();
  }

  _buildGridPositions() {
    this.gridPositions = [];
    const spacing = 1.8;
    const offset = ((this.gridSize - 1) * spacing) / 2;
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        this.gridPositions.push({
          x: col * spacing - offset,
          y: row * spacing - offset + 1.5,
          z: -7,
        });
      }
    }
  }

  getDuration() {
    return this.defaultDuration;
  }

  getSpawnConfig() {
    return {
      positions: this.gridPositions,
      size: this.preset.targetRadius,
      lifetime: this.preset.targetLifetime,
      color: COLORS.target,
      interval: 1.0,
      useInstanced: true,
    };
  }

  onHit(target, reactionTime) {
    // Score handled by ScoreManager
  }

  isComplete(elapsed, targets, scoreManager) {
    return elapsed >= this.getDuration();
  }
}
