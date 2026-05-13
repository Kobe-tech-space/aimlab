export class HUD {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    this.timerEl = this._createStat('⏱', '60');
    this.scoreEl = this._createStat('★', '0');
    this.accuracyEl = this._createStat('◎', '100%');
    this.comboEl = this._createStat('⚡', '0x');

    this.el.appendChild(this.timerEl);
    this.el.appendChild(this.scoreEl);
    this.el.appendChild(this.accuracyEl);
    this.el.appendChild(this.comboEl);

    this._warmupHint = null;

    // Countdown overlay
    this.countdownEl = document.createElement('div');
    this.countdownEl.className = 'countdown';
    this.countdownEl.style.display = 'none';
    document.body.appendChild(this.countdownEl);

    this._prevScore = 0;
    this._lastFloatTime = 0;
  }

  _createStat(label, initialValue) {
    const wrap = document.createElement('div');
    wrap.className = 'hud__stat';

    const labelEl = document.createElement('span');
    labelEl.className = 'hud__label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = 'hud__value';
    valueEl.textContent = initialValue;

    wrap.appendChild(labelEl);
    wrap.appendChild(valueEl);
    wrap.valueEl = valueEl;
    return wrap;
  }

  update({ time, score, accuracy, combo }) {
    this.timerEl.valueEl.textContent = this._formatTime(time);
    this.scoreEl.valueEl.textContent = score;
    this.accuracyEl.valueEl.textContent = accuracy + '%';
    this.comboEl.valueEl.textContent = combo + 'x';

    // Timer color states
    const timerCls = this.timerEl.valueEl.classList;
    timerCls.remove('hud__value--warning', 'hud__value--danger');
    if (time < 3) {
      timerCls.add('hud__value--danger');
    } else if (time < 5) {
      timerCls.add('hud__value--warning');
    }

    // Score change animation (throttled to avoid flooding in tracking mode)
    if (score > this._prevScore) {
      const now = performance.now();
      if (now - this._lastFloatTime > 300) {
        this._showScoreFloat('+' + (score - this._prevScore));
        this._lastFloatTime = now;
      }
      this.scoreEl.valueEl.classList.remove('hud__value--pop');
      void this.scoreEl.valueEl.offsetWidth;
      this.scoreEl.valueEl.classList.add('hud__value--pop');
    }
    this._prevScore = score;
  }

  /**
   * Animate combo number pop effect.
   */
  animateCombo() {
    this.comboEl.valueEl.classList.remove('hud__value--pop');
    void this.comboEl.valueEl.offsetWidth;
    this.comboEl.valueEl.classList.add('hud__value--pop');
  }

  /**
   * Show a floating +N text at a screen position.
   */
  _showScoreFloat(text) {
    const el = document.createElement('div');
    el.className = 'score-float';
    el.textContent = text;
    el.style.left = '50%';
    el.style.top = '45%';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  showCountdown(val) {
    this.countdownEl.style.display = 'flex';
    this.countdownEl.innerHTML = '';

    const text = document.createElement('span');
    text.className = val === 'GO!' ? 'countdown__text countdown__text--go' : 'countdown__text';
    text.textContent = val;
    // Re-trigger animation by removing and re-adding
    if (val === 'GO!') {
      text.classList.remove('countdown__text--go');
      void text.offsetWidth;
      text.classList.add('countdown__text--go');
    } else {
      text.classList.remove('countdown__text');
      void text.offsetWidth;
      text.classList.add('countdown__text');
    }
    this.countdownEl.appendChild(text);
  }

  hideCountdown() {
    this.countdownEl.style.display = 'none';
    this.countdownEl.innerHTML = '';
    this._prevScore = 0;
  }

  showWarmup() {
    this.countdownEl.style.display = 'flex';
    this.countdownEl.innerHTML = '';

    const text = document.createElement('span');
    text.className = 'countdown__text';
    text.textContent = '热身';
    text.style.fontSize = '72px';
    this.countdownEl.appendChild(text);

    this._warmupHint = document.createElement('span');
    this._warmupHint.style.cssText = 'position:absolute;top:58%;left:50%;transform:translateX(-50%);font-size:14px;color:var(--text-dim);letter-spacing:2px;';
    this._warmupHint.textContent = '点击或按空格跳过 (5s)';
    this.countdownEl.appendChild(this._warmupHint);
  }

  updateWarmup(remaining) {
    if (this._warmupHint) {
      this._warmupHint.textContent = `点击或按空格跳过 (${Math.max(0, Math.ceil(remaining))}s)`;
    }
  }

  hideWarmup() {
    this.countdownEl.style.display = 'none';
    this.countdownEl.innerHTML = '';
  }

  show() { this.el.style.display = 'flex'; }
  hide() { this.el.style.display = 'none'; }

  _formatTime(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}
