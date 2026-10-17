"""Synthesize subtle UI sound effects (original, royalty-free) into remotion/public/sfx/."""
import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / "remotion" / "public" / "sfx"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(3)


def save(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    fade = np.minimum(1, np.arange(len(x)) / 96)[::1] * np.minimum(1, (len(x) - np.arange(len(x))) / 480)
    x = x * fade
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def t(sec):
    return np.arange(int(sec * SR)) / SR


def lowpass(x, a):
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y


# whoosh: band-limited noise swelling then fading, with a falling resonance
tt = t(0.45)
noise = rng.standard_normal(len(tt))
sweep = np.sin(2 * np.pi * np.cumsum(2400 * np.exp(-tt * 5) + 300) / SR)
env = np.sin(np.pi * np.clip(tt / 0.45, 0, 1)) ** 2
save("whoosh", lowpass(noise, 0.18) * env + 0.15 * sweep * env)

# pop: soft bubbly UI blip
tt = t(0.12)
save("pop", np.sin(2 * np.pi * np.cumsum(900 + 700 * np.exp(-tt * 40)) / SR) * np.exp(-tt * 38))

# click: tiny tactile tick
tt = t(0.035)
save("click", (np.sin(2 * np.pi * 2600 * tt) + 0.5 * rng.standard_normal(len(tt))) * np.exp(-tt * 180))

# riser: noise + rising tone, for the title build-up
tt = t(0.9)
rise = np.sin(2 * np.pi * np.cumsum(200 + 900 * (tt / 0.9) ** 2) / SR)
save("riser", (0.6 * lowpass(rng.standard_normal(len(tt)), 0.25) + 0.5 * rise) * (tt / 0.9) ** 2)

# impact: deep hit + short air, for "HERO"
tt = t(0.9)
boom = np.sin(2 * np.pi * np.cumsum(40 + 120 * np.exp(-tt * 18)) / SR) * np.exp(-tt * 4.5)
air = lowpass(rng.standard_normal(len(tt)), 0.35) * np.exp(-tt * 14) * 0.35
save("impact", boom + air)

# type: three quick key taps
x = np.zeros(int(0.32 * SR))
for k, at in enumerate((0.0, 0.1, 0.2)):
    tt = t(0.03); i = int(at * SR)
    x[i:i + len(tt)] += (rng.standard_normal(len(tt)) * 0.6 + np.sin(2 * np.pi * (1800 + 200 * k) * tt)) * np.exp(-tt * 220)
save("type", x)

# ding: bright confirmation chime
tt = t(0.7)
save("ding", (np.sin(2 * np.pi * 1318.5 * tt) + 0.6 * np.sin(2 * np.pi * 1975.5 * tt)) * np.exp(-tt * 6))
print("sfx ->", OUT)
