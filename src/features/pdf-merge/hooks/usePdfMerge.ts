import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";

import type { PdfFile } from "../types";

const workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

if (pdfjsLib.GlobalWorkerOptions.workerSrc !== workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
}

const PREVIEW_SCALE = 1.2;

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function renderPreviewPage(
  doc: PDFDocumentProxy,
  pageNumber: number
): Promise<string | null> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: PREVIEW_SCALE });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const renderTask = page.render({ canvasContext: context, viewport });
  await renderTask.promise;
  page.cleanup();
  return canvas.toDataURL("image/png");
}

export function usePdfMerge() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const filesRef = useRef<PdfFile[]>([]);
  const buffersRef = useRef<Map<string, ArrayBuffer>>(new Map());
  const pdfCacheRef = useRef<Map<string, PDFDocumentProxy>>(new Map());

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const totalPages = useMemo(
    () => files.reduce((sum, file) => sum + file.pageCount, 0),
    [files]
  );

  const getPdfDoc = useCallback(async (id: string, data: ArrayBuffer) => {
    const cached = pdfCacheRef.current.get(id);
    if (cached) return cached;
    const task = pdfjsLib.getDocument({ data });
    const doc = await task.promise;
    pdfCacheRef.current.set(id, doc);
    return doc;
  }, []);

  const addFiles = useCallback(async (incoming: File[]) => {
    const targets = incoming.filter(isPdfFile);
    if (targets.length === 0) return;

    const additions: PdfFile[] = [];

    for (const file of targets) {
      try {
        const id = generateId();
        const arrayBuffer = await file.arrayBuffer();
        const doc = await getPdfDoc(id, arrayBuffer);
        const pageCount = doc.numPages;
        const previewUrl = await renderPreviewPage(doc, 1);

        buffersRef.current.set(id, arrayBuffer);

        additions.push({
          id,
          file,
          name: file.name,
          pageCount,
          previewUrl,
          previewPage: 1,
        });
      } catch {
        // ignore broken file
      }
    }

    if (additions.length > 0) {
      setFiles((prev) => [...prev, ...additions]);
    }
  }, [getPdfDoc]);

  const removeFile = useCallback((id: string) => {
    const doc = pdfCacheRef.current.get(id);
    if (doc) {
      doc.destroy();
    }
    buffersRef.current.delete(id);
    pdfCacheRef.current.delete(id);
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      if (fromIndex === toIndex) return prev;
      if (fromIndex < 0 || toIndex < 0) return prev;
      if (fromIndex >= prev.length || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const changePage = useCallback(async (id: string, delta: number) => {
    const current = filesRef.current.find((file) => file.id === id);
    if (!current) return;
    const nextPage = Math.min(
      Math.max(1, current.previewPage + delta),
      current.pageCount
    );
    if (nextPage === current.previewPage) return;

    const buffer = buffersRef.current.get(id);
    if (!buffer) return;

    try {
      const doc = await getPdfDoc(id, buffer);
      const previewUrl = await renderPreviewPage(doc, nextPage);
      setFiles((prev) =>
        prev.map((file) =>
          file.id === id
            ? { ...file, previewPage: nextPage, previewUrl }
            : file
        )
      );
    } catch {
      // ignore
    }
  }, [getPdfDoc]);

  const merge = useCallback(async (outputName: string) => {
    if (filesRef.current.length === 0) return;
    setIsMerging(true);
    try {
      const merged = await PDFDocument.create();
      for (const file of filesRef.current) {
        const buffer = buffersRef.current.get(file.id);
        if (!buffer) continue;
        const src = await PDFDocument.load(buffer);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const safeName = outputName.trim() ? outputName.trim() : "merged";
      const filename = safeName.toLowerCase().endsWith(".pdf")
        ? safeName
        : `${safeName}.pdf`;
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setIsMerging(false);
    }
  }, []);

  const clear = useCallback(() => {
    pdfCacheRef.current.forEach((doc) => doc.destroy());
    buffersRef.current.clear();
    pdfCacheRef.current.clear();
    setFiles([]);
  }, []);

  return {
    files,
    isMerging,
    totalPages,
    addFiles,
    removeFile,
    reorderFiles,
    changePage,
    merge,
    clear,
  };
}
