"""Sounddesign + Musik (prozedural mit NumPy) und Mischung mit der Sprecherstimme.
Erzeugt build/sfx_music.wav, build/vo.wav und build/mix.wav."""
import os
import subprocess
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt, sosfiltfilt

from render import TOTAL, VO

SR = 48000
N = int(TOTAL * SR)
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
B = os.path.join(ROOT, "build")
rng = np.random.default_rng(1)


def t_arr(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, f1, f2, order=2):
    return sosfilt(butter(order, [f1, f2], "band", fs=SR, output="sos"), x)


def env(n, a, d, shape=1.0):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    e[na:] = np.exp(-np.arange(n - na) / (d * SR)) ** shape
    return e


class Bus:
    def __init__(self):
        self.L = np.zeros(N + SR * 4)
        self.R = np.zeros(N + SR * 4)

    def add(self, t0, x, g=1.0, pan=0.0):
        i = int(t0 * SR)
        if i < 0:
            x = x[-i:]
            i = 0
        n = min(len(x), len(self.L) - i)
        if n <= 0:
            return
        self.L[i:i + n] += x[:n] * g * (1 - max(0, pan))
        self.R[i:i + n] += x[:n] * g * (1 + min(0, pan))


def noise(d):
    return rng.standard_normal(int(d * SR))


# ------------------------------------------------------------------ Klangbausteine
def boom(d=3.0, f0=70, f1=26, g=1.0):
    t = t_arr(d)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * env(len(t), 0.004, 0.9)
    s += lp(noise(d), 180) * env(len(t), 0.002, 0.35) * 2.5
    s += lp(noise(d), 2500) * env(len(t), 0.001, 0.06) * 0.9
    return np.tanh(s * 1.6) * g


def crack(d=0.4, g=1.0, bright=4000):
    n = noise(d) * env(int(d * SR), 0.0005, 0.03)
    s = bp(n, 300, bright) * 3
    s += boom(d, 140, 60, 0.4)[: len(s)]
    return s * g


def ice_crackle(d, density=40, g=0.5):
    out = np.zeros(int(d * SR))
    k = int(d * density)
    for _ in range(k):
        i = rng.integers(0, len(out) - 4000)
        c = crack(0.08, rng.uniform(0.2, 1.0), rng.uniform(1500, 7000))
        out[i:i + len(c)] += c[: len(out) - i]
    return out * g


def roar(d, lo=60, hi=900, a=0.5, rel=0.8, g=1.0):
    n = noise(d)
    s = bp(n, lo, hi, 2) * 2 + lp(noise(d), 120) * 2
    e = np.minimum(1, t_arr(d) / max(a, 1e-3)) * np.minimum(1, (d - t_arr(d)) / rel)
    return s * e * g


def whoosh(d=0.8, up=True, g=1.0):
    t = t_arr(d)
    n = noise(d)
    out = np.zeros_like(n)
    seg = 2048
    for i in range(0, len(n), seg):
        u = i / len(n)
        fc = 200 + 5000 * (u if up else 1 - u) ** 2
        out[i:i + seg] = bp(n[max(0, i - 4096):i + seg], fc * 0.6, fc * 1.4 + 50)[-len(n[i:i + seg]):]
    e = np.sin(np.pi * t / d) ** 2
    return out * e * g * 2


def siren(d, g=0.3):
    t = t_arr(d)
    f = 700 + 350 * np.sin(2 * np.pi * t / 3.2)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.3 * np.sin(2 * ph)
    s = lp(s, 1800) * np.minimum(1, t / 1.0) * np.minimum(1, (d - t) / 1.0)
    return s * g


def saw(f, d):
    t = t_arr(d)
    return 2 * ((t * f) % 1.0) - 1


def braam(freqs, d=2.5, g=0.5, cutoff=900):
    s = sum(saw(f * k, d) * 0.5 + saw(f * k * 1.007, d) * 0.5 for f in freqs for k in (1,))
    s = lp(s, cutoff, 3)
    e = env(len(s), 0.02, d * 0.45)
    return np.tanh(s * e * 1.4) * g


def pad(freqs, d, g=0.2, cutoff=700, att=1.5):
    s = np.zeros(int(d * SR))
    for f in freqs:
        for det in (0.996, 1.0, 1.005):
            s += saw(f * det, d)
    s = lp(s, cutoff, 2) / (len(freqs) * 3)
    t = t_arr(d)
    e = np.minimum(1, t / att) * np.minimum(1, (d - t) / 1.0)
    return s * e * g


def taiko(g=1.0):
    d = 0.9
    t = t_arr(d)
    f = 55 + 70 * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.25)
    s += lp(noise(d), 900) * env(len(t), 0.001, 0.03) * 0.8
    return np.tanh(s * 1.5) * g


def pluck(f, g=0.4):
    d = 0.35
    s = lp(saw(f, d) + saw(f * 1.01, d), 600) * env(int(d * SR), 0.003, 0.09)
    return s * g


def riser(d, g=0.5):
    t = t_arr(d)
    f = 80 * (2 ** (t / d * 4))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + bp(noise(d), 500, 6000) * (t / d) ** 2
    return s * (t / d) ** 1.5 * g


def heartbeat(g=0.5):
    return lp(boom(0.5, 60, 40, 1.0), 200) * g


D, F, A, Bb, C, G, E = 36.71, 43.65, 55.0, 58.27, 32.70, 49.0, 41.2


def build():
    sfx = Bus()
    mus = Bus()
    # ---------------- Szene 1
    sfx.add(0.0, boom(3.5, 90, 24, 1.0))
    sfx.add(0.0, crack(0.5, 1.2))
    sfx.add(0.05, ice_crackle(1.5, 30, 0.6), pan=-0.3)
    sfx.add(0.3, roar(1.4, 80, 600, 0.3, 0.6, 0.35))
    sfx.add(0.55, crack(0.6, 1.0, 6000))
    sfx.add(1.05, boom(2.5, 70, 30, 0.9))
    sfx.add(1.05, roar(1.6, 200, 4000, 0.05, 1.2, 0.6))  # Aufprall-Gischt
    sfx.add(1.45, whoosh(0.3, False, 0.6))
    sfx.add(1.55, roar(1.2, 60, 500, 0.2, 0.5, 0.5))  # Meer zieht sich zurück
    sfx.add(1.55, siren(1.3, 0.12), pan=0.4)
    sfx.add(2.6, whoosh(0.2, True, 0.5))
    sfx.add(2.75, boom(3.0, 60, 26, 1.0))
    mus.add(2.75, braam([D, A, D * 2], 3.0, 0.7))
    mus.add(0.0, pad([D, A], 4.2, 0.18, 300, 0.05))
    # ---------------- Szene 2
    mus.add(4.0, pad([D, F, A], 10.2, 0.16, 500, 2.0))
    beat = 60 / 100 / 2
    k = 0
    tt = 4.4
    while tt < 14.0:
        f = [D, D, F, D, A / 2 * 2, D, F, G][k % 8]
        mus.add(tt, pluck(f * 2, 0.22 + 0.1 * (tt - 4.4) / 10))
        tt += beat
        k += 1
    sfx.add(4.3, roar(3.4, 30, 200, 1.0, 0.5, 0.3))
    sfx.add(4.6, ice_crackle(2.5, 25, 0.55), pan=0.2)
    sfx.add(5.6, crack(0.6, 1.0))
    sfx.add(6.1, boom(2.5, 55, 25, 0.9))
    sfx.add(6.4, ice_crackle(1.2, 50, 0.5), pan=-0.2)
    # Unterwasser: dumpf
    uw = lp(roar(3.0, 30, 300, 0.1, 0.6, 1.0), 250) * 0.8
    sfx.add(7.7, uw)
    sfx.add(7.7, lp(boom(2.0, 50, 20, 1.0), 200))
    for _ in range(60):
        tb = 7.8 + rng.uniform(0, 2.7)
        d = 0.06
        tb_ = t_arr(d)
        fb = rng.uniform(300, 900) * (1 + tb_ * 8)
        sfx.add(tb, np.sin(2 * np.pi * np.cumsum(fb) / SR) * env(len(tb_), 0.003, 0.02) * 0.12, pan=rng.uniform(-0.6, 0.6))
    sfx.add(10.4, whoosh(0.4, True, 0.6))
    sfx.add(10.6, roar(3.4, 50, 1500, 1.5, 0.4, 0.75))
    sfx.add(12.6, boom(1.5, 60, 30, 0.6))
    mus.add(12.0, riser(2.0, 0.35))
    # ---------------- Szene 3: Zeitraffer-Flut
    prog = [[D, F, A], [Bb / 2 * 2, D, F], [F, A, C * 2], [C * 2, E * 2, G]]
    for i in range(6):
        mus.add(14.0 + i * 1.9, pad(prog[i % 4], 2.3, 0.2 + 0.03 * i, 600 + 150 * i, 0.4))
    tt = 14.0
    k = 0
    while tt < 25.2:
        mus.add(tt, taiko(0.45 + 0.4 * (tt - 14) / 11))
        if (tt - 14) > 5:
            mus.add(tt + 0.475, taiko(0.3 + 0.3 * (tt - 14) / 11))
        tt += 0.95
    sfx.add(14.0, roar(11.3, 200, 5000, 1.0, 1.0, 0.18))  # Regen
    sfx.add(14.3, siren(10.5, 0.16), pan=-0.5)
    sfx.add(15.5, siren(9.0, 0.1), pan=0.6)
    for ft in (2.2, 5.9, 8.8):
        sfx.add(14.0 + ft, crack(0.3, 0.8, 8000))
        sfx.add(14.0 + ft + 0.15, boom(3.0, 50, 25, 0.7))  # Donner
    sfx.add(14.0, roar(11.3, 40, 600, 4.0, 1.0, 0.35))
    mus.add(23.3, riser(2.0, 0.5))
    # ---------------- Szene 4: Flutwelle
    sfx.add(25.3, whoosh(0.3, False, 0.6))
    sfx.add(25.3, roar(1.0, 20, 120, 0.8, 0.2, 0.6))
    sfx.add(26.15, boom(3.0, 70, 22, 1.0))
    sfx.add(26.2, roar(2.0, 100, 3000, 0.05, 1.5, 0.5))
    mus.add(26.2, braam([D, A], 2.5, 0.55, 700))
    sfx.add(27.0, roar(4.6, 30, 300, 2.5, 0.3, 0.8))  # Grollen schwillt an
    sfx.add(27.8, roar(4.0, 100, 2500, 1.8, 0.2, 0.6))
    sfx.add(29.35, boom(2.0, 60, 28, 0.8))
    sfx.add(29.8, roar(1.7, 80, 4000, 1.4, 0.05, 1.0))
    sfx.add(31.45, boom(4.0, 80, 20, 1.3))
    sfx.add(31.45, roar(2.5, 100, 6000, 0.01, 2.0, 0.9))
    mus.add(31.45, braam([D / 2 * 2, A, D * 2, F * 2], 3.5, 0.8, 1200))
    sfx.add(31.6, roar(4.6, 60, 3000, 0.1, 1.5, 0.55), pan=0.2)
    for tc in (31.9, 32.6, 33.2, 34.0):
        sfx.add(tc, crack(0.3, 0.5, 2500), pan=rng.uniform(-0.5, 0.5))
    tt = 27.8
    while tt < 33.5:
        mus.add(tt, taiko(0.7))
        tt += 0.5
    mus.add(34.4, pad([D / 2 * 2, A / 2 * 2], 4.0, 0.3, 200, 0.3))  # tiefer atmosphärischer Klang
    sfx.add(34.4, boom(4.0, 45, 22, 0.6))
    # ---------------- Szene 5: Aufstieg + Globus
    sfx.add(36.0, whoosh(2.4, True, 0.8))
    sfx.add(36.4, roar(2.2, 300, 3000, 0.8, 0.6, 0.25))  # Wind in Wolken
    sfx.add(38.6, boom(3.0, 55, 24, 0.8))
    mus.add(38.6, braam([D, A, D * 2], 3.0, 0.5, 600))
    mus.add(38.6, pad([D, A, D * 2, F * 2], 8.8, 0.18, 900, 2.0))
    for i, tr in enumerate((42.6, 43.75, 44.9, 46.05)):
        sfx.add(tr - 0.15, whoosh(0.35, i % 2 == 0, 0.5))
        sfx.add(tr, boom(1.2, 80, 40, 0.35))
        mus.add(tr, pluck(D * 4, 0.3))
    mus.add(45.2, riser(2.0, 0.5))
    # ---------------- Szene 6: Finale Montage (Höhepunkt)
    tt = 47.2
    while tt < 55.6:
        prog_ = (tt - 47.2) / 8.4
        mus.add(tt, taiko(0.8 + 0.3 * prog_))
        mus.add(tt + 0.214, taiko(0.4 + 0.3 * prog_))
        tt += 0.4286
    for i, tc in enumerate((47.2, 48.9, 50.6, 52.3, 53.95)):
        sfx.add(tc, boom(1.8, 70, 25, 0.9))
        mus.add(tc, braam([[D, A], [Bb / 2 * 2, F], [F, C * 2], [C * 2, G], [D, A]][i] + [D * 2], 1.8, 0.6, 1000 + 200 * i))
    mus.add(47.2, pad([D, F, A, D * 2], 8.4, 0.28, 1400, 0.5))
    sfx.add(48.9, roar(1.7, 40, 400, 0.4, 0.3, 0.4))
    sfx.add(50.6, roar(1.7, 150, 3000, 0.3, 0.3, 0.5))
    sfx.add(52.3, roar(1.65, 80, 4000, 0.05, 0.3, 0.8))
    mus.add(53.6, riser(2.0, 0.8))
    # ---------------- Szene 7: Stille + bedrohliche Schlussfrage
    mus.add(55.95, pad([D / 2 * 2, A / 2 * 2], 8.4, 0.12, 250, 2.0))
    for hb in (57.0, 57.35, 58.6, 58.95, 60.6):
        sfx.add(hb, heartbeat(0.45 if hb != 60.6 else 0.7))
    sfx.add(58.6, whoosh(1.0, False, 0.15))
    sfx.add(60.6, boom(3.0, 50, 25, 0.35))
    return sfx, mus


def reverb(x, secs=2.2, wet=0.25):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * secs / 6))
    ir = lp(ir, 5000)
    ir /= np.sqrt((ir ** 2).sum())
    return x * (1 - wet) + fftconvolve(x, ir)[: len(x)] * wet


def write_wav(path, L, R):
    st = np.stack([L, R], 1)
    st = np.clip(st, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())


def read_wav_mono(path):
    with wave.open(path) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
        ch = w.getnchannels()
    return a.reshape(-1, ch).mean(1)


def make_vo():
    """Sprecher: tiefer gepitcht, EQ, Kompression, leichter Hall – an die Zeitpunkte gesetzt."""
    vo_dir = os.path.join(B, "vo")
    ins, filt, labels = [], [], []
    for k, (st, du, _) in enumerate(VO):
        ins += ["-i", os.path.join(vo_dir, f"n{k + 1}.wav")]
        ms = int(st * 1000)
        filt.append(f"[{k}:a]aresample=48000,asetrate=48000*0.93,aresample=48000,atempo=1.0753,"
                    f"highpass=f=70,lowpass=f=7500,equalizer=f=180:t=q:w=1:g=3,equalizer=f=3000:t=q:w=1.5:g=2,"
                    f"acompressor=threshold=-20dB:ratio=4:attack=5:release=120:makeup=4,"
                    f"adelay={ms}|{ms},apad=whole_dur={TOTAL}[v{k}]")
        labels.append(f"[v{k}]")
    fc = ";".join(filt) + ";" + "".join(labels) + f"amix=inputs={len(VO)}:normalize=0,aecho=0.8:0.6:45|90:0.12|0.06,atrim=0:{TOTAL}[out]"
    subprocess.run(["ffmpeg", "-y", "-v", "error"] + ins + ["-filter_complex", fc, "-map", "[out]", "-ac", "2", "-ar", "48000",
                    os.path.join(B, "vo.wav")], check=True)


def main():
    import sys
    no_vo = "--no-vo" in sys.argv
    if no_vo:
        return main_no_vo()
    make_vo()
    sfx, mus = build()
    L = sfx.L[:N] * 0.8 + reverb(mus.L[:N], 2.5, 0.35)
    R = sfx.R[:N] * 0.8 + reverb(mus.R[:N], 2.6, 0.35)
    # harte Stille nach dem Höhepunkt
    s0, s1 = int(55.6 * SR), int(55.95 * SR)
    L[s0:s1] = 0
    R[s0:s1] = 0
    fade = np.linspace(1, 0, int(0.01 * SR))
    L[s0 - len(fade):s0] *= fade
    R[s0 - len(fade):s0] *= fade
    # Ducking unter der Stimme
    vo = read_wav_mono(os.path.join(B, "vo.wav"))[:N]
    vo = np.pad(vo, (0, N - len(vo)))
    e = np.abs(vo)
    e = sosfiltfilt(butter(1, 4, "low", fs=SR, output="sos"), e)
    duck = 1 - 0.55 * np.clip(e / 0.03, 0, 1)
    L *= duck
    R *= duck
    peak = max(np.abs(L).max(), np.abs(R).max())
    L, R = L / peak * 0.7, R / peak * 0.7
    write_wav(os.path.join(B, "sfx_music.wav"), L, R)
    # Endmischung: Stimme klar vorne, Lautheit auf Social-Media-Niveau
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(B, "sfx_music.wav"), "-i", os.path.join(B, "vo.wav"),
                    "-filter_complex", "[0:a]volume=0.9[m];[1:a]volume=2.2[v];[m][v]amix=inputs=2:normalize=0,"
                    "alimiter=limit=0.95:attack=2:release=50,loudnorm=I=-14:TP=-1.5:LRA=11[out]",
                    "-map", "[out]", "-ar", "48000", os.path.join(B, "mix.wav")], check=True)


def main_no_vo():
    """Version ohne Sprecher: nur Musik + Sounddesign, ohne Ducking."""
    sfx, mus = build()
    L = sfx.L[:N] * 0.8 + reverb(mus.L[:N], 2.5, 0.35)
    R = sfx.R[:N] * 0.8 + reverb(mus.R[:N], 2.6, 0.35)
    s0, s1 = int(55.6 * SR), int(55.95 * SR)
    fade = np.linspace(1, 0, int(0.01 * SR))
    for ch in (L, R):
        ch[s0:s1] = 0
        ch[s0 - len(fade):s0] *= fade
    peak = max(np.abs(L).max(), np.abs(R).max())
    write_wav(os.path.join(B, "sfx_music_novo.wav"), L / peak * 0.7, R / peak * 0.7)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(B, "sfx_music_novo.wav"),
                    "-af", "alimiter=limit=0.95:attack=2:release=50,loudnorm=I=-14:TP=-1.5:LRA=11",
                    "-ar", "48000", os.path.join(B, "mix_novo.wav")], check=True)


if __name__ == "__main__":
    main()
