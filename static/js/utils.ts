/**
 * Funciones de utilidad
 */

/**
 * Convierte un byte (0-255) a su representación hex de 2 caracteres
 */
export const byteHex = (n: number): string => {
  return n.toString(16).padStart(2, '0');
};

interface HSV {
  h: number; // Matiz (0-360)
  s: number; // Saturación (0-100)
  v: number; // Valor/Brillo (0-100)
}

/**
 * Convierte un código hexadecimal a un objeto HSV.
 */
export const hexToHSV = (hex: string): HSV => {
  // Eliminar el # y convertir a RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : (diff / max) * 100;
  const v = max * 100;

  if (diff !== 0) {
    switch (max) {
      case r: h = (60 * ((g - b) / diff) + 360) % 360; break;
      case g: h = (60 * ((b - r) / diff) + 120) % 360; break;
      case b: h = (60 * ((r - g) / diff) + 240) % 360; break;
    }
  }

  return { h, s, v };
};

/**
 * Ordena una lista de colores hex siguiendo el orden del arcoíris (Matiz).
 */
export const ordenarColoresArcoiris = (colores: string[]): string[] => {
  return [...colores].sort((a, b) => {
    const colorA = hexToHSV(a);
    const colorB = hexToHSV(b);

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
  });
};
