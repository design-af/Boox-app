package af.design.boox;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.util.List;

/**
 * Bridge between the ARE page and NarrationService. JS:
 *   Capacitor.nativePromise("Narrator", "speak", { items:[{text,pause,label}], start, session, title, rate })
 *   Capacitor.addListener("Narrator", "progress", fn)   // { state, index, session, count, rate, error }
 */
@CapacitorPlugin(name = "Narrator")
public class NarratorPlugin extends Plugin {

    private final Handler main = new Handler(Looper.getMainLooper());
    private boolean askedNotify = false;

    @Override
    public void load() {
        NarrationService.listener = () -> notifyListeners("progress", snapshot());
    }

    @Override
    protected void handleOnDestroy() {
        NarrationService.listener = null;
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
        onMain(call, () -> {
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
