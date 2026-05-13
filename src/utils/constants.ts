export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export const GAME_STATE = {
  MENU: 'menu',
  WARMUP: 'warmup',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  RESULTS: 'results',
};

export const MODES = {
  GRIDSHOT: 'gridshot',
  TRACKING: 'tracking',
  FLICKING: 'flicking',
  MICROSHOT: 'microshot',
};

export const MODE_META = {
  [MODES.GRIDSHOT]: { name: 'Gridshot', icon: '⊞', desc: '消除网格中的所有目标，测试快速点击精度' },
  [MODES.TRACKING]: { name: 'Tracking', icon: '◎', desc: '持续跟随移动目标，测试跟枪能力' },
  [MODES.FLICKING]: { name: 'Flicking', icon: '⚡', desc: '快速甩动鼠标击中随机出现的目标' },
  [MODES.MICROSHOT]: { name: 'Microshot', icon: '⊙', desc: '击中极小的目标，测试微调瞄准精度' },
};

export const DIFFICULTY_PRESETS = {
  [DIFFICULTY.EASY]: {
    targetRadius: 0.45,
    targetLifetime: 3.0,
    spawnInterval: 0.8,
    gridSize: 3,
    trackingSpeed: 1.5,
    flickTargetDuration: 2.0,
    flickTargetCount: 40,
    microTargetScale: 0.7,
    microTargetCount: 30,
  },
  [DIFFICULTY.MEDIUM]: {
    targetRadius: 0.35,
    targetLifetime: 2.2,
    spawnInterval: 0.6,
    gridSize: 4,
    trackingSpeed: 2.5,
    flickTargetDuration: 1.3,
    flickTargetCount: 60,
    microTargetScale: 0.5,
    microTargetCount: 40,
  },
  [DIFFICULTY.HARD]: {
    targetRadius: 0.25,
    targetLifetime: 1.5,
    spawnInterval: 0.4,
    gridSize: 5,
    trackingSpeed: 3.5,
    flickTargetDuration: 0.9,
    flickTargetCount: 80,
    microTargetScale: 0.3,
    microTargetCount: 50,
  },
};

// Game tuning constants
export const GAME_CONFIG = {
  COUNTDOWN_DURATION: 3.5,
  MAX_DELTA: 0.1,
  TRACKING_SCORE_RATE: 50,
  ACCENT_LIGHT_BASE: 3,
  ACCENT_LIGHT_PEAK: 8,
  ACCENT_LIGHT_DECAY: 8,
  COMBO_MILESTONE_INTERVAL: 5,
  HIT_SCORE_BASE: 100,
  COMBO_MULTIPLIER_5: 1.5,
  COMBO_MULTIPLIER_10: 2,
  TIME_BONUS_FAST: 50,
  TIME_BONUS_OK: 25,
  TIME_BONUS_THRESHOLD_FAST: 300,
  TIME_BONUS_THRESHOLD_OK: 500,
};

export const COLORS = {
  background: 0x050508,
  target: 0x6366f1,
  targetHit: 0x818cf8,
  targetMiss: 0xef4444,
  targetTracking: 0xf59e0b,
  groundGrid: 0x0d0d18,
  groundLine: 0x1a1a30,
  crosshair: '#6366f1',
  crosshairHit: '#f1f1f4',
  crosshairMiss: '#ef4444',
  uiBg: '#090912',
  uiCard: '#0f0f1e',
  uiAccent: '#6366f1',
  uiText: '#e0e0e0',
  uiDim: '#5c5c6e',
};

export const CROSSHAIR_STYLES = {
  PLUS: 'plus',
  DOT: 'dot',
  CROSS: 'cross',
  CHEVRON: 'chevron',
};

export const CROSSHAIR_META = {
  [CROSSHAIR_STYLES.PLUS]: { label: '+ 字', icon: '+' },
  [CROSSHAIR_STYLES.DOT]: { label: '圆点', icon: '●' },
  [CROSSHAIR_STYLES.CROSS]: { label: '十字线', icon: '⌖' },
  [CROSSHAIR_STYLES.CHEVRON]: { label: '箭头', icon: '∧' },
};

export const DEFAULT_SETTINGS = {
  difficulty: DIFFICULTY.MEDIUM,
  volume: 0.7,
  crosshairStyle: CROSSHAIR_STYLES.PLUS,
  crosshairSize: 20,
};

const SETTINGS_KEY = 'aimlab_settings';
const STATS_KEY = 'aimlab_stats';

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Record<string, any>) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStats(stats: Record<string, any>) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

// Session history for charts
const HISTORY_KEY = 'aimlab_history';
const MAX_HISTORY = 50;

export function saveSessionResult(mode: string, score: number, accuracy: number) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : {};
    if (!history[mode]) history[mode] = [];
    history[mode].push({ score, accuracy, date: Date.now() });
    if (history[mode].length > MAX_HISTORY) {
      history[mode] = history[mode].slice(-MAX_HISTORY);
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* ignore */ }
}

export function loadSessionHistory(mode: string): Array<{ score: number; accuracy: number; date: number }> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : {};
    return history[mode] || [];
  } catch {
    return [];
  }
}
