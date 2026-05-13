import { GAME_CONFIG } from './utils/constants.js';

export class ScoreManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.totalShots = 0;
    this.reactionTimes = [];
    this.combo = 0;
    this.maxCombo = 0;
    this.trackingTime = 0; // For tracking mode
  }

  recordHit(reactionTimeMs) {
    this.hits++;
    this.totalShots++;
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    if (reactionTimeMs > 0) {
      this.reactionTimes.push(reactionTimeMs);
    }

    const comboMultiplier = this.combo >= 10 ? GAME_CONFIG.COMBO_MULTIPLIER_10 : this.combo >= 5 ? GAME_CONFIG.COMBO_MULTIPLIER_5 : 1;
    const timeBonus = reactionTimeMs < GAME_CONFIG.TIME_BONUS_THRESHOLD_FAST ? GAME_CONFIG.TIME_BONUS_FAST
      : reactionTimeMs < GAME_CONFIG.TIME_BONUS_THRESHOLD_OK ? GAME_CONFIG.TIME_BONUS_OK : 0;
    this.score += Math.round(GAME_CONFIG.HIT_SCORE_BASE * comboMultiplier) + timeBonus;
  }

  recordMiss() {
    this.misses++;
    this.totalShots++;
    this.combo = 0;
  }

  addTrackingScore(points) {
    this.score += Math.round(points);
  }

  addTrackingTime(dt) {
    this.trackingTime += dt;
  }

  getAccuracy() {
    if (this.totalShots === 0) return 100;
    return Math.round((this.hits / this.totalShots) * 100);
  }

  getAvgReactionTime() {
    if (this.reactionTimes.length === 0) return 0;
    const sum = this.reactionTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.reactionTimes.length);
  }

  getBestReactionTime() {
    if (this.reactionTimes.length === 0) return 0;
    return Math.round(Math.min(...this.reactionTimes));
  }

  getSummary() {
    return {
      score: this.score,
      hits: this.hits,
      misses: this.misses,
      totalShots: this.totalShots,
      accuracy: this.getAccuracy(),
      avgReactionTime: this.getAvgReactionTime(),
      bestReactionTime: this.getBestReactionTime(),
      combo: this.maxCombo,
      trackingTime: this.trackingTime,
    };
  }
}
