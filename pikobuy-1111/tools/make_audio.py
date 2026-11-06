"""Synthesises the music bed + SFX kit for the PIKOBUY 11.11 ad (no third-party audio).
Run:  python3 tools/make_audio.py public/assets/audio
Everything is deterministic (seeded) so re-running gives identical files."""
import sys, os, wave, numpy as np
SR = 44100
OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/assets/audio'
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(1111)
def t(d): return np.arange(int(SR*d))/SR
def env(n, a=0.002, d=0.2, curve=4.0):
    x = np.arange(n)/SR
    att = np.clip(x/max(a, 1e-4), 0, 1)
    return att*np.exp(-curve*np.maximum(x-a, 0)/max(d, 1e-4))
def lp(x, cutoff):
    # one-pole low-pass, cutoff may be an array (sweeps)
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = np.exp(-2*np.pi*c/SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1-a[i])*x[i] + a[i]*s; y[i] = s
    return y
def hp(x, cutoff): return x - lp(x, cutoff)
def norm(x, peak=0.9): return x/(np.abs(x).max()+1e-9)*peak
def save(name, x, stereo_width=0.0):
    x = np.clip(x, -1, 1)
    if x.ndim == 1:
        d = int(SR*0.011)
        r = np.concatenate([np.zeros(d), x[:-d]]) if stereo_width else x
        st = np.stack([x, x*(1-stereo_width)+r*stereo_width], 1)
    else: st = x
    with wave.open(f'{OUT}/{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st*32767).astype('<i2').tobytes())
    print('wrote', name, round(len(st)/SR, 2), 's')
noise = lambda d: rng.standard_normal(int(SR*d))

# ---------- SFX ----------
def kick(d=0.45, f0=150, f1=42):
    x = t(d); f = f1+(f0-f1)*np.exp(-x*28); ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*env(len(x), 0.001, 0.22, 3)
def impact(d=1.6, big=1.0):
    x = t(d); k = kick(d, 120, 32)*1.1
    n = lp(noise(d), 900)*env(len(x), 0.001, 0.35*big, 3)*1.6
    crack = hp(noise(d), 2500)*env(len(x), 0.0005, 0.04, 3)*0.6
    sub = np.sin(2*np.pi*38*x)*env(len(x), 0.005, 0.9*big, 3)*0.7
    return norm(np.tanh((k+n+crack+sub)*1.6), 0.95)
save('impact', impact(1.4))
save('impact-big', impact(2.4, 1.8), 0.4)
def whoosh(d=0.55, up=True):
    x = t(d); n = noise(d); s = x/d
    cut = 300+5000*(s if up else 1-s)**1.5
    w = lp(n, cut)*np.sin(np.pi*s)**1.4
    return norm(w, 0.8)
save('whoosh', whoosh(0.5), 0.6)
save('whoosh-fast', whoosh(0.28), 0.6)
def pop(d=0.14):
    x = t(d); f = 900*np.exp(-x*30)+300
    return norm(np.sin(2*np.pi*np.cumsum(f)/SR)*env(len(x), 0.001, 0.05, 3), 0.8)
save('pop', pop())
def ding(freqs, d=0.9, decay=0.35):
    x = t(d); y = sum(np.sin(2*np.pi*f*x)*(0.6**i) for i, f in enumerate(freqs))
    return y*env(len(x), 0.001, decay, 3)
def cash_register():
    a = np.concatenate([lp(noise(0.12), 3000)*env(int(SR*.12), .001, .03, 3)*0.5,
                        np.zeros(int(SR*0.05))])
    drawer = lp(noise(0.25), 1200)*env(int(SR*.25), .01, .12, 3)*0.5
    bell = ding([2093, 2637, 4186, 5274], 1.1, 0.4)
    out = np.zeros(int(SR*1.3)); out[:len(a)] += a
    out[int(SR*.08):int(SR*.08)+len(drawer)] += drawer
    out[int(SR*.12):int(SR*.12)+len(bell)] += bell
    return norm(out, 0.85)
save('cash-register', cash_register(), 0.3)
def coins(n=9):
    out = np.zeros(int(SR*0.9))
    for i in range(n):
        st = int(SR*(0.06*i+rng.uniform(0, .03)))
        c = ding([rng.uniform(3200, 5200), rng.uniform(6000, 8000)], 0.25, 0.06)*rng.uniform(.4, 1)
        out[st:st+len(c)] += c[:len(out)-st]
    return norm(out, 0.7)
save('coins', coins(), 0.5)
def truck():
    x = t(1.1); eng = np.sin(2*np.pi*(55+8*np.sin(2*np.pi*9*x))*x)
    rum = lp(noise(1.1), 220)*3; body = (eng*0.6+rum)*np.sin(np.pi*x/1.1)
    horn = np.zeros_like(x); h0 = int(SR*.55); hx = t(0.32)
    hn = (np.sign(np.sin(2*np.pi*392*hx))+np.sign(np.sin(2*np.pi*494*hx)))*env(len(hx), .01, .5, 1)*0.18
    horn[h0:h0+len(hx)] = lp(hn, 2500)
    return norm(body*0.7+horn, 0.8)
save('truck', truck(), 0.4)
def airplane():
    d = 1.2; x = t(d); s = x/d
    jet = lp(noise(d), 600+3500*np.sin(np.pi*s)) * np.sin(np.pi*s)**2
    tone = np.sin(2*np.pi*np.cumsum(500+700*np.sin(np.pi*s))/SR)*0.08*np.sin(np.pi*s)**3
    return norm(jet+tone, 0.8)
save('airplane', airplane(), 0.8)
def confirm():
    a = ding([1318.5, 2637], 0.35, 0.12); b = ding([1975.5, 3951], 0.7, 0.3)
    out = np.zeros(int(SR*0.9)); out[:len(a)] += a; s = int(SR*.09); out[s:s+len(b)] += b
    return norm(out, 0.75)
save('coupon-confirm', confirm(), 0.3)
save('check', norm(ding([2349, 4698], 0.5, 0.18), 0.7))
def tick():
    x = t(0.06); return norm(hp(noise(0.06), 3000)*env(len(x), .0005, .008, 3)+np.sin(2*np.pi*3200*x)*env(len(x), .0005, .01, 3), 0.7)
ticks = np.zeros(int(SR*2.0))
for i in range(8):
    k = tick()*(1 if i % 2 == 0 else 0.6); s = int(SR*0.25*i); ticks[s:s+len(k)] += k
save('clock-ticks', ticks)
def paper():
    d = 0.45; x = t(d); cr = np.zeros(len(x))
    for _ in range(60):
        p = rng.integers(0, len(x)-800); cr[p:p+800] += hp(noise(800/SR), 1500)*env(800, .0005, .004, 3)*rng.uniform(.2, 1)
    return norm(cr*np.sin(np.pi*x/d), 0.6)
save('paper', paper(), 0.5)
def stamp():
    x = t(0.5); thud = kick(0.5, 200, 60)*0.9 + lp(noise(0.5), 1800)*env(len(x), .001, .05, 3)
    return norm(np.tanh(thud*2), 0.9)
save('stamp', stamp())
def riser(d=1.0):
    x = t(d); s = x/d
    n = lp(noise(d), 400+7000*s**2)*s**2
    tone = np.sin(2*np.pi*np.cumsum(200+1200*s**2)/SR)*s**3*0.3
    return norm(n+tone, 0.6)
save('riser', riser(1.0), 0.7)

# ---------- MUSIC: 120 BPM electro-pop bed, 20 s ----------
BPM, DUR = 120, 20.5; beat = 60/BPM; N = int(SR*DUR)
mus = np.zeros((N, 2))
def put(sig, at, gain=1.0, pan=0.0):
    s = int(at*SR); e = min(N, s+len(sig))
    if s >= N: return
    mus[s:e, 0] += sig[:e-s]*gain*(1-max(pan, 0)); mus[s:e, 1] += sig[:e-s]*gain*(1+min(pan, 0))
K = kick(0.4, 160, 45)
hat = hp(noise(0.05), 7000)*env(int(SR*.05), .0005, .012, 3)
clap = hp(lp(noise(0.2), 4000), 900)*env(int(SR*.2), .001, .06, 3)
# chord progression (A minor-ish pop): Am F C G — root freqs
roots = [110.0, 87.31, 130.81, 98.0]
chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]]
def saw(f, d):
    x = t(d); ph = (f*x) % 1.0; return 2*ph-1
def supersaw(f, d):
    return sum(saw(f*(1+dt), d) for dt in (-0.012, -0.004, 0.004, 0.012))/4
bars = int(DUR/(beat*4))+1
for b in range(bars):
    bar_t = b*beat*4; ci = b % 4
    for q in range(4):
        tt = bar_t+q*beat
        if tt > DUR-0.3: continue
        # drop out kick briefly before the 80% reveal (6.0s) for a build -> drop
        if not (5.0 <= tt < 6.0): put(K, tt, 0.85)
        put(hat, tt+beat/2, 0.35, 0.3)
        put(hat, tt+beat/4, 0.12, -0.3); put(hat, tt+3*beat/4, 0.12, -0.3)
        if q in (1, 3): put(clap, tt, 0.45)
        # off-beat pumping bass
        bs = lp(saw(roots[ci], beat/2), 700)*env(int(SR*beat/2), .005, .18, 2)
        put(bs, tt+beat/2, 0.42)
    # chord stabs on the "and" of 2 and 4
    for off in (1.5, 3.5):
        tt = bar_t+off*beat
        if tt > DUR-0.3: continue
        st = sum(lp(supersaw(f, 0.22), 2600) for f in chords[ci])/3*env(int(SR*.22), .003, .09, 3)
        put(st, tt, 0.33, 0.25 if off == 1.5 else -0.25)
# build-up riser into the drop at 6.0s, and a last riser into the end card at 16s
put(riser(1.0), 5.0, 0.35)
put(riser(1.0), 15.0, 0.25)
# fade out tail
fade = np.ones(N); fl = int(SR*1.2); fade[-fl:] = np.linspace(1, 0, fl)**2
mus *= fade[:, None]
# gentle bus compression (tanh) + normalise, music sits under SFX
mus = np.tanh(mus*1.4); mus = mus/np.abs(mus).max()*0.8
save('music-bed', mus)
