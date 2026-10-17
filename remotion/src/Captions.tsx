import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {C, EASE, f, FONT_AR, FONT_UI, Line, TL} from "./lib";

const Y = 1395; // caption baseline zone: below faces, above Reels caption/UI band
const isLatin = (s: string) => /^[A-Za-z/ ]+$/.test(s);

const WordView: React.FC<{w: Line["words"][number]; lineEnd: number}> = ({w}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - f(w.s) + 3; // land a hair before the syllable
  const p = spring({frame: t, fps, config: {damping: 14, mass: 0.5, stiffness: 170}});
  const shown = t >= 0;
  // key words: red pill wipes in from the right (RTL), then the word sits on it in white
  const wipe = interpolate(t, [0, 9], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE});
  const latin = isLatin(w.w);
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        margin: "0 10px",
        padding: w.key ? "2px 18px 8px" : "2px 0 8px",
        opacity: shown ? Math.min(1, 0.25 + p) : 0.0,
        transform: `translateY(${(1 - p) * 34}px) scale(${0.7 + 0.3 * p})`,
        filter: `blur(${Math.max(0, (1 - p) * 8)}px)`,
      }}
    >
      {w.key && (
        <span
          style={{
            position: "absolute",
            inset: "6px 0 6px 0",
            background: C.red,
            borderRadius: 18,
            transform: `scaleX(${wipe})`,
            transformOrigin: "right center",
            boxShadow: "0 10px 30px rgba(227,30,36,0.45)",
          }}
        />
      )}
      <span
        style={{
          position: "relative",
          fontFamily: latin ? FONT_UI : FONT_AR,
          fontWeight: latin ? 700 : 800,
          fontSize: latin ? 70 : 74,
          color: C.white,
          textShadow: w.key ? "none" : "0 4px 18px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.9)",
        }}
      >
        {w.w}
      </span>
    </span>
  );
};

const LineView: React.FC<{line: Line; end: number}> = ({line, end}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [f(end) - 8, f(end)], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  if (frame < f(line.start) - 2 || frame > f(end)) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        right: 110,
        top: Y,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        direction: "rtl",
        lineHeight: 1.25,
        opacity: out,
        transform: `translateY(${(1 - out) * -24}px)`,
      }}
    >
      {line.words.map((w, i) => (
        <WordView key={i} w={w} lineEnd={end} />
      ))}
    </div>
  );
};

export const Captions: React.FC = () => {
  const z = TL.zeroToHero;
  return (
    <>
      {TL.lines.map((l, i) => {
        // the big ZERO TO HERO title speaks for itself: keep captions clear of it
        const end = l.start < z.start && l.end > z.start - 0.05 ? z.start - 0.05 : l.end;
        return <LineView key={i} line={l} end={end} />;
      })}
    </>
  );
};
