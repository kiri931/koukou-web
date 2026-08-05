import { useState, useRef, useEffect, useCallback } from "react";
import type { OpenCVStatus } from "../types";

// OpenCV.js は 10.9MB、顔検出モデルは 0.9MB ある。
// 学校のネットワークや電波の悪い場所では、**失敗ではなく「終わらない」**という
// 形で止まることがある。onerror は返らないので、時間で見切りを付ける。
const SCRIPT_TIMEOUT_MS = 45_000;
const MODEL_TIMEOUT_MS = 30_000;

/**
 * 顔の自動検出のために OpenCV.js とモデルを読み込む。
 *
 * **読み込めなくても、この道具は使える。**
 * モザイク・ぼかし・黒塗りと手動の囲みは Canvas だけで動いていて、
 * OpenCV を使うのは「顔を自動で見つける」ところだけ。
 * だから失敗したときは、道具ごと止めるのではなく
 * 「自動検出だけが使えない」と伝えて手動へ案内する（呼び出し側で表示）。
 */
export function useOpenCV() {
  const [opencvStatus, setOpencvStatus] = useState<OpenCVStatus>("loading");
  const [statusText, setStatusText] = useState("顔を見つける準備をしています…");
  const opencvReadyRef = useRef(false);
  const opencvLoadingRef = useRef(false);
  const detectorRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  /** 「もう一度試す」で作り直すための番号。変えると読み込みからやり直す */
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    if (opencvReadyRef.current) return;
    opencvLoadingRef.current = false;
    setOpencvStatus("loading");
    setStatusText("もう一度読み込んでいます…");
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const fail = (message: string) => {
      if (cancelled) return;
      clearTimer();
      opencvLoadingRef.current = false;
      setOpencvStatus("error");
      setStatusText(message);
    };

    function loadModel() {
      const cv = window.cv;
      clearTimer();
      timerRef.current = window.setTimeout(
        () => fail("顔を見つけるためのデータを読み込めませんでした（時間切れ）。"),
        MODEL_TIMEOUT_MS,
      );

      fetch("/tools/face_detection_yunet_2026may.onnx")
        .then((res) => {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.arrayBuffer();
        })
        .then((buf) => {
          if (cancelled) return;
          const data = new Uint8Array(buf);
          // 同じ名前のファイルが既にあると2回目の読み込みで落ちる（再試行のとき）
          try {
            cv.FS_unlink("/face_detection_yunet_2026may.onnx");
          } catch {
            // 初回は存在しない。無視してよい
          }
          cv.FS_createDataFile("/", "face_detection_yunet_2026may.onnx", data, true, false, false);
          // 入力サイズは検出直前に実画像サイズへ setInputSize() で更新するため仮値でよい
          detectorRef.current = new cv.FaceDetectorYN(
            "face_detection_yunet_2026may.onnx",
            "",
            new cv.Size(320, 320),
          );
          clearTimer();
          opencvReadyRef.current = true;
          setOpencvStatus("ready");
          setStatusText("顔を自動で見つけられます");
        })
        .catch((e: Error) => fail("顔を見つけるためのデータを読み込めませんでした（" + e.message + "）。"));
    }

    if (opencvReadyRef.current || opencvLoadingRef.current) return;
    opencvLoadingRef.current = true;

    if (window.cv && typeof window.cv.Mat === "function") {
      setStatusText("顔を見つける準備をしています…");
      loadModel();
      return () => {
        cancelled = true;
        clearTimer();
      };
    }

    window.Module = {
      onRuntimeInitialized: () => {
        if (cancelled) return;
        setStatusText("顔を見つける準備をしています…");
        loadModel();
      },
    };

    const script = document.createElement("script");
    script.async = true;
    // 再試行のときはキャッシュされた壊れかけの応答を避ける
    script.src = attempt === 0 ? "/tools/opencv.js" : `/tools/opencv.js?retry=${attempt}`;
    script.onerror = () => fail("顔を見つける機能を読み込めませんでした。");
    timerRef.current = window.setTimeout(
      () => fail("顔を見つける機能の読み込みに時間がかかりすぎました。"),
      SCRIPT_TIMEOUT_MS,
    );
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [attempt]);

  return { opencvStatus, statusText, opencvReadyRef, detectorRef, retry };
}
