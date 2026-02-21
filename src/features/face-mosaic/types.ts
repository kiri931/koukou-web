declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "auto" | "manual";
};

export type EffectType = "mosaic" | "blur" | "blackout";

export type OpenCVStatus = "loading" | "ready" | "error";
