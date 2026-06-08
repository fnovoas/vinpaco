"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // static/js/state.ts
  var state;
  var init_state = __esm({
    "static/js/state.ts"() {
      "use strict";
      state = {
        sourceImageData: null,
        paletteColors: [],
        imgName: "",
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
        origFile: null
      };
    }
  });

  // static/js/utils.ts
  var byteHex, hexToHSV;
  var init_utils = __esm({
    "static/js/utils.ts"() {
      "use strict";
      byteHex = (n) => {
        return n.toString(16).padStart(2, "0");
      };
      hexToHSV = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        let h = 0;
        const s = max === 0 ? 0 : diff / max * 100;
        const v = max * 100;
        if (diff !== 0) {
          switch (max) {
            case r:
              h = (60 * ((g - b) / diff) + 360) % 360;
              break;
            case g:
              h = (60 * ((b - r) / diff) + 120) % 360;
              break;
            case b:
              h = (60 * ((r - g) / diff) + 240) % 360;
              break;
          }
        }
        return { h, s, v };
      };
    }
  });

  // static/js/palette.ts
  var palette_exports = {};
  __export(palette_exports, {
    countUniqueColors: () => countUniqueColors,
    detectColors: () => detectColors,
    generarPaleta: () => generarPaleta,
    getActiveColorCount: () => getActiveColorCount,
    getEnabledColorSet: () => getEnabledColorSet,
    labToRgb: () => labToRgb,
    rgbToLab: () => rgbToLab,
    setAllColors: () => setAllColors,
    toggleColor: () => toggleColor
  });
  function rgbToLab(r, g, b) {
    let rn = r / 255;
    let gn = g / 255;
    let bn = b / 255;
    const lin = (v) => v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
    rn = lin(rn);
    gn = lin(gn);
    bn = lin(bn);
    const x = rn * 0.4124 + gn * 0.3576 + bn * 0.1805;
    const y = rn * 0.2126 + gn * 0.7152 + bn * 0.0722;
    const z = rn * 0.0193 + gn * 0.1192 + bn * 0.9505;
    const f = (t) => t > 8856e-6 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    const result = [
      116 * f(y / 1) - 16,
      500 * (f(x / 0.95047) - f(y / 1)),
      200 * (f(y / 1) - f(z / 1.08883))
    ];
    return result;
  }
  function labToRgb(L, a, b) {
    console.log("labToRgb input:", { L, a, b });
    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;
    const f3 = (t) => t > 0.206897 ? t ** 3 : (t - 16 / 116) / 7.787;
    const x = f3(fx) * 0.95047;
    const y = f3(fy) * 1;
    const z = f3(fz) * 1.08883;
    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let bv = x * 0.0557 + y * -0.204 + z * 1.057;
    const gamma = (v) => v > 31308e-7 ? 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055 : 12.92 * v;
    const result = [
      Math.round(
        Math.min(255, Math.max(0, gamma(r) * 255))
      ),
      Math.round(
        Math.min(255, Math.max(0, gamma(g) * 255))
      ),
      Math.round(
        Math.min(255, Math.max(0, gamma(bv) * 255))
      )
    ];
    console.log("labToRgb output:", result);
    return result;
  }
  function dist2(a, b) {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  }
  function kmeanspp(points, weights, k) {
    if (k >= points.length) {
      return points.map((p) => [...p]);
    }
    const centers = [];
    const n = points.length;
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
    console.log("kmeanspp: primer centro en \xEDndice", firstIdx);
    for (let c = 1; c < k; c++) {
      let maxDist = 0;
      const distances = [];
      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        for (let j = 0; j < centers.length; j++) {
          const d = dist2(points[i], centers[j]);
          minDist = Math.min(minDist, d);
        }
        distances[i] = minDist;
        maxDist = Math.max(maxDist, minDist);
      }
      let totalDist = 0;
      for (let i = 0; i < n; i++) {
        totalDist += distances[i];
      }
      if (totalDist === 0) {
        const randomIdx = Math.floor(Math.random() * n);
        centers.push([...points[randomIdx]]);
        console.log("kmeanspp: centro", c, "aleatorio en \xEDndice", randomIdx);
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
        console.log("kmeanspp: centro", c, "en \xEDndice", selectedIdx);
      }
    }
    console.log("kmeanspp: devolviendo", centers.length, "centros");
    return centers;
  }
  function kmeans(points, weights, k, maxIter = 20, nInit = 10) {
    if (points.length === 0 || k <= 0) {
      console.log("kmeans: returnando [] porque points.length=", points.length, "k=", k);
      return [];
    }
    console.log("kmeans iniciando:", { numPoints: points.length, k, nInit, maxIter });
    let bestCenters = [];
    let bestInertia = Infinity;
    for (let init = 0; init < nInit; init++) {
      let centers = kmeanspp(points, weights, k);
      console.log("  init", init, "- centros iniciales:", centers.length);
      for (let iter = 0; iter < maxIter; iter++) {
        const sums = Array.from(
          { length: k },
          () => [0, 0, 0]
        );
        const totals = new Array(k).fill(0);
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
        let changed = false;
        for (let j = 0; j < k; j++) {
          if (totals[j] === 0) continue;
          const nc = [
            sums[j][0] / totals[j],
            sums[j][1] / totals[j],
            sums[j][2] / totals[j]
          ];
          if (dist2(nc, centers[j]) > 1e-3) {
            changed = true;
          }
          centers[j] = nc;
        }
        if (!changed) break;
      }
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
      if (inertia < bestInertia) {
        bestInertia = inertia;
        bestCenters = centers.map((c) => [...c]);
      }
    }
    console.log("kmeans terminando:", { bestCenters: bestCenters.length, bestInertia });
    return bestCenters;
  }
  function generarPaleta(imageData, nColores) {
    const { data, width, height } = imageData;
    const n = width * height;
    const colorMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < n; i++) {
      const alpha = data[i * 4 + 3];
      if (alpha === 0) continue;
      const key = data[i * 4] << 16 | data[i * 4 + 1] << 8 | data[i * 4 + 2];
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
    const labPoints = uniqueKeys.map(
      (c) => rgbToLab(
        c >> 16 & 255,
        c >> 8 & 255,
        c & 255
      )
    );
    const weights = uniqueKeys.map(
      (c) => colorMap.get(c)
    );
    console.log("Antes de kmeans:");
    console.log("  labPoints:", labPoints.length, "items");
    console.log("  weights:", weights.length, "items");
    console.log("  k:", k);
    console.log("  labPoints sample:", labPoints.slice(0, 2));
    const centerLab = kmeans(
      labPoints,
      weights,
      k
    );
    console.log("Despu\xE9s de kmeans:");
    console.log("  centerLab:", centerLab);
    console.log("  centerLab.length:", centerLab ? centerLab.length : "null/undefined");
    if (!centerLab || centerLab.length === 0) {
      throw new Error("K-Means no pudo generar centros v\xE1lidos");
    }
    const centerRgb = centerLab.map(
      ([L, a, b]) => labToRgb(L, a, b)
    );
    console.log("centerRgb length:", centerRgb.length);
    console.log("centerRgb sample:", centerRgb.slice(0, 3));
    if (!centerRgb || centerRgb.length === 0) {
      throw new Error("No se generaron centros RGB v\xE1lidos");
    }
    console.log("centerRgb:", centerRgb);
    const centerLabFinal = centerRgb.map(
      ([r, g, b]) => rgbToLab(r, g, b)
    );
    console.log("centerLabFinal:", centerLabFinal);
    const result = new ImageData(width, height);
    for (let i = 0; i < n; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const a = data[i * 4 + 3];
      if (a === 0) {
        result.data[i * 4 + 3] = 0;
        continue;
      }
      const lab = rgbToLab(r, g, b);
      if (!lab || lab.length !== 3) {
        console.error("rgbToLab returned invalid result:", { r, g, b, lab });
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
      result.data[i * 4] = centerRgb[best][0];
      result.data[i * 4 + 1] = centerRgb[best][1];
      result.data[i * 4 + 2] = centerRgb[best][2];
      result.data[i * 4 + 3] = a;
    }
    return result;
  }
  var detectColors, toggleColor, setAllColors, getEnabledColorSet, getActiveColorCount, countUniqueColors;
  var init_palette = __esm({
    "static/js/palette.ts"() {
      "use strict";
      init_state();
      init_utils();
      detectColors = () => {
        if (!state.sourceImageData) return;
        const data = state.sourceImageData.data;
        const seen = /* @__PURE__ */ new Map();
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] === 0) continue;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const hex = "#" + byteHex(r) + byteHex(g) + byteHex(b);
          seen.set(hex, {
            hex,
            r,
            g,
            b,
            enabled: true
          });
        }
        state.paletteColors = [...seen.values()].sort((a, b) => {
          const colorA = hexToHSV(a.hex);
          const colorB = hexToHSV(b.hex);
          if (colorA.h !== colorB.h) {
            return colorA.h - colorB.h;
          }
          if (colorA.s !== colorB.s) {
            return colorA.s - colorB.s;
          }
          return colorA.v - colorB.v;
        }).map((c) => ({
          ...c,
          enabled: true
        }));
      };
      toggleColor = (idx) => {
        if (idx >= 0 && idx < state.paletteColors.length) {
          state.paletteColors[idx].enabled = !state.paletteColors[idx].enabled;
        }
      };
      setAllColors = (enabled) => {
        state.paletteColors.forEach((c) => {
          c.enabled = enabled;
        });
      };
      getEnabledColorSet = () => {
        return new Set(
          state.paletteColors.filter((c) => c.enabled).map((c) => c.hex)
        );
      };
      getActiveColorCount = () => {
        return state.paletteColors.filter((c) => c.enabled).length;
      };
      countUniqueColors = (img) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return 0;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;
        const seen = /* @__PURE__ */ new Set();
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] === 0) continue;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const hex = "#" + byteHex(r) + byteHex(g) + byteHex(b);
          seen.add(hex);
        }
        return seen.size;
      };
    }
  });

  // static/js/ui.ts
  var ui_exports = {};
  __export(ui_exports, {
    buildUI: () => buildUI,
    highlightColorChip: () => highlightColorChip,
    unhighlightColorChips: () => unhighlightColorChips,
    updateChipVisual: () => updateChipVisual,
    updateStats: () => updateStats
  });
  var buildUI, updateStats, updateChipVisual, highlightColorChip, unhighlightColorChips;
  var init_ui = __esm({
    "static/js/ui.ts"() {
      "use strict";
      init_state();
      init_palette();
      init_canvas();
      buildUI = () => {
        const grid = document.getElementById("color-grid");
        if (!grid) return;
        grid.innerHTML = "";
        state.paletteColors.forEach((col, idx) => {
          const chip = document.createElement("div");
          chip.className = "color-chip";
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
          chip.addEventListener("click", () => {
            toggleColor(idx);
            chip.classList.toggle("disabled", !state.paletteColors[idx].enabled);
            renderOutput();
            updateStats();
          });
          chip.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            chip.classList.toggle("marked");
          });
          grid.appendChild(chip);
        });
        updateStats();
      };
      updateStats = () => {
        const active = getActiveColorCount();
        const statActive = document.getElementById("stat-active");
        if (statActive) statActive.textContent = String(active);
        const statTotal = document.getElementById("stat-total");
        if (statTotal) statTotal.textContent = String(state.paletteColors.length);
        const activeColorCount = document.getElementById("active-color-count");
        if (activeColorCount) activeColorCount.textContent = String(active);
        const totalColorCount = document.getElementById("total-color-count");
        if (totalColorCount) totalColorCount.textContent = String(state.paletteColors.length);
      };
      updateChipVisual = (idx) => {
        const chip = document.querySelector(
          `.color-chip[data-idx="${idx}"]`
        );
        if (chip && idx < state.paletteColors.length) {
          chip.classList.toggle("disabled", !state.paletteColors[idx].enabled);
        }
      };
      highlightColorChip = (hex) => {
        const prevHighlighted = document.querySelector(".color-chip.highlighted");
        if (prevHighlighted) {
          prevHighlighted.classList.remove("highlighted");
        }
        const chips = document.querySelectorAll(".color-chip");
        for (const chip of chips) {
          const label = chip.querySelector(".chip-label");
          if (label && label.textContent === hex) {
            chip.classList.add("highlighted");
            break;
          }
        }
      };
      unhighlightColorChips = () => {
        const highlighted = document.querySelector(".color-chip.highlighted");
        if (highlighted) {
          highlighted.classList.remove("highlighted");
        }
      };
    }
  });

  // static/js/canvas.ts
  var RULER_PX, renderOutput, createExportBlob, cargarImagenGenerada, updateZoomLabel, updateGridToggleVisibility, setScale, updateSlider, getPixelHex;
  var init_canvas = __esm({
    "static/js/canvas.ts"() {
      "use strict";
      init_state();
      init_palette();
      init_utils();
      RULER_PX = 20;
      renderOutput = () => {
        if (!state.sourceImageData) return;
        const oc = document.getElementById("output-canvas");
        if (!oc) return;
        const ctx = oc.getContext("2d");
        if (!ctx) return;
        const showRuler = state.scale >= 3;
        const R = showRuler ? RULER_PX : 0;
        const gridToggle = document.getElementById("grid-toggle");
        const gridOn = gridToggle?.checked ?? false;
        oc.width = R + state.imgW * state.scale;
        oc.height = R + state.imgH * state.scale;
        ctx.clearRect(0, 0, oc.width, oc.height);
        const enabledSet = getEnabledColorSet();
        const src = state.sourceImageData.data;
        for (let row = 0; row < state.imgH; row++) {
          for (let col = 0; col < state.imgW; col++) {
            const i = (row * state.imgW + col) * 4;
            const r = src[i];
            const g = src[i + 1];
            const b = src[i + 2];
            const a = src[i + 3];
            if (a === 0) continue;
            const hex = "#" + byteHex(r) + byteHex(g) + byteHex(b);
            if (!enabledSet.has(hex)) continue;
            ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
            ctx.fillRect(R + col * state.scale, R + row * state.scale, state.scale, state.scale);
          }
        }
        if (gridOn) {
          ctx.strokeStyle = "rgba(0,0,0,0.75)";
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
        if (state.selectedClickPixel) {
          const borderX = R + state.selectedClickPixel.x * state.scale;
          const borderY = R + state.selectedClickPixel.y * state.scale;
          const borderColor = state.selectedBorderColor || "#ffffff";
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = Math.max(1, Math.min(3, state.scale * 0.15));
          ctx.strokeRect(
            borderX + 0.5,
            borderY + 0.5,
            state.scale - 1,
            state.scale - 1
          );
        }
        if (showRuler) {
          const fontSize = Math.max(7, Math.min(11, Math.floor(state.scale * 0.55)));
          ctx.font = `${fontSize}px "IBM Plex Mono", monospace`;
          ctx.fillStyle = "#666688";
          ctx.textBaseline = "middle";
          ctx.textAlign = "center";
          for (let col = 0; col < state.imgW; col++) {
            ctx.fillText(String(col + 1), R + col * state.scale + state.scale / 2, R / 2);
          }
          ctx.textAlign = "right";
          for (let row = 0; row < state.imgH; row++) {
            ctx.fillText(String(row + 1), R - 3, R + row * state.scale + state.scale / 2);
          }
        }
      };
      createExportBlob = async () => {
        if (!state.sourceImageData) return null;
        const allEnabled = state.paletteColors.length > 0 && getActiveColorCount() === state.paletteColors.length;
        if (allEnabled && state.generatedBlob) {
          return state.generatedBlob;
        }
        const enabledSet = getEnabledColorSet();
        const { width, height, data: src } = state.sourceImageData;
        const out = new ImageData(width, height);
        const dst = out.data;
        for (let i = 0; i < src.length; i += 4) {
          const r = src[i];
          const g = src[i + 1];
          const b = src[i + 2];
          const a = src[i + 3];
          if (a === 0) continue;
          const hex = "#" + byteHex(r) + byteHex(g) + byteHex(b);
          if (enabledSet.has(hex)) {
            dst[i] = r;
            dst[i + 1] = g;
            dst[i + 2] = b;
            dst[i + 3] = a;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.putImageData(out, 0, 0);
        return new Promise(
          (resolve, reject) => canvas.toBlob(
            (b) => b ? resolve(b) : reject(new Error("toBlob fall\xF3")),
            "image/png"
          )
        );
      };
      cargarImagenGenerada = (blob) => {
        const url = URL.createObjectURL(blob);
        const imgEl = new Image();
        imgEl.onload = () => {
          state.imgW = imgEl.width;
          state.imgH = imgEl.height;
          const sc = document.getElementById("source-canvas");
          if (!sc) return;
          sc.width = state.imgW;
          sc.height = state.imgH;
          const sctx = sc.getContext("2d");
          if (!sctx) return;
          sctx.drawImage(imgEl, 0, 0);
          state.sourceImageData = sctx.getImageData(0, 0, state.imgW, state.imgH);
          URL.revokeObjectURL(url);
          const maxDim = Math.max(state.imgW, state.imgH);
          state.scale = Math.min(32, Math.max(1, Math.floor(480 / maxDim)));
          updateZoomLabel();
          const gridLabel = document.getElementById("grid-label");
          if (gridLabel) {
            gridLabel.style.display = state.scale >= 3 ? "flex" : "none";
          }
          const gridToggle = document.getElementById("grid-toggle");
          if (gridToggle && state.scale < 3) {
            gridToggle.checked = false;
          }
          Promise.resolve().then(() => (init_palette(), palette_exports)).then(({ detectColors: detectColors2 }) => {
            Promise.resolve().then(() => (init_ui(), ui_exports)).then(({ buildUI: buildUI3, updateStats: updateStats2 }) => {
              detectColors2();
              buildUI3();
              renderOutput();
              const panel = document.getElementById("panel");
              if (panel) panel.style.display = "block";
              const statName = document.getElementById("stat-name");
              if (statName) statName.textContent = state.imgName;
              const statSize = document.getElementById("stat-size");
              if (statSize) statSize.textContent = state.imgW + " \xD7 " + state.imgH + " px";
              updateStats2();
            });
          });
        };
        imgEl.onerror = () => {
          alert("No se pudo leer la imagen. Elije un archivo de imagen v\xE1lido.");
          state.origFile = null;
          const btn = document.getElementById("btn-generar");
          if (btn) btn.disabled = true;
          URL.revokeObjectURL(url);
        };
        imgEl.src = url;
      };
      updateZoomLabel = () => {
        const zoomLevel = document.getElementById("zoom-level");
        if (zoomLevel) {
          zoomLevel.textContent = "\xD7" + state.scale;
        }
      };
      updateGridToggleVisibility = () => {
        const gridLabel = document.getElementById("grid-label");
        if (gridLabel) {
          gridLabel.style.display = state.scale >= 3 ? "flex" : "none";
        }
        if (state.scale < 3) {
          const gridToggle = document.getElementById("grid-toggle");
          if (gridToggle) gridToggle.checked = false;
        }
      };
      setScale = (val) => {
        let numVal;
        if (typeof val === "string") {
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
      updateSlider = () => {
        const slider = document.getElementById("zoom-slider");
        if (!slider) return;
        slider.value = String(state.scale);
        const pct = (state.scale - 1) / (100 - 1) * 100;
        slider.style.setProperty("--pct", pct.toFixed(2) + "%");
      };
      getPixelHex = (x, y) => {
        if (!state.sourceImageData) return null;
        const i = (y * state.imgW + x) * 4;
        const src = state.sourceImageData.data;
        const r = src[i];
        const g = src[i + 1];
        const b = src[i + 2];
        return "#" + byteHex(r) + byteHex(g) + byteHex(b);
      };
    }
  });

  // static/js/interactions.ts
  init_palette();
  init_state();
  init_canvas();
  init_palette();
  init_ui();
  var MAX_SCALED_DIM = 999;
  var SCALE_MIN_DIM = 1e3;
  var REJECT_MIN_DIM = 2e3;
  var MAX_PALETTE_COLORS = 500;
  var MAX_ALLOWED_COLORS = 5e3;
  var ZOOM_STEP = 0.25;
  var RULER_PX2 = 20;
  var loadImageFromBlob = (blob) => new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("No se pudo leer la imagen escalada."));
    };
    img.src = blobUrl;
  });
  var scaleImageToMaxDim = async (img, maxDim) => {
    const maxSide = Math.max(img.width, img.height);
    const factor = maxDim / maxSide;
    const width = Math.max(1, Math.round(img.width * factor));
    const height = Math.max(1, Math.round(img.height * factor));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo crear el contexto de canvas.");
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise(
      (resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("toBlob fall\xF3")), "image/png")
    );
    return { blob, width, height };
  };
  var disableGenerarButton = () => {
    const btn = document.getElementById("btn-generar");
    if (btn) btn.disabled = true;
  };
  var setupInteractions = () => {
    setupFileUpload();
    setupCanvasInteractions();
    setupZoomControls();
    setupGridToggle();
    setupBackgroundToggle();
    setupGeneralButtons();
    setupNColoresInput();
  };
  var setupFileUpload = () => {
    const dz = document.getElementById("drop-orig");
    if (!dz) return;
    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      dz.classList.add("drag-over");
    });
    dz.addEventListener("dragleave", () => {
      dz.classList.remove("drag-over");
    });
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.classList.remove("drag-over");
      const dropEvent = e;
      const files = dropEvent.dataTransfer?.files;
      if (files && files[0]) {
        setOrigFile(files[0], dz);
      }
    });
    const fileInput = document.getElementById("file-orig");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const input = e.target;
        const files = input.files;
        if (files && files[0]) {
          setOrigFile(files[0], dz);
        }
      });
    }
  };
  var setOrigFile = (file, dropZone) => {
    const url = URL.createObjectURL(file);
    const tempImg = new Image();
    tempImg.onload = () => {
      void (async () => {
        try {
          const origW = tempImg.width;
          const origH = tempImg.height;
          if (origW >= REJECT_MIN_DIM || origH >= REJECT_MIN_DIM) {
            alert(
              `La imagen no puede tener ${REJECT_MIN_DIM} p\xEDxeles o m\xE1s en alguna dimensi\xF3n.
Dimensiones: ${origW}\xD7${origH}.`
            );
            state.origFile = null;
            disableGenerarButton();
            return;
          }
          let workImg = tempImg;
          let workFile = file;
          const maxSide = Math.max(origW, origH);
          if (maxSide >= SCALE_MIN_DIM) {
            const scaled = await scaleImageToMaxDim(tempImg, MAX_SCALED_DIM);
            workFile = new File([scaled.blob], file.name, { type: "image/png" });
            workImg = await loadImageFromBlob(scaled.blob);
            alert(
              `Dimensiones detectadas: ${origW}\xD7${origH}. Imagen escalada a ${scaled.width}\xD7${scaled.height} p\xEDxeles.`
            );
          }
          const uniqueColors = countUniqueColors(workImg);
          if (uniqueColors >= MAX_ALLOWED_COLORS) {
            alert(
              `La imagen no puede tener ${MAX_ALLOWED_COLORS} colores o m\xE1s.
Colores detectados: ${uniqueColors}.`
            );
            state.origFile = null;
            disableGenerarButton();
            return;
          }
          state.origFile = workFile;
          state.imgName = file.name;
          const p = dropZone.querySelector("p");
          if (p) p.innerHTML = `<strong>${file.name}</strong>`;
          const btn = document.getElementById("btn-generar");
          if (btn) btn.disabled = false;
          if (uniqueColors > MAX_PALETTE_COLORS) {
            const nColoresInput = document.getElementById("n-colores");
            if (nColoresInput) nColoresInput.value = String(MAX_PALETTE_COLORS);
            alert(
              `Colores detectados en la imagen: ${uniqueColors}. Reduciendo su paleta a ${MAX_PALETTE_COLORS} colores. Esto puede tardar unos minutos.`
            );
            void procesarPaletaDesdeArchivo(MAX_PALETTE_COLORS);
          }
        } catch (err) {
          alert("Error al procesar la imagen:\n" + err.message);
          state.origFile = null;
          disableGenerarButton();
        } finally {
          URL.revokeObjectURL(url);
        }
      })();
    };
    tempImg.onerror = () => {
      alert("No se pudo leer la imagen. Elije un archivo de imagen v\xE1lido.");
      state.origFile = null;
      disableGenerarButton();
      URL.revokeObjectURL(url);
    };
    tempImg.src = url;
  };
  var setupZoomControls = () => {
    const slider = document.getElementById("zoom-slider");
    if (slider) {
      slider.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        if (Number.isFinite(value)) {
          setScale(value);
        }
      });
    }
    window.zoomIn = () => {
      setScale(state.scale + ZOOM_STEP);
    };
    window.zoomOut = () => {
      setScale(state.scale - ZOOM_STEP);
    };
  };
  var setupGridToggle = () => {
    const gridToggle = document.getElementById(
      "grid-toggle"
    );
    if (gridToggle) {
      gridToggle.addEventListener("change", renderOutput);
    }
  };
  var setupBackgroundToggle = () => {
    const btn = document.getElementById("bg-toggle");
    const wrapper = document.getElementById("canvas-wrapper");
    if (!btn || !wrapper) return;
    const syncBackgroundToggle = (isLight) => {
      wrapper.classList.toggle("light-bg", isLight);
      btn.textContent = isLight ? "Fondo claro" : "Fondo oscuro";
      btn.setAttribute("aria-pressed", String(isLight));
    };
    btn.addEventListener("click", () => {
      syncBackgroundToggle(!wrapper.classList.contains("light-bg"));
    });
    syncBackgroundToggle(false);
  };
  var setupNColoresInput = () => {
    const input = document.getElementById("n-colores");
    if (!input) return;
    input.max = String(MAX_PALETTE_COLORS);
    input.addEventListener("input", () => {
      if (input.value === "") return;
      const val = parseInt(input.value, 10);
      if (val > MAX_PALETTE_COLORS) {
        input.value = String(MAX_PALETTE_COLORS);
      } else if (val <= 0) {
        input.value = "1";
      }
    });
    input.addEventListener("blur", () => {
      if (input.value === "" || parseInt(input.value, 10) < 1) {
        input.value = "1";
      }
    });
  };
  var setupGeneralButtons = () => {
    window.setAll = (state_val) => {
      setAllColors(state_val);
      state.paletteColors.forEach((c, i) => {
        updateChipVisual(i);
      });
      renderOutput();
      updateStats();
    };
    window.generarPaleta = generarPaleta2;
    window.descargarImagen = descargarImagen;
    window.exportarColoresJSON = exportarColoresJSON;
  };
  var procesarPaletaDesdeArchivo = async (nColores) => {
    if (!state.origFile || nColores < 1) return;
    const btn = document.getElementById("btn-generar");
    const spinner = document.getElementById("spinner");
    if (btn) btn.disabled = true;
    if (spinner) spinner.style.display = "inline";
    try {
      const url = URL.createObjectURL(state.origFile);
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = url;
      });
      URL.revokeObjectURL(url);
      const srcCanvas = document.getElementById("source-canvas");
      srcCanvas.width = img.width;
      srcCanvas.height = img.height;
      const ctx = srcCanvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const resultData = generarPaleta(imageData, nColores);
      const offscreen = document.createElement("canvas");
      offscreen.width = img.width;
      offscreen.height = img.height;
      offscreen.getContext("2d").putImageData(resultData, 0, 0);
      const blob = await new Promise(
        (resolve, reject) => offscreen.toBlob((b) => b ? resolve(b) : reject(new Error("toBlob fall\xF3")), "image/png")
      );
      state.generatedBlob = blob;
      cargarImagenGenerada(blob);
    } catch (err) {
      alert("Error al generar la paleta:\n" + err.message);
    } finally {
      if (btn) btn.disabled = false;
      if (spinner) spinner.style.display = "none";
    }
  };
  var generarPaleta2 = async () => {
    if (!state.origFile) return;
    const nColoresInput = document.getElementById("n-colores");
    const nColores = parseInt(nColoresInput?.value ?? "8", 10);
    if (!nColores || nColores < 1) return;
    await procesarPaletaDesdeArchivo(nColores);
  };
  var descargarImagen = async () => {
    if (!state.sourceImageData) return;
    let blob;
    try {
      blob = await createExportBlob();
    } catch {
      alert("No se pudo generar la imagen para descargar.");
      return;
    }
    if (!blob) return;
    const base = state.imgName.replace(/\.[^.]+$/, "");
    const nColoresInput = document.getElementById("n-colores");
    const n = nColoresInput?.value ?? "8";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${base}_paleta_${n}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1e3);
  };
  var exportarColoresJSON = () => {
    if (!state.paletteColors || state.paletteColors.length === 0) {
      alert("No hay colores generados para exportar.");
      return;
    }
    const colors = state.paletteColors.map((c) => c.hex);
    const jsonStr = JSON.stringify(colors, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const base = state.imgName ? state.imgName.replace(/\.[^.]+$/, "") : "paleta";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${base}_colores.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1e3);
  };
  var setupCanvasInteractions = () => {
    const outputCanvas = document.getElementById(
      "output-canvas"
    );
    if (!outputCanvas) return;
    const canvasWrapper = document.getElementById(
      "canvas-wrapper"
    );
    if (!canvasWrapper) return;
    outputCanvas.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      state.isMouseDownOnCanvas = true;
      const { pixelX, pixelY } = getCanvasPixelCoords(e.clientX, e.clientY);
      if (pixelX >= 0 && pixelX < state.imgW && pixelY >= 0 && pixelY < state.imgH) {
        state.selectedClickPixel = { x: pixelX, y: pixelY };
        const hex = getPixelHex(pixelX, pixelY) || "#000000";
        showClickTooltip(e.clientX, e.clientY, `(${pixelY + 1}, ${pixelX + 1})`, hex);
        startBorderAnimation();
      } else {
        state.selectedClickPixel = null;
        hideClickTooltip();
        stopBorderAnimation();
      }
      renderOutput();
      const onMouseMove = (event) => {
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
          const hex = getPixelHex(px, py) || "#000000";
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
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
    canvasWrapper.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      state.isDragPanning = false;
      state.dragStartX = e.clientX;
      state.dragStartY = e.clientY;
      state.dragStartLeft = canvasWrapper.scrollLeft;
      state.dragStartTop = canvasWrapper.scrollTop;
      canvasWrapper.classList.add("dragging");
      const onMouseMove = (event) => {
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
        canvasWrapper.classList.remove("dragging");
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        setTimeout(() => {
          state.isDragPanning = false;
        }, 0);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      e.preventDefault();
    });
    outputCanvas.addEventListener("click", (e) => {
      if (state.isDragPanning) return;
      const rect = outputCanvas.getBoundingClientRect();
      const R = state.scale >= 3 ? RULER_PX2 : 0;
      const pixelX = Math.floor((e.clientX - rect.left - R) / state.scale);
      const pixelY = Math.floor((e.clientY - rect.top - R) / state.scale);
      const coords = document.getElementById("stat-pixel-coords");
      if (coords) {
        if (pixelX >= 0 && pixelX < state.imgW && pixelY >= 0 && pixelY < state.imgH) {
          coords.textContent = `(${pixelY + 1}, ${pixelX + 1})`;
        } else {
          coords.textContent = "\u2014";
        }
      }
    });
  };
  var getCanvasPixelCoords = (clientX, clientY) => {
    const outputCanvas = document.getElementById(
      "output-canvas"
    );
    if (!outputCanvas) return { pixelX: -1, pixelY: -1 };
    const rect = outputCanvas.getBoundingClientRect();
    const R = state.scale >= 3 ? RULER_PX2 : 0;
    const pixelX = Math.floor((clientX - rect.left - R) / state.scale);
    const pixelY = Math.floor((clientY - rect.top - R) / state.scale);
    return { pixelX, pixelY };
  };
  var startBorderAnimation = () => {
    stopBorderAnimation();
    state.selectedBorderColor = "#ffffff";
    renderOutput();
    state.borderAnimationInterval = setInterval(() => {
      state.selectedBorderColor = state.selectedBorderColor === "#ffffff" ? "#5c5fef" : "#ffffff";
      renderOutput();
    }, 300);
  };
  var stopBorderAnimation = () => {
    if (state.borderAnimationInterval) {
      clearInterval(state.borderAnimationInterval);
      state.borderAnimationInterval = null;
    }
    state.selectedBorderColor = null;
  };
  var ensureClickTooltip = () => {
    if (state.clickTooltip) return state.clickTooltip;
    const tooltip = document.createElement("div");
    tooltip.id = "click-tooltip";
    tooltip.style.position = "fixed";
    tooltip.style.display = "none";
    tooltip.style.padding = "6px 10px";
    tooltip.style.fontFamily = "IBM Plex Mono, monospace";
    tooltip.style.fontSize = "11px";
    tooltip.style.color = "#e0dfd8";
    tooltip.style.background = "rgba(15, 15, 25, 0.95)";
    tooltip.style.border = "1px solid rgba(92, 95, 239, 0.25)";
    tooltip.style.borderRadius = "6px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.zIndex = "9999";
    tooltip.style.whiteSpace = "pre-line";
    document.body.appendChild(tooltip);
    state.clickTooltip = tooltip;
    return tooltip;
  };
  var positionClickTooltip = (clientX, clientY) => {
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
  var showClickTooltip = (clientX, clientY, coords, hex) => {
    const tooltip = ensureClickTooltip();
    tooltip.innerHTML = `${coords}<br>${hex}`;
    tooltip.style.display = "block";
    positionClickTooltip(clientX, clientY);
    highlightColorChip(hex);
  };
  var updateClickTooltip = (clientX, clientY, coords, hex) => {
    if (!state.clickTooltip) return;
    state.clickTooltip.innerHTML = `${coords}<br>${hex}`;
    positionClickTooltip(clientX, clientY);
    highlightColorChip(hex);
  };
  var hideClickTooltip = () => {
    if (!state.clickTooltip) return;
    state.clickTooltip.style.display = "none";
    unhighlightColorChips();
  };

  // static/js/main.ts
  var initializeApp = () => {
    setupInteractions();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    initializeApp();
  }
})();
