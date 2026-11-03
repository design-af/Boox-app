package af.design.boox;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * Bridge between the ARE page and NarrationService. JS:
 *   Capacitor.nativePromise("Narrator", "speak", { items:[{text,pause,label}], start, session, title, rate })
 *   Capacitor.addListener("Narrator", "progress", fn)   // { state, index, session, count, rate, error }
 */
@CapacitorPlugin(name = "Narrator")
public class NarratorPlugin extends Plugin {

    private final Handler main = new Handler(Looper.getMainLooper());
    private boolean askedNotify = false;

    // A second TextToSpeech used only to list voices and play previews (main thread only).
    private TextToSpeech probe;
    private String probeEngine = null;
    private boolean probeReady = false;
    private int probeToken = 0;
    private final List<Consumer<Boolean>> probeWaiting = new ArrayList<>();

    @Override
    public void load() {
        NarrationService.listener = () -> notifyListeners("progress", snapshot());
    }

    @Override
    protected void handleOnDestroy() {
        NarrationService.listener = null;
        if (probe != null) { try { probe.shutdown(); } catch (Exception ignored) { } probe = null; }
    }

    private void withProbe(String engine, Consumer<Boolean> cb) {
        if (probe != null && engine.equals(probeEngine)) {
            if (probeReady) cb.accept(true); else probeWaiting.add(cb);
            return;
        }
        if (probe != null) { try { probe.shutdown(); } catch (Exception ignored) { } }
        for (Consumer<Boolean> w : probeWaiting) w.accept(false);
        probeWaiting.clear();
        probeWaiting.add(cb);
        probeReady = false;
        probeEngine = engine;
        final int token = ++probeToken;
        probe = new TextToSpeech(getContext(), status -> main.post(() -> {
            if (token != probeToken) return;
            probeReady = status == TextToSpeech.SUCCESS;
            List<Consumer<Boolean>> ws = new ArrayList<>(probeWaiting);
            probeWaiting.clear();
            for (Consumer<Boolean> w : ws) w.accept(probeReady);
        }), engine.isEmpty() ? null : engine);
    }

    /** Installed engines plus the English voices of one engine ("" = the system default). */
    @PluginMethod
    public void getVoices(PluginCall call) {
        final String engine = call.getString("engine", "");
        main.post(() -> withProbe(engine, ok -> {
            JSObject o = new JSObject();
            JSArray engines = new JSArray();
            JSArray voices = new JSArray();
            if (!ok) { o.put("ok", false); o.put("engines", engines); o.put("voices", voices); call.resolve(o); return; }
            try {
                for (TextToSpeech.EngineInfo e : probe.getEngines()) {
                    JSObject eo = new JSObject();
                    eo.put("name", e.name);
                    eo.put("label", e.label);
                    engines.put(eo);
                }
                o.put("defaultEngine", probe.getDefaultEngine());
                Voice dv = probe.getDefaultVoice();
                o.put("defaultVoice", dv != null ? dv.getName() : "");
                if (probe.getVoices() != null) {
                    for (Voice v : probe.getVoices()) {
                        if (v.getLocale() == null || !"en".equals(v.getLocale().getLanguage())) continue;
                        JSObject vo = new JSObject();
                        vo.put("name", v.getName());
                        vo.put("locale", v.getLocale().toLanguageTag());
                        vo.put("localeLabel", v.getLocale().getDisplayName());
                        vo.put("quality", v.getQuality());
                        vo.put("network", v.isNetworkConnectionRequired());
                        vo.put("installed", v.getFeatures() == null
                                || !v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED));
                        voices.put(vo);
                    }
                }
                o.put("ok", true);
            } catch (Exception e) {
                o.put("ok", false);
                o.put("error", e.getMessage());
            }
            o.put("engines", engines);
            o.put("voices", voices);
            call.resolve(o);
        }));
    }

    /** Speak a sample in a given engine/voice/rate. Pauses any narration first. */
    @PluginMethod
    public void preview(PluginCall call) {
        final String engine = call.getString("engine", "");
        final String voice = call.getString("voice", "");
        final String text = call.getString("text", "This is how I will sound.");
        final Double rate = call.getDouble("rate");
        main.post(() -> {
            if (NarrationService.instance != null) NarrationService.instance.pause();
            withProbe(engine, ok -> {
                if (!ok) { call.reject("That engine did not start"); return; }
                try {
                    if (!voice.isEmpty() && probe.getVoices() != null) {
                        for (Voice v : probe.getVoices()) if (voice.equals(v.getName())) { probe.setVoice(v); break; }
                    }
                    probe.setSpeechRate(rate != null && rate > 0.2 ? rate.floatValue() : 1f);
                    probe.speak(text, TextToSpeech.QUEUE_FLUSH, null, "preview");
                    call.resolve();
                } catch (Exception e) { call.reject(e.getMessage()); }
            });
        });
    }

    @PluginMethod
    public void stopPreview(PluginCall call) {
        main.post(() -> { if (probe != null) probe.stop(); call.resolve(); });
    }

    /** Android's text-to-speech settings, where engines and voice data are managed. */
    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Intent i = new Intent("com.android.settings.TTS_SETTINGS").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) {
            try { getContext().startActivity(new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
            catch (Exception ignored) { }
        }
        call.resolve();
    }

    private static JSObject snapshot() {
        JSObject o = new JSObject();
        o.put("state", NarrationService.state);
        o.put("index", NarrationService.index);
        o.put("session", NarrationService.session);
        o.put("count", NarrationService.items.size());
        o.put("rate", (double) NarrationService.rate);
        o.put("error", NarrationService.error);
        return o;
    }

    private void onMain(PluginCall call, Runnable r) {
        main.post(() -> {
            try { r.run(); call.resolve(snapshot()); }
            catch (Exception e) { call.reject(e.getMessage()); }
        });
    }

    private boolean hasEngine() {
        Intent i = new Intent("android.intent.action.TTS_SERVICE");
        List<ResolveInfo> l = getContext().getPackageManager().queryIntentServices(i, 0);
        return l != null && !l.isEmpty();
    }

    @PluginMethod
    public void check(PluginCall call) {
        JSObject o = new JSObject();
        boolean ok = hasEngine();
        o.put("ok", ok);
        o.put("reason", ok ? "" : "no-engine");
        call.resolve(o);
    }

    @PluginMethod
    public void speak(PluginCall call) {
        JSArray arr = call.getArray("items");
        if (arr == null || arr.length() == 0) { call.reject("Nothing to read"); return; }
        if (!hasEngine()) {
            NarrationService.error = "no-engine";
            NarrationService.state = "error";
            call.resolve(snapshot());
            return;
        }
        maybeAskNotify();
        final String session = call.getString("session", "");
        final String title = call.getString("title", "Narration");
        final int start = call.getInt("start", 0);
        final Double rate = call.getDouble("rate");
        final String voice = call.getString("voice", "");
        final String engine = call.getString("engine", "");
        onMain(call, () -> {
            NarrationService.voiceName = voice == null ? "" : voice;
            NarrationService.enginePkg = engine == null ? "" : engine;
            NarrationService.items.clear();
            for (int k = 0; k < arr.length(); k++) {
                JSONObject it = arr.optJSONObject(k);
                if (it == null) continue;
                NarrationService.items.add(new NarrationService.Item(
                        it.optString("text", ""), it.optInt("pause", 0), it.optString("label", "")));
            }
            NarrationService.session = session;
            NarrationService.title = title;
            NarrationService.index = Math.max(0, Math.min(NarrationService.items.size() - 1, start));
            if (rate != null && rate > 0.2) NarrationService.rate = rate.floatValue();
            NarrationService.state = "playing";
            NarrationService.error = "";
            NarrationService.send(getContext(), NarrationService.ACTION_PLAY);
        });
    }

    @PluginMethod
    public void pause(PluginCall call) {
        onMain(call, () -> { if (NarrationService.instance != null) NarrationService.instance.pause(); });
    }

    @PluginMethod
    public void resume(PluginCall call) {
        onMain(call, () -> {
            if (NarrationService.instance != null) NarrationService.instance.resume();
            else if (!NarrationService.items.isEmpty()) {
                NarrationService.state = "playing";
                NarrationService.send(getContext(), NarrationService.ACTION_PLAY);
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        onMain(call, () -> {
            if (NarrationService.instance != null) NarrationService.instance.stopAll();
            else NarrationService.state = "stopped";
        });
    }

    @PluginMethod
    public void seek(PluginCall call) {
        final int i = call.getInt("index", 0);
        onMain(call, () -> {
            if (NarrationService.instance != null) NarrationService.instance.seek(i);
            else if (!NarrationService.items.isEmpty()) {
                NarrationService.index = Math.max(0, Math.min(NarrationService.items.size() - 1, i));
                NarrationService.notifyState();
            }
        });
    }

    @PluginMethod
    public void setRate(PluginCall call) {
        final Double r = call.getDouble("rate");
        onMain(call, () -> {
            if (r != null && r > 0.2 && r < 4) NarrationService.rate = r.floatValue();
            if (NarrationService.instance != null) NarrationService.instance.applyRate();
        });
    }

    @PluginMethod
    public void getState(PluginCall call) {
        onMain(call, () -> { });
    }

    /** Android 13+: without this the playback notification is hidden (audio still plays). Asked once. */
    private void maybeAskNotify() {
        if (askedNotify || Build.VERSION.SDK_INT < 33 || getActivity() == null) return;
        askedNotify = true;
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(), new String[] { Manifest.permission.POST_NOTIFICATIONS }, 4102);
        }
    }
}
