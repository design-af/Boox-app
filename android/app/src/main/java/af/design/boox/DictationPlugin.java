package af.design.boox;

import android.Manifest;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.speech.SpeechRecognizer;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;

/**
 * App-side controls for Aside Transcribe (floating button, settings, recordings library).
 *
 * JS: Capacitor.nativePromise("Dictation", method, args)
 *   status | requestMic | openOverlaySettings | openAccessibilitySettings | openAppSettings
 *   showBubble | hideBubble | setSettings {engine, mute, cap, autoPeriod, lang, model, context, apiKey}
 *   list | load {id} | save {id, json} | remove {id} | state | setState {json} | claude {body}
 *   transcript | copyText {text} | shareText {text, subject} | clearTranscript
 */
@CapacitorPlugin(
    name = "Dictation",
    permissions = { @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO }) }
)
public class DictationPlugin extends Plugin {

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(DictationStore.PREFS, Context.MODE_PRIVATE);
    }

    private boolean hasMic() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean canOverlay() {
        return Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(getContext());
    }

    private boolean accessibilityEnabled() {
        if (DictationAccessibility.isOn()) return true;
        try {
            String s = Settings.Secure.getString(getContext().getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            return s != null && s.contains(getContext().getPackageName() + "/");
        } catch (Exception e) {
            return false;
        }
    }

    private JSObject buildStatus() {
        Context c = getContext();
        JSObject r = new JSObject();
        r.put("mic", hasMic());
        r.put("overlay", canOverlay());
        r.put("accessibility", accessibilityEnabled());
        r.put("bubble", DictationService.isRunning());
        boolean recognizer = false;
        try { recognizer = SpeechRecognizer.isRecognitionAvailable(c); } catch (Exception ignored) { }
        r.put("recognizer", recognizer);
        boolean onDevice = false;
        if (Build.VERSION.SDK_INT >= 31) {
            try { onDevice = SpeechRecognizer.isOnDeviceRecognitionAvailable(c); } catch (Exception ignored) { }
        }
        r.put("onDevice", onDevice);
        r.put("sdk", Build.VERSION.SDK_INT);

        SharedPreferences p = prefs();
        JSObject s = new JSObject();
        s.put("engine", p.getString("engine", "auto"));
        s.put("mute", p.getBoolean("mute", true));
        s.put("cap", p.getBoolean("cap", true));
        s.put("autoPeriod", p.getBoolean("autoPeriod", true));
        s.put("lang", p.getString("lang", ""));
        s.put("model", p.getString("model", ClaudeClient.DEFAULT_MODEL));
        s.put("context", p.getString("context", ""));
        s.put("hasKey", ClaudeClient.hasKey(c));
        r.put("settings", s);

        File f = DictationStore.transcriptFile(c);
        r.put("transcriptBytes", f.exists() ? f.length() : 0);
        return r;
    }

    @PluginMethod
    public void status(PluginCall call) { call.resolve(buildStatus()); }

    @PluginMethod
    public void requestMic(PluginCall call) {
        if (hasMic()) { call.resolve(buildStatus()); return; }
        requestPermissionForAlias("microphone", call, "micResult");
    }

    @PermissionCallback
    private void micResult(PluginCall call) { call.resolve(buildStatus()); }

    private void launch(PluginCall call, Intent i) {
        try {
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 23) {
            launch(call, new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName())));
        } else call.resolve();
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        launch(call, new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        launch(call, new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName())));
    }

    @PluginMethod
    public void showBubble(PluginCall call) {
        if (!hasMic()) { call.reject("Allow the microphone first"); return; }
        if (!canOverlay()) { call.reject("Allow “Display over other apps” first"); return; }
        try {
            DictationService.show(getContext());
            call.resolve(buildStatus());
        } catch (Exception e) {
            call.reject("Could not start the floating button: " + e.getMessage());
        }
    }

    @PluginMethod
    public void hideBubble(PluginCall call) {
        DictationService.close(getContext());
        call.resolve();
    }

    @PluginMethod
    public void setSettings(PluginCall call) {
        SharedPreferences.Editor e = prefs().edit();
        String[] strings = { "engine", "lang", "model", "context" };
        for (String k : strings) {
            String v = call.getString(k);
            if (v != null) e.putString(k, v.trim());
        }
        String[] bools = { "mute", "cap", "autoPeriod" };
        for (String k : bools) {
            Boolean v = call.getBoolean(k);
            if (v != null) e.putBoolean(k, v);
        }
        String key = call.getString("apiKey");
        if (key != null) e.putString("apiKey", key.trim());
        e.apply();
        call.resolve(buildStatus());
    }

    // ---------------------------------------------------------------- library

    @PluginMethod
    public void list(PluginCall call) {
        JSObject r = new JSObject();
        r.put("json", DictationStore.list(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void load(PluginCall call) {
        String s = DictationStore.load(getContext(), call.getString("id"));
        if (s == null) { call.reject("Recording not found"); return; }
        JSObject r = new JSObject();
        r.put("json", s);
        call.resolve(r);
    }

    @PluginMethod
    public void save(PluginCall call) {
        if (DictationStore.save(getContext(), call.getString("id"), call.getString("json"))) call.resolve();
        else call.reject("Could not save recording");
    }

    @PluginMethod
    public void remove(PluginCall call) {
        DictationStore.delete(getContext(), call.getString("id"));
        call.resolve();
    }

    @PluginMethod
    public void state(PluginCall call) {
        JSObject r = new JSObject();
        r.put("json", DictationStore.loadState(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void setState(PluginCall call) {
        DictationStore.saveState(getContext(), call.getString("json", "{}"));
        call.resolve();
    }

    @PluginMethod
    public void claude(PluginCall call) {
        String body = call.getString("body");
        if (body == null) { call.reject("Missing body"); return; }
        new Thread(() -> {
            try {
                JSObject r = new JSObject();
                r.put("json", ClaudeClient.send(getContext(), body));
                call.resolve(r);
            } catch (Exception e) {
                call.reject(String.valueOf(e.getMessage()));
            }
        }).start();
    }

    // ---------------------------------------------------------------- text helpers

    @PluginMethod
    public void transcript(PluginCall call) {
        String s = DictationStore.read(DictationStore.transcriptFile(getContext()));
        JSObject r = new JSObject();
        r.put("text", s == null ? "" : s.trim());
        call.resolve(r);
    }

    @PluginMethod
    public void copyText(PluginCall call) {
        ClipboardManager cm = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm == null) { call.reject("No clipboard"); return; }
        cm.setPrimaryClip(ClipData.newPlainText("Aside Transcribe", call.getString("text", "")));
        call.resolve();
    }

    @PluginMethod
    public void shareText(PluginCall call) {
        try {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_SUBJECT, call.getString("subject", "Aside Transcribe"));
            send.putExtra(Intent.EXTRA_TEXT, call.getString("text", ""));
            Intent chooser = Intent.createChooser(send, "Send");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("Share failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearTranscript(PluginCall call) {
        DictationStore.write(DictationStore.transcriptFile(getContext()), "");
        call.resolve(buildStatus());
    }
}
