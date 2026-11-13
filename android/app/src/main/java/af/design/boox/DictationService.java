package af.design.boox;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import android.os.PowerManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.text.TextUtils;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;

/**
 * Aside Transcribe floating button. A foreground service (microphone) that draws a small draggable
 * bubble over every app; tapping it opens a compact panel (a WebView running
 * public/tools/dictation/panel.html) with Live / Prep / Library. The user's own keyboard keeps
 * working because neither window takes focus. Push goes through DictationAccessibility, or the
 * clipboard if that is off.
 *
 * Speech: SpeechRecognizer restarted after every phrase until Stop. Phrases go to the panel's JS,
 * which owns the recordings (saved through DictationStore).
 *
 * Bubble: tap = open/close panel, long-press = start/stop recording, drag = move.
 */
public class DictationService extends Service {

    static final String ACTION_SHOW = "af.design.boox.dictation.SHOW";
    static final String ACTION_CLOSE = "af.design.boox.dictation.CLOSE";
    static final String ACTION_TOGGLE = "af.design.boox.dictation.TOGGLE";
    private static final String CHANNEL = "dictation";
    private static final int NOTE_ID = 4711;

    static volatile DictationService instance;
    /** Speaker marking is switched off for now (see kbcore.js SPEAKERS). */
    static final boolean SPEAKER_DOUBLE_TAP = false;

    private final Handler main = new Handler(Looper.getMainLooper());
    private WindowManager wm;

    private AsideBubbleView bubble;
    private WindowManager.LayoutParams bubbleLp;
    private LinearLayout panel;
    private WindowManager.LayoutParams panelLp;
    private WebView web;
    private boolean panelOpen;
    private int imeTop = -1;          // top of the on-screen keyboard, from DictationAccessibility
    private long lastPartialAt;       // partials are throttled: each one redraws the e-ink screen
    private boolean speechActive;     // words heard since the last final result
    private boolean cutPending;       // Prep ▸ asked to finish the current sentence
    private final Runnable cutFallback = () -> { if (cutPending) { cutPending = false; js("KB.onCut()"); } };
    private final Runnable cutForce = () -> {
        // "this." because recognizer is declared further down (no forward reference by simple name).
        if (cutPending && this.recognizer != null) {
            try { this.recognizer.stopListening(); } catch (Exception ignored) { }
        }
    };
    private boolean jsReady;
    private final ArrayList<String> queued = new ArrayList<>();

    private SpeechRecognizer recognizer;
    private boolean running;
    private boolean usingDevice;
    private boolean deviceFailed;
    private long listenStartedAt;
    private int quickErrors;
    private final ArrayList<Integer> muted = new ArrayList<>();
    private final Runnable listenRunnable = this::listen;
    // Restarting the engine always goes through this one runnable, so restarts never pile up.
    private final Runnable restartRunnable = () -> { if (running) { createRecognizer(); listen(); } };
    private long lastEngineEvent;     // last sign of life from the speech engine
    private PowerManager.WakeLock wakeLock;
    private boolean wakeLockKeepsScreen;
    private BroadcastReceiver screenReceiver;
    /** Every 5 s while recording: a speech engine that has gone silent (e.g. after the tablet slept) is restarted. */
    private final Runnable watchdog = new Runnable() {
        @Override public void run() {
            if (!running) return;
            if (SystemClock.elapsedRealtime() - lastEngineEvent > 20000) {
                state("Speech engine went quiet \u2014 restarting");
                kick();
            }
            main.postDelayed(this, 5000);
        }
    };

    static boolean isRunning() { return instance != null; }

    static void show(Context c) {
        Intent i = new Intent(c, DictationService.class).setAction(ACTION_SHOW);
        ContextCompat.startForegroundService(c, i);
    }

    static void close(Context c) {
        if (instance != null) c.startService(new Intent(c, DictationService.class).setAction(ACTION_CLOSE));
    }

    // ---------------------------------------------------------------- service

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        wm = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        createChannel();
        // When the tablet wakes up, restart the engine straight away (it often dies during sleep).
        screenReceiver = new BroadcastReceiver() {
            @Override public void onReceive(Context c, Intent i) {
                if (!running) return;
                main.postDelayed(() -> { if (running) { state("Resumed after sleep"); kick(); } }, 800);
            }
        };
        IntentFilter f = new IntentFilter(Intent.ACTION_SCREEN_ON);
        f.addAction(Intent.ACTION_USER_PRESENT);
        try { ContextCompat.registerReceiver(this, screenReceiver, f, ContextCompat.RECEIVER_NOT_EXPORTED); } catch (Exception ignored) { }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!promote()) { stopSelf(); return START_NOT_STICKY; }
        String action = intent == null ? ACTION_SHOW : intent.getAction();
        if (ACTION_CLOSE.equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (ACTION_TOGGLE.equals(action)) {
            ensureOverlay();
            if (running) stopRec("Stopped"); else startRec();
            return START_NOT_STICKY;
        }
        ensureOverlay();
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        main.removeCallbacksAndMessages(null);
        destroyRecognizer();
        unmuteBeeps();
        releaseWake();
        try { if (screenReceiver != null) unregisterReceiver(screenReceiver); } catch (Exception ignored) { }
        try { if (bubble != null) wm.removeView(bubble); } catch (Exception ignored) { }
        try { if (panel != null) wm.removeView(panel); } catch (Exception ignored) { }
        if (web != null) { try { web.destroy(); } catch (Exception ignored) { } }
        bubble = null; panel = null; web = null;
        instance = null;
        super.onDestroy();
    }

    private boolean promote() {
        try {
            int type = 0;
            if (Build.VERSION.SDK_INT >= 30) type = ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
            ServiceCompat.startForeground(this, NOTE_ID, buildNote(), type);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null && nm.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL, "Aside Transcribe", NotificationManager.IMPORTANCE_LOW);
                ch.setDescription("Shows while the Aside Transcribe floating button is on");
                ch.setShowBadge(false);
                nm.createNotificationChannel(ch);
            }
        }
    }

    private PendingIntent action(String a, int code) {
        Intent i = new Intent(this, DictationService.class).setAction(a);
        return PendingIntent.getService(this, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private Notification buildNote() {
        Intent open = new Intent(this, MainActivity.class).putExtra("afsOpen", "tools/dictation/index.html");
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_aside)
                .setContentTitle(running ? "Aside Transcribe \u2014 recording" : "Aside Transcribe")
                .setContentText(running ? "Listening. Tap the floating button for Live / Prep / Push." : "Floating button is on. Long-press it to record.")
                .setContentIntent(content)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .addAction(0, running ? "Stop recording" : "Record", action(ACTION_TOGGLE, 1))
                .addAction(0, "Close button", action(ACTION_CLOSE, 2))
                .build();
    }

    private void updateNote() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            try { nm.notify(NOTE_ID, buildNote()); } catch (Exception ignored) { }
        }
    }

    // ---------------------------------------------------------------- overlay

    private SharedPreferences prefs() {
        return getSharedPreferences(DictationStore.PREFS, Context.MODE_PRIVATE);
    }

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private static int overlayType() {
        return Build.VERSION.SDK_INT >= 26 ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
    }

    private DisplayMetrics screen() {
        DisplayMetrics m = new DisplayMetrics();
        wm.getDefaultDisplay().getRealMetrics(m);
        return m;
    }

    private void ensureOverlay() {
        if (bubble != null) return;
        if (Build.VERSION.SDK_INT >= 23 && !Settings.canDrawOverlays(this)) {
            stopSelf();
            return;
        }
        buildPanel();
        buildBubble();
    }

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface", "ClickableViewAccessibility"})
    private void buildPanel() {
        panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.WHITE);
        bg.setStroke(dp(3), Color.BLACK);
        panel.setBackground(bg);
        panel.setPadding(dp(3), 0, dp(3), dp(3));

        // Grip: drag to move the panel, tap to switch between small (1/3) and large (2/3).
        TextView grip = new TextView(this);
        grip.setText("Aside Transcribe  \u00B7  drag  \u00B7  tap to resize");
        grip.setCompoundDrawablesRelativeWithIntrinsicBounds(R.drawable.ic_aside, 0, 0, 0);
        grip.setCompoundDrawablePadding(dp(6));
        grip.setPadding(dp(10), 0, dp(10), 0);
        grip.setGravity(Gravity.CENTER);
        grip.setTextColor(Color.WHITE);
        grip.setBackgroundColor(Color.BLACK);
        grip.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        grip.setTypeface(Typeface.DEFAULT_BOLD);
        grip.setSingleLine(true);
        panel.addView(grip, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(34)));
        final float slop = dp(8);
        grip.setOnTouchListener(new View.OnTouchListener() {
            float downX, downY;
            int startX, startY;
            boolean dragging;

            @Override
            public boolean onTouch(View v, MotionEvent e) {
                switch (e.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        downX = e.getRawX(); downY = e.getRawY();
                        startX = panelLp.x; startY = panelLp.y;
                        dragging = false;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx = e.getRawX() - downX, dy = e.getRawY() - downY;
                        if (!dragging && Math.hypot(dx, dy) > slop) dragging = true;
                        if (dragging) {
                            DisplayMetrics m = screen();
                            panelLp.x = clamp(startX + Math.round(dx), 0, m.widthPixels - panelLp.width);
                            panelLp.y = clamp(startY + Math.round(dy), 0, m.heightPixels - panelLp.height);
                            try { wm.updateViewLayout(panel, panelLp); } catch (Exception ignored) { }
                        }
                        return true;
                    case MotionEvent.ACTION_UP:
                        if (dragging) {
                            prefs().edit().putInt("panelX", panelLp.x).putInt("panelY", panelLp.y).apply();
                        } else {
                            prefs().edit().putBoolean("panelBig", !prefs().getBoolean("panelBig", false)).apply();
                            layoutPanel();
                        }
                        return true;
                }
                return false;
            }
        });

        web = new WebView(this);
        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setTextZoom(100);
        web.setBackgroundColor(Color.WHITE);
        web.setVerticalScrollBarEnabled(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(new Bridge(), "AFSPanel");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true; // the panel never navigates
            }
        });
        panel.addView(web, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));

        panelLp = new WindowManager.LayoutParams(1, 1, overlayType(),
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                        | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                PixelFormat.TRANSLUCENT);
        panelLp.alpha = 0f;
        panelLp.gravity = Gravity.TOP | Gravity.START;
        wm.addView(panel, panelLp);
        web.loadUrl("file:///android_asset/public/tools/dictation/panel.html");
    }

    private static int clamp(int v, int lo, int hi) {
        return Math.max(lo, Math.min(v, Math.max(lo, hi)));
    }

    /** Called by DictationAccessibility when the on-screen keyboard appears, moves or hides. */
    void onImeBounds(int top) {
        main.post(() -> {
            if (top == imeTop) return;
            imeTop = top;
            if (panelOpen) layoutPanel();
            placeBubble();
        });
    }

    private void layoutPanel() {
        if (panel == null) return;
        if (panelOpen) {
            DisplayMetrics m = screen();
            boolean big = prefs().getBoolean("panelBig", false);
            int w = m.widthPixels * (big ? 2 : 1) / 3;
            int h = m.heightPixels * (big ? 2 : 1) / 3;
            w = Math.min(m.widthPixels, Math.max(w, dp(300)));
            h = Math.min(m.heightPixels, Math.max(h, dp(300)));
            int x = prefs().getInt("panelX", m.widthPixels - w - dp(16));
            int y = prefs().getInt("panelY", dp(72));
            x = clamp(x, 0, m.widthPixels - w);
            y = clamp(y, 0, m.heightPixels - h);
            // The keyboard is always drawn above floating windows, so keep clear of it.
            if (imeTop > 0 && y + h > imeTop - dp(6)) {
                int room = imeTop - dp(12);
                if (h > room) h = Math.max(dp(220), room);
                y = clamp(imeTop - h - dp(6), 0, m.heightPixels - h);
            }
            panelLp.width = w;
            panelLp.height = h;
            panelLp.x = x;
            panelLp.y = y;
            panelLp.alpha = 1f;
            panelLp.flags &= ~WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
        } else {
            // Kept attached (so the panel keeps receiving phrases) but invisible and untouchable.
            panelLp.width = 1;
            panelLp.height = 1;
            panelLp.alpha = 0f;
            panelLp.flags |= WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
        }
        try { wm.updateViewLayout(panel, panelLp); } catch (Exception ignored) { }
        js("KB.onPanel(" + panelOpen + ")");
    }

    private void setPanelOpen(boolean open) {
        panelOpen = open;
        if (!open) setPanelFocusable(false);
        layoutPanel();
        styleBubble();
    }

    @SuppressLint("ClickableViewAccessibility")
    private void buildBubble() {
        bubble = new AsideBubbleView(this);
        int size = dp(66);
        DisplayMetrics m = screen();
        bubbleLp = new WindowManager.LayoutParams(size, size, overlayType(),
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT);
        bubbleLp.gravity = Gravity.TOP | Gravity.START;
        bubbleLp.x = prefs().getInt("bubbleX", m.widthPixels - size - dp(12));
        bubbleLp.y = prefs().getInt("bubbleY", m.heightPixels * 2 / 5);
        bubbleLp.x = Math.max(0, Math.min(bubbleLp.x, m.widthPixels - size));
        bubbleLp.y = Math.max(0, Math.min(bubbleLp.y, m.heightPixels - size));
        DictationAccessibility a = DictationAccessibility.instance;
        if (a != null) imeTop = a.imeTop();
        avoidIme();
        styleBubble();

        final float slop = dp(10);
        bubble.setOnTouchListener(new View.OnTouchListener() {
            float downX, downY;
            int startX, startY;
            boolean dragging, longFired;
            final Runnable longPress = () -> {
                longFired = true;
                if (running) stopRec("Stopped"); else startRec();
            };

            @Override
            public boolean onTouch(View v, MotionEvent e) {
                switch (e.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        downX = e.getRawX(); downY = e.getRawY();
                        startX = bubbleLp.x; startY = bubbleLp.y;
                        dragging = false; longFired = false;
                        main.postDelayed(longPress, 650);
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx = e.getRawX() - downX, dy = e.getRawY() - downY;
                        if (!dragging && Math.hypot(dx, dy) > slop) { dragging = true; main.removeCallbacks(longPress); }
                        if (dragging) {
                            bubbleLp.x = startX + Math.round(dx);
                            bubbleLp.y = startY + Math.round(dy);
                            try { wm.updateViewLayout(bubble, bubbleLp); } catch (Exception ignored) { }
                        }
                        return true;
                    case MotionEvent.ACTION_UP:
                        main.removeCallbacks(longPress);
                        if (dragging) {
                            prefs().edit().putInt("bubbleX", bubbleLp.x).putInt("bubbleY", bubbleLp.y).apply();
                        } else if (!longFired) {
                            // Double-tap = a new speaker started (speaker unknown); single tap = panel.
                            // Speaker marking is off for now, so a tap opens the panel straight away.
                            long now = SystemClock.uptimeMillis();
                            if (!SPEAKER_DOUBLE_TAP) {
                                setPanelOpen(!panelOpen);
                            } else if (now - lastTapAt < 320) {
                                lastTapAt = 0;
                                main.removeCallbacks(singleTap);
                                onBubbleDoubleTap();
                            } else {
                                lastTapAt = now;
                                main.postDelayed(singleTap, 320);
                            }
                        }
                        return true;
                    case MotionEvent.ACTION_CANCEL:
                        main.removeCallbacks(longPress);
                        return true;
                }
                return false;
            }
        });
        wm.addView(bubble, bubbleLp);
    }

    /** Saved bubble position, nudged above the keyboard while it is showing. */
    private void avoidIme() {
        if (bubbleLp == null) return;
        DisplayMetrics m = screen();
        int size = bubbleLp.height;
        int y = clamp(prefs().getInt("bubbleY", m.heightPixels * 2 / 5), 0, m.heightPixels - size);
        if (imeTop > 0 && y + size > imeTop - dp(6)) y = Math.max(0, imeTop - size - dp(10));
        bubbleLp.y = y;
    }

    private void placeBubble() {
        if (bubble == null) return;
        avoidIme();
        try { if (bubble.isAttachedToWindow()) wm.updateViewLayout(bubble, bubbleLp); } catch (Exception ignored) { }
    }

    private long lastTapAt;
    private final Runnable singleTap = () -> setPanelOpen(!panelOpen);

    private void onBubbleDoubleTap() {
        if (!running) {
            android.widget.Toast.makeText(this, "Not recording", android.widget.Toast.LENGTH_SHORT).show();
            return;
        }
        js("KB.onSpeakerMark()");
        if (bubble != null) bubble.setBadge("?");
        android.widget.Toast.makeText(this, "New speaker marked", android.widget.Toast.LENGTH_SHORT).show();
    }

    /** While a rename field is open the panel takes typing focus; otherwise the app below keeps it. */
    private void setPanelFocusable(boolean on) {
        if (panelLp == null || panel == null) return;
        boolean was = (panelLp.flags & WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE) == 0;
        if (was == on) return;
        if (on) panelLp.flags &= ~WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
        else panelLp.flags |= WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
        try { wm.updateViewLayout(panel, panelLp); } catch (Exception ignored) { }
    }

    private void styleBubble() {
        if (bubble == null) return;
        bubble.setState(running, panelOpen);
        if (bubbleLp != null) {
            if (running) bubbleLp.flags |= WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON;
            else bubbleLp.flags &= ~WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON;
            try { if (bubble.isAttachedToWindow()) wm.updateViewLayout(bubble, bubbleLp); } catch (Exception ignored) { }
        }
    }

    private void js(String code) {
        main.post(() -> {
            if (web != null) {
                try { web.evaluateJavascript("window.KB&&" + code, null); } catch (Exception ignored) { }
            }
        });
    }

    private void state(String status) {
        js("KB.onState(" + running + "," + JSONObject.quote(status) + ")");
    }

    private void openApp(String page) {
        try {
            Intent i = new Intent(this, MainActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            if (page != null && !page.isEmpty()) i.putExtra("afsOpen", page);
            startActivity(i);
        } catch (Exception ignored) { }
    }

    // ---------------------------------------------------------------- JS bridge

    private class Bridge {
        @JavascriptInterface public void ready() {
            main.post(() -> {
                jsReady = true;
                for (String q : queued) js("KB.onPhrase(" + JSONObject.quote(q) + ")");
                queued.clear();
                state(running ? "Listening" : "");
                js("KB.onPanel(" + panelOpen + ")");
            });
        }
        @JavascriptInterface public void start() { main.post(DictationService.this::startRec); }
        @JavascriptInterface public void stop() { main.post(() -> stopRec("Stopped")); }
        /**
         * Prep: let the sentence being spoken end naturally (the recogniser closes the phrase at
         * the speaker's pause), then KB.onCut() follows that phrase. If they keep talking, the
         * phrase is closed after 12 s; KB.onCut() is sent regardless after 18 s.
         */
        @JavascriptInterface public void cut() {
            main.post(() -> {
                if (running && recognizer != null && speechActive) {
                    cutPending = true;
                    main.removeCallbacks(cutForce);
                    main.removeCallbacks(cutFallback);
                    main.postDelayed(cutForce, 12000);
                    main.postDelayed(cutFallback, 18000);
                } else {
                    js("KB.onCut()");
                    if (running && SystemClock.elapsedRealtime() - lastEngineEvent > 8000) kick();
                }
            });
        }
        @JavascriptInterface public void remove(String id) { DictationStore.delete(DictationService.this, id); }
        @JavascriptInterface public void collapse() { main.post(() -> setPanelOpen(false)); }
        @JavascriptInterface public void setBadge(String b) { main.post(() -> { if (bubble != null) bubble.setBadge(b); }); }
        @JavascriptInterface public void setFocusable(boolean on) { main.post(() -> setPanelFocusable(on)); }
        @JavascriptInterface public void quit() { main.post(DictationService.this::stopSelf); }
        @JavascriptInterface public void openApp(String page) { main.post(() -> { setPanelOpen(false); DictationService.this.openApp(page); }); }

        @JavascriptInterface public void push(String text) {
            main.post(() -> {
                String result;
                String diag = "";
                DictationAccessibility a = DictationAccessibility.instance;
                if (a != null) {
                    try { result = a.insert(text); } catch (Exception e) { result = "nofield"; a.lastDiag = String.valueOf(e.getMessage()); }
                    diag = a.lastDiag == null ? "" : a.lastDiag;
                } else result = "noservice";
                if (!"pasted".equals(result) && !"set".equals(result)) {
                    android.content.ClipboardManager cm = (android.content.ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    if (cm != null) {
                        try { cm.setPrimaryClip(android.content.ClipData.newPlainText("Aside Transcribe", text)); result = result + "+copied"; } catch (Exception ignored) { }
                    }
                }
                js("KB.onPushed(" + JSONObject.quote(result) + "," + JSONObject.quote(diag) + ")");
            });
        }

        @JavascriptInterface public String list() { return DictationStore.list(DictationService.this); }
        @JavascriptInterface public String load(String id) { String s = DictationStore.load(DictationService.this, id); return s == null ? "" : s; }
        @JavascriptInterface public boolean save(String id, String json) { return DictationStore.save(DictationService.this, id, json); }
        @JavascriptInterface public String groups() { return DictationStore.loadGroups(DictationService.this); }
        @JavascriptInterface public boolean saveGroups(String json) { return DictationStore.saveGroups(DictationService.this, json); }
        @JavascriptInterface public String loadState() { return DictationStore.loadState(DictationService.this); }
        @JavascriptInterface public boolean saveState(String json) { return DictationStore.saveState(DictationService.this, json); }

        @JavascriptInterface public String settings() {
            SharedPreferences p = prefs();
            JSONObject o = new JSONObject();
            try {
                o.put("cap", p.getBoolean("cap", true));
                o.put("autoPeriod", p.getBoolean("autoPeriod", true));
                o.put("hasKey", ClaudeClient.hasKey(DictationService.this));
                o.put("context", p.getString("context", ""));
                o.put("accessibility", DictationAccessibility.isOn());
            } catch (Exception ignored) { }
            return o.toString();
        }

        @JavascriptInterface public void claude(String id, String body) {
            new Thread(() -> {
                String code;
                try {
                    String res = ClaudeClient.send(DictationService.this, body);
                    code = "KB.onClaude(" + JSONObject.quote(id) + ",true," + JSONObject.quote(res) + ")";
                } catch (Exception e) {
                    code = "KB.onClaude(" + JSONObject.quote(id) + ",false," + JSONObject.quote(String.valueOf(e.getMessage())) + ")";
                }
                js(code);
            }).start();
        }
    }

    // ---------------------------------------------------------------- recording

    private boolean hasMic() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private void startRec() {
        if (running) return;
        if (!hasMic()) {
            state("Microphone not allowed — opening setup");
            openApp("tools/dictation/index.html");
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            state("No speech engine on this device — see Dictation setup");
            return;
        }
        running = true;
        quickErrors = 0;
        deviceFailed = false;
        if (prefs().getBoolean("mute", true)) muteBeeps();
        DictationStore.appendTranscript(this, "\n\n— " + new SimpleDateFormat("EEE d MMM yyyy, h:mm a", Locale.getDefault()).format(new Date()) + " —\n");
        acquireWake();
        createRecognizer();
        styleBubble();
        updateNote();
        state("Starting…");
        listen();
        main.removeCallbacks(watchdog);
        main.postDelayed(watchdog, 5000);
    }

    /** Throw the engine away and start listening again now. */
    private void kick() {
        if (!running) return;
        main.removeCallbacks(listenRunnable);
        main.removeCallbacks(restartRunnable);
        quickErrors = 0;
        speechActive = false;
        lastEngineEvent = SystemClock.elapsedRealtime();
        createRecognizer();
        listen();
    }

    /** Keeps the processor running while recording, so transcription can carry on with the screen off. */
    private void acquireWake() {
        try {
            boolean keepAwake = prefs().getBoolean("keepAwake", true);
            if (wakeLock != null && wakeLockKeepsScreen != keepAwake) { releaseWake(); wakeLock = null; }
            if (wakeLock == null) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                // Screen lock: the tablet doesn't sleep or show its screensaver while recording.
                // (Deprecated flag, still honoured; the window flag alone is ignored by the Boox screensaver.)
                @SuppressWarnings("deprecation")
                int level = keepAwake ? PowerManager.SCREEN_DIM_WAKE_LOCK : PowerManager.PARTIAL_WAKE_LOCK;
                wakeLock = pm.newWakeLock(level, "AsideTranscribe:recording");
                wakeLock.setReferenceCounted(false);
                wakeLockKeepsScreen = keepAwake;
            }
            wakeLock.acquire(6L * 60 * 60 * 1000);
        } catch (Exception ignored) { }
    }

    private void releaseWake() {
        try { if (wakeLock != null && wakeLock.isHeld()) wakeLock.release(); } catch (Exception ignored) { }
    }

    private void stopRec(String why) {
        boolean was = running;
        running = false;
        speechActive = false;
        if (cutPending) {
            cutPending = false;
            main.removeCallbacks(cutFallback);
            main.removeCallbacks(cutForce);
            js("KB.onCut()");
        }
        main.removeCallbacks(listenRunnable);
        main.removeCallbacks(restartRunnable);
        main.removeCallbacks(watchdog);
        if (recognizer != null) {
            try { recognizer.cancel(); } catch (Exception ignored) { }
        }
        destroyRecognizer();
        unmuteBeeps();
        releaseWake();
        styleBubble();
        if (was) updateNote();
        state(why);
    }

    private void createRecognizer() {
        destroyRecognizer();
        String engine = prefs().getString("engine", "auto");
        boolean deviceOk = false;
        if (Build.VERSION.SDK_INT >= 31 && !deviceFailed && !"online".equals(engine)) {
            try { deviceOk = SpeechRecognizer.isOnDeviceRecognitionAvailable(this); } catch (Exception ignored) { }
        }
        try {
            if (deviceOk && Build.VERSION.SDK_INT >= 31) {
                recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(this);
                usingDevice = true;
            } else {
                recognizer = SpeechRecognizer.createSpeechRecognizer(this);
                usingDevice = false;
            }
            recognizer.setRecognitionListener(listener);
        } catch (Exception e) {
            recognizer = null;
            state("Could not start speech engine: " + e.getMessage());
        }
    }

    private void destroyRecognizer() {
        if (recognizer != null) {
            try { recognizer.destroy(); } catch (Exception ignored) { }
            recognizer = null;
        }
    }

    private void listen() {
        if (!running) return;
        if (recognizer == null) createRecognizer();
        if (recognizer == null) { retry(2000, true); return; }
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
        String lang = prefs().getString("lang", "");
        if (TextUtils.isEmpty(lang)) lang = Locale.getDefault().toLanguageTag();
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 15000L);
        if (Build.VERSION.SDK_INT >= 33) i.putExtra("android.speech.extra.ENABLE_FORMATTING", "quality");
        listenStartedAt = SystemClock.elapsedRealtime();
        lastEngineEvent = listenStartedAt;
        speechActive = false;
        try {
            recognizer.startListening(i);
        } catch (Exception e) {
            retry(800, true);
        }
    }

    private void retry(long baseDelay, boolean recreate) {
        if (!running) return;
        long sinceStart = SystemClock.elapsedRealtime() - listenStartedAt;
        if (sinceStart < 1500) quickErrors = Math.min(quickErrors + 1, 6); else quickErrors = 0;
        long delay = baseDelay + quickErrors * 600L;
        main.removeCallbacks(listenRunnable);
        main.removeCallbacks(restartRunnable);
        if (recreate) main.postDelayed(restartRunnable, delay);
        else main.postDelayed(listenRunnable, delay);
    }

    private void deliverPhrase(Bundle b) {
        if (b == null) return;
        ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (r == null || r.isEmpty() || r.get(0) == null || r.get(0).trim().isEmpty()) return;
        float[] conf = b.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES);
        try {
            JSONObject o = new JSONObject();
            o.put("text", r.get(0).trim());
            JSONArray alts = new JSONArray();
            for (int k = 1; k < r.size(); k++) if (r.get(k) != null) alts.put(r.get(k));
            o.put("alts", alts);
            o.put("conf", conf != null && conf.length > 0 ? (double) conf[0] : -1.0);
            String json = o.toString();
            DictationStore.appendTranscript(this, r.get(0).trim() + " ");
            if (jsReady) js("KB.onPhrase(" + JSONObject.quote(json) + ")");
            else queued.add(json);
        } catch (Exception ignored) { }
    }

    private final RecognitionListener listener = new RecognitionListener() {
        @Override public void onReadyForSpeech(Bundle params) {
            lastEngineEvent = SystemClock.elapsedRealtime();
            if (running) state("Listening" + (usingDevice ? " (on-device)" : ""));
        }
        @Override public void onBeginningOfSpeech() { speechActive = true; lastEngineEvent = SystemClock.elapsedRealtime(); }
        @Override public void onRmsChanged(float rmsdB) { lastEngineEvent = SystemClock.elapsedRealtime(); }
        @Override public void onBufferReceived(byte[] buffer) { }
        @Override public void onEndOfSpeech() { }
        @Override public void onEvent(int eventType, Bundle params) { }

        @Override public void onPartialResults(Bundle b) {
            if (!running || b == null) return;
            speechActive = true;
            lastEngineEvent = SystemClock.elapsedRealtime();
            if (!panelOpen) return;
            long now = SystemClock.elapsedRealtime();
            if (now - lastPartialAt < 700) return;
            lastPartialAt = now;
            ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (r != null && !r.isEmpty() && r.get(0) != null) js("KB.onPartial(" + JSONObject.quote(r.get(0)) + ")");
        }

        @Override public void onResults(Bundle b) {
            lastEngineEvent = SystemClock.elapsedRealtime();
            deliverPhrase(b);
            speechActive = false;
            if (cutPending) {
                cutPending = false;
                main.removeCallbacks(cutFallback);
                main.removeCallbacks(cutForce);
                js("KB.onCut()");
            }
            js("KB.onPartial(\"\")");
            quickErrors = 0;
            if (running) {
                main.removeCallbacks(listenRunnable);
                main.postDelayed(listenRunnable, 60);
            }
        }

        @Override public void onError(int error) {
            lastEngineEvent = SystemClock.elapsedRealtime();
            speechActive = false;
            if (cutPending) {
                cutPending = false;
                main.removeCallbacks(cutFallback);
                main.removeCallbacks(cutForce);
                js("KB.onCut()");
            }
            if (!running) return;
            js("KB.onPartial(\"\")");
            switch (error) {
                case 6: // SPEECH_TIMEOUT
                case 7: // NO_MATCH
                    retry(100, false);
                    break;
                case 9: // INSUFFICIENT_PERMISSIONS
                    // The speech engine refuses the microphone while the tablet sleeps (screensaver).
                    // Only a real missing permission stops recording; otherwise wait and retry, and
                    // the screen-on handler restarts it as soon as the tablet wakes.
                    if (!hasMic()) { stopRec("Microphone not allowed - open AFS Custom Boox, Aside Transcribe, Setup"); break; }
                    state("Paused while the tablet sleeps - resumes when it wakes");
                    retry(3000, true);
                    break;
                case 12: // LANGUAGE_NOT_SUPPORTED
                case 13: // LANGUAGE_UNAVAILABLE
                    if (usingDevice) {
                        deviceFailed = true;
                        state("On-device engine lacks this language — using online");
                        retry(200, true);
                    } else {
                        stopRec("Speech engine doesn't support this language");
                    }
                    break;
                case 1: // NETWORK_TIMEOUT
                case 2: // NETWORK
                case 4: // SERVER
                    state("No connection — retrying (try the on-device engine in setup)");
                    retry(1500, true);
                    break;
                case 8: // RECOGNIZER_BUSY
                    retry(600, true);
                    break;
                default:
                    retry(500, true);
                    break;
            }
        }
    };

    // ---------------------------------------------------------------- beeps

    private void muteBeeps() {
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (am == null) return;
        int[] streams = { AudioManager.STREAM_MUSIC, AudioManager.STREAM_NOTIFICATION, AudioManager.STREAM_SYSTEM };
        for (int s : streams) {
            try {
                if (!am.isStreamMute(s)) {
                    am.adjustStreamVolume(s, AudioManager.ADJUST_MUTE, 0);
                    muted.add(s);
                }
            } catch (Exception ignored) { }
        }
    }

    private void unmuteBeeps() {
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (am != null) {
            for (int s : muted) {
                try { am.adjustStreamVolume(s, AudioManager.ADJUST_UNMUTE, 0); } catch (Exception ignored) { }
            }
        }
        muted.clear();
    }
}
