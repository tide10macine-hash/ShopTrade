"""Synthesise the full sound kit for the PIKOBUY 11.11 promo: SFX + 120 BPM music bed.

Everything is generated from oscillators and filtered noise (no samples, no downloads),
so the audio is original, royalty-free and fully reproducible.

Usage: python3 -I make_audio.py <out_dir>
Writes 16-bit 44.1 kHz stereo WAVs into <out_dir>/sfx and <out_dir>/music.
"""
import os, sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
OUT = sys.argv[1] if len(sys.argv) > 1 else "assets/audio"
rng = np.random.default_rng(1111)  # deterministic


# ------------------------------------------------------------------ helpers
def t(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return rng.uniform(-1, 1, int(d * SR))


def filt(x, kind, f, order=2):
    sos = butter(order, f, btype=kind, fs=SR, output="sos")
    return sosfilt(sos, x)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def env_adsr(n, a=0.005, r=0.1):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def sweep_sine(f0, f1, d, curve="exp"):
    tt = t(d)
    if curve == "exp":
        f = f0 * (f1 / f0) ** (tt / d)
    else:
        f = f0 + (f1 - f0) * tt / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def reverb(x, size=0.6, mix=0.25, damp=5000):
    ir = noise(size) * env_exp(int(size * SR), size / 5)
    ir = filt(ir, "low", damp)
    ir /= np.abs(ir).sum() ** 0.5 * 4
    wet = fftconvolve(x, ir)[: len(x) + int(size * SR)]
    dry = np.concatenate([x, np.zeros(len(wet) - len(x))])
    return dry * (1 - mix) + wet * mix


def stereo(x, pan=0.0, width=0.0):
    """pan -1..1; width adds a few-ms Haas offset on the right channel."""
    l = x * np.sqrt(0.5 * (1 - pan))
    r = x * np.sqrt(0.5 * (1 + pan))
    if width:
        k = int(width * SR)
        r = np.concatenate([np.zeros(k), r[:-k]]) if k else r
    return np.stack([l, r], 1)


def pan_sweep(x, p0, p1):
    p = np.linspace(p0, p1, len(x))
    return np.stack([x * np.sqrt(0.5 * (1 - p)), x * np.sqrt(0.5 * (1 + p))], 1)


def norm(x, peak=0.89):
    m = np.abs(x).max()
    return x / m * peak if m > 0 else x


def write(path, x):
    if x.ndim == 1:
        x = stereo(x)
    x = np.clip(x, -1, 1)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    import wave
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())
    print(os.path.relpath(path), f"{len(x)/SR:.2f}s")


def pad_to(x, n):
    return np.concatenate([x, np.zeros(n - len(x))]) if len(x) < n else x[:n]


# ------------------------------------------------------------------ SFX
def sfx_impact(big=False):
    d = 2.2 if big else 1.3
    n = int(d * SR)
    boom = sweep_sine(90 if big else 110, 32, d) * env_exp(n, 0.55 if big else 0.32)
    sub = np.sin(2 * np.pi * 42 * t(d)) * env_exp(n, 0.9 if big else 0.4) * 0.6
    crack = filt(noise(d), "band", [400, 6000]) * env_exp(n, 0.05)
    body = filt(noise(d), "low", 900) * env_exp(n, 0.25 if big else 0.14) * 0.8
    click = np.zeros(n); click[:200] = np.hanning(400)[200:] * 1.0
    x = boom * 1.0 + sub + crack * 0.7 + body + click
    x = np.tanh(x * 1.6)
    x = reverb(x, 1.6 if big else 0.9, 0.3 if big else 0.18, 3500)
    return norm(stereo(x, 0, 0.012))


def sfx_riser(d=0.9):
    n = int(d * SR)
    nz = noise(d)
    out = np.zeros(n)
    # sweep a band-pass up by processing in blocks
    blocks = 40
    for b in range(blocks):
        s, e = b * n // blocks, (b + 1) * n // blocks
        fc = 300 * (9000 / 300) ** (b / blocks)
        seg = filt(nz, "band", [fc * 0.7, min(fc * 1.4, 20000)])[s:e]
        out[s:e] = seg
    tone = sweep_sine(200, 1600, d) * 0.25
    x = (out + tone) * (np.linspace(0, 1, n) ** 2.2)
    x[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return norm(stereo(x, 0, 0.008), 0.8)


def sfx_whoosh(d=0.38, f0=600, f1=3500, p0=-0.8, p1=0.8):
    n = int(d * SR)
    nz = noise(d)
    out = np.zeros(n)
    blocks = 30
    for b in range(blocks):
        s, e = b * n // blocks, (b + 1) * n // blocks
        x = b / blocks
        fc = f0 * (f1 / f0) ** (np.sin(np.pi * x * 0.5))
        out[s:e] = filt(nz, "band", [fc * 0.6, min(fc * 1.6, 20000)])[s:e]
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6
    return norm(pan_sweep(out * e, p0, p1), 0.75)


def sfx_airplane(d=1.3):
    n = int(d * SR)
    jet = filt(noise(d), "band", [500, 4000])
    hum = sweep_sine(520, 300, d) * 0.25 + sweep_sine(1040, 600, d) * 0.1
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    x = (jet + hum) * e
    return norm(pan_sweep(reverb(x, 0.5, 0.2)[:n], -0.9, 0.9), 0.7)


def sfx_pop(f0=950, f1=260):
    d = 0.14
    n = int(d * SR)
    x = sweep_sine(f0, f1, d) * env_exp(n, 0.035)
    x += filt(noise(d), "high", 2500) * env_exp(n, 0.004) * 0.5
    return norm(stereo(x), 0.8)


def sfx_paper(d=0.45):
    n = int(d * SR)
    x = np.zeros(n)
    for _ in range(46):
        p = rng.integers(0, n - 2000)
        g = int(rng.uniform(0.002, 0.012) * SR)
        x[p:p + g] += rng.uniform(-1, 1, g) * env_exp(g, g / SR / 3) * rng.uniform(0.3, 1)
    x = filt(x, "band", [1200, 9000]) * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.6
    return norm(stereo(x, 0, 0.006), 0.6)


def bell(freqs, amps, d, tau):
    n = int(d * SR)
    tt = t(d)
    x = np.zeros(n)
    for f, a in zip(freqs, amps):
        x += a * np.sin(2 * np.pi * f * tt + rng.uniform(0, 6)) * env_exp(n, tau * (1500 / f) ** 0.4)
    return x


def sfx_cash_register():
    d = 1.4
    n = int(d * SR)
    drawer = filt(noise(0.12), "band", [300, 2500]) * env_exp(int(0.12 * SR), 0.03)
    thunk = sweep_sine(180, 70, 0.12) * env_exp(int(0.12 * SR), 0.04)
    ka = pad_to(drawer * 0.7 + thunk, n)
    ching = bell([2093, 2637, 3136, 4186, 5274, 6272], [1, .8, .6, .5, .35, .25], d - 0.09, 0.35)
    ching = np.concatenate([np.zeros(int(0.09 * SR)), ching * (1 + 0.3 * np.sin(2 * np.pi * 9 * t(d - 0.09)))])
    x = ka + ching * 0.8
    x = reverb(x, 0.8, 0.2)
    return norm(stereo(x, 0.1, 0.01), 0.8)


def sfx_coins():
    d = 0.9
    n = int(d * SR)
    x = np.zeros(n)
    for k, off in enumerate([0, 0.07, 0.15, 0.21, 0.3]):
        f = rng.uniform(2800, 3600)
        c = bell([f, f * 1.58, f * 2.31, f * 2.9], [1, .6, .4, .25], 0.4, 0.06)
        c += filt(noise(0.4), "high", 5000) * env_exp(int(0.4 * SR), 0.002) * 0.6
        s = int(off * SR)
        x[s:s + len(c)] += c[: n - s] * (1 - k * 0.12)
    return norm(stereo(reverb(x, 0.4, 0.15)[:n], 0, 0.01), 0.7)


def sfx_truck():
    d = 1.1
    n = int(d * SR)
    tt = t(d)
    eng = np.sign(np.sin(2 * np.pi * (48 + 10 * tt) * tt)) * 0.5
    eng = filt(eng, "low", 380) * (0.6 + 0.4 * np.sin(2 * np.pi * 16 * tt))
    rumble = filt(noise(d), "low", 220) * 0.8
    e = np.minimum(1, tt / 0.15) * np.exp(-np.maximum(0, tt - 0.5) / 0.25)
    x = (eng + rumble) * e
    # two-tone horn
    horn = np.zeros(n)
    for s0, dur in [(0.55, 0.1), (0.7, 0.16)]:
        h = t(dur)
        tone = np.sign(np.sin(2 * np.pi * 415 * h)) + np.sign(np.sin(2 * np.pi * 523 * h))
        tone = filt(tone, "low", 2500) * env_adsr(len(h), 0.005, 0.03)
        s = int(s0 * SR)
        horn[s:s + len(h)] += tone * 0.25
    return norm(pan_sweep(x + horn, 0.7, -0.4), 0.75)


def sfx_coupon():
    d = 0.7
    n = int(d * SR)
    x = np.zeros(n)
    for k, f in enumerate([1318.5, 1975.5, 2637.0]):
        s = int(k * 0.075 * SR)
        b = bell([f, f * 2, f * 3], [1, .3, .1], d - k * 0.075, 0.18)
        x[s:s + len(b)] += b[: n - s]
    return norm(stereo(reverb(x, 0.5, 0.2)[:n], 0, 0.008), 0.7)


def sfx_check():
    d = 0.6
    x = bell([1568, 3136, 4704], [1, .4, .15], d, 0.15)
    x2 = bell([2093, 4186], [1, .3], d - 0.06, 0.18)
    x[int(0.06 * SR):] += x2
    return norm(stereo(reverb(x, 0.4, 0.18)[: int(d * SR)]), 0.65)


def sfx_tick(high=True):
    d = 0.08
    n = int(d * SR)
    x = filt(noise(d), "band", [2500, 6000] if high else [1200, 3000]) * env_exp(n, 0.006)
    x += np.sin(2 * np.pi * (3200 if high else 2000) * t(d)) * env_exp(n, 0.01) * 0.4
    return norm(stereo(x), 0.6)


def sfx_stamp():
    d = 0.6
    n = int(d * SR)
    thud = sweep_sine(140, 50, d) * env_exp(n, 0.07)
    slap = filt(noise(d), "band", [500, 5000]) * env_exp(n, 0.02)
    x = np.tanh((thud + slap * 0.8) * 2)
    return norm(stereo(reverb(x, 0.4, 0.15)[:n]), 0.85)


# ------------------------------------------------------------------ MUSIC (120 BPM, A minor)
BPM = 120
BEAT = 60 / BPM
DUR = 22.5
# section times (s) - keep in sync with src/timeline.ts
DROP_80 = 8.5      # 80% reveal (coupon scene start)
DROP_LOGO = 18.0   # final logo slam
STOP = 22.0        # end hit; music stops, chord tail rings out
HOOKS = [8.5, 13.0, 18.0]


def kick():
    d = 0.35
    n = int(d * SR)
    x = sweep_sine(160, 45, d) * env_exp(n, 0.12)
    x[: int(0.003 * SR)] += 0.6
    return np.tanh(x * 1.8) * 0.9


def clap():
    d = 0.25
    n = int(d * SR)
    x = np.zeros(n)
    for off in [0, 0.01, 0.022]:
        s = int(off * SR)
        g = filt(noise(d), "band", [900, 5000]) * env_exp(n, 0.012 if off < 0.02 else 0.06)
        x[s:] += g[: n - s]
    return x * 0.45


def hat(open_=False):
    d = 0.18 if open_ else 0.05
    n = int(d * SR)
    return filt(noise(d), "high", 7000) * env_exp(n, 0.05 if open_ else 0.012) * 0.28


def saw(f, d, detune=(0,)):
    tt = t(d)
    x = np.zeros(len(tt))
    for c in detune:
        ff = f * 2 ** (c / 1200)
        x += 2 * ((tt * ff + rng.uniform(0, 1)) % 1) - 1
    return x / len(detune)


def note(name):
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    n, o = name[:-1], int(name[-1])
    return 440 * 2 ** ((names[n] + (o - 4) * 12) / 12)


def music():
    N = int((DUR + 1.5) * SR)
    drums = np.zeros((N, 2)); bass = np.zeros(N); chords = np.zeros((N, 2)); lead = np.zeros((N, 2))
    side = np.ones(N)
    beats = int(DUR / BEAT)
    # sections (in seconds): drop-out before the 80% reveal (5.75-6.0) and before logo (15.75-16)
    def muted(sec):
        return DROP_80 - 0.25 <= sec < DROP_80 or DROP_LOGO - 0.25 <= sec < DROP_LOGO or sec >= STOP
    prog = [("A1", ["A3", "C4", "E4"]), ("F1", ["F3", "A3", "C4"]), ("C2", ["G3", "C4", "E4"]), ("G1", ["G3", "B3", "D4"])]
    K, C = kick(), clap()
    for b in range(beats):
        sec = b * BEAT
        s = int(sec * SR)
        if not muted(sec):
            drums[s:s + len(K)] += stereo(K)[: N - s] * 1.0
            # sidechain envelope
            dk = int(0.22 * SR)
            side[s:s + dk] = np.minimum(side[s:s + dk], 0.25 + 0.75 * (np.arange(dk) / dk) ** 1.5)
            if b % 2 == 1:
                drums[s:s + len(C)] += stereo(C, 0, 0.008)[: N - s]
        for q in range(4):  # 16th hats
            hs = sec + q * BEAT / 4
            if muted(hs):
                continue
            H = hat(open_=(q == 2 and b % 4 == 3))
            amp = 1.0 if q == 2 else 0.45
            i = int(hs * SR)
            drums[i:i + len(H)] += stereo(H * amp, 0.25 if q % 2 else -0.25)[: N - i]
        # bass: offbeat 8ths + 16th pickup, sidechained
        bar = b // 4
        root, chord = prog[bar % 4]
        f = note(root)
        for q, length in [(0.5, 0.22), (0.75, 0.12)]:
            bs = sec + q * BEAT
            if muted(bs):
                continue
            x = saw(f, length, (0, 7)) * env_adsr(int(length * SR), 0.004, 0.04)
            x = filt(x, "low", 900)
            i = int(bs * SR)
            bass[i:i + len(x)] += x[: N - i] * 0.55
        # chord stabs on the "and"
        cs = sec + 0.5 * BEAT
        if not muted(cs):
            length = 0.2
            x = sum(saw(note(c), length, (-14, 0, 13)) for c in chord) / 3
            x = filt(x, "low", 3200) * env_exp(int(length * SR), 0.07)
            i = int(cs * SR)
            chords[i:i + len(x)] += stereo(x, 0, 0.011)[: N - i] * 0.42
    # lead hook (square-ish pluck) in the 80% section and finale
    hook = ["E5", "E5", "A5", "G5", "E5", "D5", "E5", "C5"]
    for start in HOOKS:
        for k, nm in enumerate(hook):
            ls = start + k * BEAT / 2
            if muted(ls):
                continue
            length = 0.2
            tt = t(length)
            x = np.sign(np.sin(2 * np.pi * note(nm) * tt)) * 0.5 + np.sin(2 * np.pi * note(nm) * 2 * tt) * 0.2
            x = filt(x, "low", 4200) * env_exp(len(tt), 0.08)
            i = int(ls * SR)
            lead[i:i + len(x)] += stereo(x, 0.15 if k % 2 else -0.15, 0.009)[: N - i] * 0.22
    # final sustained chord tail after the stop (19.0s)
    tail = sum(saw(note(c), 1.9, (-12, 0, 12)) for c in ["A3", "C4", "E4", "A4"]) / 4
    tail = filt(tail, "low", 2400) * env_exp(len(tail), 0.6) * 0.35
    i = int(STOP * SR)
    chords[i:i + len(tail)] += stereo(tail, 0, 0.012)[: N - i]
    mix = drums + stereo(bass * side) + chords * side[:, None] + lead * (0.6 + 0.4 * side[:, None])
    mix = np.tanh(mix * 1.1) * 0.9
    mix = mix[: int(DUR * SR)]
    nf = int(0.35 * SR)  # short fade so the ringing chord ends cleanly at the last frame
    mix[-nf:] *= np.linspace(1, 0, nf)[:, None] ** 1.5
    return norm(mix, 0.85)


def sfx_page_flip():
    d = 0.16
    n = int(d * SR)
    x = filt(noise(d), "band", [900, 7000]) * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.5 * env_exp(n, 0.06)
    x[: int(0.004 * SR)] += filt(noise(0.004), "high", 3000) * 0.8
    return norm(pan_sweep(x, -0.3, 0.3), 0.6)


def sfx_shutter():
    d = 0.22
    n = int(d * SR)
    x = np.zeros(n)
    for off, amp in [(0.0, 1.0), (0.075, 0.8)]:
        s0 = int(off * SR)
        c = filt(noise(0.05), "band", [1500, 9000]) * env_exp(int(0.05 * SR), 0.006) * amp
        c += sweep_sine(1800, 600, 0.05) * env_exp(int(0.05 * SR), 0.008) * 0.4 * amp
        x[s0:s0 + len(c)] += c[: n - s0]
    return norm(stereo(x, 0, 0.005), 0.7)


def sfx_doorbell():
    d = 1.3
    n = int(d * SR)
    x = np.zeros(n)
    for off, f in [(0.0, 659.3), (0.42, 523.3)]:
        s0 = int(off * SR)
        b = bell([f, f * 2.0, f * 3.0, f * 4.2], [1, .5, .2, .08], d - off, 0.35)
        x[s0:s0 + len(b)] += b[: n - s0]
    return norm(stereo(reverb(x, 0.5, 0.2)[:n], 0, 0.01), 0.7)


def sfx_glitch():
    d = 0.32
    n = int(d * SR)
    x = np.zeros(n)
    pos = 0
    while pos < n - 400:
        g = int(rng.uniform(0.008, 0.03) * SR)
        kind = rng.integers(0, 3)
        tt = np.arange(g) / SR
        if kind == 0:
            seg = np.sign(np.sin(2 * np.pi * rng.uniform(200, 2400) * tt))
        elif kind == 1:
            seg = rng.uniform(-1, 1, g)
            seg = np.round(seg * 3) / 3
        else:
            seg = np.zeros(g)
        x[pos:pos + g] = seg[: n - pos] * rng.uniform(0.3, 1)
        pos += g
    x = filt(x, "band", [200, 9000]) * env_exp(n, 0.14)
    return norm(stereo(x, 0, 0.004), 0.6)


def sfx_vacuum():
    d = 1.1
    n = int(d * SR)
    hiss = filt(noise(d), "band", [2500, 9000])
    tone = sweep_sine(900, 380, d) * 0.15
    e = np.minimum(1, np.arange(n) / (0.05 * SR)) * np.exp(-np.maximum(0, np.arange(n) / SR - 0.75) / 0.12)
    return norm(stereo((hiss + tone) * e, 0, 0.006), 0.55)


if __name__ == "__main__":
    S = os.path.join(OUT, "sfx")
    write(f"{S}/impact.wav", sfx_impact())
    write(f"{S}/impact-cinematic.wav", sfx_impact(big=True))
    write(f"{S}/riser.wav", sfx_riser())
    write(f"{S}/whoosh.wav", sfx_whoosh())
    write(f"{S}/whoosh-reverse.wav", sfx_whoosh(0.32, 2500, 500, 0.8, -0.8))
    write(f"{S}/airplane.wav", sfx_airplane())
    write(f"{S}/pop.wav", sfx_pop())
    write(f"{S}/pop-high.wav", sfx_pop(1400, 500))
    write(f"{S}/paper-rustle.wav", sfx_paper())
    write(f"{S}/cash-register.wav", sfx_cash_register())
    write(f"{S}/coins.wav", sfx_coins())
    write(f"{S}/truck.wav", sfx_truck())
    write(f"{S}/coupon-confirm.wav", sfx_coupon())
    write(f"{S}/checkmark.wav", sfx_check())
    write(f"{S}/tick.wav", sfx_tick(True))
    write(f"{S}/tock.wav", sfx_tick(False))
    write(f"{S}/stamp.wav", sfx_stamp())
    if len(sys.argv) > 2 and sys.argv[2] == "--tips":
        # "5 Mistakes" countdown: 39 s bed; drops before mistake #5 and before the PIKOBUY reveal
        DUR, DROP_80, DROP_LOGO, STOP, HOOKS = 39.0, 6.0, 33.0, 38.6, [33.0]
        write(f"{S}/glitch.wav", sfx_glitch())
        write(f"{S}/vacuum.wav", sfx_vacuum())
        write(os.path.join(OUT, "music", "music-bed-tips-120bpm.wav"), music())
        sys.exit(0)
    if len(sys.argv) > 2 and sys.argv[2] == "--reasons":
        # "3 Reasons" video: 18 s bed, drop before the 80% scene and the logo, stop on the end hit
        DUR, DROP_80, DROP_LOGO, STOP, HOOKS = 18.0, 10.0, 15.5, 17.5, [6.0, 10.0, 15.5]
        write(os.path.join(OUT, "music", "music-bed-3reasons-120bpm.wav"), music())
        sys.exit(0)
    write(os.path.join(OUT, "music", "music-bed-120bpm.wav"), music())
    write(f"{S}/page-flip.wav", sfx_page_flip())
    write(f"{S}/camera-shutter.wav", sfx_shutter())
    write(f"{S}/doorbell.wav", sfx_doorbell())
