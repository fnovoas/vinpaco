/**
 * Lógica de renderizado del canvas
 */

import { state } from './state';
import { getEnabledColorSet } from './palette';
import { byteHex } from './utils';

const RULER_PX = 20;

/**
 * Renderiza el canvas de salida con la paleta aplicada
 */
export const renderOutput = (): void => {
  if (!state.sourceImageData) return;

  const oc = document.getElementById('output-canvas') as HTMLCanvasElement;
  if (!oc) return;

  const ctx = oc.getContext('2d');
  if (!ctx) return;

  const showRuler = state.scale >= 3;
  const R = showRuler ? RULER_PX : 0;
  const gridToggle = document.getElementById('grid-toggle') as HTMLInputElement;
  const gridOn = gridToggle?.checked ?? false;

  oc.width = R + state.imgW * state.scale;
  oc.height = R + state.imgH * state.scale;
  ctx.clearRect(0, 0, oc.width, oc.height);

  const enabledSet = getEnabledColorSet();
  const src = state.sourceImageData.data;

  // Renderizar píxeles coloreados
  for (let row = 0; row < state.imgH; row++) {
    for (let col = 0; col < state.imgW; col++) {
      const i = (row * state.imgW + col) * 4;
      const r = src[i];
      const g = src[i + 1];
      const b = src[i + 2];
      const a = src[i + 3];
      if (a === 0) continue;
      const hex = '#' + byteHex(r) + byteHex(g) + byteHex(b);
      if (!enabledSet.has(hex)) continue;
      ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
      ctx.fillRect(R + col * state.scale, R + row * state.scale, state.scale, state.scale);
    }
  }

  // Renderizar cuadrícula si está habilitada
  if (gridOn) {
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineWidth = 1;
    for (let col = 0; col <= state.imgW; col++) {
      const x = R + col * state.scale + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, R);
      ctx.lineTo(x, R + state.imgH * state.scale);
      ctx.stroke();
    }
    for (let row = 0; row <= state.imgH; row++) {
      const y = R + row * state.scale + 0.5;
      ctx.beginPath();
      ctx.moveTo(R, y);
      ctx.lineTo(R + state.imgW * state.scale, y);
      ctx.stroke();
    }
  }

  // Renderizar borde del píxel seleccionado
  if (state.selectedClickPixel) {
    const borderX = R + state.selectedClickPixel.x * state.scale;
    const borderY = R + state.selectedClickPixel.y * state.scale;
    const borderColor = state.selectedBorderColor || '#ffffff';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = Math.max(1, Math.min(3, state.scale * 0.15));
    ctx.strokeRect(
      borderX + 0.5,
      borderY + 0.5,
      state.scale - 1,
      state.scale - 1
    );
  }

  // Renderizar regla si está habilitada
  if (showRuler) {
    const fontSize = Math.max(7, Math.min(11, Math.floor(state.scale * 0.55)));
    ctx.font = `${fontSize}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = '#666688';
    ctx.textBaseline = 'middle';

    ctx.textAlign = 'center';
    for (let col = 0; col < state.imgW; col++) {
      ctx.fillText(String(col + 1), R + col * state.scale + state.scale / 2, R / 2);
    }

    ctx.textAlign = 'right';
    for (let row = 0; row < state.imgH; row++) {
      ctx.fillText(String(row + 1), R - 3, R + row * state.scale + state.scale / 2);
    }
  }
};

/**
 * Carga una imagen generada (blob) en el canvas y actualiza el estado
 */
export const cargarImagenGenerada = (blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  const imgEl = new Image();

  imgEl.onload = () => {
    state.imgW = imgEl.width;
    state.imgH = imgEl.height;

    const sc = document.getElementById('source-canvas') as HTMLCanvasElement;
    if (!sc) return;

    sc.width = state.imgW;
    sc.height = state.imgH;
    const sctx = sc.getContext('2d');
    if (!sctx) return;

    sctx.drawImage(imgEl, 0, 0);
    state.sourceImageData = sctx.getImageData(0, 0, state.imgW, state.imgH);

    URL.revokeObjectURL(url);

    // Calcular escala automática
    const maxDim = Math.max(state.imgW, state.imgH);
    state.scale = Math.min(32, Math.max(1, Math.floor(480 / maxDim)));
    updateZoomLabel();

    // Actualizar visibilidad de cuadrícula
    const gridLabel = document.getElementById('grid-label') as HTMLElement;
    if (gridLabel) {
      gridLabel.style.display = state.scale >= 3 ? 'flex' : 'none';
    }
    const gridToggle = document.getElementById('grid-toggle') as HTMLInputElement;
    if (gridToggle && state.scale < 3) {
      gridToggle.checked = false;
    }

    // Importar funciones de otros módulos para evitar circular dependency
    import('./palette').then(({ detectColors }) => {
      import('./ui').then(({ buildUI, updateStats }) => {
        detectColors();
        buildUI();
        renderOutput();

        const panel = document.getElementById('panel') as HTMLElement;
        if (panel) panel.style.display = 'block';

        const statName = document.getElementById('stat-name');
        if (statName) statName.textContent = state.imgName;

        const statSize = document.getElementById('stat-size');
        if (statSize) statSize.textContent = state.imgW + ' × ' + state.imgH + ' px';

        updateStats();
      });
    });
  };

  imgEl.onerror = () => {
    alert('No se pudo leer la imagen. Elije un archivo de imagen válido.');
    state.origFile = null;
    const btn = document.getElementById('btn-generar') as HTMLButtonElement;
    if (btn) btn.disabled = true;
    URL.revokeObjectURL(url);
  };

  imgEl.src = url;
};

/**
 * Actualiza la etiqueta de zoom
 */
export const updateZoomLabel = (): void => {
  const zoomLevel = document.getElementById('zoom-level');
  if (zoomLevel) {
    zoomLevel.textContent = '×' + state.scale;
  }
};

/**
 * Actualiza la visibilidad del toggle de cuadrícula
 */
export const updateGridToggleVisibility = (): void => {
  const gridLabel = document.getElementById('grid-label') as HTMLElement;
  if (gridLabel) {
    gridLabel.style.display = state.scale >= 3 ? 'flex' : 'none';
  }
  if (state.scale < 3) {
    const gridToggle = document.getElementById('grid-toggle') as HTMLInputElement;
    if (gridToggle) gridToggle.checked = false;
  }
};

/**
 * Establece la escala de zoom
 */
export const setScale = (val: number | string): void => {
  let numVal: number;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (!Number.isFinite(parsed)) return;
    numVal = parsed;
  } else {
    numVal = val;
  }

  state.scale = Math.min(100, Math.max(1, Number(numVal.toFixed(2))));
  updateZoomLabel();
  updateGridToggleVisibility();
  updateSlider();
  renderOutput();
};

/**
 * Actualiza el slider de zoom visualmente
 */
export const updateSlider = (): void => {
  const slider = document.getElementById('zoom-slider') as HTMLInputElement;
  if (!slider) return;
  slider.value = String(state.scale);
  const pct = ((state.scale - 1) / (100 - 1)) * 100;
  slider.style.setProperty('--pct', pct.toFixed(2) + '%');
};

/**
 * Obtiene el código hexadecimal del color de un pixel específico
 */
export const getPixelHex = (x: number, y: number): string | null => {
  if (!state.sourceImageData) return null;
  const i = (y * state.imgW + x) * 4;
  const src = state.sourceImageData.data;
  const r = src[i];
  const g = src[i + 1];
  const b = src[i + 2];
  return '#' + byteHex(r) + byteHex(g) + byteHex(b);
};
