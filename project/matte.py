"""Cut the speaker out of base.mp4 (Robust Video Matting) for the "text behind subject" shots.

Usage: python matte.py <start_sec> <end_sec>
Writes remotion/public/person.webm (VP9 with alpha) + person.json ({"start": sec}).
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort

ROOT = Path(__file__).resolve().parent
PUB = ROOT.parent / "remotion" / "public"
MODEL = r"models/rvm_mobilenetv3_fp32.onnx"
FFMPEG = shutil.which("ffmpeg") or str(next(Path.home().glob(
    "AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg*/ffmpeg-*/bin/ffmpeg.exe")))
W, H, FPS = 1080, 1920, "60000/1001"

t0, t1 = float(sys.argv[1]), float(sys.argv[2])
# start a little earlier so the recurrent state is settled when the window begins
warm = min(1.0, t0)
dec = subprocess.Popen([FFMPEG, "-v", "error", "-ss", f"{t0 - warm:.3f}", "-i", str(PUB / "base.mp4"),
                        "-t", f"{t1 - t0 + warm:.3f}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                       stdout=subprocess.PIPE)
mask_path = ROOT.parent / "work" / "mask.mkv"
enc = subprocess.Popen([FFMPEG, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}",
                        "-r", FPS, "-i", "-", "-c:v", "ffv1", str(mask_path)], stdin=subprocess.PIPE)

sess = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
ratio = np.array([0.25], np.float32)
skip = round(warm * 60000 / 1001)
n = 0
while True:
    buf = dec.stdout.read(W * H * 3)
    if len(buf) < W * H * 3:
        break
    src = np.frombuffer(buf, np.uint8).reshape(H, W, 3).transpose(2, 0, 1)[None].astype(np.float32) / 255
    fgr, pha, *rec = sess.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3],
                                      "downsample_ratio": ratio})
    if n >= skip:
        enc.stdin.write((pha[0, 0] * 255).clip(0, 255).astype(np.uint8).tobytes())
    n += 1
enc.stdin.close(); enc.wait(); dec.wait()

# person = base frames with the matte as alpha (matte slightly eroded + feathered to avoid halos)
subprocess.run([FFMPEG, "-v", "error", "-y", "-ss", f"{t0:.3f}", "-i", str(PUB / "base.mp4"), "-i", str(mask_path),
                "-t", f"{t1 - t0:.3f}", "-filter_complex",
                "[1:v]format=gray,erosion,gblur=sigma=1.2[m];[0:v][m]alphamerge,format=yuva420p[v]",
                "-map", "[v]", "-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-crf", "18", "-b:v", "0",
                "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", str(PUB / "person.webm")], check=True)
(PUB / "person.json").write_text(json.dumps({"start": t0, "end": t1}), encoding="utf-8")
print("frames", n - skip, "->", PUB / "person.webm")
