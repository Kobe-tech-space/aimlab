import { DIFFICULTY, CROSSHAIR_STYLES, CROSSHAIR_META, saveSettings } from '../utils/constants.js';

export class SettingsPanel {
  constructor(container, settings) {
    this.container = container;
    this.settings = settings;
    this.onSettingsChanged = null;
    this._backCb = null;

    this.el = document.createElement('div');
    this.el.className = 'settings-panel';
    this.el.style.display = 'none';
    container.appendChild(this.el);
    this._build();
  }

  _build() {
    const card = document.createElement('div');
    card.className = 'settings-panel__card';

    // Title
    const title = document.createElement('h2');
    title.className = 'settings-panel__title';
    title.textContent = '设置';
    card.appendChild(title);

    // Difficulty
    this._addLabel(card, '难度');
    const diffGroup = this._addButtonGroup(card, [
      { label: '简单', value: DIFFICULTY.EASY },
      { label: '中等', value: DIFFICULTY.MEDIUM },
      { label: '困难', value: DIFFICULTY.HARD },
    ], this.settings.difficulty, (value) => {
      this.settings.difficulty = value;
      this._onChange();
    });

    // Volume
    this._addLabel(card, '音量');
    this._addSlider(card, this.settings.volume, (value) => {
      this.settings.volume = value;
      this._onChange();
    });

    // Crosshair style
    this._addLabel(card, '准星样式');
    const chStyles = [
      { label: CROSSHAIR_META[CROSSHAIR_STYLES.PLUS].icon, value: CROSSHAIR_STYLES.PLUS },
      { label: CROSSHAIR_META[CROSSHAIR_STYLES.DOT].icon, value: CROSSHAIR_STYLES.DOT },
      { label: CROSSHAIR_META[CROSSHAIR_STYLES.CROSS].icon, value: CROSSHAIR_STYLES.CROSS },
      { label: CROSSHAIR_META[CROSSHAIR_STYLES.CHEVRON].icon, value: CROSSHAIR_STYLES.CHEVRON },
    ];
    this._addButtonGroup(card, chStyles, this.settings.crosshairStyle || CROSSHAIR_STYLES.PLUS, (value) => {
      this.settings.crosshairStyle = value;
      this._onChange();
    });

    // Crosshair size
    this._addLabel(card, '准星大小');
    this._addSlider(card, (this.settings.crosshairSize - 12) / 28, (value) => {
      this.settings.crosshairSize = Math.round(12 + value * 28);
      this._onChange();
    });

    // Sensitivity converter
    this._addLabel(card, '灵敏度转换');
    const convRow = document.createElement('div');
    convRow.style.cssText = 'display:flex;gap:6px;align-items:center;';
    card.appendChild(convRow);

    const gameSelect = document.createElement('select');
    gameSelect.style.cssText = 'flex:1;padding:6px 8px;background:#0d0d18;color:#e0e0e0;border:1px solid #2a2a44;border-radius:6px;font-size:11px;font-family:inherit;';
    ['CS2 (默认)', 'Valorant', 'Overwatch 2', 'Apex Legends', 'Rainbow Six'].forEach((g, i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = g;
      gameSelect.appendChild(opt);
    });
    convRow.appendChild(gameSelect);

    const sensInput = document.createElement('input');
    sensInput.type = 'number';
    sensInput.placeholder = '灵敏度';
    sensInput.step = '0.01';
    sensInput.style.cssText = 'width:70px;padding:6px 8px;background:#0d0d18;color:#e0e0e0;border:1px solid #2a2a44;border-radius:6px;font-size:11px;font-family:inherit;';
    convRow.appendChild(sensInput);

    const dpiInput = document.createElement('input');
    dpiInput.type = 'number';
    dpiInput.placeholder = 'DPI';
    dpiInput.value = '800';
    dpiInput.style.cssText = 'width:60px;padding:6px 8px;background:#0d0d18;color:#e0e0e0;border:1px solid #2a2a44;border-radius:6px;font-size:11px;font-family:inherit;';
    convRow.appendChild(dpiInput);

    const resultEl = document.createElement('span');
    resultEl.style.cssText = 'font-size:11px;color:#6366f1;min-width:80px;text-align:right;';
    resultEl.textContent = '—';
    convRow.appendChild(resultEl);

    const rates = [1, 0.315, 6, 5, 12.9]; // Approx eDPI conversion factors to Aim Lab
    const updateConv = () => {
      const game = parseInt(gameSelect.value);
      const sens = parseFloat(sensInput.value);
      const dpi = parseFloat(dpiInput.value);
      if (sens && dpi) {
        const edpi = sens * dpi;
        const aimSens = (edpi * rates[game] / 1000).toFixed(2);
        resultEl.textContent = aimSens + ' Aim';
      } else {
        resultEl.textContent = '—';
      }
    };
    gameSelect.addEventListener('change', updateConv);
    sensInput.addEventListener('input', updateConv);
    dpiInput.addEventListener('input', updateConv);

    // Export / Import row
    const ioRow = document.createElement('div');
    ioRow.style.cssText = 'display:flex;gap:8px;margin-top:20px;';
    card.appendChild(ioRow);

    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn--ghost';
    exportBtn.style.flex = '1';
    exportBtn.textContent = '导出配置';
    exportBtn.addEventListener('click', () => this._export());
    ioRow.appendChild(exportBtn);

    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn--ghost';
    importBtn.style.flex = '1';
    importBtn.textContent = '导入配置';
    importBtn.addEventListener('click', () => this._fileInput.click());
    ioRow.appendChild(importBtn);

    // Hidden file input for import
    this._fileInput = document.createElement('input');
    this._fileInput.type = 'file';
    this._fileInput.accept = '.json';
    this._fileInput.style.display = 'none';
    this._fileInput.addEventListener('change', (e) => this._import(e));
    card.appendChild(this._fileInput);

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn--primary';
    backBtn.style.width = '100%';
    backBtn.style.marginTop = '12px';
    backBtn.textContent = '返回';
    backBtn.addEventListener('click', () => this._back());
    card.appendChild(backBtn);

    this.el.appendChild(card);
  }

  _export() {
    const blob = new Blob([JSON.stringify(this.settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aimlab-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  _import(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        Object.assign(this.settings, imported);
        saveSettings(this.settings);
        if (this.onSettingsChanged) this.onSettingsChanged(this.settings);
        // Rebuild UI
        this.el.innerHTML = '';
        this._build();
        this.el.style.display = 'flex';
      } catch {
        alert('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  _addLabel(parent, text) {
    const label = document.createElement('div');
    label.className = 'settings-panel__label';
    label.textContent = text;
    parent.appendChild(label);
  }

  _addButtonGroup(parent, options, selected, onChange) {
    const group = document.createElement('div');
    group.className = 'settings__btn-group';

    for (const opt of options) {
      const btn = document.createElement('button');
      btn.className = 'settings__btn-option';
      btn.textContent = opt.label;
      if (opt.value === selected) {
        btn.classList.add('settings__btn-option--active');
      }
      btn.addEventListener('click', () => {
        group.querySelectorAll('.settings__btn-option').forEach(b =>
          b.classList.remove('settings__btn-option--active')
        );
        btn.classList.add('settings__btn-option--active');
        onChange(opt.value);
      });
      group.appendChild(btn);
    }
    parent.appendChild(group);
    return group;
  }

  _addSlider(parent, initialValue, onChange) {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'settings__slider';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01';
    slider.value = initialValue;
    slider.addEventListener('input', () => onChange(parseFloat(slider.value)));
    parent.appendChild(slider);
  }

  _onChange() {
    saveSettings(this.settings);
    if (this.onSettingsChanged) this.onSettingsChanged(this.settings);
  }

  _back() {
    if (this._backCb) this._backCb();
  }

  show(backCb) {
    this._backCb = backCb;
    this.el.style.display = 'flex';
  }

  hide() { this.el.style.display = 'none'; }
}
