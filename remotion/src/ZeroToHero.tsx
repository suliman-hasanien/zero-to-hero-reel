import React from "react";
import {AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import person from "../public/person.json";
import {C, EASE, EASE_IN, f, FONT_TITLE, TL} from "./lib";

const z = TL.zeroToHero;
export const ZTH_HOLD = TL.lines.find((l) => l.words.some((w) => w.w === "UI/UX"))!.end; // stays through "UI/UX"

/** Letters fly in with tracking + mask reveal, one by one. */
const Word: React.FC<{text: string; start: number; size: number; color: string; stagger?: number; from?: number}> = ({
  text,
  start,
  size,
  color,
  stagger = 2.2,
  from = -1,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: "flex", justifyContent: "center", lineHeight: 0.86, overflow: "visible"}}>
      {text.split("").map((ch, i) => {
        const p = spring({frame: frame - f(start) - i * stagger, fps, config: {damping: 15, mass: 0.8, stiffness: 120}});
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: FONT_TITLE,
              fontSize: size,
              color,
              letterSpacing: 4,
              transform: `translateX(${(1 - p) * from * 260}px) translateY(${(1 - p) * 40}px) scale(${1 + (1 - p) * 0.35})`,
              opacity: Math.min(1, p * 1.6),
              clipPath: `inset(${(1 - Math.min(1, p)) * 100}% 0 0 0)`,
              filter: `blur(${(1 - Math.min(1, p)) * 12}px)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/**
 * "ZERO" sits behind the speaker (head overlaps its lower edge = depth);
 * "TO HERO" lands in front over the chest so the name always reads.
 */
export const ZeroToHeroTitle: React.FC<{layer: "back" | "front"}> = ({layer}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(z.start) - 30 || frame > f(ZTH_HOLD) + 30) return null;
  const exit = interpolate(frame, [f(ZTH_HOLD) - 6, f(ZTH_HOLD) + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN,
  });
  const hero = spring({frame: frame - f(z.hero), fps, config: {damping: 11, mass: 0.9, stiffness: 160}});
  // slow push toward camera while it holds = depth
  const drift = interpolate(frame, [f(z.start), f(ZTH_HOLD)], [1, 1.06], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const glow = interpolate(frame, [f(z.start) - 20, f(z.start) + 10], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE});
  const out = {
    transform: `scale(${drift}) translateY(${-exit * 140}px)`,
    opacity: 1 - exit,
    filter: `blur(${exit * 14}px)`,
  };
  if (layer === "back") {
    return (
      <AbsoluteFill>
        {/* soft light wash behind the letters so the dark type reads on any wall */}
        <AbsoluteFill
          style={{
            background: "radial-gradient(60% 26% at 50% 22%, rgba(255,255,255,0.6), rgba(255,255,255,0) 70%)",
            opacity: glow * (1 - exit),
          }}
        />
        <AbsoluteFill style={{top: 250, alignItems: "center", ...out}}>
          <Word text="ZERO" start={z.start} size={380} color={C.ink} from={-1} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{top: 930, alignItems: "center", ...out}}>
      <div style={{display: "flex", alignItems: "center", gap: 26}}>
        <div style={{filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.45))"}}>
          <Word text="TO" start={z.to} size={150} color={C.white} stagger={1.5} from={1} />
        </div>
        <div
          style={{
            transform: `scale(${0.6 + 0.4 * hero})`,
            opacity: Math.min(1, hero * 2),
            filter: `drop-shadow(0 18px 40px rgba(0,0,0,0.5)) drop-shadow(0 0 30px rgba(227,30,36,${0.5 * hero}))`,
          }}
        >
          <Word text="HERO" start={z.hero} size={330} color={C.red} stagger={1.2} from={1} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Speaker cut-out placed above the title so the letters sit behind them. */
export const PersonOverlay: React.FC = () => (
  <Sequence from={f(person.start)} durationInFrames={f(person.end - person.start)}>
    <AbsoluteFill>
      <OffthreadVideo src={staticFile("person.webm")} transparent muted />
    </AbsoluteFill>
  </Sequence>
);
