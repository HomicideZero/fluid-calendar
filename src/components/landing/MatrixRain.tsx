"use client";

import { useEffect, useRef } from "react";

/**
 * Matrix code-rain with a ghostly face emerging from the glyphs — the
 * HomicideZero "Claira" visual reused from ai.homicidezero.com. The face is an
 * invisible luminance mask (`/hz-face-mask.png`) that brightens, bends and
 * slows the rain where the face is. Dark electric-blue palette.
 *
 * Honors `prefers-reduced-motion` (renders a single static frame) and pauses
 * when the tab is hidden. Self-contained: draws onto a full-screen canvas.
 */

const TARGET_FPS = 20;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" +
  "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ" +
  "∴∵≡≈×÷±∞∑∏√∂∫≠≤≥";

function randomGlyph(): string {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "0";
}

interface Drop {
  y: number;
  speed: number;
  length: number;
  col: number;
  chars: string[];
  flickerAt: number;
}

// Ghostly face mask tuning (matched to the reference).
const FACE_MASK_SRC = "/hz-face-mask.png";
const FACE_GAMMA = 1.0;
const FACE_SCALE = 1.25;
const FACE_BRIGHTEN = 5.0;
const FACE_BG_DIM = 0.35;
const FACE_BEND = 3.5;
const FACE_SPEED_SLOW = 0.3;
const FACE_WHITE_SHIFT = 255;

function startMatrix(canvas: HTMLCanvasElement): { stop: () => void } {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { stop() {} };

  const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  let isVisible = document.visibilityState !== "hidden";
  let loopActive = false;
  let frame: number | null = null;
  let lastRenderAt = 0;
  let tick = 0;
  let cols = 0;
  let rows = 0;
  let charW = 7;
  let charH = 13;
  let drops: Drop[] = [];

  let faceImg: HTMLImageElement | null = null;
  let faceLoaded = false;
  let mask: Float32Array | null = null;
  let gradX: Float32Array | null = null;
  const maskScratch = document.createElement("canvas");
  const maskCtx = maskScratch.getContext("2d", { willReadFrequently: true });

  function loadFace() {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      faceImg = img;
      faceLoaded = true;
      rebuildMask();
    };
    img.src = FACE_MASK_SRC;
  }

  function rebuildMask() {
    if (!faceLoaded || !faceImg || !maskCtx || cols <= 0 || rows <= 0) {
      mask = null;
      gradX = null;
      return;
    }
    maskScratch.width = cols;
    maskScratch.height = rows;
    maskCtx.fillStyle = "#000";
    maskCtx.fillRect(0, 0, cols, rows);
    const gridAspect = cols / (rows * (charH / charW));
    const imgAspect = faceImg.width / faceImg.height;
    let dw = cols,
      dh = rows,
      dx = 0,
      dy = 0;
    if (imgAspect > gridAspect) {
      dw = cols;
      dh = (dw / imgAspect) * (charW / charH);
      dy = (rows - dh) / 2;
    } else {
      dh = rows;
      dw = dh * imgAspect * (charH / charW);
      dx = (cols - dw) / 2;
    }
    const cx = cols / 2;
    const cy = rows / 2;
    dx = cx - (cx - dx) * FACE_SCALE;
    dy = cy - (cy - dy) * FACE_SCALE;
    dw *= FACE_SCALE;
    dh *= FACE_SCALE;
    maskCtx.drawImage(faceImg, dx, dy, dw, dh);
    const data = maskCtx.getImageData(0, 0, cols, rows).data;
    const m = new Float32Array(cols * rows);
    let maxL = 0;
    for (let i = 0, p = 0; i < m.length; i++, p += 4) {
      const l = data[p]! / 255;
      m[i] = l;
      if (l > maxL) maxL = l;
    }
    const norm = maxL > 0 ? 1 / maxL : 1;
    for (let i = 0; i < m.length; i++) {
      m[i] = Math.pow(m[i]! * norm, FACE_GAMMA);
    }
    const gx = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const l = c > 0 ? m[r * cols + c - 1]! : m[r * cols + c]!;
        const rt = c < cols - 1 ? m[r * cols + c + 1]! : m[r * cols + c]!;
        gx[r * cols + c] = (rt - l) * 0.5;
      }
    }
    mask = m;
    gradX = gx;
  }

  function maskAt(col: number, row: number): number {
    if (!mask || col < 0 || col >= cols || row < 0 || row >= rows) return 0;
    return mask[row * cols + col]!;
  }
  function gradAt(col: number, row: number): number {
    if (!gradX || col < 0 || col >= cols || row < 0 || row >= rows) return 0;
    return gradX[row * cols + col]!;
  }

  function spawnDrop(col: number, offscreen?: boolean): Drop {
    const length = 8 + Math.floor(Math.random() * 20);
    const chars: string[] = [];
    for (let i = 0; i < length; i++) chars.push(randomGlyph());
    return {
      y: offscreen ? -(Math.random() * rows) : -(Math.random() * length),
      speed: 0.55 + Math.random() * 0.9,
      length,
      col,
      chars,
      flickerAt: 0,
    };
  }

  function measureChar(): { w: number; h: number } {
    const span = document.createElement("span");
    span.textContent = "M";
    span.style.cssText =
      "position:absolute;visibility:hidden;white-space:pre;font-size:11px;font-family:monospace;line-height:1;";
    document.body.appendChild(span);
    const rect = span.getBoundingClientRect();
    document.body.removeChild(span);
    return { w: rect.width || 7, h: rect.height || 13 };
  }

  function rebuildGrid() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.max(1, Math.floor(w / charW));
    rows = Math.max(1, Math.floor(h / charH));

    rebuildMask();

    const targetDrops = Math.max(8, Math.floor(cols * 1.6));
    drops = [];
    for (let i = 0; i < targetDrops; i++) {
      drops.push(spawnDrop(Math.floor(Math.random() * cols), true));
    }
  }

  function drawStaticFrame() {
    ctx!.fillStyle = "#09090b";
    ctx!.fillRect(0, 0, canvas.width, canvas.height);
    ctx!.font = "11px monospace";
    ctx!.textBaseline = "top";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.03) {
          const alpha = 0.08 + Math.random() * 0.12;
          ctx!.fillStyle = `rgba(40, 170, 255, ${alpha})`;
          ctx!.fillText(randomGlyph(), c * charW, r * charH);
        }
      }
    }
  }

  function step(time: number) {
    if (!loopActive) return;
    frame = requestAnimationFrame(step);
    if (time - lastRenderAt < FRAME_INTERVAL_MS || cols <= 0 || rows <= 0)
      return;

    const delta = Math.min(
      3,
      lastRenderAt === 0 ? 1 : (time - lastRenderAt) / FRAME_INTERVAL_MS
    );
    lastRenderAt = time;
    tick += delta;

    // Fade the previous frame (trail ghosting).
    ctx!.fillStyle = "rgba(9, 9, 11, 0.12)";
    ctx!.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    ctx!.font = "11px monospace";
    ctx!.textBaseline = "top";

    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i]!;
      const headRowCur = Math.floor(drop.y);
      const mHead = maskAt(drop.col, headRowCur);
      const speedFactor = 1 - mHead * (1 - FACE_SPEED_SLOW);
      drop.y += drop.speed * delta * speedFactor;

      if (tick - drop.flickerAt > 3) {
        drop.chars[0] = randomGlyph();
        const mutIdx = Math.floor(Math.random() * drop.chars.length);
        drop.chars[mutIdx] = randomGlyph();
        drop.flickerAt = tick;
      }

      const headRow = Math.floor(drop.y);

      for (let t = 0; t < drop.length; t++) {
        const row = headRow - t;
        if (row < 0 || row >= rows) continue;

        const m = maskAt(drop.col, row);
        const bend = gradAt(drop.col, row) * FACE_BEND * charW;
        const x = drop.col * charW + bend;
        const bgFactor = FACE_BG_DIM + (1 - FACE_BG_DIM) * m;
        const brighten = bgFactor * (1 + m * FACE_BRIGHTEN);

        const y = row * charH;
        const ch = drop.chars[t % drop.chars.length]!;

        let r_: number, g_: number, b_: number, a_: number;
        if (t === 0) {
          r_ = 200;
          g_ = 240;
          b_ = 255;
          a_ = 0.95;
        } else if (t < 3) {
          a_ = 0.7 - t * 0.1;
          r_ = 80;
          g_ = 200;
          b_ = 255;
        } else {
          const progress = t / drop.length;
          a_ = Math.max(0, 0.5 * (1 - progress));
          r_ = 30;
          g_ = 150;
          b_ = 255;
        }
        const rr = Math.min(255, r_ + m * FACE_WHITE_SHIFT);
        const gg = Math.min(255, g_ + m * 30);
        const bb = Math.min(255, b_ + m * (FACE_WHITE_SHIFT - 20));
        const aa = Math.min(1, a_ * brighten);
        ctx!.fillStyle = `rgba(${rr | 0}, ${gg | 0}, ${bb | 0}, ${aa})`;
        ctx!.fillText(ch, x, y);
      }

      if (headRow - drop.length > rows) {
        drops[i] = spawnDrop(Math.floor(Math.random() * cols), false);
      }
    }
  }

  function syncLoop() {
    const canRender = cols > 0 && rows > 0;
    if (motionMedia.matches) {
      if (loopActive) {
        loopActive = false;
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
      }
      if (canRender) drawStaticFrame();
      return;
    }
    if (!isVisible || !canRender) {
      if (loopActive) {
        loopActive = false;
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
      }
      return;
    }
    if (!loopActive) {
      loopActive = true;
      lastRenderAt = 0;
      frame = requestAnimationFrame(step);
    }
  }

  const size = measureChar();
  charW = size.w;
  charH = size.h;

  const onResize = () => {
    rebuildGrid();
    syncLoop();
  };
  window.addEventListener("resize", onResize);

  const onVisibilityChange = () => {
    isVisible = document.visibilityState !== "hidden";
    syncLoop();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  const onMotionChange = () => syncLoop();
  motionMedia.addEventListener("change", onMotionChange);

  rebuildGrid();
  loadFace();
  syncLoop();

  return {
    stop() {
      loopActive = false;
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionMedia.removeEventListener("change", onMotionChange);
    },
  };
}

export function MatrixRain({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const controller = startMatrix(canvas);
    return () => controller.stop();
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
