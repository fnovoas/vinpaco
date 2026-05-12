/**
 * Tipos e interfaces para el visor de paleta
 */

export interface ColorInfo {
  hex: string;
  r: number;
  g: number;
  b: number;
  enabled: boolean;
}

export interface PixelCoords {
  pixelX: number;
  pixelY: number;
}

export interface SelectedPixel {
  x: number;
  y: number;
}

export interface AppState {
  sourceImageData: ImageData | null;
  paletteColors: ColorInfo[];
  imgName: string;
  imgW: number;
  imgH: number;
  scale: number;
  generatedBlob: Blob | null;
  isDragPanning: boolean;
  dragStartX: number;
  dragStartY: number;
  dragStartLeft: number;
  dragStartTop: number;
  isMouseDownOnCanvas: boolean;
  selectedClickPixel: SelectedPixel | null;
  selectedBorderColor: string | null;
  borderAnimationInterval: NodeJS.Timeout | null;
  clickTooltip: HTMLDivElement | null;
  origFile: File | null;
}
