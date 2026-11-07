package de.makho.assistant;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Makhos Ohren und Stimme.
 *
 * Spracherkennung läuft in einer Dauerschleife (auch während Makho spricht, damit
 * "Stopp" sofort wirkt) und meldet Teilergebnisse, Endergebnisse und die Lautstärke
 * des Mikrofons. Die Sprachausgabe nutzt bevorzugt die Google-Sprachausgabe und
 * meldet jedes gesprochene Wort, damit die Untertitel mitlaufen.
 */
@CapacitorPlugin(name = "Makho", permissions = { @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "mic") })
public class MakhoPlugin extends Plugin {

    private static final String GOOGLE_TTS = "com.google.android.tts";

    private final Handler main = new Handler(Looper.getMainLooper());
    private final Runnable cycle = this::beginCycle;
    private SpeechRecognizer recognizer;
    private volatile boolean wantListening = false;
    private boolean resumeListening = false;
    private String lang = "de-DE";
    private long lastRms = 0;

    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    private String ttsEngine = "";
    private final Map<String, PluginCall> pending = new HashMap<>();
    private int utterances = 0;

    private AudioManager audio;
    private boolean muted = false;

    @Override
    public void load() {
        audio = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        initTts();
    }

    /* ======================= Sprachausgabe ======================= */

    private void initTts() {
        TextToSpeech.OnInitListener onInit = status -> {
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady) {
                try {
                    tts.setLanguage(Locale.GERMANY);
                    tts.setOnUtteranceProgressListener(progress);
                } catch (Exception ignored) {}
            }
            JSObject o = new JSObject();
            o.put("ready", ttsReady);
            o.put("engine", ttsEngine);
            notifyListeners("ttsReady", o, true);
        };
        boolean hasGoogle = false;
        try {
            getContext().getPackageManager().getPackageInfo(GOOGLE_TTS, 0);
            hasGoogle = true;
        } catch (Exception ignored) {}
        ttsEngine = hasGoogle ? GOOGLE_TTS : "default";
        tts = hasGoogle ? new TextToSpeech(getContext(), onInit, GOOGLE_TTS) : new TextToSpeech(getContext(), onInit);
    }

    private final UtteranceProgressListener progress = new UtteranceProgressListener() {
        @Override
        public void onStart(String id) {
            emitTts("start", id, -1, -1);
        }

        @Override
        public void onDone(String id) {
            emitTts("done", id, -1, -1);
            finish(id, true);
        }

        @Override
        public void onError(String id) {
            emitTts("error", id, -1, -1);
            finish(id, false);
        }

        @Override
        public void onStop(String id, boolean interrupted) {
            emitTts("stop", id, -1, -1);
            finish(id, false);
        }

        @Override
        public void onRangeStart(String id, int start, int end, int frame) {
            emitTts("word", id, start, end);
        }
    };

    private void emitTts(String type, String id, int start, int end) {
        JSObject o = new JSObject();
        o.put("type", type);
        o.put("id", id);
        if (start >= 0) {
            o.put("start", start);
            o.put("end", end);
        }
        notifyListeners("tts", o);
    }

    private void finish(String id, boolean completed) {
        PluginCall call;
        synchronized (pending) {
            call = pending.remove(id);
        }
        if (call != null) {
            JSObject r = new JSObject();
            r.put("completed", completed);
            call.resolve(r);
        }
    }

    private Set<Voice> voices() {
        try {
            Set<Voice> v = tts.getVoices();
            return v != null ? v : new HashSet<>();
        } catch (Exception e) {
            return new HashSet<>();
        }
    }

    @PluginMethod
    public void getVoices(PluginCall call) {
        JSArray list = new JSArray();
        if (ttsReady) {
            for (Voice v : voices()) {
                Locale l = v.getLocale();
                if (l == null || !"de".equals(l.getLanguage())) continue;
                Set<String> f = v.getFeatures();
                if (f != null && f.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                JSObject o = new JSObject();
                o.put("name", v.getName());
                o.put("quality", v.getQuality());
                o.put("network", v.isNetworkConnectionRequired());
                o.put("country", l.getCountry());
                list.put(o);
            }
        }
        JSObject r = new JSObject();
        r.put("voices", list);
        r.put("engine", ttsEngine);
        r.put("ready", ttsReady);
        call.resolve(r);
    }

    @PluginMethod
    public void speak(PluginCall call) {
        if (!ttsReady || tts == null) {
            call.reject("Sprachausgabe nicht bereit");
            return;
        }
        String text = call.getString("text", "");
        float rate = call.getFloat("rate", 1.0f);
        float pitch = call.getFloat("pitch", 1.0f);
        float volume = call.getFloat("volume", 1.0f);
        String voice = call.getString("voice", null);
        boolean voiceSet = false;
        if (voice != null && !voice.isEmpty()) {
            for (Voice v : voices()) {
                if (v.getName().equals(voice)) {
                    tts.setVoice(v);
                    voiceSet = true;
                    break;
                }
            }
        }
        if (!voiceSet) tts.setLanguage(Locale.GERMANY);
        tts.setSpeechRate(rate);
        tts.setPitch(pitch);
        String id = "u" + (++utterances);
        synchronized (pending) {
            pending.put(id, call);
        }
        Bundle params = new Bundle();
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume);
        int res = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, id);
        if (res != TextToSpeech.SUCCESS) {
            synchronized (pending) {
                pending.remove(id);
            }
            call.reject("Sprechen fehlgeschlagen");
        }
    }

    @PluginMethod
    public void stopSpeaking(PluginCall call) {
        try {
            if (tts != null) tts.stop();
        } catch (Exception ignored) {}
        ArrayList<String> ids;
        synchronized (pending) {
            ids = new ArrayList<>(pending.keySet());
        }
        for (String id : ids) finish(id, false);
        call.resolve();
    }

    /* ======================= Spracherkennung ======================= */

    @PluginMethod
    public void startListening(PluginCall call) {
        if (getPermissionState("mic") != PermissionState.GRANTED) {
            call.reject("Mikrofon nicht erlaubt");
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            call.reject("Spracherkennung nicht verfügbar");
            return;
        }
        lang = call.getString("lang", "de-DE");
        wantListening = true;
        main.removeCallbacks(cycle);
        main.post(cycle);
        call.resolve();
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        wantListening = false;
        main.post(this::teardown);
        call.resolve();
    }

    private void beginCycle() {
        if (!wantListening) return;
        try {
            if (recognizer == null) {
                recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                recognizer.setRecognitionListener(listener);
            }
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang);
            i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
            i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());
            i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1200L);
            i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 900L);
            muteBeeps(true);
            recognizer.startListening(i);
            emitState(true);
        } catch (Exception e) {
            emitError(-1);
            restart(900, true);
        }
    }

    private void restart(long delay, boolean recreate) {
        main.removeCallbacks(cycle);
        if (recreate) destroyRecognizer();
        if (wantListening) main.postDelayed(cycle, delay);
    }

    private void destroyRecognizer() {
        if (recognizer != null) {
            try {
                recognizer.cancel();
                recognizer.destroy();
            } catch (Exception ignored) {}
            recognizer = null;
        }
    }

    private void teardown() {
        main.removeCallbacks(cycle);
        destroyRecognizer();
        muteBeeps(false);
        emitState(false);
    }

    private final RecognitionListener listener = new RecognitionListener() {
        @Override
        public void onReadyForSpeech(Bundle b) {
            emitPhase("ready");
        }

        @Override
        public void onBeginningOfSpeech() {
            emitPhase("begin");
        }

        @Override
        public void onRmsChanged(float db) {
            long now = System.currentTimeMillis();
            if (now - lastRms < 70) return;
            lastRms = now;
            JSObject o = new JSObject();
            o.put("db", db);
            notifyListeners("rms", o);
        }

        @Override
        public void onBufferReceived(byte[] b) {}

        @Override
        public void onEndOfSpeech() {
            emitPhase("end");
        }

        @Override
        public void onError(int error) {
            emitState(false);
            emitError(error);
            if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                wantListening = false;
                return;
            }
            boolean recreate = error == SpeechRecognizer.ERROR_CLIENT || error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || error == 11;
            long delay;
            if (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) delay = 60;
            else if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY) delay = 700;
            else if (error == SpeechRecognizer.ERROR_NETWORK || error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT) delay = 1500;
            else delay = 400;
            restart(delay, recreate);
        }

        @Override
        public void onResults(Bundle b) {
            emitState(false);
            emitResults("final", b);
            restart(50, false);
        }

        @Override
        public void onPartialResults(Bundle b) {
            emitResults("partial", b);
        }

        @Override
        public void onEvent(int type, Bundle b) {}
    };

    private void emitResults(String type, Bundle b) {
        ArrayList<String> m = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (m == null || m.isEmpty()) return;
        JSArray alts = new JSArray();
        for (String s : m) alts.put(s);
        JSObject o = new JSObject();
        o.put("type", type);
        o.put("text", m.get(0));
        o.put("alts", alts);
        notifyListeners("speech", o);
    }

    private void emitPhase(String phase) {
        JSObject o = new JSObject();
        o.put("phase", phase);
        notifyListeners("phase", o);
    }

    private void emitState(boolean listening) {
        JSObject o = new JSObject();
        o.put("listening", listening);
        notifyListeners("state", o);
    }

    private void emitError(int code) {
        JSObject o = new JSObject();
        o.put("code", code);
        notifyListeners("recognitionError", o);
    }

    /** Die Signaltöne der Spracherkennung laufen über System- und Benachrichtigungston. */
    private void muteBeeps(boolean mute) {
        if (audio == null || mute == muted) return;
        int dir = mute ? AudioManager.ADJUST_MUTE : AudioManager.ADJUST_UNMUTE;
        try {
            audio.adjustStreamVolume(AudioManager.STREAM_SYSTEM, dir, 0);
        } catch (Exception ignored) {}
        try {
            audio.adjustStreamVolume(AudioManager.STREAM_NOTIFICATION, dir, 0);
        } catch (Exception ignored) {}
        muted = mute;
    }

    /* ======================= Lebenszyklus ======================= */

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        resumeListening = wantListening;
        wantListening = false;
        main.post(this::teardown);
        try {
            if (tts != null) tts.stop();
        } catch (Exception ignored) {}
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if (resumeListening) {
            wantListening = true;
            restart(400, true);
        }
    }

    @Override
    protected void handleOnDestroy() {
        wantListening = false;
        teardown();
        try {
            if (tts != null) tts.shutdown();
        } catch (Exception ignored) {}
        super.handleOnDestroy();
    }
}
