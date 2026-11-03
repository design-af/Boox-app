package af.design.boox;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.DisplayMetrics;

import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

/**
 * File access for the Template Maker tool. Templates live in one folder the app owns:
 * Documents/AFS Templates on internal storage. On Android 10+ that goes through MediaStore,
 * so no storage permission is needed. Import into Boox Notes from there.
 *
 * JS:
 *   Capacitor.nativePromise("TemplateFiles", "info")    // screen size + PPI, folder, saved files
 *   Capacitor.nativePromise("TemplateFiles", "save", { filename, base64, mime })   // replaces same name
 *   Capacitor.nativePromise("TemplateFiles", "share", { filename, base64, mime })
 */
@CapacitorPlugin(
    name = "TemplateFiles",
    permissions = { @Permission(alias = "storage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }) }
)
public class TemplateFilesPlugin extends Plugin {

    static final String FOLDER = "AFS Templates";
    private static final String RELATIVE = Environment.DIRECTORY_DOCUMENTS + "/" + FOLDER + "/";

    private static boolean useMediaStore() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q;
    }

    private static File legacyDir() {
        return new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS), FOLDER);
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
        r.put("folder", Environment.DIRECTORY_DOCUMENTS + "/" + FOLDER);
        JSArray files = new JSArray();
        try {
            for (String name : listFiles()) files.put(name);
        } catch (Exception ignored) { }
        r.put("files", files);
        call.resolve(r);
    }

    private java.util.List<String> listFiles() {
        java.util.List<String> out = new java.util.ArrayList<>();
        if (useMediaStore()) {
            Uri coll = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL);
            try (Cursor c = getContext().getContentResolver().query(coll,
                    new String[] { MediaStore.MediaColumns.DISPLAY_NAME },
                    MediaStore.MediaColumns.RELATIVE_PATH + "=?", new String[] { RELATIVE },
                    MediaStore.MediaColumns.DATE_MODIFIED + " DESC")) {
                while (c != null && c.moveToNext()) out.add(c.getString(0));
            }
        } else {
            File[] fs = legacyDir().listFiles();
            if (fs != null) for (File f : fs) if (f.isFile()) out.add(f.getName());
        }
        return out;
    }

    @PluginMethod
    public void save(PluginCall call) {
        if (!useMediaStore() && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            requestPermissionForAlias("storage", call, "storageResult");
            return;
        }
        doSave(call);
    }

    @PermissionCallback
    private void storageResult(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED) doSave(call);
        else call.reject("Storage permission was declined");
    }

    private void doSave(PluginCall call) {
        String filename = cleanName(call.getString("filename", ""));
        String mime = call.getString("mime", "application/octet-stream");
        String b64 = call.getString("base64");
        if (b64 == null || filename.isEmpty()) { call.reject("Missing file data"); return; }
        byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
        try {
            boolean replaced;
            if (useMediaStore()) {
                ContentResolver cr = getContext().getContentResolver();
                Uri coll = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL);
                Uri uri = null;
                try (Cursor c = cr.query(coll, new String[] { MediaStore.MediaColumns._ID },
                        MediaStore.MediaColumns.RELATIVE_PATH + "=? AND " + MediaStore.MediaColumns.DISPLAY_NAME + "=?",
                        new String[] { RELATIVE, filename }, null)) {
                    if (c != null && c.moveToFirst()) uri = ContentUris.withAppendedId(coll, c.getLong(0));
                }
                replaced = uri != null;
                if (uri == null) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                    v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
                    v.put(MediaStore.MediaColumns.RELATIVE_PATH, RELATIVE);
                    uri = cr.insert(coll, v);
                    if (uri == null) throw new IOException("Documents folder is unavailable");
                }
                try (OutputStream os = cr.openOutputStream(uri, "wt")) {
                    if (os == null) throw new IOException("Couldn't open the file for writing");
                    os.write(bytes);
                }
            } else {
                File dir = legacyDir();
                if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Couldn't create " + dir.getPath());
                File out = new File(dir, filename);
                replaced = out.exists();
                try (FileOutputStream os = new FileOutputStream(out)) { os.write(bytes); }
            }
            JSObject r = new JSObject();
            r.put("path", Environment.DIRECTORY_DOCUMENTS + "/" + FOLDER + "/" + filename);
            r.put("replaced", replaced);
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

    private static String cleanName(String name) {
        String n = name.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]+", " ").trim();
        while (n.startsWith(".")) n = n.substring(1);
        return n;
    }
}
