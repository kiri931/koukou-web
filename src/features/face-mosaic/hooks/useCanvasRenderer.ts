import { useRef, useCallback, useEffect } from "react";
import type { Rect, EffectType } from "../types";

export function useCanvasRenderer(options: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  originalImageRef: React.RefObject<HTMLImageElement | null>;
  imageLoadedRef: React.RefObject<boolean>;
  detectedRectsRef: React.RefObject<Rect[]>;
  manualRectsRef: React.RefObject<Rect[]>;
  selectedRectRef: React.RefObject<Rect | null>;
  isDrawingRef: React.RefObject<boolean>;
  drawStartRef: React.RefObject<{ x: number; y: number } | null>;
  drawCurrentRef: React.RefObject<{ x: number; y: number } | null>;
  effect: EffectType;
  mosaicSize: number;
  blurKernel: number;
  detectedRects: Rect[];
  manualRects: Rect[];
  imageLoaded: boolean;
}) {
  const {
    canvasRef,
    overlayCanvasRef,
    originalImageRef,
    imageLoadedRef,
    detectedRectsRef,
    manualRectsRef,
    selectedRectRef,
    isDrawingRef,
    drawStartRef,
    drawCurrentRef,
    effect,
    mosaicSize,
    blurKernel,
    detectedRects,
    manualRects,
    imageLoaded,
  } = options;

  const effectRef = useRef<EffectType>(effect);
  const mosaicSizeRef = useRef(mosaicSize);
  const blurKernelRef = useRef(blurKernel);
  const renderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { effectRef.current = effect; }, [effect]);
  useEffect(() => { mosaicSizeRef.current = mosaicSize; }, [mosaicSize]);
  useEffect(() => { blurKernelRef.current = blurKernel; }, [blurKernel]);

  const applyMosaic = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, blockSize: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iw = Math.ceil(w);
    const ih = Math.ceil(h);
    for (let bx = ix; bx < ix + iw; bx += blockSize) {
      for (let by = iy; by < iy + ih; by += blockSize) {
        const bw = Math.min(blockSize, ix + iw - bx);
        const bh = Math.min(blockSize, iy + ih - by);
        const cx = Math.floor(bx + bw / 2);
        const cy = Math.floor(by + bh / 2);
        const pixel = ctx.getImageData(cx, cy, 1, 1).data;
        ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
        ctx.fillRect(bx, by, bw, bh);
      }
    }
  }, []);

  const applyBlur = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, x: number, y: number, w: number, h: number, kernel: number) => {
    const blurPx = kernel * 0.4;
    const tmp = new OffscreenCanvas(w, h);
    const tmpCtx = tmp.getContext("2d")!;
    tmpCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    ctx.save();
    ctx.filter = `blur(${blurPx}px)`;
    ctx.drawImage(tmp, x, y);
    ctx.restore();
  }, []);

  const applyEffectOnCtx = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, rect: Rect, eff: EffectType, mosSize: number, blKernel: number) => {
    const { x, y, w, h } = rect;
    if (w <= 0 || h <= 0) return;
    switch (eff) {
      case "mosaic":
        applyMosaic(ctx, x, y, w, h, Math.max(1, mosSize));
        break;
      case "blur":
        applyBlur(ctx, canvas, x, y, w, h, blKernel);
        break;
      case "blackout":
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y, w, h);
        break;
    }
  }, [applyMosaic, applyBlur]);

  const renderOverlay = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const octx = overlay.getContext("2d");
    if (!octx) return;
    octx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw detected rects (green)
    detectedRectsRef.current.forEach((r) => {
      if (r === selectedRectRef.current) return;
      octx.strokeStyle = "#22c55e";
      octx.lineWidth = 2;
      octx.setLineDash([]);
      octx.strokeRect(r.x, r.y, r.w, r.h);
    });

    // Draw manual rects (blue dashed)
    manualRectsRef.current.forEach((r) => {
      if (r === selectedRectRef.current) return;
      octx.strokeStyle = "#60a5fa";
      octx.lineWidth = 2;
      octx.setLineDash([4, 3]);
      octx.strokeRect(r.x, r.y, r.w, r.h);
      octx.setLineDash([]);
    });

    // Selected rect (yellow dashed)
    if (selectedRectRef.current) {
      const r = selectedRectRef.current;
      octx.strokeStyle = "#fbbf24";
      octx.lineWidth = 2.5;
      octx.setLineDash([6, 3]);
      octx.strokeRect(r.x, r.y, r.w, r.h);
      octx.setLineDash([]);
    }

    // In-progress drawing rect
    if (isDrawingRef.current && drawStartRef.current && drawCurrentRef.current) {
      const x = Math.min(drawStartRef.current.x, drawCurrentRef.current.x);
      const y = Math.min(drawStartRef.current.y, drawCurrentRef.current.y);
      const w = Math.abs(drawCurrentRef.current.x - drawStartRef.current.x);
      const h = Math.abs(drawCurrentRef.current.y - drawStartRef.current.y);
      octx.strokeStyle = "#60a5fa";
      octx.lineWidth = 2;
      octx.setLineDash([4, 3]);
      octx.strokeRect(x, y, w, h);
      octx.setLineDash([]);
    }
  }, [overlayCanvasRef, detectedRectsRef, manualRectsRef, selectedRectRef, isDrawingRef, drawStartRef, drawCurrentRef]);

  const renderAll = useCallback(() => {
    if (!imageLoadedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !originalImageRef.current) return;

    ctx.drawImage(originalImageRef.current, 0, 0);
    const allRects = [...detectedRectsRef.current, ...manualRectsRef.current];
    allRects.forEach((rect) => {
      applyEffectOnCtx(ctx, canvas, rect, effectRef.current, mosaicSizeRef.current, blurKernelRef.current);
    });
    renderOverlay();
  }, [canvasRef, originalImageRef, imageLoadedRef, detectedRectsRef, manualRectsRef, applyEffectOnCtx, renderOverlay]);

  const scheduleRender = useCallback(() => {
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    renderTimerRef.current = setTimeout(renderAll, 150);
  }, [renderAll]);

  // Trigger re-render when effect params or rects change
  useEffect(() => { scheduleRender(); }, [effect, mosaicSize, blurKernel, detectedRects, manualRects, scheduleRender]);

  // Render after imageLoaded becomes true
  useEffect(() => {
    if (imageLoaded) {
      renderAll();
    }
  }, [imageLoaded, renderAll]);

  return {
    effectRef,
    mosaicSizeRef,
    blurKernelRef,
    renderAll,
    renderOverlay,
    scheduleRender,
  };
}
