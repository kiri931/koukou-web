import { useState, useRef, useCallback } from "react";

export function useImageHandler(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  onImageLoaded?: () => void,
) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const originalFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageLoadedRef = useRef(false);

  const handleFile = useCallback((file: File) => {
    setFileError("");

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setFileError("対応フォーマット（JPEG / PNG / WebP / GIF）の画像を選択してください。");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setFileError("ファイルサイズが上限（20MB）を超えています。");
      return;
    }

    originalFileRef.current = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;

        const canvas = canvasRef.current;
        const overlay = overlayCanvasRef.current;
        if (canvas && overlay) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          overlay.width = img.naturalWidth;
          overlay.height = img.naturalHeight;
        }

        imageLoadedRef.current = true;
        setImageLoaded(true);
        setFileName(file.name);
        onImageLoaded?.();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [canvasRef, overlayCanvasRef, onImageLoaded]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  }, [handleFile]);

  const onDropZoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const resetImage = useCallback(() => {
    originalImageRef.current = null;
    originalFileRef.current = null;
    imageLoadedRef.current = false;
    setImageLoaded(false);
    setFileName("");
    setFileError("");

    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (canvas) { canvas.width = 1; canvas.height = 1; }
    if (overlay) { overlay.width = 1; overlay.height = 1; }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [canvasRef, overlayCanvasRef]);

  return {
    imageLoaded,
    imageLoadedRef,
    fileName,
    fileError,
    isDragOver,
    originalImageRef,
    originalFileRef,
    fileInputRef,
    handleFile,
    onDragOver,
    onDragLeave,
    onDrop,
    onDropZoneClick,
    onFileChange,
    resetImage,
  };
}
