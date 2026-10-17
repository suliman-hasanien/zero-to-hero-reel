import React from "react";
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import timeline from "../public/timeline.json";

export const TL = timeline as Timeline;
export const FPS = 60000 / 1001;
export const W = 1080;
export const H = 1920;

export type Word = {w: string; s: number; e: number; key: boolean};
export type Line = {clip: number; start: number; end: number; words: Word[]};
export type Timeline = {
  fps: number;
  duration: number;
  clips: {clip: number; start: number; end: number}[];
  zeroToHero: {start: number; to: number; hero: number; end: number};
  lines: Line[];
};

// Brand + design tokens
export const C = {
  red: "#E31E24",
  redSoft: "rgba(227,30,36,0.18)",
  ink: "#0E0F13",
  white: "#FFFFFF",
  glass: "rgba(14,15,20,0.74)",
  stroke: "rgba(255,255,255,0.16)",
  blue: "#3B82F6",
  muted: "rgba(255,255,255,0.55)",
  green: "#22C55E",
  yellow: "#FFC93C",
};
export const FONT_AR = "Alexandria";
export const FONT_UI = "Space Grotesk";
export const FONT_TITLE = "Anton";

export const f = (sec: number) => Math.round(sec * FPS);

/** Global start (seconds) of the n-th word in clip `clip` that starts with `text`. */
export const at = (clip: number, text: string, n = 0): number => {
  const hits = TL.lines.filter((l) => l.clip === clip).flatMap((l) => l.words).filter((w) => w.w.startsWith(text));
  if (!hits[n]) throw new Error(`word not found: clip ${clip} "${text}"`);
  return hits[n].s;
};
export const atEnd = (clip: number, text: string, n = 0): number => {
  const hits = TL.lines.filter((l) => l.clip === clip).flatMap((l) => l.words).filter((w) => w.w.startsWith(text));
  return hits[n].e;
};
export const clipStart = (c: number) => TL.clips[c - 1].start;
export const clipEnd = (c: number) => TL.clips[c - 1].end;

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

/** 0..1 springy entrance starting at `sec` (global). */
export const useIn = (sec: number, damping = 16, mass = 0.7) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - f(sec), fps, config: {damping, mass, stiffness: 140}});
};

/** eased 0..1 between two global times */
export const useRamp = (from: number, to: number, ease = EASE) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [f(from), f(to)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
};

/** visibility window with smooth in/out; returns {p: entrance 0..1, o: exit 1..0} */
export const useWindow = (start: number, end: number, outDur = 0.35) => {
  const p = useIn(start);
  const o = 1 - useRamp(end - outDur, end, EASE_IN);
  return {p, o, visible: p > 0.001 && o > 0.001};
};

export const Glass: React.FC<{style?: React.CSSProperties; children?: React.ReactNode; radius?: number}> = ({
  style,
  children,
  radius = 30,
}) => (
  <div
    style={{
      background: C.glass,
      border: `2px solid ${C.stroke}`,
      borderRadius: radius,
      backdropFilter: "blur(22px)",
      WebkitBackdropFilter: "blur(22px)",
      boxShadow: "0 30px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Dots: React.FC = () => (
  <div style={{display: "flex", gap: 10}}>
    {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
      <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />
    ))}
  </div>
);

/** Positioned layer that pops in (scale + rise + blur) and fades out. */
export const Pop: React.FC<{
  start: number;
  end: number;
  x: number;
  y: number;
  w?: number;
  origin?: string;
  from?: "up" | "down" | "left" | "right" | "scale";
  children: React.ReactNode;
}> = ({start, end, x, y, w, origin = "center", from = "up", children}) => {
  const {p, o, visible} = useWindow(start, end);
  if (!visible) return null;
  const d = 60 * (1 - p);
  const tr =
    from === "up" ? `translateY(${d}px)` : from === "down" ? `translateY(${-d}px)` :
    from === "left" ? `translateX(${-d * 2}px)` : from === "right" ? `translateX(${d * 2}px)` : "";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        transform: `${tr} scale(${0.86 + 0.14 * p})`,
        transformOrigin: origin,
        opacity: Math.min(p * 1.4, 1) * o,
        filter: `blur(${(1 - p) * 10 + (1 - o) * 8}px)`,
      }}
    >
      {children}
    </div>
  );
};

export const Label: React.FC<{children: React.ReactNode; size?: number; color?: string; weight?: number; ar?: boolean}> = ({
  children,
  size = 26,
  color = C.white,
  weight = 600,
  ar,
}) => (
  <div
    style={{
      fontFamily: ar ? FONT_AR : FONT_UI,
      fontSize: size,
      fontWeight: weight,
      color,
      direction: ar ? "rtl" : "ltr",
      letterSpacing: ar ? 0 : 0.5,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);
