import { MODES, MODE_META, DIFFICULTY, loadStats } from '../utils/constants.js';

const MODE_ORDER = [MODES.GRIDSHOT, MODES.FLICKING, MODES.TRACKING, MODES.MICROSHOT];
const MODE_CSS_CLASS = {
  [MODES.GRIDSHOT]: 'mode-card--gridshot',
  [MODES.FLICKING]: 'mode-card--flicking',
  [MODES.TRACKING]: 'mode-card--tracking',
  [MODES.MICROSHOT]: 'mode-card--microshot',
};

export class MainMenu {
  constructor(container) {
    this.container = container;
    this.onModeSelect = null;
    this.onPlaylistSelect = null;
    this.onDailyChallenge = null;
    this.onSettingsOpen = null;

    this.el = document.createElement('div');
    this.el.className = 'main-menu';
    this.el.style.display = 'none';
    container.appendChild(this.el);
    this._build();
  }

  _build() {
    // Title
    const title = document.createElement('h1');
    title.className = 'main-menu__title';
    title.textContent = 'AIM LAB';
    this.el.appendChild(title);

    // Gradient divider
    const divider = document.createElement('div');
    divider.className = 'main-menu__divider';
    this.el.appendChild(divider);

    // Subtitle
    const sub = document.createElement('p');
    sub.className = 'main-menu__subtitle';
    sub.textContent = '选择训练模式';
    this.el.appendChild(sub);

    // Mode cards grid
    const grid = document.createElement('div');
    grid.className = 'main-menu__grid';
    this.el.appendChild(grid);

    const stats = loadStats();

    for (const modeId of MODE_ORDER) {
      const meta = MODE_META[modeId];
      const card = this._createCard(modeId, meta, stats[modeId]);
      card.addEventListener('click', () => {
        if (this.onModeSelect) this.onModeSelect(modeId);
      });
      grid.appendChild(card);
    }

    // Daily challenge button
    const dailyBtn = document.createElement('button');
    dailyBtn.className = 'btn btn--primary';
    dailyBtn.textContent = '🔥 每日挑战';
    dailyBtn.style.marginTop = '4px';
    dailyBtn.addEventListener('click', () => {
      if (this.onDailyChallenge) this.onDailyChallenge();
    });
    this.el.appendChild(dailyBtn);

    // Playlist button
    const playlistBtn = document.createElement('button');
    playlistBtn.className = 'btn btn--ghost main-menu__settings-btn';
    playlistBtn.textContent = '▶ 训练播放列表';
    playlistBtn.style.marginTop = '4px';
    playlistBtn.addEventListener('click', () => {
      if (this.onPlaylistSelect) {
        this.onPlaylistSelect([MODES.GRIDSHOT, MODES.FLICKING, MODES.TRACKING, MODES.MICROSHOT]);
      }
    });
    this.el.appendChild(playlistBtn);

    // Settings button
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'btn btn--ghost main-menu__settings-btn';
    settingsBtn.textContent = '⚙ 设置';
    settingsBtn.addEventListener('click', () => {
      if (this.onSettingsOpen) this.onSettingsOpen();
    });
    this.el.appendChild(settingsBtn);
  }

  _createCard(modeId, meta, bestStats) {
    const card = document.createElement('div');
    card.className = `mode-card ${MODE_CSS_CLASS[modeId]}`;

    const icon = document.createElement('div');
    icon.className = 'mode-card__icon';
    icon.textContent = meta.icon;

    const name = document.createElement('div');
    name.className = 'mode-card__name';
    name.textContent = meta.name;

    const desc = document.createElement('div');
    desc.className = 'mode-card__desc';
    desc.textContent = meta.desc;

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(desc);

    if (bestStats && bestStats.bestScore) {
      const best = document.createElement('div');
      best.className = 'mode-card__best';
      best.textContent = `最高分: ${bestStats.bestScore}`;
      card.appendChild(best);
    }

    return card;
  }

  show() { this.el.style.display = 'flex'; }
  hide() { this.el.style.display = 'none'; }
}
