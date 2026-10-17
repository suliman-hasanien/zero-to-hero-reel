"""Synthesize an original, royalty-free background bed (warm lo-fi / uplifting pop).

Am - F - C - G at 100 BPM: soft pad, plucked arpeggio, sub bass, light kick + hats.
Usage: python make_music.py <seconds> <out.wav>
"""
import sys
import wave

import numpy as np

SR = 48000
BPM = 100
BEAT = 60 / BPM
dur = float(sys.argv[1])
out = sys.argv[2]
n = int(SR * dur)
mix = np.zeros(n)
rng = np.random.default_rng(7)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(sig, t, gain=1.0):
    i = int(t * SR)
    if i >= n:
        return
    j = min(n, i + len(sig))
    mix[i:j] += sig[: j - i] * gain


def env(length, a, r):
    t = np.arange(int(length * SR)) / SR
    e = np.minimum(1, t / a) * np.minimum(1, np.maximum(0, (length - t) / r))
    return e, t


def pad(notes, length):
    e, t = env(length, 0.6, 0.8)
    s = np.zeros_like(t)
    for m in notes:
        for det in (-0.08, 0.0, 0.08):                 # gentle chorus
            f = hz(m + det)
            s += np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return s * e / (len(notes) * 3)


def pluck(m, length=0.45):
    t = np.arange(int(length * SR)) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return s * np.exp(-t * 7) * np.minimum(1, t / 0.004)


def bass(m, length):
    e, t = env(length, 0.01, 0.12)
    return np.sin(2 * np.pi * hz(m) * t) * e


def kick():
    t = np.arange(int(0.35 * SR)) / SR
    f = 45 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def hat():
    t = np.arange(int(0.06 * SR)) / SR
    x = rng.standard_normal(len(t))
    x = np.diff(np.concatenate([[0], x]))             # crude high-pass
    return x * np.exp(-t * 70)


# vi - IV - I - V in A minor / C major
chords = [(57, 60, 64, 69), (53, 57, 60, 65), (48, 55, 60, 64), (55, 59, 62, 67)]
roots = [45, 41, 48, 43]
bar = 4 * BEAT
bars = int(np.ceil(dur / bar))
for b in range(bars):
    t0 = b * bar
    ci = b % 4
    place(pad(chords[ci], bar + 0.6), t0, 0.55)
    if b >= 1:                                          # bass from bar 2
        for k in (0, 2.5, 3):
            place(bass(roots[ci], BEAT * (1.4 if k == 0 else 0.45)), t0 + k * BEAT, 0.5)
    arp = [chords[ci][i] + 12 for i in (0, 1, 2, 3, 2, 1, 2, 3)]
    for k, m in enumerate(arp):                         # 8th-note arpeggio
        place(pluck(m), t0 + k * BEAT / 2, 0.22 if b >= 1 else 0.12)
    if b >= 2:                                          # drums from bar 3
        for k in (0, 2):
            place(kick(), t0 + k * BEAT, 0.6)
        for k in range(8):
            place(hat(), t0 + k * BEAT / 2 + 0.01, 0.10 if k % 2 else 0.05)

mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.8
pcm = (mix * 32767).astype("<i2")
with wave.open(out, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out, dur, "s")
