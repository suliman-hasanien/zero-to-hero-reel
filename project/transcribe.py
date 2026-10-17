"""Transcribe each clip with Whisper large-v3 (word-level timestamps).

Usage: python transcribe.py <work_dir> <source: clean|raw>
Writes <work_dir>/transcript_<source>.json
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

work = Path(sys.argv[1])
source = sys.argv[2]

model = WhisperModel(
    r"models/large-v3",      # local copy of Systran/faster-whisper-large-v3
    device="cpu",
    compute_type="int8",
)

# Context only (spelling hints for names/terms visible on the banner); not inserted into output.
prompt = "زيرو تو هيرو. شركة متخصصة في البرمجة والتسويق باستخدام الذكاء الاصطناعي AI."

FFMPEG = shutil.which("ffmpeg") or str(next(Path.home().glob(
    "AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg*/ffmpeg-*/bin/ffmpeg.exe")))


def load16k(path):
    """Decode to 16 kHz mono float32 with ffmpeg (the installed PyAV is incompatible with faster-whisper)."""
    pcm = subprocess.run([FFMPEG, "-v", "error", "-i", str(path), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0


result = {}
for i in range(1, 8):
    segments, info = model.transcribe(
        load16k(work / source / f"{i}.wav"),
        language="ar",
        beam_size=5,
        word_timestamps=True,
        vad_filter=False,
        condition_on_previous_text=False,
        initial_prompt=prompt,
        temperature=0.0,
    )
    segs = []
    for s in segments:
        segs.append({
            "start": round(s.start, 3),
            "end": round(s.end, 3),
            "text": s.text.strip(),
            "avg_logprob": round(s.avg_logprob, 3),
            "words": [
                {"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)}
                for w in s.words
            ],
        })
    result[str(i)] = segs
    print(i, " | ".join(s["text"] for s in segs), flush=True)

(work / f"transcript_{source}.json").write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
