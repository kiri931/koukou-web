import { useCallback } from "react";
import type { Rect } from "../types";

export function useCanvasInteraction(options: {
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  imageLoadedRef: React.RefObject<boolean>;
  detectedRectsRef: React.RefObject<Rect[]>;
  manualRectsRef: React.RefObject<Rect[]>;
  selectedRectRef: React.RefObject<Rect | null>;
  drawModeRef: React.RefObject<boolean>;
  isDrawingRef: React.MutableRefObject<boolean>;
  drawStartRef: React.MutableRefObject<{ x: number; y: number } | null>;
  drawCurrentRef: React.MutableRefObject<{ x: number; y: number } | null>;
  setManualRects: React.Dispatch<React.SetStateAction<Rect[]>>;
  setSelectedRect: (rect: Rect | null) => void;
  renderOverlay: () => void;
}) {
  const {
    overlayCanvasRef,
    imageLoadedRef,
    detectedRectsRef,
    manualRectsRef,
    selectedRectRef,
    drawModeRef,
    isDrawingRef,
    drawStartRef,
    drawCurrentRef,
    setManualRects,
    setSelectedRect,
    renderOverlay,
  } = options;

  const getImageCoords = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return { x: 0, y: 0 };
    const rect = overlay.getBoundingClientRect();
    const scaleX = overlay.width / rect.width;
    const scaleY = overlay.height / rect.height;
    const clientX = "touches" in e && e.touches.length > 0 ? e.touches[0].clientX : "clientX" in e ? e.clientX : 0;
    const clientY = "touches" in e && e.touches.length > 0 ? e.touches[0].clientY : "clientY" in e ? e.clientY : 0;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, [overlayCanvasRef]);

  const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!imageLoadedRef.current) return;
    const pos = getImageCoords(e as any);

    if (drawModeRef.current) {
      isDrawingRef.current = true;
      drawStartRef.current = pos;
      drawCurrentRef.current = pos;
    } else {
      const allRects = [...detectedRectsRef.current, ...manualRectsRef.current];
      let hit: Rect | null = null;
      for (let i = allRects.length - 1; i >= 0; i--) {
        const r = allRects[i];
        if (pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h) {
          hit = r;
          break;
        }
      }
      setSelectedRect(hit);
      selectedRectRef.current = hit;
      renderOverlay();
    }
  }, [getImageCoords, imageLoadedRef, drawModeRef, detectedRectsRef, manualRectsRef, setSelectedRect, selectedRectRef, renderOverlay]);

  const onPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    drawCurrentRef.current = getImageCoords(e as any);
    renderOverlay();
  }, [getImageCoords, renderOverlay]);

  const onPointerUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    let pos: { x: number; y: number };
    if ("changedTouches" in e && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      pos = getImageCoords({ clientX: touch.clientX, clientY: touch.clientY } as any);
    } else {
      pos = getImageCoords(e as any);
    }

    if (drawStartRef.current) {
      const x = Math.min(drawStartRef.current.x, pos.x);
      const y = Math.min(drawStartRef.current.y, pos.y);
      const w = Math.abs(pos.x - drawStartRef.current.x);
      const h = Math.abs(pos.y - drawStartRef.current.y);

      if (w > 5 && h > 5) {
        const newRect: Rect = { x, y, w, h, type: "manual" };
        setManualRects((prev) => {
          const next = [...prev, newRect];
          manualRectsRef.current = next;
          return next;
        });
      }
    }
    drawStartRef.current = null;
    drawCurrentRef.current = null;
    renderOverlay();
  }, [getImageCoords, setManualRects, manualRectsRef, renderOverlay]);

  const onPointerLeave = useCallback(() => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      drawStartRef.current = null;
      drawCurrentRef.current = null;
      renderOverlay();
    }
  }, [renderOverlay]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    onPointerDown(e);
  }, [onPointerDown]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    onPointerMove(e);
  }, [onPointerMove]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    onPointerUp(e);
  }, [onPointerUp]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
