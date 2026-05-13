export class BaseMode {
  constructor(preset) {
    this.preset = preset;
    this.name = 'Base';
    this.description = '';
    this.defaultDuration = 30;
  }

  getDuration() {
    return this.defaultDuration;
  }

  getSpawnConfig() {
    return null;
  }

  getTargetPosition(target, elapsed) {
    return null;
  }

  onHit(target, reactionTime) {}

  onMiss(target) {}

  update(dt, elapsed) {}

  isComplete(elapsed, targets, scoreManager) {
    return elapsed >= this.getDuration();
  }
}
