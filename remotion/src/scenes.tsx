import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {at, atEnd, C, clipEnd, clipStart, Dots, EASE, f, FONT_AR, FONT_UI, Glass, Label, Pop, TL, useIn, useRamp} from "./lib";
import {ZTH_HOLD} from "./ZeroToHero";

const TOP = 230; // graphics band: under the Reels header, above the speakers' heads

/* ---------- small primitives ---------- */

const Bar: React.FC<{w: number | string; h?: number; c?: string; r?: number; style?: React.CSSProperties}> = ({w, h = 16, c = "rgba(255,255,255,0.22)", r = 8, style}) => (
  <div style={{width: w, height: h, borderRadius: r, background: c, ...style}} />
);

const Cursor: React.FC<{x: number; y: number; color?: string; label?: string}> = ({x, y, color = C.blue, label}) => (
  <div style={{position: "absolute", left: x, top: y, transform: "translate(-4px,-4px)"}}>
    <svg width="38" height="38" viewBox="0 0 24 24">
      <path d="M3 2l7 19 2.5-7.5L20 11z" fill={color} stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
    {label && (
      <div style={{marginLeft: 26, marginTop: -6, background: color, borderRadius: 8, padding: "4px 10px"}}>
        <Label size={18}>{label}</Label>
      </div>
    )}
  </div>
);

const Chip: React.FC<{text: string; color?: string; ar?: boolean; size?: number}> = ({text, color = C.red, ar, size = 28}) => (
  <div style={{display: "inline-flex", padding: "10px 22px", borderRadius: 999, background: color, boxShadow: `0 12px 30px ${color}55`}}>
    <Label size={size} ar={ar} weight={700}>{text}</Label>
  </div>
);

/** Typewriter: reveals `text` between two global times. */
const Typed: React.FC<{text: string; from: number; to: number; style?: React.CSSProperties}> = ({text, from, to, style}) => {
  const p = useRamp(from, to, (x) => x);
  const n = Math.floor(p * text.length);
  const frame = useCurrentFrame();
  const caret = frame % 30 < 16 && p < 1;
  return (
    <span style={style}>
      {text.slice(0, n)}
      <span style={{opacity: caret ? 1 : 0}}>|</span>
    </span>
  );
};

/* ---------- S1: code window -> design canvas (clip 1) ---------- */

const CODE = [
  ["const", " app = ", "createServer", "();"],
  ["app.", "get", "(", "'/users'", ", handler);"],
  ["for", " (let i = 0; i < n; i++) {"],
  ["  ", "await", " db.", "query", "(sql);"],
  ["}"],
];
const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const start = clipStart(1) + 0.25;
  const code = at(1, "الكود");
  const flip = at(1, "مش");
  const stay = at(1, "خليك");
  const end = clipEnd(1) - 0.1;
  const strike = useRamp(code, code + 0.35);
  const turn = useRamp(flip, flip + 0.5);
  const showDesign = turn > 0.5;
  const love = useIn(stay);
  return (
    <Pop start={start} end={end} x={60} y={TOP} w={640} from="left">
      <div style={{perspective: 1400}}>
        <Glass style={{height: 330, transform: `rotateY(${turn * 180 - (showDesign ? 180 : 0)}deg)`}}>
          <div style={{display: "flex", alignItems: "center", gap: 14, padding: "16px 22px", borderBottom: `2px solid ${C.stroke}`}}>
            <Dots />
            <Label size={20} color={C.muted}>{showDesign ? "design.fig" : "server.js"}</Label>
          </div>
          {!showDesign ? (
            <div style={{padding: "18px 26px", fontFamily: "Consolas, monospace", fontSize: 25, lineHeight: 1.65, color: "#C9D1D9"}}>
              {CODE.map((ln, i) => {
                const tStart = start + 0.35 + i * 0.55;
                const p = interpolate(frame, [f(tStart), f(tStart + 0.45)], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
                const txt = ln.join("");
                return (
                  <div key={i} style={{position: "relative", whiteSpace: "pre", opacity: p > 0 ? 1 : 0}}>
                    <span style={{color: i % 2 ? "#7EE787" : "#FF7B72"}}>{txt.slice(0, Math.ceil(p * txt.length))}</span>
                    <div style={{position: "absolute", left: 0, top: "52%", height: 4, width: `${strike * 100}%`, background: C.red, borderRadius: 2}} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{position: "relative", height: 260, transform: "scaleX(-1)"}}>
              <div style={{transform: "scaleX(-1)", position: "absolute", inset: 0}}>
                {/* design canvas: grid + frames + palette */}
                <div style={{position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)", backgroundSize: "32px 32px"}} />
                <div style={{position: "absolute", left: 28, top: 26, width: 170, height: 200, borderRadius: 18, background: "#fff", padding: 14}}>
                  <Bar w="100%" h={70} c={C.red} r={10} />
                  <Bar w="80%" h={12} c="#D4D4D8" style={{marginTop: 14}} />
                  <Bar w="60%" h={12} c="#D4D4D8" style={{marginTop: 10}} />
                  <Bar w={90} h={30} c={C.ink} r={15} style={{marginTop: 18}} />
                </div>
                <div style={{position: "absolute", left: 230, top: 26, display: "flex", gap: 12}}>
                  {[C.red, C.ink, C.yellow, C.blue].map((c, i) => (
                    <div key={c} style={{width: 54, height: 54, borderRadius: 14, background: c, border: "2px solid rgba(255,255,255,.4)", transform: `scale(${interpolate(frame, [f(flip + 0.5 + i * 0.08), f(flip + 0.75 + i * 0.08)], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE})})`}} />
                  ))}
                </div>
                <div style={{position: "absolute", left: 230, top: 104}}>
                  <div style={{fontFamily: FONT_UI, fontWeight: 700, fontSize: 64, color: "#fff", lineHeight: 1}}>Aa</div>
                  <Label size={18} color={C.muted}>Space Grotesk · 64</Label>
                </div>
                <div style={{position: "absolute", left: 420, top: 120, transform: `scale(${love})`}}>
                  <Chip text="UI/UX" />
                </div>
                <Cursor x={160 + turn * 120} y={150 - turn * 40} label="You" />
              </div>
            </div>
          )}
        </Glass>
      </div>
    </Pop>
  );
};

/* ---------- S2: design curiosity + "where do I start?" (clip 2) ---------- */

const PenPath: React.FC<{from: number}> = ({from}) => {
  const p = useRamp(from, from + 0.9);
  return (
    <svg width="560" height="200" viewBox="0 0 560 200">
      <path d="M20 160 C 140 10, 260 10, 300 100 S 470 190, 540 40" fill="none" stroke={C.white} strokeWidth="6" strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      {[[20, 160], [300, 100], [540, 40]].map(([x, y], i) => (
        <g key={i} opacity={p > i / 2.2 ? 1 : 0}>
          <line x1={x - 50} y1={y + 30} x2={x + 50} y2={y - 30} stroke={C.blue} strokeWidth="3" />
          <rect x={x - 10} y={y - 10} width="20" height="20" fill="white" stroke={C.blue} strokeWidth="4" />
        </g>
      ))}
    </svg>
  );
};

const S2: React.FC = () => {
  const design = at(2, "مجال");
  const but = at(2, "ولكن");
  const start = at(2, "تبدأ");
  const end = at(2, "هل", 1) - 0.05;
  const frame = useCurrentFrame();
  const q = useIn(start, 9);
  return (
    <>
      <Pop start={design - 0.1} end={but + 0.1} x={170} y={TOP + 20} w={740}>
        <Glass style={{padding: 24}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8}}>
            <Label size={22} color={C.muted}>Pen tool</Label>
            <Chip text="Design" size={22} />
          </div>
          <PenPath from={design} />
        </Glass>
      </Pop>
      <Pop start={but} end={end} x={110} y={TOP + 10} w={860}>
        <div style={{display: "flex", gap: 22, justifyContent: "center"}}>
          {[0, 1, 2].map((i) => {
            const pulse = i === 1 ? 1 + 0.06 * Math.sin((frame - f(start)) / 6) * q : 1;
            return (
              <div key={i} style={{width: 250, height: 300, borderRadius: 26, border: "4px dashed rgba(255,255,255,0.8)", background: "rgba(14,15,20,0.45)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pulse})`}}>
                <div style={{fontFamily: FONT_UI, fontWeight: 700, fontSize: 150, color: i === 1 ? C.red : "rgba(255,255,255,0.35)", transform: `scale(${i === 1 ? q : 1})`}}>?</div>
              </div>
            );
          })}
        </div>
      </Pop>
    </>
  );
};

/* ---------- S3: the world moves, you stay (clip 2) ---------- */

const S3: React.FC = () => {
  const start = at(2, "هل", 1);
  const grow = at(2, "يتطور");
  const you = at(2, "ولكنك");
  const end = at(2, "اليوم") - 0.05;
  const p = useRamp(start + 0.1, grow + 0.7);
  const stuck = useRamp(you, you + 0.5);
  const frame = useCurrentFrame();
  const blink = 0.55 + 0.45 * Math.abs(Math.sin((frame - f(you)) / 10));
  const pts = Array.from({length: 9}, (_, i) => [20 + i * 90, 250 - Math.pow(i / 8, 2.2) * 220]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <Pop start={start} end={end} x={90} y={TOP} w={900}>
      <Glass style={{padding: "22px 26px"}}>
        <div style={{display: "flex", justifyContent: "space-between"}}>
          <Label size={22} color={C.muted}>Tech growth · 2020 → 2026</Label>
          <Label size={22} color={C.green}>▲ AI</Label>
        </div>
        <svg width="850" height="280" viewBox="0 0 850 280">
          {[60, 120, 180, 240].map((y) => <line key={y} x1="0" x2="850" y1={y} y2={y} stroke="rgba(255,255,255,.08)" strokeWidth="2" />)}
          <path d={d} fill="none" stroke={C.green} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
          <circle cx={pts[8][0]} cy={pts[8][1]} r={12 * p} fill={C.green} />
          {/* "you": flat and stuck */}
          <line x1="20" x2={20 + 760 * stuck} y1="250" y2="250" stroke={C.red} strokeWidth="7" strokeLinecap="round" strokeDasharray="14 12" />
          <g opacity={stuck}>
            <circle cx={20 + 760 * stuck} cy="250" r="13" fill={C.red} opacity={blink} />
            <text x={20 + 760 * stuck - 70} y="225" fill={C.red} fontFamily={FONT_UI} fontWeight={700} fontSize="28">YOU</text>
          </g>
        </svg>
      </Glass>
    </Pop>
  );
};

/* ---------- S4b: UI / UX chips beside the title ---------- */

const S4: React.FC = () => {
  const ui = at(2, "UI/UX");
  return (
    <>
      <Pop start={ui - 0.05} end={ZTH_HOLD + 0.1} x={70} y={1270} from="left"><Chip text="UI" size={44} color={C.ink} /></Pop>
      <Pop start={ui + 0.18} end={ZTH_HOLD + 0.1} x={880} y={1270} from="right"><Chip text="UX" size={44} /></Pop>
    </>
  );
};

/* ---------- S5: level up to the top + world of design (clip 2) ---------- */

const S5: React.FC = () => {
  const start = at(2, "سوف");
  const top = at(2, "للقمة");
  const world = at(2, "عالم");
  const end = clipEnd(2) - 0.15;
  const p = useRamp(start + 0.1, top + 0.45);
  const pal = useIn(world);
  return (
    <Pop start={start} end={end} x={110} y={TOP} w={860}>
      <Glass style={{padding: "24px 28px"}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline"}}>
          <Label size={24} color={C.muted}>Beginner</Label>
          <div style={{fontFamily: FONT_UI, fontWeight: 700, fontSize: 56, color: C.white}}>{Math.round(p * 100)}%</div>
          <Label size={24} color={p > 0.98 ? C.yellow : C.muted}>PRO ★</Label>
        </div>
        <div style={{height: 26, borderRadius: 13, background: "rgba(255,255,255,.12)", marginTop: 12, overflow: "hidden"}}>
          <div style={{width: `${p * 100}%`, height: "100%", borderRadius: 13, background: `linear-gradient(90deg, ${C.red}, #FF6A3D)`}} />
        </div>
        <div style={{display: "flex", gap: 14, marginTop: 24, alignItems: "center", opacity: pal, transform: `translateY(${(1 - pal) * 20}px)`}}>
          {[C.red, C.ink, "#F4F4F5", C.yellow, C.blue].map((c) => <div key={c} style={{flex: 1, height: 70, borderRadius: 16, background: c, border: "2px solid rgba(255,255,255,.3)"}} />)}
          <div style={{fontFamily: FONT_AR, fontWeight: 800, fontSize: 60, color: C.white, marginLeft: 10}}>أب</div>
        </div>
      </Glass>
    </Pop>
  );
};

/* ---------- S6: think like a designer, analyse UX -> user flow (clip 3) ---------- */

const S6: React.FC = () => {
  const start = clipStart(3) + 0.25;
  const think = at(3, "تفكّر");
  const ux = at(3, "تجربة");
  const end = clipEnd(3) - 0.15;
  const nodes = ["Home", "Search", "Product", "Checkout"];
  const frame = useCurrentFrame();
  const travel = useRamp(ux, ux + 1.2);
  return (
    <Pop start={start} end={end} x={70} y={TOP} w={940}>
      <Glass style={{padding: "22px 24px"}}>
        <div style={{display: "flex", justifyContent: "space-between", marginBottom: 14}}>
          <Label size={22} color={C.muted}>User Flow</Label>
          <Chip text="UX" size={20} color={C.blue} />
        </div>
        <div style={{position: "relative", height: 210}}>
          <svg width="890" height="210" style={{position: "absolute", left: 0, top: 0}}>
            {nodes.slice(1).map((_, i) => {
              const p = interpolate(frame, [f(think + i * 0.3), f(think + i * 0.3 + 0.35)], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
              const x1 = 170 + i * 230, x2 = 230 + i * 230;
              return <line key={i} x1={x1} x2={x1 + (x2 - x1) * p} y1="80" y2="80" stroke={C.white} strokeWidth="5" strokeDasharray="10 8" />;
            })}
          </svg>
          {nodes.map((n, i) => {
            const p = interpolate(frame, [f(start + i * 0.25), f(start + i * 0.25 + 0.4)], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE});
            const active = travel * 3.2 >= i;
            return (
              <div key={n} style={{position: "absolute", left: i * 230, top: 20, width: 170, height: 120, borderRadius: 20, background: active && travel > 0 ? C.blue : "rgba(255,255,255,0.1)", border: `2px solid ${C.stroke}`, transform: `scale(${p})`, padding: 14}}>
                <Bar w="70%" h={12} c="rgba(255,255,255,.6)" />
                <Bar w="45%" h={12} c="rgba(255,255,255,.35)" style={{marginTop: 10}} />
                <div style={{position: "absolute", bottom: 12, left: 14}}><Label size={22}>{n}</Label></div>
              </div>
            );
          })}
          {travel > 0 && (
            <div style={{position: "absolute", top: 120, left: 60 + travel * 690}}>
              <Cursor x={0} y={0} color={C.red} label="User" />
            </div>
          )}
        </div>
      </Glass>
    </Pop>
  );
};

/* ---------- S7: build app + web UIs in Figma, AI-assisted (clip 4) ---------- */

const S7: React.FC = () => {
  const start = at(4, "وتبني") - 0.1;
  const web = at(4, "ومواقع");
  const figma = at(4, "Figma");
  const ai = at(4, "بالذكاء");
  const end = clipEnd(4) - 0.15;
  const frame = useCurrentFrame();
  const sel = useIn(figma, 12);
  const aiP = useIn(ai, 12);
  const shimmer = ((frame - f(ai)) % 50) / 50;
  const block = (i: number) => interpolate(frame, [f(start + 0.2 + i * 0.18), f(start + 0.45 + i * 0.18)], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE});
  return (
    <>
      {/* phone */}
      <Pop start={start} end={end} x={60} y={TOP - 10} w={250}>
        <div style={{transform: "scale(0.78)", transformOrigin: "top left", width: 250, height: 470, borderRadius: 44, background: C.ink, border: "6px solid #2A2B31", padding: 14, boxShadow: "0 30px 70px rgba(0,0,0,.4)"}}>
          <div style={{width: 80, height: 18, borderRadius: 9, background: "#000", margin: "0 auto 14px"}} />
          {[["100%", 110, C.red], ["90%", 18, "#3F3F46"], ["65%", 18, "#3F3F46"], ["100%", 80, "#27272A"], ["100%", 80, "#27272A"]].map(([w, h, c], i) => (
            <div key={i} style={{width: w as string, height: h as number, borderRadius: 14, background: c as string, marginBottom: 12, opacity: block(i), transform: `translateY(${(1 - block(i)) * 30}px)`}} />
          ))}
          <div style={{width: "100%", height: 46, borderRadius: 23, background: C.white, opacity: block(5)}} />
        </div>
      </Pop>
      {/* browser */}
      <Pop start={web} end={end} x={350} y={TOP + 10} w={660} from="right">
        <Glass style={{height: 340}} radius={24}>
          <div style={{display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: `2px solid ${C.stroke}`}}>
            <Dots />
            <div style={{flex: 1, height: 30, borderRadius: 15, background: "rgba(255,255,255,.1)", padding: "2px 16px"}}><Label size={18} color={C.muted}>yourproject.com</Label></div>
          </div>
          <div style={{padding: 20, position: "relative"}}>
            <div style={{display: "flex", gap: 14}}>
              <Bar w={120} h={16} c="rgba(255,255,255,.6)" /><Bar w={70} h={16} /><Bar w={70} h={16} /><Bar w={70} h={16} />
            </div>
            <div style={{display: "flex", gap: 18, marginTop: 22}}>
              <div style={{flex: 1}}>
                <Bar w="90%" h={34} c="#fff" /><Bar w="70%" h={34} c="#fff" style={{marginTop: 10}} />
                <Bar w="80%" h={14} style={{marginTop: 18}} /><Bar w="60%" h={14} style={{marginTop: 10}} />
                <Bar w={150} h={46} c={C.red} r={23} style={{marginTop: 20}} />
              </div>
              <div style={{position: "relative", width: 200, height: 200, borderRadius: 20, background: "linear-gradient(135deg,#3B82F6,#E31E24)"}}>
                {/* Figma-style selection */}
                <div style={{position: "absolute", inset: -8, border: `3px solid ${C.blue}`, opacity: sel, transform: `scale(${0.9 + 0.1 * sel})`}}>
                  {[[-9, -9], [-9, "calc(100% - 9px)"], ["calc(100% - 9px)", -9], ["calc(100% - 9px)", "calc(100% - 9px)"]].map(([l, t], i) => (
                    <div key={i} style={{position: "absolute", left: l as number, top: t as number, width: 16, height: 16, background: "#fff", border: `3px solid ${C.blue}`}} />
                  ))}
                  <div style={{position: "absolute", top: -42, left: -3, background: C.blue, padding: "3px 10px", borderRadius: 6}}><Label size={18}>Frame · 200×200</Label></div>
                </div>
                {/* AI generating shimmer */}
                <div style={{position: "absolute", inset: 0, borderRadius: 20, opacity: aiP * 0.9, background: `linear-gradient(110deg, transparent ${shimmer * 100 - 30}%, rgba(255,255,255,.65) ${shimmer * 100}%, transparent ${shimmer * 100 + 30}%)`}} />
              </div>
            </div>
          </div>
        </Glass>
      </Pop>
      {/* tool + AI chips */}
      <Pop start={figma - 0.05} end={end} x={650} y={TOP + 360} from="up">
        <div style={{display: "flex", gap: 14}}>
          <Glass radius={999} style={{padding: "10px 22px"}}><Label size={26} weight={700}>Figma</Label></Glass>
          <div style={{opacity: aiP, transform: `scale(${0.6 + 0.4 * aiP})`}}><Chip text="✦ AI" size={26} color="#7C3AED" /></div>
        </div>
      </Pop>
    </>
  );
};

/* ---------- S8: portfolio -> job market + freelance (clip 5) ---------- */

const Toast: React.FC<{start: number; end: number; y: number; title: string; sub: string; color: string; icon: string}> = ({start, end, y, title, sub, color, icon}) => (
  <Pop start={start} end={end} x={600} y={y} w={420} from="right">
    <Glass radius={22} style={{padding: "16px 18px", display: "flex", gap: 16, alignItems: "center"}}>
      <div style={{width: 58, height: 58, borderRadius: 16, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: "#fff", fontFamily: FONT_UI, fontWeight: 700}}>{icon}</div>
      <div>
        <Label size={26} weight={700}>{title}</Label>
        <Label size={20} color={C.muted}>{sub}</Label>
      </div>
    </Glass>
  </Pop>
);

const S8: React.FC = () => {
  const start = at(5, "بمعرض") - 0.1;
  const port = at(5, "بورتفوليو");
  const job = at(5, "سوق");
  const free = at(5, "والفريلانس");
  const end = clipEnd(5) - 0.15;
  const frame = useCurrentFrame();
  const thumbs = ["linear-gradient(135deg,#E31E24,#FF8A3D)", "linear-gradient(135deg,#3B82F6,#22D3EE)", "linear-gradient(135deg,#111827,#6B7280)", "linear-gradient(135deg,#7C3AED,#EC4899)"];
  return (
    <>
      <Pop start={start} end={end} x={60} y={TOP} w={520} from="left">
        <Glass style={{padding: 20}}>
          <div style={{display: "flex", justifyContent: "space-between", marginBottom: 14}}>
            <Label size={24} weight={700}>Portfolio</Label>
            <Label size={20} color={C.muted}>4 projects</Label>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14}}>
            {thumbs.map((g, i) => {
              const p = interpolate(frame, [f(port - 0.1 + i * 0.12), f(port + 0.25 + i * 0.12)], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE});
              return <div key={i} style={{height: 130, borderRadius: 18, background: g, opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`}} />;
            })}
          </div>
        </Glass>
      </Pop>
      <Toast start={job} end={end} y={TOP + 10} title="Job offer" sub="UI/UX Designer" color={C.blue} icon="✓" />
      <Toast start={free} end={end} y={TOP + 130} title="Freelance" sub="New client · $$$" color={C.green} icon="$" />
    </>
  );
};

/* ---------- S9: limited seats + step by step (clip 6) ---------- */

const S9: React.FC = () => {
  const start = clipStart(6) + 0.1;
  const hesit = at(6, "متردد");
  const seats = at(6, "المقاعد");
  const step = at(6, "خطوة");
  const end = clipEnd(6) - 0.15;
  const frame = useCurrentFrame();
  const total = 20;
  const filled = Math.round(interpolate(frame, [f(seats), f(seats + 1.1)], [9, 17], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE}));
  const toggle = Math.floor((frame - f(hesit)) / 9) % 2 === 0;
  return (
    <>
      <Pop start={start} end={seats - 0.05} x={140} y={TOP + 20} w={800}>
        <Glass style={{padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
          <div>
            <Label size={22} color={C.muted}>Semester</Label>
            <Label size={44} weight={700}>New term · Fall</Label>
          </div>
          {frame >= f(hesit) && (
            <div style={{width: 120, height: 64, borderRadius: 32, background: toggle ? C.green : "rgba(255,255,255,.2)", padding: 6}}>
              <div style={{width: 52, height: 52, borderRadius: 26, background: "#fff", transform: `translateX(${toggle ? 56 : 0}px)`}} />
            </div>
          )}
        </Glass>
      </Pop>
      <Pop start={seats} end={step - 0.05} x={190} y={TOP} w={700}>
        <Glass style={{padding: "22px 26px"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16}}>
            <Label size={24} weight={700}>Seats</Label>
            <Label size={30} weight={700} color={C.red}>{total - filled} left</Label>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 10}}>
            {Array.from({length: total}, (_, i) => (
              <div key={i} style={{height: 48, borderRadius: 10, background: i < filled ? C.red : "rgba(255,255,255,.14)", transform: `scale(${i === filled - 1 ? 1.12 : 1})`}} />
            ))}
          </div>
        </Glass>
      </Pop>
      <Pop start={step - 0.05} end={end} x={110} y={TOP + 40} w={860}>
        <Glass style={{padding: "26px 30px"}}>
          <div style={{display: "flex", alignItems: "center"}}>
            {[1, 2, 3, 4].map((n, i) => {
              const p = interpolate(frame, [f(step + i * 0.22), f(step + i * 0.22 + 0.25)], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
              return (
                <React.Fragment key={n}>
                  <div style={{width: 84, height: 84, borderRadius: 42, display: "flex", alignItems: "center", justifyContent: "center", background: p > 0.5 ? C.red : "rgba(255,255,255,.14)", transform: `scale(${1 + 0.15 * Math.sin(p * Math.PI)})`}}>
                    <Label size={36} weight={700}>{p > 0.5 ? "✓" : String(n)}</Label>
                  </div>
                  {n < 4 && <div style={{flex: 1, height: 8, margin: "0 10px", borderRadius: 4, background: `linear-gradient(90deg, ${C.red} ${p * 100}%, rgba(255,255,255,.14) ${p * 100}%)`}} />}
                </React.Fragment>
              );
            })}
          </div>
        </Glass>
      </Pop>
    </>
  );
};

/* ---------- S10: comment "Course" -> registration link (clip 7) ---------- */

const S10: React.FC = () => {
  const start = at(7, "علّقلنا") - 0.1;
  const word = at(7, "Course");
  const link = at(7, "رابط");
  const end = TL.duration - 0.3;
  const sent = useIn(at(7, "ليصلك"), 12);
  const lk = useIn(link, 11);
  return (
    <Pop start={start} end={end} x={90} y={TOP} w={900}>
      <Glass style={{padding: "22px 24px"}}>
        <div style={{display: "flex", gap: 16, alignItems: "center"}}>
          <div style={{width: 64, height: 64, borderRadius: 32, background: "linear-gradient(135deg,#E31E24,#FF8A3D)"}} />
          <div style={{flex: 1, height: 76, borderRadius: 38, background: "rgba(255,255,255,.1)", border: `2px solid ${C.stroke}`, display: "flex", alignItems: "center", padding: "0 26px"}}>
            <Typed text="Course" from={word} to={word + 0.45} style={{fontFamily: FONT_UI, fontWeight: 700, fontSize: 36, color: C.white}} />
          </div>
          <div style={{width: 76, height: 76, borderRadius: 38, background: C.red, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.18 * Math.sin(sent * Math.PI)})`}}>
            <svg width="36" height="36" viewBox="0 0 24 24"><path d="M3 11l18-8-8 18-2-8z" fill="#fff" /></svg>
          </div>
        </div>
        <div style={{height: lk * 110, overflow: "hidden"}}>
          <div style={{marginTop: 20, display: "flex", gap: 14, alignItems: "center", direction: "rtl", opacity: lk}}>
            <div style={{width: 64, height: 64, borderRadius: 18, background: C.green, display: "flex", alignItems: "center", justifyContent: "center"}}>
              <svg width="34" height="34" viewBox="0 0 24 24"><path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" /></svg>
            </div>
            <div style={{fontFamily: FONT_AR, fontWeight: 700, fontSize: 36, color: C.white}}>رابط التسجيل</div>
            <div style={{marginRight: "auto"}}><Chip text="✓" size={26} color={C.green} /></div>
          </div>
        </div>
      </Glass>
    </Pop>
  );
};

export const Scenes: React.FC = () => (
  <>
    <S1 />
    <S2 />
    <S3 />
    <S4 />
    <S5 />
    <S6 />
    <S7 />
    <S8 />
    <S9 />
    <S10 />
  </>
);

/** Sound cues (global seconds) shared with Reel.tsx so audio stays tied to the visuals. */
export const sfxCues = (): {t: number; s: string; v: number}[] => [
  {t: clipStart(1) + 0.25, s: "whoosh", v: 0.35},
  {t: clipStart(1) + 0.6, s: "type", v: 0.25},
  {t: clipStart(1) + 1.7, s: "type", v: 0.25},
  {t: at(1, "الكود"), s: "click", v: 0.4},
  {t: at(1, "مش"), s: "whoosh", v: 0.3},
  {t: at(1, "خليك"), s: "pop", v: 0.35},
  {t: at(2, "مجال") - 0.1, s: "pop", v: 0.3},
  {t: at(2, "ولكن"), s: "whoosh", v: 0.25},
  {t: at(2, "تبدأ"), s: "pop", v: 0.35},
  {t: at(2, "هل", 1), s: "whoosh", v: 0.25},
  {t: at(2, "ولكنك"), s: "click", v: 0.35},
  {t: TL.zeroToHero.start - 0.85, s: "riser", v: 0.35},
  {t: TL.zeroToHero.hero, s: "impact", v: 0.55},
  {t: at(2, "UI/UX"), s: "pop", v: 0.35},
  {t: at(2, "سوف"), s: "whoosh", v: 0.25},
  {t: atEnd(2, "للقمة"), s: "ding", v: 0.3},
  {t: clipStart(3) + 0.25, s: "whoosh", v: 0.25},
  {t: at(3, "تجربة"), s: "click", v: 0.35},
  {t: at(4, "وتبني"), s: "whoosh", v: 0.25},
  {t: at(4, "Figma"), s: "click", v: 0.4},
  {t: at(4, "بالذكاء"), s: "pop", v: 0.35},
  {t: at(5, "بورتفوليو"), s: "whoosh", v: 0.25},
  {t: at(5, "سوق"), s: "pop", v: 0.35},
  {t: at(5, "والفريلانس"), s: "ding", v: 0.3},
  {t: at(6, "المقاعد"), s: "click", v: 0.35},
  {t: at(6, "خطوة"), s: "pop", v: 0.3},
  {t: at(7, "Course"), s: "type", v: 0.3},
  {t: at(7, "ليصلك"), s: "click", v: 0.4},
  {t: at(7, "رابط"), s: "ding", v: 0.3},
];
