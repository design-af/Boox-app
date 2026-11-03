package af.design.boox;

import android.Manifest;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import android.util.DisplayMetrics;

import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * File access for the Template Maker tool. JS:
 *   Capacitor.nativePromise("TemplateFiles", "info")              // screen size, access, template folders
 *   Capacitor.nativePromise("TemplateFiles", "requestAllFiles")   // opens "All files access" settings
 *   Capacitor.nativePromise("TemplateFiles", "saveFile", { folder, filename, base64 })
 *   Capacitor.nativePromise("TemplateFiles", "saveToDownloads", { filename, base64, mime })
 *   Capacitor.nativePromise("TemplateFiles", "share", { filename, base64, mime })
 *   Capacitor.nativePromise("TemplateFiles", "openNotes")
 */
@CapacitorPlugin(
    name = "TemplateFiles",
    permissions = { @Permission(alias = "storage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }) }
)
public class TemplateFilesPlugin extends Plugin {

    /** Folder names Boox firmwares have used for custom note templates (checked first, in order). */
    private static final String[] KNOWN_FOLDERS = { "noteTemplate", "Notes/Templates", "note/template", "Note/Template" };
    private static final String[] NOTES_PACKAGES = { "com.onyx.android.note", "com.onyx.android.notes", "com.onyx" };

    private File root() {
        return Environment.getExternalStorageDirectory();
    }

    private boolean hasAllFiles() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) return Environment.isExternalStorageManager();
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
    }

    @PluginMethod
    public void info(PluginCall call) {
        DisplayMetrics m = new DisplayMetrics();
        getActivity().getWindowManager().getDefaultDisplay().getRealMetrics(m);
        JSObject r = new JSObject();
        r.put("width", Math.min(m.widthPixels, m.heightPixels));
        r.put("height", Math.max(m.widthPixels, m.heightPixels));
        r.put("xdpi", m.xdpi);
        r.put("ydpi", m.ydpi);
        r.put("sdk", Build.VERSION.SDK_INT);
        r.put("model", Build.MODEL);
        r.put("maker", Build.MANUFACTURER);
        r.put("allFiles", hasAllFiles());
        r.put("root", root().getAbsolutePath());
        r.put("notesApp", findNotesPackage() != null);

        JSArray folders = new JSArray();
        if (hasAllFiles()) {
            for (String path : templateFolders()) {
                JSObject f = new JSObject();
                f.put("path", path);
                File dir = new File(root(), path);
                String[] names = dir.list();
                f.put("files", names == null ? 0 : names.length);
                folders.put(f);
            }
        }
        r.put("folders", folders);
        call.resolve(r);
    }

    /** Existing template folders: known names first, then any folder named like "*template*" up to two levels deep. */
    private List<String> templateFolders() {
        Set<String> found = new LinkedHashSet<>();
        File base = root();
        for (String rel : KNOWN_FOLDERS) {
            if (new File(base, rel).isDirectory()) found.add(rel);
        }
        File[] top = base.listFiles();
        if (top != null) {
            for (File a : top) {
                if (!a.isDirectory() || a.getName().startsWith(".") || a.getName().equals("Android")) continue;
                if (a.getName().toLowerCase(Locale.ROOT).contains("template")) found.add(a.getName());
                File[] inner = a.listFiles();
                if (inner == null) continue;
                for (File b : inner) {
                    if (b.isDirectory() && b.getName().toLowerCase(Locale.ROOT).contains("template")) {
                        found.add(a.getName() + "/" + b.getName());
                    }
                }
            }
        }
        return new ArrayList<>(found);
    }

    @PluginMethod
    public void requestAllFiles(PluginCall call) {
        if (hasAllFiles()) {
            JSObject r = new JSObject();
            r.put("allFiles", true);
            call.resolve(r);
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Intent intent;
            try {
                intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
                startActivityForResult(call, intent, "allFilesResult");
            } catch (Exception e) {
                intent = new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                startActivityForResult(call, intent, "allFilesResult");
            }
        } else {
            requestPermissionForAlias("storage", call, "storageResult");
        }
    }

    @ActivityCallback
    private void allFilesResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject r = new JSObject();
        r.put("allFiles", hasAllFiles());
        call.resolve(r);
    }

    @PermissionCallback
    private void storageResult(PluginCall call) {
        JSObject r = new JSObject();
        r.put("allFiles", hasAllFiles());
        call.resolve(r);
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        String folder = call.getString("folder", "");
        String filename = cleanName(call.getString("filename", ""));
        String b64 = call.getString("base64");
        if (b64 == null || filename.isEmpty()) { call.reject("Missing file data"); return; }
        if (!hasAllFiles()) { call.reject("NO_ACCESS"); return; }
        try {
            File base = root().getCanonicalFile();
            File dir = folder.startsWith("/") ? new File(folder) : new File(base, folder);
            dir = dir.getCanonicalFile();
            if (!dir.getPath().startsWith(base.getPath())) { call.reject("Folder must be on the tablet's storage"); return; }
            if (!dir.isDirectory() && !dir.mkdirs()) { call.reject("Couldn't create " + dir.getPath()); return; }
            File out = new File(dir, filename);
            boolean existed = out.exists();
            try (FileOutputStream os = new FileOutputStream(out)) {
                os.write(Base64.decode(b64, Base64.DEFAULT));
            }
            JSObject r = new JSObject();
            r.put("path", out.getAbsolutePath());
            r.put("replaced", existed);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("Save failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String filename = cleanName(call.getString("filename", ""));
        String mime = call.getString("mime", "application/octet-stream");
        String b64 = call.getString("base64");
        if (b64 == null || filename.isEmpty()) { call.reject("Missing file data"); return; }
        byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
        String sub = "AFS Templates";
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues v = new ContentValues();
                v.put(MediaStore.Downloads.DISPLAY_NAME, filename);
                v.put(MediaStore.Downloads.MIME_TYPE, mime);
                v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + sub);
                Uri uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (uri == null) throw new IOException("Downloads is unavailable");
                try (OutputStream os = getContext().getContentResolver().openOutputStream(uri)) {
                    if (os == null) throw new IOException("Downloads is unavailable");
                    os.write(bytes);
                }
            } else {
                File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), sub);
                if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Couldn't create " + dir.getPath());
                try (FileOutputStream os = new FileOutputStream(new File(dir, filename))) { os.write(bytes); }
            }
            JSObject r = new JSObject();
            r.put("path", "Download/" + sub + "/" + filename);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("Save failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void share(PluginCall call) {
        String filename = cleanName(call.getString("filename", ""));
        String mime = call.getString("mime", "application/octet-stream");
        String b64 = call.getString("base64");
        if (b64 == null || filename.isEmpty()) { call.reject("Missing file data"); return; }
        try {
            File dir = new File(getContext().getCacheDir(), "share");
            if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Cache unavailable");
            File[] old = dir.listFiles();
            if (old != null) for (File f : old) //noinspection ResultOfMethodCallIgnored
                f.delete();
            File out = new File(dir, filename);
            try (FileOutputStream os = new FileOutputStream(out)) { os.write(Base64.decode(b64, Base64.DEFAULT)); }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", out);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(mime);
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.putExtra(Intent.EXTRA_TITLE, filename);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, "Send template");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("Share failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openNotes(PluginCall call) {
        String pkg = findNotesPackage();
        JSObject r = new JSObject();
        if (pkg == null) { r.put("opened", false); call.resolve(r); return; }
        Intent launch = getContext().getPackageManager().getLaunchIntentForPackage(pkg);
        if (launch == null) { r.put("opened", false); call.resolve(r); return; }
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(launch);
        r.put("opened", true);
        call.resolve(r);
    }

    private String findNotesPackage() {
        PackageManager pm = getContext().getPackageManager();
        for (String p : NOTES_PACKAGES) {
            if (pm.getLaunchIntentForPackage(p) != null) return p;
        }
        return null;
    }

    private static String cleanName(String name) {
        String n = name.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]+", " ").trim();
        while (n.startsWith(".")) n = n.substring(1);
        return n;
    }
}
