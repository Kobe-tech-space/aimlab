const POOL_SIZE = 12;

class AudioNodePool {
  constructor(ctx) {
    this.ctx = ctx;
    this.nodes = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0); // start immediately, control with gain
      gain.gain.setValueAtTime(0, ctx.currentTime);
      this.nodes.push({ osc, gain, busy: false });
    }
  }

  acquire() {
    for (const node of this.nodes) {
      if (!node.busy) {
        node.busy = true;
        return node;
      }
    }
    // Pool exhausted — create an overflow node
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(0);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    const overflow = { osc, gain, busy: true, overflow: true };
    this.nodes.push(overflow);
    return overflow;
  }

  release(node) {
    if (node.overflow) {
      node.osc.stop(this.ctx.currentTime + 0.01);
      node.osc.disconnect();
      node.gain.disconnect();
      const idx = this.nodes.indexOf(node);
      if (idx > -1) this.nodes.splice(idx, 1);
      return;
    }
    node.gain.gain.cancelScheduledValues(this.ctx.currentTime);
    node.gain.gain.setValueAtTime(0, this.ctx.currentTime);
    node.busy = false;
  }
}

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.pool = null;
    this.volume = 0.7;
    this._initOnInteraction = this._initOnInteraction.bind(this);
    window.addEventListener('click', this._initOnInteraction, { once: true });
    window.addEventListener('keydown', this._initOnInteraction, { once: true });
  }

  _initOnInteraction() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.pool = new AudioNodePool(this.ctx);
  }

  _ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.pool = new AudioNodePool(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  _playTone(freq, type, duration, vol = 1, rampUp = 0, rampDown = 0) {
    const ctx = this._ensureCtx();
    const node = this.pool.acquire();
    const now = ctx.currentTime;

    node.osc.type = type;
    node.osc.frequency.cancelScheduledValues(now);
    node.osc.frequency.setValueAtTime(freq, now);

    const gainNode = node.gain;
    gainNode.gain.cancelScheduledValues(now);
    const targetVol = vol * this.volume;

    if (rampUp > 0) {
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(targetVol, now + rampUp);
    } else {
      gainNode.gain.setValueAtTime(targetVol, now);
    }

    if (rampDown > 0) {
      gainNode.gain.setValueAtTime(targetVol, now + duration - rampDown);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } else {
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }

    // Auto-release after duration
    setTimeout(() => this.pool.release(node), duration * 1000 + 50);
  }

  playHit() {
    const ctx = this._ensureCtx();
    const node = this.pool.acquire();
    const now = ctx.currentTime;

    node.osc.type = 'sine';
    node.osc.frequency.cancelScheduledValues(now);
    node.osc.frequency.setValueAtTime(880, now);
    node.osc.frequency.exponentialRampToValueAtTime(1760, now + 0.05);

    node.gain.gain.cancelScheduledValues(now);
    node.gain.gain.setValueAtTime(0.3 * this.volume, now);
    node.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    setTimeout(() => this.pool.release(node), 170);
  }

  playMiss() {
    this._playTone(150, 'square', 0.2, 0.2);
  }

  playCountdown() {
    this._playTone(600, 'sine', 0.15, 0.4);
  }

  playStart() {
    const ctx = this._ensureCtx();
    const now = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const node = this.pool.acquire();
      node.osc.type = 'sine';
      node.osc.frequency.cancelScheduledValues(now + i * 0.1);
      node.osc.frequency.setValueAtTime(freq, now + i * 0.1);

      node.gain.gain.cancelScheduledValues(now + i * 0.1);
      node.gain.gain.setValueAtTime(0.3 * this.volume, now + i * 0.1);
      node.gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);

      setTimeout(() => this.pool.release(node), (i * 0.1 + 0.2) * 1000 + 50);
    });
  }

  playEnd() {
    const ctx = this._ensureCtx();
    const now = ctx.currentTime;
    [784, 659, 523].forEach((freq, i) => {
      const node = this.pool.acquire();
      node.osc.type = 'sine';
      node.osc.frequency.cancelScheduledValues(now + i * 0.15);
      node.osc.frequency.setValueAtTime(freq, now + i * 0.15);

      node.gain.gain.cancelScheduledValues(now + i * 0.15);
      node.gain.gain.setValueAtTime(0.25 * this.volume, now + i * 0.15);
      node.gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);

      setTimeout(() => this.pool.release(node), (i * 0.15 + 0.3) * 1000 + 50);
    });
  }

  playCombo(combo) {
    const ctx = this._ensureCtx();
    const now = ctx.currentTime;
    let baseFreq = 440;
    if (combo >= 20) baseFreq = 1200;
    else if (combo >= 15) baseFreq = 1047;
    else if (combo >= 10) baseFreq = 880;
    else if (combo >= 5) baseFreq = 659;

    const node = this.pool.acquire();
    node.osc.type = 'sine';
    node.osc.frequency.cancelScheduledValues(now);
    node.osc.frequency.setValueAtTime(baseFreq, now);
    node.osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

    node.gain.gain.cancelScheduledValues(now);
    node.gain.gain.setValueAtTime(0.25 * this.volume, now);
    node.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    setTimeout(() => this.pool.release(node), 250);
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
  }
}
