/**
 * palette.ts
 * Lógica de detección, manipulación y generación de paletas de colores
 */

import { state } from './state';
import { ColorInfo } from './types';
import { byteHex, hexToHSV } from './utils';

/* ============================================================================
 * DETECCIÓN Y MANEJO DE PALETA
 * ========================================================================== */

/**
 * Detecta los colores únicos en la imagen y los ordena por luminancia
 */
export const detectColors = (): void => {
  if (!state.sourceImageData) return;

  const data = state.sourceImageData.data;
  const seen = new Map<string, ColorInfo>();

  for (let i = 0; i < data.length; i += 4) {
    // Ignorar píxeles transparentes
    if (data[i + 3] === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const hex = '#' + byteHex(r) + byteHex(g) + byteHex(b);

    seen.set(hex, {
      hex,
      r,
      g,
      b,
      enabled: true,
    });
  }

  state.paletteColors = [...seen.values()]
    .sort((a, b) => {
      const colorA = hexToHSV(a.hex);
      const colorB = hexToHSV(b.hex);

      // 1. Prioridad: Matiz (Hue) para el orden del arcoíris
      if (colorA.h !== colorB.h) {
        return colorA.h - colorB.h;
      }
      // 2. Secundaria: Saturación (de menos a más intenso)
      if (colorA.s !== colorB.s) {
        return colorA.s - colorB.s;
      }
      // 3. Terciaria: Brillo (de oscuro a claro)
      return colorA.v - colorB.v;
    })
    .map((c) => ({
      ...c,
      enabled: true,
    }));
};

/**
 * Alterna el estado de habilitación de un color por índice
 */
export const toggleColor = (idx: number): void => {
  if (idx >= 0 && idx < state.paletteColors.length) {
    state.paletteColors[idx].enabled =
      !state.paletteColors[idx].enabled;
  }
};

/**
 * Habilita o deshabilita todos los colores
 */
export const setAllColors = (enabled: boolean): void => {
  state.paletteColors.forEach((c) => {
    c.enabled = enabled;
  });
};

/**
 * Obtiene el conjunto de colores habilitados en formato hex
 */
export const getEnabledColorSet = (): Set<string> => {
  return new Set(
    state.paletteColors
      .filter((c) => c.enabled)
      .map((c) => c.hex)
  );
};

/**
 * Cuenta colores activos
 */
export const getActiveColorCount = (): number => {
  return state.paletteColors.filter((c) => c.enabled).length;
};

/* ============================================================================
 * CONVERSIÓN DE COLOR
 * RGB <-> LAB
 * ========================================================================== */

/**
 * Conversión RGB → XYZ → LAB
 */
export function rgbToLab(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;

  const lin = (v: number): number =>
    v > 0.04045
      ? Math.pow((v + 0.055) / 1.055, 2.4)
      : v / 12.92;

  rn = lin(rn);
  gn = lin(gn);
  bn = lin(bn);

  const x =
    rn * 0.4124 +
    gn * 0.3576 +
    bn * 0.1805;

  const y =
    rn * 0.2126 +
    gn * 0.7152 +
    bn * 0.0722;

  const z =
    rn * 0.0193 +
    gn * 0.1192 +
    bn * 0.9505;

  const f = (t: number): number =>
    t > 0.008856
      ? Math.cbrt(t)
      : 7.787 * t + 16 / 116;

  const result = [
    116 * f(y / 1.00000) - 16,
    500 * (f(x / 0.95047) - f(y / 1.00000)),
    200 * (f(y / 1.00000) - f(z / 1.08883)),
  ];

  return result;
}

/**
 * Cuenta el número de colores únicos en una imagen
 */
export const countUniqueColors = (img: HTMLImageElement): number => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;
  const seen = new Set<string>();

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue; // Saltar píxeles transparentes
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const hex = '#' + byteHex(r) + byteHex(g) + byteHex(b);
    seen.add(hex);
  }

  return seen.size;
};

export function labToRgb(
  L: number,
  a: number,
  b: number
): [number, number, number] {
  console.log('labToRgb input:', { L, a, b });

  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const f3 = (t: number): number =>
    t > 0.206897
      ? t ** 3
      : (t - 16 / 116) / 7.787;

  const x = f3(fx) * 0.95047;
  const y = f3(fy) * 1.00000;
  const z = f3(fz) * 1.08883;

  let r =
    x * 3.2406 +
    y * -1.5372 +
    z * -0.4986;

  let g =
    x * -0.9689 +
    y * 1.8758 +
    z * 0.0415;

  let bv =
    x * 0.0557 +
    y * -0.2040 +
    z * 1.0570;

  const gamma = (v: number): number =>
    v > 0.0031308
      ? 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055
      : 12.92 * v;

  const result = [
    Math.round(
      Math.min(255, Math.max(0, gamma(r) * 255))
    ),
    Math.round(
      Math.min(255, Math.max(0, gamma(g) * 255))
    ),
    Math.round(
      Math.min(255, Math.max(0, gamma(bv) * 255))
    ),
  ];

  console.log('labToRgb output:', result);
  return result;
};

/* ============================================================================
 * K-MEANS
 * ========================================================================== */

/**
 * Distancia euclidiana al cuadrado
 */
function dist2(
  a: number[],
  b: number[]
): number {
  return (
    (a[0] - b[0]) ** 2 +
    (a[1] - b[1]) ** 2 +
    (a[2] - b[2]) ** 2
  );
}

/**
 * Selecciona centros iniciales usando KMeans++ algorithm
 * Elige el primer centro aleatoriamente, luego cada subsecuente
 * con probabilidad proporcional al cuadrado de la distancia al centro más cercano
 */
function kmeanspp(
  points: number[][],
  weights: number[],
  k: number
): number[][] {
  if (k >= points.length) {
    return points.map(p => [...p]);
  }

  const centers: number[][] = [];
  const n = points.length;

  // Primer centro: elegir aleatoriamente (ponderado por peso)
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  let firstIdx = 0;

  for (let i = 0; i < n; i++) {
    rand -= weights[i];
    if (rand <= 0) {
      firstIdx = i;
      break;
    }
  }

  centers.push([...points[firstIdx]]);
  console.log('kmeanspp: primer centro en índice', firstIdx);

  // Restantes k-1 centros
  for (let c = 1; c < k; c++) {
    let maxDist = 0;
    const distances: number[] = [];

    // Calcular distancia mínima de cada punto al centro más cercano
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;

      for (let j = 0; j < centers.length; j++) {
        const d = dist2(points[i], centers[j]);
        minDist = Math.min(minDist, d);
      }

      distances[i] = minDist;
      maxDist = Math.max(maxDist, minDist);
    }

    // Seleccionar siguiente centro: probabilidad ∝ distancia²
    // Sumar todas las distancias (ponderadas)
    let totalDist = 0;
    for (let i = 0; i < n; i++) {
      totalDist += distances[i];
    }

    if (totalDist === 0) {
      // Si todas las distancias son 0, elegir aleatoriamente
      const randomIdx = Math.floor(Math.random() * n);
      centers.push([...points[randomIdx]]);
      console.log('kmeanspp: centro', c, 'aleatorio en índice', randomIdx);
    } else {
      rand = Math.random() * totalDist;
      let cumulativeDist = 0;
      let selectedIdx = n - 1;

      for (let i = 0; i < n; i++) {
        cumulativeDist += distances[i];
        if (cumulativeDist >= rand) {
          selectedIdx = i;
          break;
        }
      }

      centers.push([...points[selectedIdx]]);
      console.log('kmeanspp: centro', c, 'en índice', selectedIdx);
    }
  }

  console.log('kmeanspp: devolviendo', centers.length, 'centros');
  return centers;
}

/**
 * K-Means ponderado con inicialización KMeans++
 * Ejecuta múltiples reinicios y retorna los centros con menor inercia
 */
function kmeans(
  points: number[][],
  weights: number[],
  k: number,
  maxIter = 20,
  nInit = 10
): number[][] {
  if (points.length === 0 || k <= 0) {
    console.log('kmeans: returnando [] porque points.length=', points.length, 'k=', k);
    return [];
  }

  console.log('kmeans iniciando:', { numPoints: points.length, k, nInit, maxIter });

  let bestCenters: number[][] = [];
  let bestInertia = Infinity;

  for (let init = 0; init < nInit; init++) {
    let centers = kmeanspp(points, weights, k);
    console.log('  init', init, '- centros iniciales:', centers.length);

    for (let iter = 0; iter < maxIter; iter++) {
      const sums = Array.from(
        { length: k },
        () => [0, 0, 0]
      );

      const totals = new Array<number>(k).fill(0);

      // Asignación
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const w = weights[i];

        let best = 0;
        let bestDist = Infinity;

        for (let j = 0; j < k; j++) {
          const d = dist2(p, centers[j]);

          if (d < bestDist) {
            bestDist = d;
            best = j;
          }
        }

        sums[best][0] += p[0] * w;
        sums[best][1] += p[1] * w;
        sums[best][2] += p[2] * w;

        totals[best] += w;
      }

      // Recalcular centroides
      let changed = false;

      for (let j = 0; j < k; j++) {
        if (totals[j] === 0) continue;

        const nc = [
          sums[j][0] / totals[j],
          sums[j][1] / totals[j],
          sums[j][2] / totals[j],
        ];

        if (dist2(nc, centers[j]) > 0.001) {
          changed = true;
        }

        centers[j] = nc;
      }

      if (!changed) break;
    }

    // Calcular inercia (intra-cluster sum of squares ponderado)
    let inertia = 0;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const w = weights[i];

      let best = 0;
      let bestDist = Infinity;

      for (let j = 0; j < k; j++) {
        const d = dist2(p, centers[j]);

        if (d < bestDist) {
          bestDist = d;
          best = j;
        }
      }

      inertia += bestDist * w;
    }

    // Guardar si es la mejor solución
    if (inertia < bestInertia) {
      bestInertia = inertia;
      bestCenters = centers.map(c => [...c]);
    }
  }

  console.log('kmeans terminando:', { bestCenters: bestCenters.length, bestInertia });
  return bestCenters;
}

/* ============================================================================
 * GENERACIÓN / CUANTIZACIÓN DE PALETA
 * ========================================================================== */

/**
 * Genera una nueva imagen cuantizada usando K-Means en espacio LAB
 */
export function generarPaleta(
  imageData: ImageData,
  nColores: number
): ImageData {
  const { data, width, height } = imageData;

  const n = width * height;

  // Mapa de colores únicos con frecuencia
  const colorMap = new Map<number, number>();

  for (let i = 0; i < n; i++) {
    const alpha = data[i * 4 + 3];

    // Ignorar transparentes
    if (alpha === 0) continue;

    const key =
      (data[i * 4] << 16) |
      (data[i * 4 + 1] << 8) |
      data[i * 4 + 2];

    colorMap.set(
      key,
      (colorMap.get(key) ?? 0) + 1
    );
  }

  const uniqueKeys = Array.from(colorMap.keys());

  if (uniqueKeys.length === 0) {
    return new ImageData(
      new Uint8ClampedArray(data),
      width,
      height
    );
  }

  const k = Math.min(
    Math.max(1, nColores),
    uniqueKeys.length
  );

  // Convertir colores únicos a LAB
  const labPoints = uniqueKeys.map((c) =>
    rgbToLab(
      (c >> 16) & 0xff,
      (c >> 8) & 0xff,
      c & 0xff
    ) as number[]
  );

  const weights = uniqueKeys.map(
    (c) => colorMap.get(c)!
  );

  console.log('Antes de kmeans:');
  console.log('  labPoints:', labPoints.length, 'items');
  console.log('  weights:', weights.length, 'items');
  console.log('  k:', k);
  console.log('  labPoints sample:', labPoints.slice(0, 2));

  // Ejecutar K-Means
  const centerLab = kmeans(
    labPoints,
    weights,
    k
  );

  console.log('Después de kmeans:');
  console.log('  centerLab:', centerLab);
  console.log('  centerLab.length:', centerLab ? centerLab.length : 'null/undefined');

  if (!centerLab || centerLab.length === 0) {
    throw new Error('K-Means no pudo generar centros válidos');
  }

  // Convertir centroides a RGB
  const centerRgb = centerLab.map(
    ([L, a, b]) => labToRgb(L, a, b)
  );

  console.log('centerRgb length:', centerRgb.length);
  console.log('centerRgb sample:', centerRgb.slice(0, 3));
  
  if (!centerRgb || centerRgb.length === 0) {
    throw new Error('No se generaron centros RGB válidos');
  }

  console.log('centerRgb:', centerRgb);

  // Reconvertir para comparación consistente
  const centerLabFinal = centerRgb.map(
    ([r, g, b]) => rgbToLab(r, g, b) as number[]
  );

  console.log('centerLabFinal:', centerLabFinal);

  // Resultado
  const result = new ImageData(width, height);

  for (let i = 0; i < n; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];

    // Mantener transparencia
    if (a === 0) {
      result.data[i * 4 + 3] = 0;
      continue;
    }

    const lab = rgbToLab(r, g, b) as number[];

    // Debug: verificar valores
    if (!lab || lab.length !== 3) {
      console.error('rgbToLab returned invalid result:', { r, g, b, lab });
      throw new Error(`rgbToLab failed for RGB(${r}, ${g}, ${b})`);
    }

    let best = 0;
    let bestDist = Infinity;

    for (let j = 0; j < k; j++) {
      const d = dist2(
        lab,
        centerLabFinal[j]
      );

      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
    }

    result.data[i * 4] =
      centerRgb[best][0];

    result.data[i * 4 + 1] =
      centerRgb[best][1];

    result.data[i * 4 + 2] =
      centerRgb[best][2];

    result.data[i * 4 + 3] = a;
  }

  return result;
}