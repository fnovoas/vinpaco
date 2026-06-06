/**
 * Manejadores de interacciones (drag, click, zoom, etc.)
 */
import { generarPaleta as procesarPaleta, countUniqueColors } from './palette';
import { state } from './state';
import { renderOutput, setScale, cargarImagenGenerada, getPixelHex, createExportBlob } from './canvas';
import { setAllColors } from './palette';
import { updateChipVisual, buildUI, updateStats, highlightColorChip, unhighlightColorChips } from './ui';

const MAX_IMAGE_DIM = 999;
const ZOOM_STEP = 0.25;
const RULER_PX = 20;

/**
 * Configura los event listeners al cargar el DOM
 */
export const setupInteractions = (): void => {
  setupFileUpload();
  setupCanvasInteractions();
  setupZoomControls();
  setupGridToggle();
  setupBackgroundToggle();
  setupGeneralButtons();
  setupNColoresInput();
};

/**
 * Configura drag & drop y carga de archivo
 */
const setupFileUpload = (): void => {
  const dz = document.getElementById('drop-orig');
  if (!dz) return;

  dz.addEventListener('dragover', (e: Event) => {
    e.preventDefault();
    dz.classList.add('drag-over');
  });

  dz.addEventListener('dragleave', () => {
    dz.classList.remove('drag-over');
  });

  dz.addEventListener('drop', (e: Event) => {
    e.preventDefault();
    dz.classList.remove('drag-over');
    const dropEvent = e as DragEvent;
    const files = dropEvent.dataTransfer?.files;
    if (files && files[0]) {
      setOrigFile(files[0], dz);
    }
  });

  const fileInput = document.getElementById('file-orig') as HTMLInputElement;
  if (fileInput) {
    fileInput.addEventListener('change', (e: Event) => {
      const input = e.target as HTMLInputElement;
      const files = input.files;
      if (files && files[0]) {
        setOrigFile(files[0], dz);
      }
    });
  }
};

/**
 * Maneja la carga de archivo de imagen
 */
const setOrigFile = (file: File, dropZone: Element): void => {
  const url = URL.createObjectURL(file);
  const tempImg = new Image();

  tempImg.onload = () => {
    if (tempImg.width > MAX_IMAGE_DIM || tempImg.height > MAX_IMAGE_DIM) {
      alert(
        `La imagen no puede superar ${MAX_IMAGE_DIM}×${MAX_IMAGE_DIM} píxeles.\nDimensiones: ${tempImg.width}×${tempImg.height}.`
      );
      state.origFile = null;
      const btn = document.getElementById('btn-generar') as HTMLButtonElement;
      if (btn) btn.disabled = true;
      URL.revokeObjectURL(url);
      return;
    }

    const uniqueColors = countUniqueColors(tempImg);
    if (uniqueColors >= 9000) {
      alert(
        `La imagen no puede tener 9000 colores o más.\nColores detectados: ${uniqueColors}.`
      );
      state.origFile = null;
      const btn = document.getElementById('btn-generar') as HTMLButtonElement;
      if (btn) btn.disabled = true;
      URL.revokeObjectURL(url);
      return;
    }

    state.origFile = file;
    state.imgName = file.name;
    const p = dropZone.querySelector('p');
    if (p) p.innerHTML = `<strong>${file.name}</strong>`;
    const btn = document.getElementById('btn-generar') as HTMLButtonElement;
    if (btn) btn.disabled = false;
    URL.revokeObjectURL(url);
  };

  tempImg.onerror = () => {
    alert('No se pudo leer la imagen. Elije un archivo de imagen válido.');
    state.origFile = null;
    const btn = document.getElementById('btn-generar') as HTMLButtonElement;
    if (btn) btn.disabled = true;
    URL.revokeObjectURL(url);
  };

  tempImg.src = url;
};

/**
 * Configura controles de zoom
 */
const setupZoomControls = (): void => {
  const slider = document.getElementById('zoom-slider') as HTMLInputElement;
  if (slider) {
    slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      if (Number.isFinite(value)) {
        setScale(value);
      }
    });
  }

  (window as any).zoomIn = () => {
    setScale(state.scale + ZOOM_STEP);
  };

  (window as any).zoomOut = () => {
    setScale(state.scale - ZOOM_STEP);
  };
};

/**
 * Configura el toggle de cuadrícula
 */
const setupGridToggle = (): void => {
  const gridToggle = document.getElementById(
    'grid-toggle'
  ) as HTMLInputElement;
  if (gridToggle) {
    gridToggle.addEventListener('change', renderOutput);
  }
};

/**
 * Configura el toggle de fondo claro/oscuro del visor
 */
const setupBackgroundToggle = (): void => {
  const btn = document.getElementById('bg-toggle') as HTMLButtonElement;
  const wrapper = document.getElementById('canvas-wrapper') as HTMLElement;
  if (!btn || !wrapper) return;

  const syncBackgroundToggle = (isLight: boolean): void => {
    wrapper.classList.toggle('light-bg', isLight);
    btn.textContent = isLight ? 'Fondo claro' : 'Fondo oscuro';
    btn.setAttribute('aria-pressed', String(isLight));
  };

  btn.addEventListener('click', () => {
    syncBackgroundToggle(!wrapper.classList.contains('light-bg'));
  });

  syncBackgroundToggle(false);
};

/**
 * Configura la validación del input de número de colores
 */
const setupNColoresInput = (): void => {
  const input = document.getElementById('n-colores') as HTMLInputElement;
  if (!input) return;

  input.addEventListener('input', () => {
    if (input.value === '') return;
    const val = parseInt(input.value, 10);
    if (val > 500) {
      input.value = '500';
    } else if (val <= 0) {
      input.value = '1';
    }
  });

  input.addEventListener('blur', () => {
    if (input.value === '' || parseInt(input.value, 10) < 1) {
      input.value = '1';
    }
  });
};

/**
 * Configura botones generales
 */
const setupGeneralButtons = (): void => {
  (window as any).setAll = (state_val: boolean) => {
    setAllColors(state_val);
    state.paletteColors.forEach((c, i) => {
      updateChipVisual(i);
    });
    renderOutput();
    updateStats();
  };

  (window as any).generarPaleta = generarPaleta;
  (window as any).descargarImagen = descargarImagen;
  (window as any).exportarColoresJSON = exportarColoresJSON;
};

/**
 * Genera la paleta mediante llamada a Flask
 */
const generarPaleta = async (): Promise<void> => {
  if (!state.origFile) return;

  const nColoresInput = document.getElementById('n-colores') as HTMLInputElement;
  const nColores = parseInt(nColoresInput?.value ?? '8', 10);
  if (!nColores || nColores < 1) return;

  const btn = document.getElementById('btn-generar') as HTMLButtonElement;
  const spinner = document.getElementById('spinner');

  if (btn) btn.disabled = true;
  if (spinner) spinner.style.display = 'inline';

  try {
    // Cargar imagen en canvas oculto para obtener ImageData
    const url = URL.createObjectURL(state.origFile);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    URL.revokeObjectURL(url);

    const srcCanvas = document.getElementById('source-canvas') as HTMLCanvasElement;
    srcCanvas.width = img.width;
    srcCanvas.height = img.height;
    const ctx = srcCanvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    // Procesar en TypeScript (sin servidor)
    const resultData = procesarPaleta(imageData, nColores);

    // Convertir ImageData → Blob
    const offscreen = document.createElement('canvas');
    offscreen.width = img.width;
    offscreen.height = img.height;
    offscreen.getContext('2d')!.putImageData(resultData, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) =>
      offscreen.toBlob(b => b ? resolve(b) : reject(new Error('toBlob falló')), 'image/png')
    );

    state.generatedBlob = blob;
    cargarImagenGenerada(blob);
  } catch (err) {
    alert('Error al generar la paleta:\n' + (err as Error).message);
  } finally {
    if (btn) btn.disabled = false;
    if (spinner) spinner.style.display = 'none';
  }
};

/**
 * Descarga la imagen con transparencia en los colores deshabilitados
 */
const descargarImagen = async (): Promise<void> => {
  if (!state.sourceImageData) return;

  let blob: Blob | null;
  try {
    blob = await createExportBlob();
  } catch {
    alert('No se pudo generar la imagen para descargar.');
    return;
  }
  if (!blob) return;

  const base = state.imgName.replace(/\.[^.]+$/, '');
  const nColoresInput = document.getElementById('n-colores') as HTMLInputElement;
  const n = nColoresInput?.value ?? '8';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${base}_paleta_${n}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

/**
 * Exporta la lista de colores a un archivo JSON
 */
const exportarColoresJSON = (): void => {
  if (!state.paletteColors || state.paletteColors.length === 0) {
    alert('No hay colores generados para exportar.');
    return;
  }

  const colors = state.paletteColors.map((c) => c.hex);
  const jsonStr = JSON.stringify(colors, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });

  const base = state.imgName ? state.imgName.replace(/\.[^.]+$/, '') : 'paleta';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${base}_colores.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

/**
 * Configura interacciones del canvas
 */
const setupCanvasInteractions = (): void => {
  const outputCanvas = document.getElementById(
    'output-canvas'
  ) as HTMLCanvasElement;
  if (!outputCanvas) return;

  const canvasWrapper = document.getElementById(
    'canvas-wrapper'
  ) as HTMLElement;
  if (!canvasWrapper) return;

  // Click en canvas para seleccionar píxel
  outputCanvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    state.isMouseDownOnCanvas = true;
    const { pixelX, pixelY } = getCanvasPixelCoords(e.clientX, e.clientY);

    if (pixelX >= 0 && pixelX < state.imgW && pixelY >= 0 && pixelY < state.imgH) {
      state.selectedClickPixel = { x: pixelX, y: pixelY };
      const hex = getPixelHex(pixelX, pixelY) || '#000000';
      showClickTooltip(e.clientX, e.clientY, `(${pixelY + 1}, ${pixelX + 1})`, hex);
      startBorderAnimation();
    } else {
      state.selectedClickPixel = null;
      hideClickTooltip();
      stopBorderAnimation();
    }
    renderOutput();

    const onMouseMove = (event: MouseEvent) => {
      if (!state.isMouseDownOnCanvas) return;
      if (state.isDragPanning) {
        state.selectedClickPixel = null;
        hideClickTooltip();
        stopBorderAnimation();
        renderOutput();
        return;
      }
      const { pixelX: px, pixelY: py } = getCanvasPixelCoords(
        event.clientX,
        event.clientY
      );
      if (px >= 0 && px < state.imgW && py >= 0 && py < state.imgH) {
        state.selectedClickPixel = { x: px, y: py };
        const hex = getPixelHex(px, py) || '#000000';
        updateClickTooltip(event.clientX, event.clientY, `(${px + 1}, ${py + 1})`, hex);
        if (!state.borderAnimationInterval) {
          startBorderAnimation();
        }
      } else {
        state.selectedClickPixel = null;
        hideClickTooltip();
        stopBorderAnimation();
      }
      renderOutput();
    };

    const onMouseUp = () => {
      state.isMouseDownOnCanvas = false;
      state.selectedClickPixel = null;
      hideClickTooltip();
      stopBorderAnimation();
      renderOutput();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  // Drag & pan en canvas
  canvasWrapper.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    state.isDragPanning = false;
    state.dragStartX = e.clientX;
    state.dragStartY = e.clientY;
    state.dragStartLeft = canvasWrapper.scrollLeft;
    state.dragStartTop = canvasWrapper.scrollTop;
    canvasWrapper.classList.add('dragging');

    const onMouseMove = (event: MouseEvent) => {
      const dx = event.clientX - state.dragStartX;
      const dy = event.clientY - state.dragStartY;
      if (!state.isDragPanning && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        state.isDragPanning = true;
        state.selectedClickPixel = null;
        hideClickTooltip();
        renderOutput();
      }
      canvasWrapper.scrollLeft = state.dragStartLeft - dx;
      canvasWrapper.scrollTop = state.dragStartTop - dy;
    };

    const onMouseUp = () => {
      canvasWrapper.classList.remove('dragging');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setTimeout(() => {
        state.isDragPanning = false;
      }, 0);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    e.preventDefault();
  });

  // Click en canvas para mostrar coordenadas
  outputCanvas.addEventListener('click', (e) => {
    if (state.isDragPanning) return;
    const rect = outputCanvas.getBoundingClientRect();
    const R = state.scale >= 3 ? RULER_PX : 0;
    const pixelX = Math.floor((e.clientX - rect.left - R) / state.scale);
    const pixelY = Math.floor((e.clientY - rect.top - R) / state.scale);

    const coords = document.getElementById('stat-pixel-coords');
    if (coords) {
      if (pixelX >= 0 && pixelX < state.imgW && pixelY >= 0 && pixelY < state.imgH) {
        coords.textContent = `(${pixelY + 1}, ${pixelX + 1})`;
      } else {
        coords.textContent = '—';
      }
    }
  });
};

/**
 * Obtiene las coordenadas de píxel del canvas desde coordenadas del cliente
 */
const getCanvasPixelCoords = (clientX: number, clientY: number) => {
  const outputCanvas = document.getElementById(
    'output-canvas'
  ) as HTMLCanvasElement;
  if (!outputCanvas) return { pixelX: -1, pixelY: -1 };

  const rect = outputCanvas.getBoundingClientRect();
  const R = state.scale >= 3 ? RULER_PX : 0;
  const pixelX = Math.floor((clientX - rect.left - R) / state.scale);
  const pixelY = Math.floor((clientY - rect.top - R) / state.scale);
  return { pixelX, pixelY };
};

/**
 * Inicia la animación del borde del píxel seleccionado
 */
const startBorderAnimation = (): void => {
  stopBorderAnimation();
  state.selectedBorderColor = '#ffffff';
  renderOutput();
  state.borderAnimationInterval = setInterval(() => {
    state.selectedBorderColor =
      state.selectedBorderColor === '#ffffff' ? '#5c5fef' : '#ffffff';
    renderOutput();
  }, 300);
};

/**
 * Detiene la animación del borde
 */
const stopBorderAnimation = (): void => {
  if (state.borderAnimationInterval) {
    clearInterval(state.borderAnimationInterval);
    state.borderAnimationInterval = null;
  }
  state.selectedBorderColor = null;
};

/**
 * Asegura que existe el tooltip y lo retorna
 */
const ensureClickTooltip = (): HTMLDivElement => {
  if (state.clickTooltip) return state.clickTooltip;

  const tooltip = document.createElement('div');
  tooltip.id = 'click-tooltip';
  tooltip.style.position = 'fixed';
  tooltip.style.display = 'none';
  tooltip.style.padding = '6px 10px';
  tooltip.style.fontFamily = 'IBM Plex Mono, monospace';
  tooltip.style.fontSize = '11px';
  tooltip.style.color = '#e0dfd8';
  tooltip.style.background = 'rgba(15, 15, 25, 0.95)';
  tooltip.style.border = '1px solid rgba(92, 95, 239, 0.25)';
  tooltip.style.borderRadius = '6px';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.zIndex = '9999';
  tooltip.style.whiteSpace = 'pre-line';
  document.body.appendChild(tooltip);
  state.clickTooltip = tooltip;
  return tooltip;
};

/**
 * Posiciona el tooltip
 */
const positionClickTooltip = (clientX: number, clientY: number): void => {
  const tooltip = ensureClickTooltip();
  const offsetX = 12;
  const offsetY = 24;
  let left = clientX + offsetX;
  let top = clientY - offsetY;
  const padding = 8;
  const rect = tooltip.getBoundingClientRect();
  const maxRight = window.innerWidth - padding;
  const maxTop = window.innerHeight - padding;

  if (left + rect.width > maxRight) left = clientX - rect.width - offsetX;
  if (top < padding) top = clientY + offsetX;
  if (top + rect.height > maxTop) top = maxTop - rect.height;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
};

/**
 * Muestra el tooltip
 */
const showClickTooltip = (
  clientX: number,
  clientY: number,
  coords: string,
  hex: string
): void => {
  const tooltip = ensureClickTooltip();
  tooltip.innerHTML = `${coords}<br>${hex}`;
  tooltip.style.display = 'block';
  positionClickTooltip(clientX, clientY);
  highlightColorChip(hex);
};

/**
 * Actualiza el contenido del tooltip
 */
const updateClickTooltip = (
  clientX: number,
  clientY: number,
  coords: string,
  hex: string
): void => {
  if (!state.clickTooltip) return;
  state.clickTooltip.innerHTML = `${coords}<br>${hex}`;
  positionClickTooltip(clientX, clientY);
  highlightColorChip(hex);
};

/**
 * Oculta el tooltip
 */
const hideClickTooltip = (): void => {
  if (!state.clickTooltip) return;
  state.clickTooltip.style.display = 'none';
  unhighlightColorChips();
};
