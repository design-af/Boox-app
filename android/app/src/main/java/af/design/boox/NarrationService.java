package af.design.boox;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Plays a narration queue with TextToSpeech from a foreground service, so it keeps going with the
 * screen off. The page hands over the whole queue at once; this service never needs the WebView
 * while it plays. All state lives in static fields guarded by the main thread.
 */
public class NarrationService extends Service {

    public static final String ACTION_PLAY = "af.design.boox.narration.PLAY";
    public static final String ACTION_PAUSE = "af.design.boox.narration.PAUSE";
    public static final String ACTION_RESUME = "af.design.boox.narration.RESUME";
    public static final String ACTION_NEXT = "af.design.boox.narration.NEXT";
    public static final String ACTION_STOP = "af.design.boox.narration.STOP";

    private static final String CHANNEL = "narration";
    private static final int NOTE_ID = 4101;

    public static class Item {
        final String text, label;
        final int pause;
        Item(String text, int pause, String label) { this.text = text; this.pause = pause; this.label = label; }
    }

    public interface Listener { void onState(); }

    // ---- shared state (main thread only) ----
    static final List<Item> items = new ArrayList<>();
    static String session = "", title = "Narration", state = "stopped", error = "";
    static int index = 0;
    static float rate = 1.0f;
    static Listener listener;
    static NarrationService instance;

    private final Handler main = new Handler(Looper.getMainLooper());
    private TextToSpeech tts;
    private boolean ready = false, pendingPlay = false;
    private int gen = 0;
    private PowerManager.WakeLock wake;

    static void send(Context ctx, String action) {
        Intent i = new Intent(ctx, NarrationService.class).setAction(action);
        if (ACTION_PLAY.equals(action)) ContextCompat.startForegroundService(ctx, i);
        else if (instance != null) ctx.startService(i);
    }

    static void notifyState() {
        if (listener != null) listener.onState();
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AFSBoox:narration");
        wake.setReferenceCounted(false);
        tts = new TextToSpeech(getApplicationContext(), status -> main.post(() -> onTtsInit(status)));
    }

    private void onTtsInit(int status) {
        if (status != TextToSpeech.SUCCESS) {
            fail("no-engine");
            return;
        }
        int lang = tts.setLanguage(Locale.US);
        if (lang == TextToSpeech.LANG_MISSING_DATA || lang == TextToSpeech.LANG_NOT_SUPPORTED) {
            lang = tts.setLanguage(Locale.getDefault());
            if (lang == TextToSpeech.LANG_MISSING_DATA || lang == TextToSpeech.LANG_NOT_SUPPORTED) {
                fail("no-voice");
                return;
            }
        }
        tts.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build());
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) { main.post(() -> onUttStart(id)); }
            @Override public void onDone(String id) { main.post(() -> onUttDone(id)); }
            @Override public void onError(String id) { main.post(() -> onUttDone(id)); }
            @Override public void onStop(String id, boolean interrupted) { /* pause/seek handle state */ }
        });
        ready = true;
        if (pendingPlay) { pendingPlay = false; playFrom(index); }
    }

    private void fail(String why) {
        error = why;
        state = "error";
        releaseWake();
        notifyState();
        stopForegroundCompat();
        stopSelf();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        // Always promote first: startForegroundService requires it within a few seconds.
        startForegroundCompat();
        if (action == null) action = ACTION_STOP;
        switch (action) {
            case ACTION_PLAY:
                error = "";
                if (ready) playFrom(index); else pendingPlay = true;
                break;
            case ACTION_PAUSE: pause(); break;
            case ACTION_RESUME: resume(); break;
            case ACTION_NEXT: seek(index + 1); break;
            default: stopAll(); break;
        }
        return START_NOT_STICKY;
    }

    // ---- playback ----
    void playFrom(int i) {
        gen++;
        if (tts != null) tts.stop();
        if (i >= items.size()) { finish(); return; }
        index = Math.max(0, i);
        state = "playing";
        acquireWake();
        tts.setSpeechRate(rate);
        String g = Integer.toString(gen);
        for (int k = index; k < items.size(); k++) {
            Item it = items.get(k);
            Bundle p = new Bundle();
            tts.speak(it.text, TextToSpeech.QUEUE_ADD, p, "u:" + g + ":" + k);
            if (it.pause > 0) tts.playSilentUtterance(it.pause, TextToSpeech.QUEUE_ADD, "s:" + g + ":" + k);
        }
        updateNotification();
        notifyState();
    }

    private int[] parse(String id) {
        try {
            String[] p = id.split(":");
            return new int[] { p[0].equals("u") ? 0 : 1, Integer.parseInt(p[1]), Integer.parseInt(p[2]) };
        } catch (Exception e) { return null; }
    }

    private void onUttStart(String id) {
        int[] u = parse(id);
        if (u == null || u[1] != gen || u[0] != 0 || !"playing".equals(state)) return;
        if (u[2] != index) {
            String before = labelAt(index);
            index = u[2];
            if (!before.equals(labelAt(index))) updateNotification();
        }
        notifyState();
    }

    private void onUttDone(String id) {
        int[] u = parse(id);
        if (u == null || u[1] != gen || !"playing".equals(state)) return;
        int k = u[2];
        if (k != items.size() - 1) return;
        boolean last = u[0] == 1 || items.get(k).pause <= 0;
        if (last) finish();
    }

    private void finish() {
        gen++;
        state = "done";
        index = Math.max(0, items.size() - 1);
        releaseWake();
        notifyState();
        stopForegroundCompat();
        stopSelf();
    }

    void pause() {
        if (!"playing".equals(state)) return;
        gen++;
        tts.stop();
        state = "paused";
        releaseWake();
        updateNotification();
        notifyState();
    }

    void resume() {
        if (!"paused".equals(state)) return;
        if (ready) playFrom(index); else { state = "playing"; pendingPlay = true; }
    }

    void seek(int i) {
        if (items.isEmpty()) return;
        i = Math.max(0, Math.min(items.size() - 1, i));
        if ("playing".equals(state)) playFrom(i);
        else { index = i; updateNotification(); notifyState(); }
    }

    void applyRate() {
        if ("playing".equals(state)) playFrom(index);
    }

    void stopAll() {
        gen++;
        if (tts != null) tts.stop();
        state = "stopped";
        releaseWake();
        notifyState();
        stopForegroundCompat();
        stopSelf();
    }

    private String labelAt(int i) {
        if (i < 0 || i >= items.size()) return "";
        String l = items.get(i).label;
        return l == null ? "" : l;
    }

    // ---- foreground notification ----
    private void ensureChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL, "Narration", NotificationManager.IMPORTANCE_LOW);
                ch.setDescription("Shows while ARE Prep Tools is reading aloud");
                ch.setShowBadge(false);
                nm.createNotificationChannel(ch);
            }
        }
    }

    private PendingIntent action(String a, int code) {
        Intent i = new Intent(this, NarrationService.class).setAction(a);
        return PendingIntent.getService(this, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private Notification build() {
        ensureChannel();
        Intent open = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        boolean playing = "playing".equals(state);
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText((playing ? "" : "Paused · ") + labelAt(index))
                .setContentIntent(content)
                .setOngoing(playing)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .addAction(0, playing ? "Pause" : "Resume", action(playing ? ACTION_PAUSE : ACTION_RESUME, 1))
                .addAction(0, "Next", action(ACTION_NEXT, 2))
                .addAction(0, "Stop", action(ACTION_STOP, 3));
        return b.build();
    }

    private void startForegroundCompat() {
        int type = Build.VERSION.SDK_INT >= 29 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0;
        ServiceCompat.startForeground(this, NOTE_ID, build(), type);
    }

    private void updateNotification() {
        if (instance == null || "stopped".equals(state) || "done".equals(state)) return;
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            nm.notify(NOTE_ID, build());
        } catch (Exception ignored) { }
    }

    private void stopForegroundCompat() {
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
    }

    // ---- wake lock: keep the CPU up while speaking with the screen off ----
    private void acquireWake() {
        if (wake != null) wake.acquire(4 * 60 * 60 * 1000L);
    }

    private void releaseWake() {
        if (wake != null && wake.isHeld()) wake.release();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        stopAll();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        gen++;
        releaseWake();
        if (tts != null) { tts.stop(); tts.shutdown(); tts = null; }
        ready = false;
        if ("playing".equals(state) || "paused".equals(state)) { state = "stopped"; notifyState(); }
        instance = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
