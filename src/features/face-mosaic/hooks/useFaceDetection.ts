import { useState, useCallback } from "react";
import type { Rect } from "../types";

export function useFaceDetection(
  opencvReadyRef: React.RefObject<boolean>,
  imageLoadedRef: React.RefObject<boolean>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  cascadeRef: React.RefObject<any>,
  onDetected: (rects: Rect[]) => void,
) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState("");
  const [minNeighbors, setMinNeighbors] = useState(2);
  const [scaleFactor, setScaleFactor] = useState(1.1);

  const handleDetect = useCallback(async () => {
    if (!opencvReadyRef.current || !imageLoadedRef.current) return;
    setIsDetecting(true);
    setDetectStatus("検出中...");

    await new Promise((r) => setTimeout(r, 10));

    try {
      const cv = window.cv;
      const canvas = canvasRef.current!;
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      const faces = new cv.RectVector();
      const msize = new cv.Size(0, 0);
      cascadeRef.current.detectMultiScale(gray, faces, scaleFactor, minNeighbors, 0, msize, msize);

      const newRects: Rect[] = [];
      for (let i = 0; i < faces.size(); i++) {
        const face = faces.get(i);
        newRects.push({ x: face.x, y: face.y, w: face.width, h: face.height, type: "auto" });
      }

      src.delete();
      gray.delete();
      faces.delete();

      onDetected(newRects);

      if (newRects.length === 0) {
        setDetectStatus("顔が検出されませんでした。minNeighbors を下げて再試行してください。");
      } else {
        setDetectStatus(`${newRects.length} 個の顔を検出しました`);
      }
    } catch (e: any) {
      setDetectStatus("エラー: " + e.message);
    } finally {
      setIsDetecting(false);
    }
  }, [opencvReadyRef, imageLoadedRef, canvasRef, cascadeRef, scaleFactor, minNeighbors, onDetected]);

  return {
    isDetecting,
    detectStatus,
    setDetectStatus,
    minNeighbors,
    setMinNeighbors,
    scaleFactor,
    setScaleFactor,
    handleDetect,
  };
}
