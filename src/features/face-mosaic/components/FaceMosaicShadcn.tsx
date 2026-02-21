import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ImageIcon,
  Upload,
  ScanFace,
  Loader2,
  Pencil,
  Trash2,
  RotateCcw,
  Download,
  RefreshCw,
  ShieldCheck,
  Grid3x3,
  Droplets,
  Square,
  CircleCheck,
  CircleAlert,
  LoaderCircle,
  FileImage,
} from "lucide-react";

import type { EffectType } from "../types";
import { useOpenCV } from "../hooks/useOpenCV";
import { useImageHandler } from "../hooks/useImageHandler";
import { useRectManager } from "../hooks/useRectManager";
import { useFaceDetection } from "../hooks/useFaceDetection";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import { useCanvasInteraction } from "../hooks/useCanvasInteraction";

export default function FaceMosaicShadcn() {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Drawing refs (shared between renderer and interaction)
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const drawCurrentRef = useRef<{ x: number; y: number } | null>(null);

  // Effect state
  const [effect, setEffect] = useState<EffectType>("mosaic");
  const [mosaicSize, setMosaicSize] = useState(15);
  const [blurKernel, setBlurKernel] = useState(21);

  // Hooks
  const { opencvStatus, statusText, opencvReadyRef, cascadeRef } = useOpenCV();

  const rectManager = useRectManager();
  const {
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
  } = rectManager;

  const onImageLoaded = useCallback(() => {
    resetRects();
    setDetectStatus("");
  }, [resetRects]);

  const {
    imageLoaded,
    imageLoadedRef,
    fileName,
    fileError,
    isDragOver,
    originalImageRef,
    originalFileRef,
    fileInputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onDropZoneClick,
    onFileChange,
    resetImage,
  } = useImageHandler(canvasRef, overlayCanvasRef, onImageLoaded);

  const onDetected = useCallback((rects: typeof detectedRects) => {
    setDetectedRects(rects);
    setSelectedRect(null);
  }, [setDetectedRects, setSelectedRect]);

  const {
    isDetecting,
    detectStatus,
    setDetectStatus,
    minNeighbors,
    setMinNeighbors,
    scaleFactor,
    setScaleFactor,
    handleDetect,
  } = useFaceDetection(opencvReadyRef, imageLoadedRef, canvasRef, cascadeRef, onDetected);

  const { effectRef, mosaicSizeRef, blurKernelRef, renderOverlay } = useCanvasRenderer({
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
  });

  const {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = useCanvasInteraction({
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
  });

  // ===== Save =====
  const handleSave = useCallback(async () => {
    if (!imageLoadedRef.current || !originalImageRef.current) return;
    const canvas = canvasRef.current!;

    const tmp = new OffscreenCanvas(canvas.width, canvas.height);
    const tmpCtx = tmp.getContext("2d")!;
    tmpCtx.drawImage(originalImageRef.current, 0, 0);

    const allRects = [...detectedRectsRef.current, ...manualRectsRef.current];
    allRects.forEach((rect) => {
      const { x, y, w, h } = rect;
      if (w <= 0 || h <= 0) return;
      switch (effectRef.current) {
        case "mosaic": {
          const blockSize = Math.max(1, mosaicSizeRef.current);
          const ix = Math.floor(x); const iy = Math.floor(y);
          const iw = Math.ceil(w); const ih = Math.ceil(h);
          for (let bx = ix; bx < ix + iw; bx += blockSize) {
            for (let by = iy; by < iy + ih; by += blockSize) {
              const bw2 = Math.min(blockSize, ix + iw - bx);
              const bh2 = Math.min(blockSize, iy + ih - by);
              const cx2 = Math.floor(bx + bw2 / 2);
              const cy2 = Math.floor(by + bh2 / 2);
              const pixel = tmpCtx.getImageData(cx2, cy2, 1, 1).data;
              tmpCtx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
              tmpCtx.fillRect(bx, by, bw2, bh2);
            }
          }
          break;
        }
        case "blur": {
          const blurPx = blurKernelRef.current * 0.4;
          const sub = new OffscreenCanvas(w, h);
          const subCtx = sub.getContext("2d")!;
          subCtx.drawImage(tmp, x, y, w, h, 0, 0, w, h);
          tmpCtx.save();
          tmpCtx.filter = `blur(${blurPx}px)`;
          tmpCtx.drawImage(sub, x, y);
          tmpCtx.restore();
          break;
        }
        case "blackout":
          tmpCtx.fillStyle = "#000";
          tmpCtx.fillRect(x, y, w, h);
          break;
      }
    });

    const blob = await tmp.convertToBlob({ type: "image/png" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const baseName = originalFileRef.current ? originalFileRef.current.name.replace(/\.[^.]+$/, "") : "image";
    a.href = url;
    a.download = "face-mosaic_" + baseName + ".png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [imageLoadedRef, originalImageRef, detectedRectsRef, manualRectsRef, effectRef, mosaicSizeRef, blurKernelRef, originalFileRef]);

  // ===== Global Reset =====
  const handleGlobalReset = useCallback(() => {
    resetImage();
    resetRects();
    setDetectStatus("");
    setEffect("mosaic");
    setMosaicSize(15);
    setBlurKernel(21);
  }, [resetImage, resetRects, setDetectStatus]);

  const hasRects = detectedRects.length > 0 || manualRects.length > 0;

  const StepBadge = ({ n }: { n: number }) => (
    <Badge className="h-7 w-7 rounded-full bg-indigo-500 text-xs font-extrabold text-white shrink-0 flex items-center justify-center p-0">
      {n}
    </Badge>
  );

  return (
    <div className="dark min-h-screen bg-[#0f172a] text-slate-100 font-sans">
      <div className="mx-auto max-w-5xl px-4 py-8 pb-16 flex flex-col gap-4">

        {/* OpenCV Status — Alert */}
        <Alert
          className={`border ${
            opencvStatus === "ready"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : opencvStatus === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
          }`}
        >
          {opencvStatus === "ready" ? (
            <CircleCheck className="h-4 w-4" />
          ) : opencvStatus === "error" ? (
            <CircleAlert className="h-4 w-4" />
          ) : (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          )}
          <AlertTitle>{statusText}</AlertTitle>
        </Alert>

        {/* Step 1: Image Selection */}
        <Card className="border-slate-700 bg-slate-800 shadow-lg">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-3 text-slate-100">
              <StepBadge n={1} />
              画像を選択
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              role="button"
              tabIndex={0}
              onClick={onDropZoneClick}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDropZoneClick(); } }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-indigo-500 bg-indigo-500/5"
                  : "border-slate-600 hover:border-indigo-500 hover:bg-indigo-500/5"
              }`}
            >
              <ImageIcon className="h-14 w-14 text-slate-500" />
              <p className="text-base font-semibold text-slate-200">画像をここにドラッグ＆ドロップ</p>
              <p className="text-sm text-slate-400">または</p>
              <Button
                variant="default"
                size="sm"
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                <Upload className="h-4 w-4" />
                ファイルを選択
              </Button>
              <p className="text-xs text-slate-500">対応形式: JPEG / PNG / WebP / GIF（最大 20MB）</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
            {fileError && (
              <Alert variant="destructive" className="mt-3 bg-red-500/10 border-red-500/30">
                <CircleAlert className="h-4 w-4" />
                <AlertDescription className="text-red-400">{fileError}</AlertDescription>
              </Alert>
            )}
            {fileName && !fileError && (
              <Badge variant="outline" className="mt-3 border-slate-600 text-slate-300 gap-1.5 py-1 px-2.5">
                <FileImage className="h-3.5 w-3.5" />
                {fileName}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Face Detection */}
        <Card className="border-slate-700 bg-slate-800 shadow-lg">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-3 text-slate-100">
              <StepBadge n={2} />
              顔を検出
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* minNeighbors */}
            <div className="flex flex-col gap-2">
              <Label className="text-slate-200">
                minNeighbors
                <span className="ml-1 text-xs font-normal text-slate-400">（小さいほど多く検出・誤検出も増える）</span>
              </Label>
              <div className="flex items-center gap-3">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[minNeighbors]}
                  onValueChange={(v) => setMinNeighbors(v[0])}
                  className="flex-1 [&_[data-slot=slider-track]]:bg-slate-700 [&_[data-slot=slider-range]]:bg-indigo-500 [&_[data-slot=slider-thumb]]:border-indigo-500"
                />
                <Badge variant="secondary" className="min-w-[2.5rem] justify-center tabular-nums bg-slate-700 text-indigo-400">
                  {minNeighbors}
                </Badge>
              </div>
            </div>

            <Separator className="bg-slate-700" />

            {/* scaleFactor */}
            <div className="flex flex-col gap-2">
              <Label className="text-slate-200">
                scaleFactor
                <span className="ml-1 text-xs font-normal text-slate-400">（小さいほど精度高い・処理は遅くなる）</span>
              </Label>
              <div className="flex items-center gap-3">
                <Slider
                  min={1.05}
                  max={2.0}
                  step={0.05}
                  value={[scaleFactor]}
                  onValueChange={(v) => setScaleFactor(v[0])}
                  className="flex-1 [&_[data-slot=slider-track]]:bg-slate-700 [&_[data-slot=slider-range]]:bg-indigo-500 [&_[data-slot=slider-thumb]]:border-indigo-500"
                />
                <Badge variant="secondary" className="min-w-[2.5rem] justify-center tabular-nums bg-slate-700 text-indigo-400">
                  {scaleFactor.toFixed(2)}
                </Badge>
              </div>
            </div>

            <Separator className="bg-slate-700" />

            {/* Detect Button + Status */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                disabled={!opencvReadyRef.current || !imageLoaded || isDetecting}
                onClick={handleDetect}
                className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40"
              >
                {isDetecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanFace className="h-4 w-4" />
                )}
                顔を検出
              </Button>
              {detectStatus && (
                <Badge
                  variant="outline"
                  className={`py-1 px-2.5 ${
                    detectedRects.length > 0
                      ? "border-green-500/30 text-green-400"
                      : "border-slate-600 text-slate-400"
                  }`}
                >
                  {detectStatus}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 3 + Canvas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 items-start">

          {/* Step 3: Effect Selection */}
          <Card className="border-slate-700 bg-slate-800 shadow-lg">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-3 text-slate-100">
                <StepBadge n={3} />
                エフェクト選択
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Effect RadioGroup */}
              <RadioGroup
                value={effect}
                onValueChange={(v) => setEffect(v as EffectType)}
                className="grid grid-cols-3 gap-2"
              >
                {([
                  { value: "mosaic", icon: <Grid3x3 className="h-5 w-5" />, label: "モザイク" },
                  { value: "blur", icon: <Droplets className="h-5 w-5" />, label: "ぼかし" },
                  { value: "blackout", icon: <Square className="h-5 w-5" />, label: "黒塗り" },
                ] as const).map((item) => (
                  <Label
                    key={item.value}
                    htmlFor={`effect-${item.value}`}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 cursor-pointer transition-colors ${
                      effect === item.value
                        ? "border-indigo-500 bg-indigo-500/10 text-slate-100"
                        : "border-slate-600 bg-[#0f172a] text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <RadioGroupItem
                      id={`effect-${item.value}`}
                      value={item.value}
                      className="sr-only"
                    />
                    {item.icon}
                    <span className="text-xs font-medium">{item.label}</span>
                  </Label>
                ))}
              </RadioGroup>

              {/* Effect Params — Card inner */}
              {effect === "mosaic" && (
                <Card className="border-slate-700 bg-slate-900/50 shadow-none">
                  <CardContent className="flex flex-col gap-2 p-3">
                    <Label className="text-slate-200 text-sm">ピクセルサイズ</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={5}
                        max={40}
                        step={1}
                        value={[mosaicSize]}
                        onValueChange={(v) => setMosaicSize(v[0])}
                        className="flex-1 [&_[data-slot=slider-track]]:bg-slate-700 [&_[data-slot=slider-range]]:bg-indigo-500 [&_[data-slot=slider-thumb]]:border-indigo-500"
                      />
                      <Badge variant="secondary" className="min-w-[3rem] justify-center tabular-nums bg-slate-700 text-indigo-400">
                        {mosaicSize}px
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {effect === "blur" && (
                <Card className="border-slate-700 bg-slate-900/50 shadow-none">
                  <CardContent className="flex flex-col gap-2 p-3">
                    <Label className="text-slate-200 text-sm">ぼかし強度</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={5}
                        max={51}
                        step={2}
                        value={[blurKernel]}
                        onValueChange={(v) => setBlurKernel(v[0])}
                        className="flex-1 [&_[data-slot=slider-track]]:bg-slate-700 [&_[data-slot=slider-range]]:bg-indigo-500 [&_[data-slot=slider-thumb]]:border-indigo-500"
                      />
                      <Badge variant="secondary" className="min-w-[2.5rem] justify-center tabular-nums bg-slate-700 text-indigo-400">
                        {blurKernel}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator className="bg-slate-700" />

              {/* Draw Controls */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={drawMode ? "default" : "outline"}
                  size="sm"
                  disabled={!imageLoaded}
                  onClick={() => {
                    setDrawMode((prev) => !prev);
                    setSelectedRect(null);
                    selectedRectRef.current = null;
                  }}
                  className={
                    drawMode
                      ? "bg-indigo-500/10 border border-indigo-500 text-indigo-400 hover:bg-indigo-500/20"
                      : "border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-indigo-400 bg-slate-800"
                  }
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {drawMode ? "描画モード ON" : "手動描画モード"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!selectedRect}
                  onClick={deleteSelected}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  削除
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasRects}
                  onClick={resetRects}
                  className="text-slate-400 border-slate-600 hover:text-slate-200 hover:border-slate-500 bg-transparent disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  全リセット
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Canvas — Card */}
          <Card className="border-slate-700 bg-slate-800 shadow-lg overflow-hidden relative min-h-[260px] flex items-center justify-center p-0">
            <CardContent className="relative flex items-center justify-center w-full p-0">
              <canvas
                ref={canvasRef}
                className={`block max-w-full h-auto ${imageLoaded ? "" : "hidden"}`}
              />
              <canvas
                ref={overlayCanvasRef}
                className={`absolute top-0 left-0 max-w-full h-auto ${imageLoaded ? "" : "hidden"} ${drawMode ? "cursor-crosshair" : "cursor-default"}`}
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerLeave}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              />
              {!imageLoaded && (
                <div className="flex flex-col items-center gap-2 py-16 text-slate-500">
                  <ImageIcon className="h-10 w-10" />
                  <p className="text-sm">画像を選択するとここに表示されます</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step 4: Save / Reset */}
        <Card className="border-slate-700 bg-slate-800 shadow-lg">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-3 text-slate-100">
              <StepBadge n={4} />
              保存 / リセット
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                disabled={!imageLoaded}
                onClick={handleSave}
                className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                画像を保存（PNG）
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleGlobalReset}
                className="text-slate-400 border-slate-600 hover:text-slate-200 hover:border-slate-500 bg-transparent"
              >
                <RefreshCw className="h-4 w-4" />
                全体リセット
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice — Alert */}
        <Alert className="bg-indigo-500/5 border-indigo-500/15 text-slate-400">
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
          <AlertDescription className="text-xs text-slate-400">
            画像はブラウザ内でのみ処理され、サーバーへの送信は一切行われません。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
