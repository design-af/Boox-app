package af.design.boox;

import android.Manifest;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.speech.SpeechRecognizer;
import android.view.inputmethod.InputMethodInfo;
import android.view.inputmethod.InputMethodManager;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Setup and backup transcript for the AFS Dictation keyboard (DictationIME).
 *
 * JS:
 *   Capacitor.nativePromise("Dictation", "status")          // mic, enabled, selected, engine availability, settings
 *   Capacitor.nativePromise("Dictation", "requestMic")
 *   Capacitor.nativePromise("Dictation", "openKeyboardSettings")
 *   Capacitor.nativePromise("Dictation", "showPicker")
 *   Capacitor.nativePromise("Dictation", "setSettings", { engine, live, mute, cap, lang })
 *   Capacitor.nativePromise("Dictation", "transcript")      // { text }
 *   Capacitor.nativePromise("Dictation", "copyTranscript")
 *   Capacitor.nativePromise("Dictation", "shareTranscript")
 *   Capacitor.nativePromise("Dictation", "clearTranscript")
 */
@CapacitorPlugin(
    name = "Dictation",
    permissions = { @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO }) }
)
public class DictationPlugin extends Plugin {

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(DictationIME.PREFS, Context.MODE_PRIVATE);
    }

    private boolean hasMic() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private JSObject buildStatus() {
        Context c = getContext();
        JSObject r = new JSObject();
        r.put("mic", hasMic());

        boolean enabled = false;
        InputMethodManager imm = (InputMethodManager) c.getSystemService(Context.INPUT_METHOD_SERVICE);
        if (imm != null) {
            try {
                for (InputMethodInfo info : imm.getEnabledInputMethodList()) {
                    if (c.getPackageName().equals(info.getPackageName())) { enabled = true; break; }
                }
            } catch (Exception ignored) { }
        }
        r.put("enabled", enabled);

        String current = null;
        try { current = Settings.Secure.getString(c.getContentResolver(), Settings.Secure.DEFAULT_INPUT_METHOD); } catch (Exception ignored) { }
        r.put("selected", current != null && current.startsWith(c.getPackageName() + "/"));

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
        s.put("live", p.getBoolean("live", true));
        s.put("mute", p.getBoolean("mute", true));
        s.put("cap", p.getBoolean("cap", true));
        s.put("lang", p.getString("lang", ""));
        r.put("settings", s);

        File f = DictationIME.transcriptFile(c);
        r.put("transcriptBytes", f.exists() ? f.length() : 0);
        return r;
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(buildStatus());
    }

    @PluginMethod
    public void requestMic(PluginCall call) {
        if (hasMic()) { call.resolve(buildStatus()); return; }
        requestPermissionForAlias("microphone", call, "micResult");
    }

    @PermissionCallback
    private void micResult(PluginCall call) {
        call.resolve(buildStatus());
    }

    @PluginMethod
    public void openKeyboardSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open keyboard settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            i.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open app settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void showPicker(PluginCall call) {
        InputMethodManager imm = (InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
        if (imm == null) { call.reject("No input method service"); return; }
        getActivity().runOnUiThread(() -> {
            imm.showInputMethodPicker();
            call.resolve();
        });
    }

    @PluginMethod
    public void setSettings(PluginCall call) {
        SharedPreferences.Editor e = prefs().edit();
        String engine = call.getString("engine");
        if (engine != null) e.putString("engine", engine);
        Boolean live = call.getBoolean("live");
        if (live != null) e.putBoolean("live", live);
        Boolean mute = call.getBoolean("mute");
        if (mute != null) e.putBoolean("mute", mute);
        Boolean cap = call.getBoolean("cap");
        if (cap != null) e.putBoolean("cap", cap);
        String lang = call.getString("lang");
        if (lang != null) e.putString("lang", lang.trim());
        e.apply();
        call.resolve(buildStatus());
    }

    private String readTranscript() {
        File f = DictationIME.transcriptFile(getContext());
        if (!f.exists()) return "";
        try (FileInputStream in = new FileInputStream(f)) {
            byte[] b = new byte[(int) f.length()];
            int off = 0;
            while (off < b.length) {
                int n = in.read(b, off, b.length - off);
                if (n < 0) break;
                off += n;
            }
            return new String(b, 0, off, StandardCharsets.UTF_8).trim();
        } catch (Exception e) {
            return "";
        }
    }

    @PluginMethod
    public void transcript(PluginCall call) {
        JSObject r = new JSObject();
        r.put("text", readTranscript());
        call.resolve(r);
    }

    @PluginMethod
    public void copyTranscript(PluginCall call) {
        String text = call.getString("text");
        if (text == null) text = readTranscript();
        ClipboardManager cm = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm == null) { call.reject("No clipboard"); return; }
        cm.setPrimaryClip(ClipData.newPlainText("Dictation transcript", text));
        call.resolve();
    }

    @PluginMethod
    public void shareTranscript(PluginCall call) {
        String text = call.getString("text");
        if (text == null) text = readTranscript();
        try {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_SUBJECT, "Dictation transcript");
            send.putExtra(Intent.EXTRA_TEXT, text);
            Intent chooser = Intent.createChooser(send, "Send transcript");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("Share failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearTranscript(PluginCall call) {
        try (FileOutputStream out = new FileOutputStream(DictationIME.transcriptFile(getContext()), false)) {
            out.write(new byte[0]);
        } catch (Exception ignored) { }
        call.resolve(buildStatus());
    }
}
