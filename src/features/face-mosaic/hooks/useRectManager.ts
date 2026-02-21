import { useState, useRef, useCallback, useEffect } from "react";
import type { Rect } from "../types";

export function useRectManager() {
  const [detectedRects, setDetectedRects] = useState<Rect[]>([]);
  const [manualRects, setManualRects] = useState<Rect[]>([]);
  const [selectedRect, setSelectedRect] = useState<Rect | null>(null);
  const [drawMode, setDrawMode] = useState(false);

  const detectedRectsRef = useRef<Rect[]>([]);
  const manualRectsRef = useRef<Rect[]>([]);
  const selectedRectRef = useRef<Rect | null>(null);
  const drawModeRef = useRef(false);

  useEffect(() => { detectedRectsRef.current = detectedRects; }, [detectedRects]);
  useEffect(() => { manualRectsRef.current = manualRects; }, [manualRects]);
  useEffect(() => { selectedRectRef.current = selectedRect; }, [selectedRect]);
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);

  const deleteSelected = useCallback(() => {
    if (!selectedRectRef.current) return;
    const r = selectedRectRef.current;
    setDetectedRects((prev) => {
      const next = prev.filter((x) => x !== r);
      detectedRectsRef.current = next;
      return next;
    });
    setManualRects((prev) => {
      const next = prev.filter((x) => x !== r);
      manualRectsRef.current = next;
      return next;
    });
    setSelectedRect(null);
    selectedRectRef.current = null;
  }, []);

  const resetRects = useCallback(() => {
    setDetectedRects([]);
    setManualRects([]);
    setSelectedRect(null);
    setDrawMode(false);
    detectedRectsRef.current = [];
    manualRectsRef.current = [];
    selectedRectRef.current = null;
    drawModeRef.current = false;
  }, []);

  // Keyboard shortcut for delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedRectRef.current) {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        deleteSelected();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [deleteSelected]);

  return {
    detectedRects,
    setDetectedRects,
    detectedRectsRef,
    manualRects,
    setManualRects,
    manualRectsRef,
    selectedRect,
    setSelectedRect,
    selectedRectRef,
    drawMode,
    setDrawMode,
    drawModeRef,
    deleteSelected,
    resetRects,
  };
}
