import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { TargetManager } from './TargetManager.js';
import { ScoreManager } from './ScoreManager.js';
import { AudioManager } from './AudioManager.js';
import { ParticleSystem, ScreenShake } from './ParticleSystem.js';
import { WeaponModel } from './WeaponModel.js';
import { DecalManager } from './DecalManager.js';
import { HUD } from './ui/HUD.js';
import { ResultsPanel } from './ui/ResultsPanel.js';
import { GAME_STATE, MODES, COLORS, DIFFICULTY_PRESETS, GAME_CONFIG, saveStats, loadStats, saveSessionResult } from './utils/constants.js';
import { GridshotMode } from './modes/GridshotMode.js';
import { TrackingMode } from './modes/TrackingMode.js';
import { FlickingMode } from './modes/FlickingMode.js';
import { MicroshotMode } from './modes/MicroshotMode.js';

const MODE_CLASSES = {
  [MODES.GRIDSHOT]: GridshotMode,
  [MODES.TRACKING]: TrackingMode,
  [MODES.FLICKING]: FlickingMode,
  [MODES.MICROSHOT]: MicroshotMode,
};

export class Game {
  constructor(container) {
    this.container = container;
    this.state = GAME_STATE.MENU;
    this.currentMode = null;
    this.modeInstance = null;
    this.settings = null;
    this.elapsed = 0;
    this.countdownValue = 3;
    this.countdownTimer = 0;
    this.warmupTimer = 0;

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLighting();
    this._initEnvironment();

    this.input = new InputManager(this.renderer, this.camera);
    this.targetManager = new TargetManager(this.scene);
    this.scoreManager = new ScoreManager();
    this.audio = new AudioManager();
    this.particles = new ParticleSystem(this.scene);
    this.screenShake = new ScreenShake(this.camera);
    this.weapon = new WeaponModel(this.camera);
    this.decals = new DecalManager(this.scene, -8);
    this.hud = new HUD();
    this.resultsPanel = new ResultsPanel(document.getElementById('ui-overlay'));

    this.clock = new THREE.Clock();
    this._animate = this._animate.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    window.addEventListener('resize', () => this._onResize());
    window.addEventListener('keydown', this._onKeyDown);
    this.renderer.domElement.addEventListener('click', this._onClick);

    this._animate();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.background);
    this.scene.fog = new THREE.Fog(COLORS.background, 15, 35);
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.5, 5);
    this.camera.lookAt(0, 0, -5);
  }

  _initLighting() {
    const ambient = new THREE.AmbientLight(0x0c0c1a, 1.0);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 2);
    dir.position.set(5, 10, 5);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 50;
    this.scene.add(dir);

    this.accentLight = new THREE.PointLight(COLORS.target, 3, 20);
    this.accentLight.position.set(0, 2, -2);
    this.scene.add(this.accentLight);
  }

  _initEnvironment() {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({ color: COLORS.groundGrid, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid lines
    const gridHelper = new THREE.PolarGridHelper(10, 32, 18, 64, COLORS.groundLine, COLORS.groundLine);
    gridHelper.position.y = -2.99;
    this.scene.add(gridHelper);

    // Target wall
    const wallGeo = new THREE.PlaneGeometry(8, 6);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a18,
      roughness: 0.5,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.z = -8;
    wall.receiveShadow = true;
    this.scene.add(wall);
    this.targetWall = wall;

    // Wall border
    const borderGeo = new THREE.EdgesGeometry(wallGeo);
    const borderLine = new THREE.LineSegments(
      borderGeo,
      new THREE.LineBasicMaterial({ color: 0x1a1a30, transparent: true, opacity: 0.4 }),
    );
    borderLine.position.copy(wall.position);
    this.scene.add(borderLine);
  }

  start(modeId, settings) {
    this.settings = settings;
    const preset = DIFFICULTY_PRESETS[settings.difficulty];
    this.currentMode = modeId;

    const ModeClass = MODE_CLASSES[modeId];
    this.modeInstance = new ModeClass(preset);
    this.particles.clear();
    this.screenShake.reset();

    // Apply settings
    this.audio.setVolume(settings.volume);
    this.input.setStyle(settings.crosshairStyle || 'plus');
    const size = settings.crosshairSize || 20;
    this.input.crosshairEl.style.fontSize = size + 'px';

    this._enterWarmup();
  }

  _enterWarmup() {
    this.state = GAME_STATE.WARMUP;
    this.warmupTimer = 0;
    this.targetManager.setMode(this.modeInstance, this.settings.difficulty);
    this.scoreManager.reset();
    this.particles.clear();

    const config = this.modeInstance.getSpawnConfig();
    this.targetManager.spawnWave(config, 0);

    this.hud.show();
    this.hud.showWarmup();
  }

  _endWarmup() {
    this.targetManager.clearAll();
    this.particles.clear();
    this.decals.clear();
    this.hud.hideWarmup();
    this._enterCountdown();
  }

  _enterCountdown() {
    this.state = GAME_STATE.COUNTDOWN;
    this.countdownValue = 3;
    this.countdownTimer = 0;
    this.hud.show();
    this.hud.showCountdown(this.countdownValue);
    this.audio.playCountdown();
  }

  _startPlaying() {
    this.state = GAME_STATE.PLAYING;
    this.elapsed = 0;
    this.scoreManager.reset();
    this.targetManager.setMode(this.modeInstance, this.settings.difficulty);
    this.particles.clear();

    const config = this.modeInstance.getSpawnConfig();
    this.targetManager.spawnWave(config, this.elapsed);

    this.hud.hideCountdown();
    this.audio.playStart();
    document.body.classList.add('playing');
  }

  _endSession() {
    this.state = GAME_STATE.RESULTS;
    document.body.classList.remove('playing');
    this.audio.playEnd();
    this.hud.hide();
    this.screenShake.reset();
    this.particles.clear();

    const summary = this.scoreManager.getSummary();
    summary.mode = this.currentMode;
    summary.duration = this.elapsed;

    const stats = loadStats();
    const modeStats = stats[this.currentMode] || {};
    const isNewBest = !modeStats.bestScore || summary.score > modeStats.bestScore;
    if (isNewBest) {
      modeStats.bestScore = summary.score;
      modeStats.bestAccuracy = summary.accuracy;
    }
    stats[this.currentMode] = modeStats;
    saveStats(stats);
    saveSessionResult(this.currentMode, summary.score, summary.accuracy);

    summary.isNewBest = isNewBest;
    this.resultsPanel.show(summary, () => this._backToMenu());
    this.targetManager.clearAll();
    this.decals.clear();
  }

  _backToMenu() {
    this.state = GAME_STATE.MENU;
    this.modeInstance = null;
    this.targetManager.clearAll();
    this.particles.clear();
    this.decals.clear();
    this.resultsPanel.hide();
    document.body.classList.remove('playing');
    document.dispatchEvent(new CustomEvent('game:menu'));
  }

  _onClick(event) {
    if (this.state !== GAME_STATE.PLAYING && this.state !== GAME_STATE.WARMUP) return;
    const isWarmup = this.state === GAME_STATE.WARMUP;

    const hit = this.input.getIntersection(this.targetManager.getTargets(), event);

    if (hit && hit.instanceId === undefined) {
      // Individual target hit — only process if target is alive
      const target = hit.target;
      if (target && target.isAlive()) {
        this.targetManager.handleHit(target);
        this.audio.playHit();
        this.input.showHitMarker();
        this.particles.emit(target.mesh.position.clone(), 10, COLORS.targetHit);
        this.accentLight.intensity = GAME_CONFIG.ACCENT_LIGHT_PEAK;
        this.decals.add(target.mesh.position);
        this._recoilAmount = 1;
        if (!isWarmup) {
          const reactionTime = performance.now() - (target.spawnedAt || performance.now());
          const prevCombo = this.scoreManager.combo;
          this.scoreManager.recordHit(reactionTime);
          if (this.scoreManager.combo > prevCombo) {
            this.hud.animateCombo();
            if (this.scoreManager.combo % GAME_CONFIG.COMBO_MILESTONE_INTERVAL === 0) {
              this.audio.playCombo(this.scoreManager.combo);
            }
          }
          if (this.modeInstance.onHit) this.modeInstance.onHit(target, reactionTime);
        }
      }
    } else if (hit && hit.instanceId !== undefined && hit.instanceId >= 0) {
      // Instanced mesh hit (Gridshot mode)
      if (this.targetManager.isInstancedHitAlive(hit.instanceId)) {
        this.targetManager.handleHit(hit.instanceId);
        this.audio.playHit();
        this.input.showHitMarker();
        const pos = this.targetManager.getInstancedPosition(hit.instanceId) || hit.point;
        this.particles.emit(pos.clone(), 10, COLORS.targetHit);
        this.accentLight.intensity = GAME_CONFIG.ACCENT_LIGHT_PEAK;
        this.decals.add(pos);
        this._recoilAmount = 1;
        if (!isWarmup) {
          const spawnedAt = this.targetManager._instanceData[hit.instanceId].spawnedAt;
          const reactionTime = performance.now() - spawnedAt;
          const prevCombo = this.scoreManager.combo;
          this.scoreManager.recordHit(reactionTime);
          if (this.scoreManager.combo > prevCombo) {
            this.hud.animateCombo();
            if (this.scoreManager.combo % GAME_CONFIG.COMBO_MILESTONE_INTERVAL === 0) {
              this.audio.playCombo(this.scoreManager.combo);
            }
          }
        }
      }
    } else if (!isWarmup && this.currentMode !== MODES.TRACKING) {
      this.scoreManager.recordMiss();
      this.audio.playMiss();
      this.screenShake.trigger(0.15, 0.12);
    }
  }

  _animate() {
    requestAnimationFrame(this._animate);
    const dt = Math.min(this.clock.getDelta(), GAME_CONFIG.MAX_DELTA);

    // Decay accent light
    if (this.accentLight.intensity > GAME_CONFIG.ACCENT_LIGHT_BASE) {
      this.accentLight.intensity += (GAME_CONFIG.ACCENT_LIGHT_BASE - this.accentLight.intensity) * dt * GAME_CONFIG.ACCENT_LIGHT_DECAY;
    }

    if (this.state === GAME_STATE.WARMUP) {
      this.warmupTimer += dt;

      if (this.modeInstance) {
        this.modeInstance.update(dt, this.warmupTimer);
      }

      this.targetManager.update(dt, this.warmupTimer, this.modeInstance);

      const cfg = this.modeInstance?.getSpawnConfig();
      if (cfg && this.targetManager.shouldSpawn(cfg, this.warmupTimer)) {
        this.targetManager.spawnWave(cfg, this.warmupTimer);
      }

      this.input.update(this.targetManager.getTargets());

      this.hud.updateWarmup(5 - this.warmupTimer);

      if (this.warmupTimer >= 5) {
        this._endWarmup();
      }
    }

    if (this.state === GAME_STATE.COUNTDOWN) {
      this.countdownTimer += dt;
      const newVal = 3 - Math.floor(this.countdownTimer);
      if (newVal !== this.countdownValue && newVal >= 0) {
        this.countdownValue = newVal;
        this.hud.showCountdown(this.countdownValue > 0 ? this.countdownValue : 'GO!');
        if (this.countdownValue > 0) this.audio.playCountdown();
      }
      if (this.countdownTimer >= GAME_CONFIG.COUNTDOWN_DURATION) {
        this._startPlaying();
      }
    }

    if (this.state === GAME_STATE.PLAYING) {
      this.elapsed += dt;

      if (this.modeInstance) {
        this.modeInstance.update(dt, this.elapsed);
      }

      const expiredTargets = this.targetManager.update(dt, this.elapsed, this.modeInstance);
      for (const expired of expiredTargets) {
        this.scoreManager.recordMiss();
        this.screenShake.trigger(0.08, 0.1);
      }

      const cfg = this.modeInstance?.getSpawnConfig();
      if (cfg && this.targetManager.shouldSpawn(cfg, this.elapsed)) {
        this.targetManager.spawnWave(cfg, this.elapsed);
      }

      // Single raycaster pass for crosshair + tracking hover detection
      const hoverResult = this.input.update(this.targetManager.getTargets());

      if (this.currentMode === MODES.TRACKING) {
        // Reset all tracking targets first
        for (const t of this.targetManager.getTargets()) {
          if (t.mesh && t.mesh.material && t.mesh.material.emissiveIntensity !== undefined) {
            t.mesh.material.emissiveIntensity = 0.4;
          }
        }
        const ht = hoverResult?.target;
        if (ht && ht.isAlive && ht.isAlive()) {
          this.scoreManager.addTrackingScore(dt * GAME_CONFIG.TRACKING_SCORE_RATE);
          this.scoreManager.addTrackingTime(dt);
          ht.mesh.material.emissiveIntensity = 1.2;
        }
      }

      if (this.modeInstance?.isComplete(this.elapsed, this.targetManager.getTargets(), this.scoreManager)) {
        this._endSession();
      }

      this.hud.update({
        time: this.modeInstance?.getDuration() - this.elapsed || 0,
        score: this.scoreManager.score,
        accuracy: this.scoreManager.getAccuracy(),
        combo: this.scoreManager.combo,
      });
    }

    this.particles.update(dt);
    this.decals.update(dt);
    this.screenShake.update(dt);
    this.weapon.update(dt, this.input.mouse, this._recoilAmount || 0);
    if (this._recoilAmount > 0) {
      this._recoilAmount *= Math.pow(0.01, dt);
      if (this._recoilAmount < 0.01) this._recoilAmount = 0;
    }

    if (this.state !== GAME_STATE.MENU) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  _onKeyDown(event) {
    if (event.key === 'Escape') {
      if (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.COUNTDOWN) {
        this._endSession();
      }
    }
    if (event.key === ' ' || event.code === 'Space') {
      if (this.state === GAME_STATE.WARMUP) {
        event.preventDefault();
        this._endWarmup();
      }
    }
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
