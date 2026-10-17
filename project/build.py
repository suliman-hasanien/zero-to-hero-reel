"""Build the final montage from captions.json.

Edit captions.json (text, timings, key words, cuts, transitions) and rerun:
    python build.py            -> full 4K master + 1080p upload copy
    python build.py --preview  -> fast 540p preview only

captions.json
  clips.<n>.in / out       trim window of clip n (seconds, source time)
  clips.<n>.cut            optional [[a, b], ...] source ranges removed inside the clip
  clips.<n>.zoom           [start, end] slow push (e.g. [1.0, 1.06]) over the clip
  joins[i]                 transition into clip i+2: {"type": "zoom|whip_left|whip_right|dissolve", "d": sec}
  lines[]                  {"clip": n, "words": [{"w", "s", "e", "key"?}], "punch"?: true, "break"?: k}
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent          # montage_output/project
OUT = ROOT.parent                               # montage_output
SRC = OUT.parent                                # folder with 1.MOV .. 7.MOV
WORK = OUT / "work"
CLEAN = WORK / "clean"                          # denoised + leveled audio
FFMPEG = shutil.which("ffmpeg") or str(next(Path.home().glob(
    "AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg*/ffmpeg-*/bin/ffmpeg.exe")))

BASE = "--base" in sys.argv                     # 1080x1920 edit without captions, for the Remotion stage
W, H = (1080, 1920) if BASE else (2160, 3840)
FPS = "60000/1001"
GRADE = ("eq=contrast=1.06:brightness=-0.01:saturation=1.08:gamma=0.98,"
         "colorbalance=rs=0.01:bs=-0.01:rm=0.01:bm=-0.01")
PUNCH = 1.07                                    # punch-in zoom on emphasised lines

# Caption look
FONT = "Alexandria"
FONT_SIZE = 150
KEY_SIZE = 164
CAP_X, CAP_Y = W // 2, 2800                     # bottom-centre anchor, clear of Reels UI and faces
KEY = "&H3CC9FF&"                               # #FFC93C warm yellow (ASS is BGR)
DIM = "&H99&"                                   # not-yet-spoken words at ~40% opacity
MUSIC_DB = -21                                  # music bed level under speech (before ducking)

cfg = json.loads((ROOT / "captions.json").read_text(encoding="utf-8"))
CLIPS = range(1, 8)


def ass_time(t):
    t = max(t, 0)
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def pieces(c):
    """Kept source ranges of clip c after trims and inner cuts."""
    info = cfg["clips"][str(c)]
    keep, a = [], info["in"]
    for x, y in sorted(info.get("cut", [])):
        if x > a:
            keep.append((a, x))
        a = max(a, y)
    keep.append((a, info["out"]))
    return keep


def src_to_clip(c, t):
    """Map a source time of clip c onto the edited clip's local time (None if cut away)."""
    acc = 0.0
    for a, b in pieces(c):
        if a <= t <= b:
            return acc + t - a
        acc += b - a
    return None


def clip_len(c):
    return sum(b - a for a, b in pieces(c))


def joins():
    js = cfg.get("joins") or [{"type": "dissolve", "d": 0.25}] * 6
    return js


def offsets():
    """Global start time of each edited clip on the merged timeline."""
    off, t, js = {}, 0.0, joins()
    for c in CLIPS:
        off[c] = t
        if c < 7:
            t += clip_len(c) - js[c - 1]["d"]
    return off, t + clip_len(7)


def caption_lines():
    off, _ = offsets()
    out = []
    for ln in cfg["lines"]:
        c = ln["clip"]
        ws = []
        for w in ln["words"]:
            s, e = src_to_clip(c, w["s"]), src_to_clip(c, w["e"])
            if s is None or e is None:
                continue                        # word sits inside a cut
            ws.append(dict(w, gs=off[c] + s, ge=off[c] + e, ls=s, le=e))
        if ws:
            out.append(dict(ln, words=ws, start=ws[0]["gs"] - 0.08, end=ws[-1]["ge"] + 0.30))
    for a, b in zip(out, out[1:]):              # never let two captions overlap
        a["end"] = min(a["end"], b["start"] - 0.02)
    return out


def build_ass(lines):
    ev = []
    for ln in lines:
        dur_ms = int((ln["end"] - ln["start"]) * 1000)
        fade_out = min(160, dur_ms // 4)
        move = f"\\move({CAP_X},{CAP_Y + 50},{CAP_X},{CAP_Y},0,220)"
        glow_parts, main_parts = [], []
        for w in ln["words"]:
            t0 = max(0, int((w["gs"] - ln["start"]) * 1000))
            size = KEY_SIZE if w.get("key") else FONT_SIZE
            tag = f"\\fs{size}\\alpha{DIM}\\t({t0},{t0 + 100},\\alpha&H00&)"
            if w.get("key"):                    # vertical bounce only, so the line never reflows
                tag += f"\\1c{KEY}\\t({t0},{t0 + 110},\\fscy122)\\t({t0 + 110},{t0 + 260},\\fscy100)"
            else:
                tag += "\\1c&HFFFFFF&"
            main_parts.append(f"{{{tag}}}{w['w']}")
            glow_parts.append(f"{{\\fs{size}}}{w['w']}")
        def join(parts):
            if ln.get("break"):
                i = ln["break"]
                return " ".join(parts[:i]) + "\\N" + " ".join(parts[i:])
            return " ".join(parts)
        st, en = ass_time(ln["start"]), ass_time(ln["end"])
        head = f"{move}\\fad(150,{fade_out})\\fscx92\\fscy92\\t(0,220,0.6,\\fscx100\\fscy100)"
        ev.append(f"Dialogue: 0,{st},{en},Glow,,0,0,0,,{{{head}\\blur20}}{join(glow_parts)}")
        ev.append(f"Dialogue: 1,{st},{en},Main,,0,0,0,,{{{head}}}{join(main_parts)}")

    ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Glow,{FONT},{FONT_SIZE},&HFF000000,&HFF000000,&H6A000000,&H00000000,-1,0,0,0,100,100,0,0,1,24,0,2,200,200,0,178
Style: Main,{FONT},{FONT_SIZE},&H00FFFFFF,&H00FFFFFF,&H00141414,&H00000000,-1,0,0,0,100,100,0,0,1,4,0,2,200,200,0,178

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + "\n".join(ev) + "\n"
    (ROOT / "captions.ass").write_text(ass, encoding="utf-8-sig")


def zoom_expr(c, lines):
    """Per-frame zoom for clip c: eased slow push plus punch-ins on emphasised lines."""
    z0, z1 = cfg["clips"][str(c)].get("zoom", [1.0, 1.0])
    L = clip_len(c)
    p = f"min(max(t/{L:.3f},0),1)"
    base = f"({z0}+({z1 - z0})*{p}*{p}*(3-2*{p}))"
    punch = [f"between(t,{ln['words'][0]['ls'] - 0.05:.3f},{ln['words'][-1]['le'] + 0.15:.3f})"
             for ln in lines if ln["clip"] == c and ln.get("punch")]
    if punch:
        return f"{base}*(1+{PUNCH - 1}*min(1,{'+'.join(punch)}))"
    return base


def export_timeline(lines, total):
    """Global timings for the Remotion motion-graphics stage."""
    off, _ = offsets()
    def g(c, t):
        return off[c] + src_to_clip(c, t)
    tl = {
        "fps": 60000 / 1001, "duration": total,
        "clips": [{"clip": c, "start": off[c], "end": off[c] + clip_len(c)} for c in CLIPS],
        "zeroToHero": {"start": g(2, 9.72), "to": g(2, 10.08), "hero": g(2, 10.16), "end": g(2, 10.56)},
        "lines": [{"clip": ln["clip"], "start": ln["start"], "end": ln["end"],
                   "words": [{"w": w["w"], "s": w["gs"], "e": w["ge"], "key": bool(w.get("key"))}
                             for w in ln["words"]]} for ln in lines],
    }
    (OUT / "remotion" / "public" / "timeline.json").write_text(
        json.dumps(tl, ensure_ascii=False, indent=1), encoding="utf-8")


def render(preview=False):
    lines = caption_lines()
    build_ass(lines)
    off, total = offsets()
    js = joins()
    inputs, graph = [], []
    for c in CLIPS:
        inputs += ["-i", str(SRC / f"{c}.MOV")]
    for c in CLIPS:
        inputs += ["-i", str(CLEAN / f"{c}.wav")]
    inputs += ["-stream_loop", "-1", "-i", str(WORK / "music.wav")]

    for c in CLIPS:
        ps = pieces(c)
        vparts, aparts = [], []
        for k, (a, b) in enumerate(ps):
            graph.append(f"[{c - 1}:v]trim={a}:{b},setpts=PTS-STARTPTS[v{c}p{k}]")
            graph.append(f"[{c + 6}:a]atrim={a}:{b},asetpts=PTS-STARTPTS[a{c}p{k}]")
            vparts.append(f"[v{c}p{k}]"); aparts.append(f"[a{c}p{k}]")
        if len(ps) > 1:                         # inner cut: tiny audio crossfades hide the splice
            graph.append(f"{''.join(vparts)}concat=n={len(ps)}:v=1:a=0[v{c}c]")
            a_in = aparts[0]
            for k in range(1, len(ps)):
                graph.append(f"{a_in}{aparts[k]}acrossfade=d=0.03[a{c}x{k}]")
                a_in = f"[a{c}x{k}]"
            graph.append(f"{a_in}anull[a{c}]")
        else:
            graph.append(f"{vparts[0]}null[v{c}c]")
            graph.append(f"{aparts[0]}anull[a{c}]")
        z = zoom_expr(c, lines)
        graph.append(
            f"[v{c}c]fps={FPS},{GRADE},"
            f"scale=w='trunc({W}*{z}/2)*2':h='trunc({H}*{z}/2)*2':eval=frame:flags=bicubic,"
            f"crop={W}:{H}:(iw-{W})/2:(ih-{H})/2,setsar=1,format=yuv420p,settb=AVTB[v{c}]")

    pv, pa, blurs = "v1", "a1", []
    for c in range(2, 8):
        j = js[c - 2]
        d = j["d"]
        o = off[c]                              # transition starts where clip c starts
        kind = {"zoom": "zoomin", "whip_left": "smoothleft", "whip_right": "smoothright",
                "dissolve": "dissolve", "fade": "fade"}[j["type"]]
        graph.append(f"[{pv}][v{c}]xfade=transition={kind}:duration={d}:offset={o:.3f}[vx{c}]")
        graph.append(f"[{pa}][a{c}]acrossfade=d={d}:c1=qsin:c2=qsin[ax{c}]")
        if j["type"].startswith("whip"):        # directional motion blur across the whip
            blurs.append(f"gblur=sigma={60 * W // 2160}:sigmaV=0:steps=2:enable='between(t,{o + d * 0.15:.3f},{o + d * 0.85:.3f})'")
        if j["type"] == "zoom":
            blurs.append(f"gblur=sigma={7 * W // 2160 or 3}:steps=2:enable='between(t,{o + d * 0.25:.3f},{o + d * 0.75:.3f})'")
        pv, pa = f"vx{c}", f"ax{c}"

    end = total - 0.6
    scale = ",scale=540:960" if preview else ""
    vchain = ",".join(blurs + ([] if BASE else ["ass=captions.ass:fontsdir=fonts"]) +
                      ["fade=t=in:d=0.25", f"fade=t=out:st={end:.3f}:d=0.6"])
    graph.append(f"[{pv}]{vchain}{scale}[vout]")
    # speech + music bed, music ducked under the voice
    graph.append(f"[{pa}]afade=t=in:d=0.05,asplit=2[voice][key]")
    graph.append(f"[14:a]atrim=0:{total:.3f},volume={MUSIC_DB}dB,afade=t=in:d=1.2,"
                 f"afade=t=out:st={total - 1.5:.3f}:d=1.5,aformat=channel_layouts=stereo[mus]")
    graph.append("[key]aformat=channel_layouts=stereo[keyst]")
    graph.append("[mus][keyst]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450:makeup=1[duck]")
    graph.append("[voice]aformat=channel_layouts=stereo[vst]")
    graph.append(f"[vst][duck]amix=inputs=2:normalize=0,alimiter=limit=0.89,"
                 f"afade=t=out:st={end:.3f}:d=0.6[aout]")
    (ROOT / "filtergraph.txt").write_text(";\n".join(graph), encoding="utf-8")

    common = [FFMPEG, "-hide_banner", "-y", *inputs, "-/filter_complex", "filtergraph.txt",
              "-map", "[vout]", "-map", "[aout]", "-t", f"{total:.3f}",
              "-map_metadata", "-1", "-map_chapters", "-1"]
    color = ["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv"]
    audio = ["-c:a", "aac", "-b:a", "320k", "-ar", "48000"]
    if BASE:
        export_timeline(lines, total)
        cmd = common + ["-c:v", "libx264", "-preset", "medium", "-crf", "12", "-pix_fmt", "yuv420p",
                        "-g", "30", *color, *audio, "-movflags", "+faststart",
                        str(OUT / "remotion" / "public" / "base.mp4")]
        subprocess.run(cmd, cwd=ROOT, check=True)
        return
    if preview:
        cmd = common + ["-c:v", "libx264", "-preset", "veryfast", "-crf", "23", *color, *audio,
                        "-movflags", "+faststart", str(OUT / "preview_540p.mp4")]
        subprocess.run(cmd, cwd=ROOT, check=True)
        return
    master = OUT / "final_4K.mp4"
    cmd = common + ["-c:v", "h264_nvenc", "-preset", "p7", "-tune", "hq", "-rc", "vbr", "-cq", "17",
                    "-b:v", "60M", "-maxrate", "90M", "-bufsize", "120M", "-profile:v", "high", "-level", "5.2",
                    "-bf", "3", "-spatial-aq", "1", "-g", "120", *color, *audio,
                    "-movflags", "+faststart", str(master)]
    subprocess.run(cmd, cwd=ROOT, check=True)
    # lighter 1080x1920 copy for uploading on a slow connection
    subprocess.run([FFMPEG, "-hide_banner", "-y", "-i", str(master), "-vf", "scale=1080:1920:flags=lanczos",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-level", "4.2",
                    "-pix_fmt", "yuv420p", *color, "-c:a", "copy", "-map_metadata", "-1",
                    "-movflags", "+faststart", str(OUT / "final_1080p_instagram.mp4")], check=True)


if __name__ == "__main__":
    render(preview="--preview" in sys.argv)
