package af.design.boox;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.nio.charset.StandardCharsets;

/**
 * Files for AFS Dictation, shared by the floating panel (DictationService) and the app page
 * (DictationPlugin). Everything lives in the app's private files/dictation/ folder:
 *   recordings/<id>.json  one recording each (format in public/tools/dictation/kbcore.js)
 *   state.json            { liveId, prepId }
 *   transcript.txt        plain backup of every phrase heard
 */
final class DictationStore {
    private DictationStore() { }

    static final String PREFS = "dictation";

    private static File base(Context c) {
        File d = new File(c.getFilesDir(), "dictation");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    private static File recDir(Context c) {
        File d = new File(base(c), "recordings");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    static boolean validId(String id) {
        return id != null && id.matches("[a-z0-9]{1,40}");
    }

    static File transcriptFile(Context c) {
        return new File(base(c), "transcript.txt");
    }

    static synchronized void appendTranscript(Context c, String s) {
        try (FileWriter w = new FileWriter(transcriptFile(c), true)) {
            w.write(s);
        } catch (Exception ignored) { }
    }

    static String read(File f) {
        if (f == null || !f.exists()) return null;
        try (FileInputStream in = new FileInputStream(f)) {
            byte[] b = new byte[(int) f.length()];
            int off = 0;
            while (off < b.length) {
                int n = in.read(b, off, b.length - off);
                if (n < 0) break;
                off += n;
            }
            return new String(b, 0, off, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    static synchronized boolean write(File f, String s) {
        File tmp = new File(f.getParentFile(), f.getName() + ".tmp");
        try (FileOutputStream out = new FileOutputStream(tmp, false)) {
            out.write(s.getBytes(StandardCharsets.UTF_8));
            out.getFD().sync();
        } catch (Exception e) {
            return false;
        }
        return tmp.renameTo(f) || (f.delete() && tmp.renameTo(f));
    }

    static String load(Context c, String id) {
        if (!validId(id)) return null;
        return read(new File(recDir(c), id + ".json"));
    }

    static boolean save(Context c, String id, String json) {
        if (!validId(id) || json == null) return false;
        return write(new File(recDir(c), id + ".json"), json);
    }

    static boolean delete(Context c, String id) {
        if (!validId(id)) return false;
        return new File(recDir(c), id + ".json").delete();
    }

    static String loadState(Context c) {
        String s = read(new File(base(c), "state.json"));
        return s == null ? "{}" : s;
    }

    static boolean saveState(Context c, String json) {
        return write(new File(base(c), "state.json"), json == null ? "{}" : json);
    }

    /** Library metadata, newest first is left to the page. */
    static String list(Context c) {
        JSONArray out = new JSONArray();
        File[] files = recDir(c).listFiles();
        if (files != null) {
            for (File f : files) {
                if (!f.getName().endsWith(".json")) continue;
                try {
                    JSONObject r = new JSONObject(read(f));
                    JSONObject m = new JSONObject();
                    m.put("id", r.optString("id"));
                    m.put("title", r.optString("title", ""));
                    m.put("created", r.optLong("created", f.lastModified()));
                    m.put("updated", r.optLong("updated", f.lastModified()));
                    m.put("pushed", r.optLong("pushed", 0));
                    m.put("hasSummary", r.optString("summary", "").trim().length() > 0);
                    int words = 0;
                    JSONArray ps = r.optJSONArray("phrases");
                    if (ps != null) {
                        for (int i = 0; i < ps.length(); i++) {
                            String raw = ps.optJSONObject(i) == null ? "" : ps.optJSONObject(i).optString("raw", "").trim();
                            if (!raw.isEmpty()) words += raw.split("\\s+").length;
                        }
                    }
                    m.put("words", words);
                    m.put("flags", r.optJSONArray("flags") == null ? 0 : r.optJSONArray("flags").length());
                    out.put(m);
                } catch (Exception ignored) { }
            }
        }
        return out.toString();
    }
}
