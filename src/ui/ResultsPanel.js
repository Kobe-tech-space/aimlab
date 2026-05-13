import { MODE_META, loadSessionHistory } from '../utils/constants.js';

function getRating(accuracy, avgReaction, trackingTime) {
  const hasReaction = avgReaction > 0;
  const hasTracking = trackingTime > 0;
  // For tracking mode (no reaction data), use tracking time as proxy
  const effectiveReaction = hasReaction ? avgReaction : (hasTracking && trackingTime > 10 ? 200 : 400);
  if (accuracy >= 95 && effectiveReaction < 250) return { grade: 'S', cls: 'results-panel__rating--s' };
  if (accuracy >= 85 && effectiveReaction < 350) return { grade: 'A', cls: 'results-panel__rating--a' };
  if (accuracy >= 70) return { grade: 'B', cls: 'results-panel__rating--b' };
  return { grade: 'C', cls: 'results-panel__rating--c' };
}

export class ResultsPanel {
  constructor(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.className = 'results-panel';
    this.el.style.display = 'none';
    container.appendChild(this.el);
  }

  show(summary, onBack) {
    this.el.innerHTML = '';
    this.el.style.display = 'flex';

    const meta = MODE_META[summary.mode] || { name: summary.mode, icon: '?' };
    const rating = getRating(summary.accuracy, summary.avgReactionTime, summary.trackingTime);
    const isPB = summary.isNewBest;

    const card = document.createElement('div');
    card.className = 'results-panel__card';
    if (isPB) card.style.animation = 'scaleIn 0.4s ease-out, goldenGlow 2s ease-in-out infinite';
    this.el.appendChild(card);

    // Mode name
    const modeName = document.createElement('div');
    modeName.className = 'results-panel__mode';
    modeName.textContent = meta.name + ' 结果';
    card.appendChild(modeName);

    // Rating
    const ratingEl = document.createElement('div');
    ratingEl.className = `results-panel__rating ${rating.cls}`;
    ratingEl.textContent = rating.grade;
    card.appendChild(ratingEl);

    // Score
    const scoreEl = document.createElement('div');
    scoreEl.className = 'results-panel__score';
    scoreEl.textContent = summary.score;
    card.appendChild(scoreEl);

    const scoreLabel = document.createElement('div');
    scoreLabel.className = 'results-panel__score-label';
    scoreLabel.textContent = '总分';
    card.appendChild(scoreLabel);

    // PB badge
    if (isPB) {
      const pbBadge = document.createElement('div');
      pbBadge.className = 'results-panel__pb-badge';
      pbBadge.textContent = '★ 新纪录 ★';
      card.appendChild(pbBadge);
    }

    // Stats grid
    const statsGrid = document.createElement('div');
    statsGrid.className = 'results-panel__stats';
    card.appendChild(statsGrid);

    const statItems = [
      { label: '命中', value: summary.hits },
      { label: '失误', value: summary.misses },
      { label: '命中率', value: summary.accuracy + '%' },
      { label: '最高连击', value: summary.combo + 'x' },
      { label: '平均反应', value: summary.avgReactionTime + 'ms' },
      { label: '最快反应', value: summary.bestReactionTime + 'ms' },
    ];

    for (const stat of statItems) {
      statsGrid.appendChild(this._statBox(stat.label, stat.value));
    }

    // History mini chart
    const history = loadSessionHistory(summary.mode);
    if (history.length >= 2) {
      this._addChart(card, history);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'results-panel__actions';
    card.appendChild(actions);

    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn btn--primary';
    retryBtn.textContent = '再来一次';
    retryBtn.addEventListener('click', () => {
      this.hide();
      if (onBack) onBack();
    });
    actions.appendChild(retryBtn);

    const menuBtn = document.createElement('button');
    menuBtn.className = 'btn btn--ghost';
    menuBtn.textContent = '返回菜单';
    menuBtn.addEventListener('click', () => {
      this.hide();
      if (onBack) onBack();
    });
    actions.appendChild(menuBtn);
  }

  _statBox(label, value) {
    const box = document.createElement('div');
    box.className = 'results-panel__stat';

    const valEl = document.createElement('div');
    valEl.className = 'results-panel__stat-value';
    valEl.textContent = value;

    const labelEl = document.createElement('div');
    labelEl.className = 'results-panel__stat-label';
    labelEl.textContent = label;

    box.appendChild(valEl);
    box.appendChild(labelEl);
    return box;
  }

  _addChart(parent, history) {
    const container = document.createElement('div');
    container.style.cssText = 'margin-top:12px;';
    parent.appendChild(container);

    const label = document.createElement('div');
    label.className = 'results-panel__stat-label';
    label.textContent = '近期成绩趋势';
    label.style.marginBottom = '6px';
    container.appendChild(label);

    const canvas = document.createElement('canvas');
    canvas.width = 380;
    canvas.height = 100;
    canvas.style.width = '100%';
    canvas.style.height = '100px';
    canvas.style.borderRadius = '6px';
    canvas.style.background = 'rgba(255,255,255,0.02)';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pad = 12;
    const points = history.slice(-20);
    const maxScore = Math.max(...points.map(p => p.score), 1);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    points.forEach((p, i) => {
      const x = pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - (p.score / maxScore) * (h - pad * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw dots
    points.forEach((p, i) => {
      const x = pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - (p.score / maxScore) * (h - pad * 2);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
    });

    // Fill below
    ctx.lineTo(pad + (points.length - 1) / Math.max(points.length - 1, 1) * (w - pad * 2), h - pad);
    ctx.lineTo(pad, h - pad);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, pad, 0, h - pad);
    gradient.addColorStop(0, 'rgba(99,102,241,0.15)');
    gradient.addColorStop(1, 'rgba(99,102,241,0.0)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  hide() { this.el.style.display = 'none'; }
}
