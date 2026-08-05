import { useState, useCallback } from "react";
import type { Rect } from "../types";

export function useFaceDetection(
  opencvReadyRef: React.RefObject<boolean>,
  imageLoadedRef: React.RefObject<boolean>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  detectorRef: React.RefObject<any>,
  onDetected: (rects: Rect[]) => void,
) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState("");
  const [scoreThreshold, setScoreThreshold] = useState(0.6);
  const [nmsThreshold, setNmsThreshold] = useState(0.3);

  const handleDetect = useCallback(async () => {
    if (!opencvReadyRef.current || !imageLoadedRef.current) return;
    setIsDetecting(true);
    setDetectStatus("検出中...");

    await new Promise((r) => setTimeout(r, 10));

    // モバイル端末の高解像度写真はWASMヒープを超えてクラッシュするため、
    // 検出用に縮小したキャンバスを用意し、結果座標をスケールバックする
    const MAX_DETECT_DIM = 800;

    let detectCanvas: HTMLCanvasElement;
    let scaleX = 1;
    let scaleY = 1;
    let tempCanvas: HTMLCanvasElement | null = null;

    try {
      const cv = window.cv;
      const canvas = canvasRef.current!;
      const origW = canvas.width;
      const origH = canvas.height;

      if (origW > MAX_DETECT_DIM || origH > MAX_DETECT_DIM) {
        const scale = MAX_DETECT_DIM / Math.max(origW, origH);
        const newW = Math.round(origW * scale);
        const newH = Math.round(origH * scale);

        tempCanvas = document.createElement("canvas");
        tempCanvas.width = newW;
        tempCanvas.height = newH;
        const ctx = tempCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, 0, newW, newH);

        detectCanvas = tempCanvas;
        scaleX = origW / newW;
        scaleY = origH / newH;
      } else {
        detectCanvas = canvas;
      }

      const src = cv.imread(detectCanvas);
      const bgr = new cv.Mat();
      cv.cvtColor(src, bgr, cv.COLOR_RGBA2BGR);

      const detector = detectorRef.current;
      detector.setInputSize(new cv.Size(bgr.cols, bgr.rows));
      detector.setScoreThreshold(scoreThreshold);
      detector.setNMSThreshold(nmsThreshold);

      const faces = new cv.Mat();
      detector.detect(bgr, faces);

      const newRects: Rect[] = [];
      for (let i = 0; i < faces.rows; i++) {
        const row = i * faces.cols;
        const x = faces.data32F[row];
        const y = faces.data32F[row + 1];
        const w = faces.data32F[row + 2];
        const h = faces.data32F[row + 3];
        newRects.push({
          x: Math.round(x * scaleX),
          y: Math.round(y * scaleY),
          w: Math.round(w * scaleX),
          h: Math.round(h * scaleY),
          type: "auto",
        });
      }

      src.delete();
      bgr.delete();
      faces.delete();

      onDetected(newRects);

      if (newRects.length === 0) {
        setDetectStatus("顔が検出されませんでした。scoreThreshold を下げて再試行してください。");
      } else {
        setDetectStatus(`${newRects.length} 個の顔を検出しました`);
      }
    } catch (e: any) {
      const msg: string = e?.message ?? String(e);
      const isMemoryError =
        msg.includes("out of bounds") ||
        msg.includes("dynCall") ||
        msg.includes("memory") ||
        msg.includes("OOM");
      if (isMemoryError) {
        setDetectStatus(
          "メモリ不足: 画像が大きすぎて顔検出を実行できませんでした。より小さい画像（推奨: 短辺 1000px 以下）で再試行してください。"
        );
      } else {
        setDetectStatus("エラー: " + msg);
      }
    } finally {
      setIsDetecting(false);
      // 一時キャンバスをDOMから切り離してGCに渡す
      if (tempCanvas) {
        tempCanvas.width = 1;
        tempCanvas.height = 1;
        tempCanvas = null;
      }
    }
  }, [opencvReadyRef, imageLoadedRef, canvasRef, detectorRef, scoreThreshold, nmsThreshold, onDetected]);

  return {
    isDetecting,
    detectStatus,
    setDetectStatus,
    scoreThreshold,
    setScoreThreshold,
    nmsThreshold,
    setNmsThreshold,
    handleDetect,
  };
}
