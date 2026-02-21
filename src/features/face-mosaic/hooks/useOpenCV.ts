import { useState, useRef, useEffect } from "react";
import type { OpenCVStatus } from "../types";

export function useOpenCV() {
  const [opencvStatus, setOpencvStatus] = useState<OpenCVStatus>("loading");
  const [statusText, setStatusText] = useState("OpenCV.js 読み込み中...");
  const opencvReadyRef = useRef(false);
  const opencvLoadingRef = useRef(false);
  const cascadeRef = useRef<any>(null);

  useEffect(() => {
    function loadCascade() {
      const cv = window.cv;
      fetch("/haarcascade_frontalface_default.xml")
        .then((res) => {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.arrayBuffer();
        })
        .then((buf) => {
          const data = new Uint8Array(buf);
          cv.FS_createDataFile("/", "haarcascade_frontalface_default.xml", data, true, false, false);
          cascadeRef.current = new cv.CascadeClassifier();
          cascadeRef.current.load("haarcascade_frontalface_default.xml");
          opencvReadyRef.current = true;
          setOpencvStatus("ready");
          setStatusText("準備完了");
        })
        .catch((e: Error) => {
          setOpencvStatus("error");
          setStatusText("Cascade 読み込みに失敗しました: " + e.message);
        });
    }

    if (opencvReadyRef.current || opencvLoadingRef.current) return;
    opencvLoadingRef.current = true;

    if (window.cv && typeof window.cv.Mat === "function") {
      setStatusText("モデル読み込み中...");
      loadCascade();
      return;
    }

    window.Module = {
      onRuntimeInitialized: () => {
        setStatusText("モデル読み込み中...");
        loadCascade();
      },
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = "/opencv.js";
    script.onerror = () => {
      opencvLoadingRef.current = false;
      setOpencvStatus("error");
      setStatusText("OpenCV.js の読み込みに失敗しました。ページを再読み込みしてください。");
    };
    document.head.appendChild(script);
  }, []);

  return { opencvStatus, statusText, opencvReadyRef, cascadeRef };
}
