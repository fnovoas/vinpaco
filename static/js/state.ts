/**
 * Gestión del estado global de la aplicación
 */

import { AppState } from './types';

export const state: AppState = {
  sourceImageData: null,
  paletteColors: [],
  imgName: '',
  imgW: 0,
  imgH: 0,
  scale: 1,
  generatedBlob: null,
  isDragPanning: false,
  dragStartX: 0,
  dragStartY: 0,
  dragStartLeft: 0,
  dragStartTop: 0,
  isMouseDownOnCanvas: false,
  selectedClickPixel: null,
  selectedBorderColor: null,
  borderAnimationInterval: null,
  clickTooltip: null,
  origFile: null,
};

export const resetState = (): void => {
  state.sourceImageData = null;
  state.paletteColors = [];
  state.selectedClickPixel = null;
  state.selectedBorderColor = null;
};
