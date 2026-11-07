/* Makho – Ohren und Stimme. Nutzt das eigene Android-Plugin, im Browser Web Speech, in Tests eine Attrappe. */
(function (root) {
  "use strict";
  const Cap = root.Capacitor;
  const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const mode = root.__MAKHO_MOCK ? "mock" : isNative ? "native" : "web";
  const P = mode === "native" ? (Cap.registerPlugin ? Cap.registerPlugin("Makho") : Cap.Plugins.Makho) : null;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  const h = { speech() {}, rms() {}, state() {}, word() {}, phase() {} };
  const prefs = (() => { try { return JSON.parse(localStorage.getItem("makho.voice") || "{}"); } catch (e) { return {}; } })();
  const settings = { rate: prefs.rate || 1.0, pitch: prefs.pitch || 0.95, voice: prefs.voice || null };
  const save = () => { try { localStorage.setItem("makho.voice", JSON.stringify(settings)); } catch (e) {} };
  let voiceList = [];
  let speakingNow = false;
  let wantListen = false;

  /* ---------------- native ---------------- */
  async function nativeInit() {
    P.addListener("speech", e => h.speech(e.type, e.text || "", e.alts || [e.text]));
    P.addListener("rms", e => h.rms(e.db));
    P.addListener("state", e => h.state(!!e.listening));
    P.addListener("phase", e => h.phase(e.phase));
    P.addListener("tts", e => { if (e.type === "word") h.word(e.start, e.end); });
    P.addListener("ttsReady", () => loadVoices());
    await loadVoices();
  }
  async function loadVoices() {
    try {
      const r = await P.getVoices();
      voiceList = (r.voices || []).sort((a, b) => (b.quality - a.quality) || ((a.country === "DE" ? 0 : 1) - (b.country === "DE" ? 0 : 1)) || ((b.network ? 1 : 0) - (a.network ? 1 : 0)));
      if (!settings.voice && voiceList[0]) settings.voice = voiceList[0].name;
      if (settings.voice && voiceList.length && !voiceList.some(v => v.name === settings.voice)) settings.voice = voiceList[0].name;
    } catch (e) {}
  }

  /* ---------------- web ---------------- */
  let webRec = null;
  function webListen() {
    const SR = root.SpeechRecognition || root.webkitSpeechRecognition;
    if (!SR) return false;
    webRec = new SR(); webRec.lang = "de-DE"; webRec.continuous = true; webRec.interimResults = true; webRec.maxAlternatives = 4;
    webRec.onresult = e => { const r = e.results[e.results.length - 1]; h.speech(r.isFinal ? "final" : "partial", r[0].transcript, [...r].map(x => x.transcript)); };
    webRec.onend = () => { h.state(false); if (wantListen) setTimeout(() => { try { webRec.start(); h.state(true); } catch (e) {} }, 250); };
    try { webRec.start(); h.state(true); return true; } catch (e) { return false; }
  }

  /* ---------------- öffentlich ---------------- */
  const Voice = {
    mode,
    settings,
    on(name, fn) { h[name] = fn; },
    async init() { if (mode === "native") await nativeInit(); },
    async micPermission(ask) {
      if (mode === "mock") return true;
      if (mode === "web") return !!(root.SpeechRecognition || root.webkitSpeechRecognition);
      try {
        let p = await P.checkPermissions();
        if (p.mic !== "granted" && ask) p = await P.requestPermissions({ permissions: ["mic"] });
        return p.mic === "granted";
      } catch (e) { return false; }
    },
    async listen() {
      wantListen = true;
      if (mode === "native") { try { await P.startListening({ lang: "de-DE" }); return true; } catch (e) { return false; } }
      if (mode === "web") return webListen();
      h.state(true); return true;
    },
    async unlisten() {
      wantListen = false;
      if (mode === "native") { try { await P.stopListening(); } catch (e) {} }
      else if (webRec) { try { webRec.stop(); } catch (e) {} }
    },
    get speaking() { return speakingNow; },
    async say(text) {
      speakingNow = true;
      try {
        if (mode === "native") {
          await Promise.race([P.speak({ text, rate: settings.rate, pitch: settings.pitch, voice: settings.voice || undefined }), wait(text.length * 110 + 6000)]);
        } else if (mode === "web" && root.speechSynthesis) {
          await Promise.race([new Promise(res => {
            const u = new SpeechSynthesisUtterance(text); u.lang = "de-DE"; u.rate = settings.rate; u.pitch = settings.pitch;
            const v = speechSynthesis.getVoices().find(x => /^de/i.test(x.lang)); if (v) u.voice = v;
            u.onboundary = ev => { if (ev.name === "word") h.word(ev.charIndex, ev.charIndex + (ev.charLength || 1)); };
            u.onend = u.onerror = res; speechSynthesis.speak(u);
          }), wait(text.length * 110 + 6000)]);
        } else {
          const words = [...text.matchAll(/\S+/g)];
          for (const w of words) { if (!speakingNow) break; h.word(w.index, w.index + w[0].length); await wait(root.__MAKHO_MOCK_WORD_MS || 12); }
        }
      } catch (e) { await wait(300); }
      speakingNow = false;
    },
    async hush() {
      speakingNow = false;
      if (mode === "native") { try { await P.stopSpeaking(); } catch (e) {} }
      else if (mode === "web" && root.speechSynthesis) speechSynthesis.cancel();
    },
    voices() { return voiceList; },
    nextVoice() {
      if (!voiceList.length) return null;
      const i = voiceList.findIndex(v => v.name === settings.voice);
      settings.voice = voiceList[(i + 1) % voiceList.length].name; save();
      return { index: (i + 1) % voiceList.length + 1, total: voiceList.length };
    },
    adjust(key, delta) {
      const lim = key === "rate" ? [0.6, 1.6] : [0.6, 1.4];
      settings[key] = Math.round(Math.min(lim[1], Math.max(lim[0], settings[key] + delta)) * 100) / 100; save();
      return settings[key];
    },
    reset() { settings.rate = 1.0; settings.pitch = 0.95; settings.voice = voiceList[0] ? voiceList[0].name : null; save(); },
    /* nur für Tests */
    mock: { hear(text, type = "final") { h.speech(type, text, [text]); }, rms(db) { h.rms(db); } }
  };
  root.MakhoVoice = Voice;
})(window);
