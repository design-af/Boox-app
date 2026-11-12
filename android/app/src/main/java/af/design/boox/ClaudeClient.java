package af.design.boox;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Minimal Anthropic Messages API client for Dictation's Check and Key points. The API key and
 * model come from SharedPreferences "dictation" (set on the Dictation page). Call off the main thread.
 */
final class ClaudeClient {
    private ClaudeClient() { }

    static final String DEFAULT_MODEL = "claude-sonnet-5-5";

    static boolean hasKey(Context c) {
        return !c.getSharedPreferences(DictationStore.PREFS, Context.MODE_PRIVATE).getString("apiKey", "").trim().isEmpty();
    }

    /** Sends a request body (without model) and returns the raw JSON response. */
    static String send(Context c, String body) throws Exception {
        SharedPreferences p = c.getSharedPreferences(DictationStore.PREFS, Context.MODE_PRIVATE);
        String key = p.getString("apiKey", "").trim();
        if (key.isEmpty()) throw new Exception("Add a Claude API key on the Dictation page first");
        JSONObject req = new JSONObject(body);
        if (!req.has("model")) req.put("model", p.getString("model", DEFAULT_MODEL));
        if (!req.has("max_tokens")) req.put("max_tokens", 2000);

        HttpURLConnection con = (HttpURLConnection) new URL("https://api.anthropic.com/v1/messages").openConnection();
        con.setRequestMethod("POST");
        con.setConnectTimeout(20000);
        con.setReadTimeout(180000);
        con.setDoOutput(true);
        con.setRequestProperty("content-type", "application/json");
        con.setRequestProperty("x-api-key", key);
        con.setRequestProperty("anthropic-version", "2023-06-01");
        byte[] out = req.toString().getBytes(StandardCharsets.UTF_8);
        try (OutputStream os = con.getOutputStream()) {
            os.write(out);
        }
        int code = con.getResponseCode();
        InputStream in = code >= 400 ? con.getErrorStream() : con.getInputStream();
        String text = "";
        if (in != null) {
            try (InputStream s = in) {
                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                byte[] b = new byte[8192];
                int n;
                while ((n = s.read(b)) > 0) buf.write(b, 0, n);
                text = new String(buf.toByteArray(), StandardCharsets.UTF_8);
            }
        }
        con.disconnect();
        if (code >= 400) {
            String msg = "HTTP " + code;
            try {
                JSONObject e = new JSONObject(text).optJSONObject("error");
                if (e != null) msg = e.optString("message", msg);
            } catch (Exception ignored) { }
            if (code == 401) msg = "Claude API key was rejected (" + msg + ")";
            throw new Exception(msg);
        }
        return text;
    }
}
