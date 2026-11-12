package af.design.boox;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.inputmethodservice.InputMethodService;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.File;
import java.io.FileWriter;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;

/**
 * AFS Dictation: a keyboard that types continuous speech into whatever text field is focused.
 *
 * Android's SpeechRecognizer stops after each phrase, so this restarts it straight away until
 * the user taps Stop. Words in progress show as composing (underlined) text in the field and are
 * committed when the phrase ends. Every committed phrase is also appended to a backup transcript
 * (files/dictation/transcript.txt), which the Dictation tool page can copy or share.
 *
 * Settings live in SharedPreferences "dictation" (written by DictationPlugin):
 *   engine "auto" | "device" | "online", live (bool), mute (bool), cap (bool), lang ("" = device).
 */
public class DictationIME extends InputMethodService {

    static final String PREFS = "dictation";

    private final Handler main = new Handler(Looper.getMainLooper());

    private SpeechRecognizer recognizer;
    private boolean running;          // the user wants to be listening
    private boolean usingDevice;      // current recognizer is on-device
    private boolean deviceFailed;     // on-device engine refused this language; use online
    private long listenStartedAt;
    private int quickErrors;          // errors right after starting, for back-off
    private int phrases;

    private String composing = "";    // partial text currently shown in the field
    private String phrasePrefix = null; // " " or "" for the phrase in progress (null = not computed)
    private boolean phraseCap;
    private final StringBuilder pendingSuffix = new StringBuilder(); // punctuation tapped mid-phrase

    private final ArrayList<int[]> muted = new ArrayList<>();

    private LinearLayout root;
    private TextView statusView;
    private TextView previewView;
    private Button startBtn;

    // ---------------------------------------------------------------- UI

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private Button key(String label, float weight, View.OnClickListener onClick) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 19);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setTextColor(Color.BLACK);
        b.setPadding(dp(4), 0, dp(4), 0);
        b.setMinHeight(0);
        b.setMinimumHeight(0);
        b.setStateListAnimator(null);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.WHITE);
        bg.setStroke(dp(2), Color.BLACK);
        b.setBackground(bg);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(58), weight);
        lp.setMargins(dp(3), dp(3), dp(3), dp(3));
        b.setLayoutParams(lp);
        b.setOnClickListener(onClick);
        return b;
    }

    private LinearLayout row() {
        LinearLayout r = new LinearLayout(this);
        r.setOrientation(LinearLayout.HORIZONTAL);
        r.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        return r;
    }

    @Override
    public View onCreateInputView() {
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);
        root.setPadding(dp(6), dp(4), dp(6), dp(6));

        View rule = new View(this);
        rule.setBackgroundColor(Color.BLACK);
        root.addView(rule, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(3)));

        statusView = new TextView(this);
        statusView.setTextColor(Color.BLACK);
        statusView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        statusView.setPadding(dp(4), dp(6), dp(4), 0);
        statusView.setSingleLine(true);
        statusView.setEllipsize(TextUtils.TruncateAt.END);
        root.addView(statusView);

        previewView = new TextView(this);
        previewView.setTextColor(Color.BLACK);
        previewView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        previewView.setPadding(dp(4), dp(2), dp(4), dp(6));
        previewView.setMaxLines(2);
        previewView.setMinLines(2);
        previewView.setEllipsize(TextUtils.TruncateAt.END);
        root.addView(previewView);

        LinearLayout r1 = row();
        startBtn = key("Start", 2.2f, v -> { if (running) stop("Stopped"); else start(); });
        r1.addView(startBtn);
        r1.addView(key("New line", 1.3f, v -> insert("\n")));
        r1.addView(key("⌫", 1f, v -> backspace()));
        Button sw = key("ABC", 1f, v -> switchKeyboard(false));
        sw.setOnLongClickListener(v -> { switchKeyboard(true); return true; });
        r1.addView(sw);
        root.addView(r1);

        LinearLayout r2 = row();
        r2.addView(key(".", 1f, v -> insert(".")));
        r2.addView(key(",", 1f, v -> insert(",")));
        r2.addView(key("?", 1f, v -> insert("?")));
        r2.addView(key(":", 1f, v -> insert(":")));
        r2.addView(key("—", 1f, v -> insert(" —")));
        r2.addView(key("Space", 1.6f, v -> insert(" ")));
        root.addView(r2);

        refreshUi();
        return root;
    }

    @Override
    public boolean onEvaluateFullscreenMode() {
        return false; // never take over the screen in landscape
    }

    private void setPreview(String t) {
        if (previewView == null) return;
        // Show the tail of long phrases so the newest words stay visible.
        previewView.setText(t.length() > 140 ? "\u2026" + t.substring(t.length() - 140) : t);
    }

    private void setStatus(String s) {
        if (statusView != null) statusView.setText(s);
    }

    private void refreshUi() {
        if (startBtn == null) return;
        GradientDrawable bg = new GradientDrawable();
        bg.setStroke(dp(2), Color.BLACK);
        if (running) {
            startBtn.setText("■  Stop");
            bg.setColor(Color.BLACK);
            startBtn.setTextColor(Color.WHITE);
        } else {
            startBtn.setText("●  Start");
            bg.setColor(Color.WHITE);
            startBtn.setTextColor(Color.BLACK);
        }
        startBtn.setBackground(bg);
        if (root != null) root.setKeepScreenOn(running);
        if (!running && statusView != null && TextUtils.isEmpty(statusView.getText())) {
            setStatus(hasMic() ? "AFS Dictation — tap Start to transcribe" : "Microphone not allowed yet — tap Start for setup");
        }
    }

    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        composing = "";
        phrasePrefix = null;
        refreshUi();
    }

    @Override
    public void onFinishInput() {
        // Leaving this field: keep whatever was in progress.
        flushComposing();
        super.onFinishInput();
    }

    @Override
    public void onFinishInputView(boolean finishingInput) {
        // Keyboard hidden: stop, so the mic is never left on invisibly.
        if (running) stop("Stopped (keyboard closed)");
        super.onFinishInputView(finishingInput);
    }

    @Override
    public void onDestroy() {
        running = false;
        main.removeCallbacksAndMessages(null);
        destroyRecognizer();
        unmuteBeeps();
        super.onDestroy();
    }

    // ---------------------------------------------------------------- settings

    private SharedPreferences prefs() {
        return getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private boolean hasMic() {
        return checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    // ---------------------------------------------------------------- start / stop

    private void start() {
        if (!hasMic()) {
            setStatus("Allow the microphone in AFS Custom Boox → Dictation");
            try {
                Intent i = new Intent(this, MainActivity.class);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(i);
            } catch (Exception ignored) { }
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            setStatus("No speech engine on this device — see Dictation setup");
            return;
        }
        running = true;
        quickErrors = 0;
        phrases = 0;
        deviceFailed = false;
        if (prefs().getBoolean("mute", true)) muteBeeps();
        writeTranscript("\n\n— " + new SimpleDateFormat("EEE d MMM yyyy, h:mm a", Locale.getDefault()).format(new Date()) + " —\n");
        createRecognizer();
        refreshUi();
        listen();
    }

    private void stop(String why) {
        running = false;
        main.removeCallbacksAndMessages(null);
        if (recognizer != null) {
            try { recognizer.cancel(); } catch (Exception ignored) { }
        }
        destroyRecognizer();
        flushComposing();
        unmuteBeeps();
        setStatus(why + (phrases > 0 ? " — " + phrases + " phrases saved to backup" : ""));
        refreshUi();
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
            setStatus("Could not start speech engine: " + e.getMessage());
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
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
        String lang = prefs().getString("lang", "");
        if (TextUtils.isEmpty(lang)) lang = Locale.getDefault().toLanguageTag();
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
        // Ask for longer phrases; many engines ignore these, which is why we restart.
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 15000L);
        if (Build.VERSION.SDK_INT >= 33) {
            // Punctuation and capitals where the engine supports it.
            i.putExtra("android.speech.extra.ENABLE_FORMATTING", "quality");
        }
        listenStartedAt = SystemClock.elapsedRealtime();
        try {
            recognizer.startListening(i);
        } catch (Exception e) {
            retry(800, true);
        }
    }

    /** Restart after a pause; backs off when errors come straight after starting. */
    private void retry(long baseDelay, boolean recreate) {
        if (!running) return;
        long sinceStart = SystemClock.elapsedRealtime() - listenStartedAt;
        if (sinceStart < 1500) quickErrors = Math.min(quickErrors + 1, 6); else quickErrors = 0;
        long delay = baseDelay + quickErrors * 600L;
        main.removeCallbacksAndMessages(null);
        main.postDelayed(() -> {
            if (!running) return;
            if (recreate) createRecognizer();
            listen();
        }, delay);
    }

    private final RecognitionListener listener = new RecognitionListener() {
        @Override public void onReadyForSpeech(Bundle params) {
            if (running) setStatus("● Listening" + (usingDevice ? " (on-device)" : "") + (phrases > 0 ? " — " + phrases + " phrases" : ""));
        }
        @Override public void onBeginningOfSpeech() { }
        @Override public void onRmsChanged(float rmsdB) { }
        @Override public void onBufferReceived(byte[] buffer) { }
        @Override public void onEndOfSpeech() { }
        @Override public void onEvent(int eventType, Bundle params) { }

        @Override public void onPartialResults(Bundle b) {
            if (!running) return;
            String t = first(b);
            if (!TextUtils.isEmpty(t)) showPartial(t);
        }

        @Override public void onResults(Bundle b) {
            String t = first(b);
            commitPhrase(TextUtils.isEmpty(t) ? composing : t);
            quickErrors = 0;
            if (running) {
                main.removeCallbacksAndMessages(null);
                main.postDelayed(DictationIME.this::listen, 60);
            }
        }

        @Override public void onError(int error) {
            if (!running) return;
            // Keep anything already heard.
            if (!composing.isEmpty()) commitPhrase(composing);
            switch (error) {
                case 6: // SPEECH_TIMEOUT
                case 7: // NO_MATCH
                    retry(100, false);
                    break;
                case 9: // INSUFFICIENT_PERMISSIONS
                    stop("Microphone not allowed — open AFS Custom Boox → Dictation");
                    break;
                case 12: // LANGUAGE_NOT_SUPPORTED
                case 13: // LANGUAGE_UNAVAILABLE
                    if (usingDevice) {
                        deviceFailed = true;
                        setStatus("On-device engine lacks this language — switching to online");
                        retry(200, true);
                    } else {
                        stop("Speech engine doesn't support " + prefs().getString("lang", Locale.getDefault().toLanguageTag()));
                    }
                    break;
                case 1: // NETWORK_TIMEOUT
                case 2: // NETWORK
                case 4: // SERVER
                    setStatus("No connection — retrying… (try on-device engine in setup)");
                    retry(1500, true);
                    break;
                case 8: // RECOGNIZER_BUSY
                    retry(600, true);
                    break;
                default: // CLIENT, AUDIO, SERVER_DISCONNECTED, TOO_MANY_REQUESTS, ...
                    retry(500, true);
                    break;
            }
        }
    };

    private static String first(Bundle b) {
        if (b == null) return "";
        ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (r == null || r.isEmpty() || r.get(0) == null) return "";
        return r.get(0).trim();
    }

    // ---------------------------------------------------------------- text

    /** Works out spacing and capitals from the text before the cursor, once per phrase. */
    private void computePhraseContext(InputConnection ic) {
        phrasePrefix = "";
        phraseCap = prefs().getBoolean("cap", true);
        if (ic == null) return;
        CharSequence before = null;
        try { before = ic.getTextBeforeCursor(40, 0); } catch (Exception ignored) { }
        if (before == null || before.length() == 0) return;
        char last = before.charAt(before.length() - 1);
        if (!Character.isWhitespace(last)) phrasePrefix = " ";
        String trimmed = before.toString().replaceAll("[ \\t]+$", "");
        if (!trimmed.isEmpty()) {
            char c = trimmed.charAt(trimmed.length() - 1);
            phraseCap = phraseCap && ".?!\n".indexOf(c) >= 0;
        }
    }

    private String decorate(String t) {
        String s = t;
        if (phraseCap && !s.isEmpty()) s = s.substring(0, 1).toUpperCase(Locale.getDefault()) + s.substring(1);
        if (!s.isEmpty() && ".,?!:;".indexOf(s.charAt(0)) >= 0) return s;
        return (phrasePrefix == null ? "" : phrasePrefix) + s;
    }

    private void showPartial(String t) {
        setPreview(t);
        if (!prefs().getBoolean("live", true)) { composing = t; return; }
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) { composing = t; return; }
        if (phrasePrefix == null) computePhraseContext(ic);
        try { ic.setComposingText(decorate(t), 1); } catch (Exception ignored) { }
        composing = t;
    }

    private void commitPhrase(String t) {
        InputConnection ic = getCurrentInputConnection();
        String text = t == null ? "" : t.trim();
        if (!text.isEmpty()) {
            if (phrasePrefix == null) computePhraseContext(ic);
            String out = decorate(text);
            if (ic != null) {
                try { ic.commitText(out, 1); } catch (Exception ignored) { }
            }
            writeTranscript(out);
            phrases++;
            setPreview(text);
        } else if (ic != null && !composing.isEmpty()) {
            try { ic.commitText("", 1); } catch (Exception ignored) { }
        }
        composing = "";
        phrasePrefix = null;
        if (pendingSuffix.length() > 0) {
            String s = pendingSuffix.toString();
            pendingSuffix.setLength(0);
            if (ic != null) {
                try { ic.commitText(s, 1); } catch (Exception ignored) { }
            }
            writeTranscript(s);
        }
    }

    private void flushComposing() {
        if (!composing.isEmpty()) commitPhrase(composing);
        else {
            InputConnection ic = getCurrentInputConnection();
            if (ic != null) {
                try { ic.finishComposingText(); } catch (Exception ignored) { }
            }
        }
    }

    /** Punctuation / new line / space. Mid-phrase it waits until the phrase is committed. */
    private void insert(String s) {
        if (!composing.isEmpty()) {
            pendingSuffix.append(s);
            setStatus("Will add “" + s.replace("\n", "↵") + "” after this phrase");
            return;
        }
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        if ("\n".equals(s)) {
            EditorInfo ei = getCurrentInputEditorInfo();
            boolean multiLine = ei != null && (ei.inputType & EditorInfo.TYPE_TEXT_FLAG_MULTI_LINE) != 0;
            if (!multiLine && ei != null && (ei.imeOptions & EditorInfo.IME_MASK_ACTION) != EditorInfo.IME_ACTION_NONE
                    && (ei.imeOptions & EditorInfo.IME_FLAG_NO_ENTER_ACTION) == 0) {
                sendDefaultEditorAction(true);
                return;
            }
            sendDownUpKeyEvents(KeyEvent.KEYCODE_ENTER);
        } else {
            ic.commitText(s, 1);
        }
        writeTranscript(s);
    }

    private void backspace() {
        if (!composing.isEmpty()) {
            setStatus("Wait for the phrase to finish, then delete");
            return;
        }
        sendDownUpKeyEvents(KeyEvent.KEYCODE_DEL);
    }

    private void switchKeyboard(boolean picker) {
        if (running) stop("Stopped");
        if (!picker && Build.VERSION.SDK_INT >= 28) {
            try { if (switchToPreviousInputMethod()) return; } catch (Exception ignored) { }
        }
        InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        if (imm != null) imm.showInputMethodPicker();
    }

    // ---------------------------------------------------------------- backup transcript

    static File transcriptFile(Context c) {
        File dir = new File(c.getFilesDir(), "dictation");
        if (!dir.exists()) dir.mkdirs();
        return new File(dir, "transcript.txt");
    }

    private void writeTranscript(String s) {
        try (FileWriter w = new FileWriter(transcriptFile(this), true)) {
            w.write(s);
        } catch (Exception ignored) { }
    }

    // ---------------------------------------------------------------- beeps

    /** Many speech engines beep on every restart; mute those streams while dictating. */
    private void muteBeeps() {
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (am == null || Build.VERSION.SDK_INT < 23) return;
        int[] streams = { AudioManager.STREAM_MUSIC, AudioManager.STREAM_NOTIFICATION, AudioManager.STREAM_SYSTEM };
        for (int s : streams) {
            try {
                if (!am.isStreamMute(s)) {
                    am.adjustStreamVolume(s, AudioManager.ADJUST_MUTE, 0);
                    muted.add(new int[] { s });
                }
            } catch (Exception ignored) { }
        }
    }

    private void unmuteBeeps() {
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (am == null || Build.VERSION.SDK_INT < 23) { muted.clear(); return; }
        for (int[] s : muted) {
            try { am.adjustStreamVolume(s[0], AudioManager.ADJUST_UNMUTE, 0); } catch (Exception ignored) { }
        }
        muted.clear();
    }
}
