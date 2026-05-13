import { Game } from './Game.js';
import { MainMenu } from './ui/MainMenu.js';
import { SettingsPanel } from './ui/SettingsPanel.js';
import { MODES, loadSettings } from './utils/constants.js';

const settings = loadSettings();
const game = new Game(document.getElementById('game-container'));
const mainMenu = new MainMenu(document.getElementById('ui-overlay'));
const settingsPanel = new SettingsPanel(document.getElementById('ui-overlay'), settings);

// Playlist state
let playlistQueue = [];
let playlistIndex = 0;
mainMenu.onModeSelect = (mode) => {
  mainMenu.hide();
  game.start(mode, settings);
};

mainMenu.onPlaylistSelect = (modes) => {
  playlistQueue = modes;
  playlistIndex = 0;
  mainMenu.hide();
  game.start(playlistQueue[0], settings);
};

mainMenu.onDailyChallenge = () => {
  // Deterministic random based on date
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) hash = ((hash << 5) - hash) + today.charCodeAt(i);
  const modeIds = [MODES.GRIDSHOT, MODES.FLICKING, MODES.TRACKING, MODES.MICROSHOT];
  const diffs = ['easy', 'medium', 'hard'];
  const mode = modeIds[Math.abs(hash) % modeIds.length];
  const diff = diffs[Math.abs(hash >> 4) % diffs.length];

  // Save current difficulty, restore after challenge ends
  const savedDifficulty = settings.difficulty;
  settings.difficulty = diff;
  mainMenu.hide();
  game.start(mode, settings);

  // Restore after the game session
  const restoreDifficulty = () => {
    settings.difficulty = savedDifficulty;
    document.removeEventListener('game:menu', restoreDifficulty);
  };
  document.addEventListener('game:menu', restoreDifficulty, { once: true });
};

mainMenu.onSettingsOpen = () => {
  mainMenu.hide();
  settingsPanel.show(() => {
    settingsPanel.hide();
    mainMenu.show();
  });
};

settingsPanel.onSettingsChanged = (newSettings) => {
  Object.assign(settings, newSettings);
};

document.addEventListener('game:menu', () => {
  // Check if there's a next mode in playlist
  if (playlistQueue.length > 0 && playlistIndex < playlistQueue.length - 1) {
    playlistIndex++;
    game.start(playlistQueue[playlistIndex], settings);
  } else {
    playlistQueue = [];
    playlistIndex = 0;
    mainMenu.show();
  }
});

mainMenu.show();
