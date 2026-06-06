/**
 * Construcción y actualización de componentes UI
 */

import { state } from './state';
import { toggleColor, getActiveColorCount } from './palette';
import { renderOutput } from './canvas';

/**
 * Construye la cuadrícula de chips de color
 */
export const buildUI = (): void => {
  const grid = document.getElementById('color-grid');
  if (!grid) return;

  grid.innerHTML = '';

  state.paletteColors.forEach((col, idx) => {
    const chip = document.createElement('div');
    chip.className = 'color-chip';
    chip.dataset.idx = String(idx);
    chip.innerHTML = `
      <div class="chip-swatch" style="background:${col.hex}"></div>
      <span class="chip-label">${col.hex}</span>
      <div class="chip-check">
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
          <path d="M1 3L3 5L7 1" stroke="#8890ef" stroke-width="1.6"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>`;
    chip.addEventListener('click', () => {
      toggleColor(idx);
      chip.classList.toggle('disabled', !state.paletteColors[idx].enabled);
      renderOutput();
      updateStats();
    });
    chip.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      chip.classList.toggle('marked');
    });
    grid.appendChild(chip);
  });

  updateStats();
};

/**
 * Actualiza las estadísticas mostradas en la interfaz
 */
export const updateStats = (): void => {
  const active = getActiveColorCount();
  const statActive = document.getElementById('stat-active');
  if (statActive) statActive.textContent = String(active);

  const statTotal = document.getElementById('stat-total');
  if (statTotal) statTotal.textContent = String(state.paletteColors.length);

  // Actualizar también el contador en la sección de colores
  const activeColorCount = document.getElementById('active-color-count');
  if (activeColorCount) activeColorCount.textContent = String(active);

  const totalColorCount = document.getElementById('total-color-count');
  if (totalColorCount) totalColorCount.textContent = String(state.paletteColors.length);
};

/**
 * Actualiza el estado visual del chip de color
 */
export const updateChipVisual = (idx: number): void => {
  const chip = document.querySelector(
    `.color-chip[data-idx="${idx}"]`
  ) as HTMLElement;
  if (chip && idx < state.paletteColors.length) {
    chip.classList.toggle('disabled', !state.paletteColors[idx].enabled);
  }
};

/**
 * Resalta el chip de color correspondiente al hex dado
 */
export const highlightColorChip = (hex: string): void => {
  // Quitar resaltado anterior
  const prevHighlighted = document.querySelector('.color-chip.highlighted');
  if (prevHighlighted) {
    prevHighlighted.classList.remove('highlighted');
  }

  // Encontrar y resaltar el chip
  const chips = document.querySelectorAll('.color-chip');
  for (const chip of chips) {
    const label = chip.querySelector('.chip-label');
    if (label && label.textContent === hex) {
      chip.classList.add('highlighted');
      break;
    }
  }
};

/**
 * Quita el resaltado de todos los chips de color
 */
export const unhighlightColorChips = (): void => {
  const highlighted = document.querySelector('.color-chip.highlighted');
  if (highlighted) {
    highlighted.classList.remove('highlighted');
  }
};
