package af.design.boox;

import android.accessibilityservice.AccessibilityService;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;

import java.util.ArrayDeque;
import java.util.List;

/**
 * Lets the floating Dictation panel push text into the text field the user is typing in, in any
 * app, without replacing their keyboard. It remembers the last text field the user touched and
 * where the on-screen keyboard is (so the panel can stay above it); it acts only when the user
 * taps Push. Turned on by the user in Settings > Accessibility > AFS Dictation.
 */
public class DictationAccessibility extends AccessibilityService {

    static volatile DictationAccessibility instance;

    private AccessibilityNodeInfo lastField;
    private String lastFieldPkg = "";
    private final Rect imeBounds = new Rect();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable imeCheck = this::updateIme;

    /** Why the last push found nothing; shown in the panel. */
    String lastDiag = "";

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public void onInterrupt() { }

    @Override
    public boolean onUnbind(android.content.Intent intent) {
        instance = null;
        return super.onUnbind(intent);
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        instance = null;
        super.onDestroy();
    }

    static boolean isOn() {
        return instance != null;
    }

    private boolean isOurs(CharSequence pkg) {
        return pkg != null && getPackageName().contentEquals(pkg);
    }

    private static boolean looksEditable(AccessibilityNodeInfo n) {
        if (n == null) return false;
        if (n.isEditable()) return true;
        CharSequence cls = n.getClassName();
        return cls != null && cls.toString().contains("EditText");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        int type = event.getEventType();
        if (type == AccessibilityEvent.TYPE_WINDOWS_CHANGED) {
            // Coalesce bursts of window changes into one cheap check.
            handler.removeCallbacks(imeCheck);
            handler.postDelayed(imeCheck, 250);
            return;
        }
        // Only focus changes are tracked (not keystrokes), so typing is never slowed down.
        if (type != AccessibilityEvent.TYPE_VIEW_FOCUSED) return;
        if (isOurs(event.getPackageName())) return;
        try {
            AccessibilityNodeInfo src = event.getSource();
            if (src != null && looksEditable(src)) {
                lastField = src;
                lastFieldPkg = String.valueOf(event.getPackageName());
            }
        } catch (Exception ignored) { }
    }

    /** Tells the floating panel where the keyboard is, so it can move above it. */
    private void updateIme() {
        Rect found = new Rect();
        try {
            for (AccessibilityWindowInfo w : getWindows()) {
                if (w.getType() == AccessibilityWindowInfo.TYPE_INPUT_METHOD) {
                    w.getBoundsInScreen(found);
                    break;
                }
            }
        } catch (Exception ignored) { }
        if (!found.equals(imeBounds)) {
            imeBounds.set(found);
            DictationService s = DictationService.instance;
            if (s != null) s.onImeBounds(found.height() > 0 ? found.top : -1);
        }
    }

    /** Current keyboard top in screen pixels, or -1 when no keyboard is showing. */
    int imeTop() {
        updateIme();
        return imeBounds.height() > 0 ? imeBounds.top : -1;
    }

    private AccessibilityNodeInfo focusedIn(AccessibilityNodeInfo root) {
        if (root == null || isOurs(root.getPackageName())) return null;
        AccessibilityNodeInfo f = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
        if (looksEditable(f)) return f;
        // Some apps report focus on a container; look inside it, then across the window.
        AccessibilityNodeInfo start = f != null ? f : root;
        AccessibilityNodeInfo best = null;
        ArrayDeque<AccessibilityNodeInfo> q = new ArrayDeque<>();
        q.add(start);
        int seen = 0;
        while (!q.isEmpty() && seen < 4000) {
            AccessibilityNodeInfo n = q.poll();
            seen++;
            if (n == null) continue;
            if (looksEditable(n)) {
                if (n.isFocused()) return n;
                if (best == null && n.getTextSelectionStart() >= 0) best = n;
            }
            for (int i = 0; i < n.getChildCount(); i++) q.add(n.getChild(i));
        }
        return best;
    }

    private AccessibilityNodeInfo findField(StringBuilder diag) {
        try {
            AccessibilityNodeInfo f = focusedIn(getRootInActiveWindow());
            if (f != null) return f;
        } catch (Exception ignored) { }
        try {
            List<AccessibilityWindowInfo> wins = getWindows();
            for (AccessibilityWindowInfo w : wins) {
                AccessibilityNodeInfo r = w.getRoot();
                if (diag.length() < 600) {
                    AccessibilityNodeInfo fo = r == null ? null : r.findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
                    diag.append("[").append(winType(w.getType())).append(' ')
                        .append(r == null ? "?" : String.valueOf(r.getPackageName()))
                        .append(fo == null ? " no-focus" : " focus=" + shortClass(fo) + (fo.isEditable() ? " editable" : ""))
                        .append("] ");
                }
                if (w.getType() != AccessibilityWindowInfo.TYPE_APPLICATION) continue;
                AccessibilityNodeInfo f = focusedIn(r);
                if (f != null) return f;
            }
        } catch (Exception ignored) { }
        if (lastField != null) {
            try {
                if (lastField.refresh()) {
                    diag.append("using last field in ").append(lastFieldPkg);
                    return lastField;
                }
            } catch (Exception ignored) { }
        }
        return null;
    }

    private static String shortClass(AccessibilityNodeInfo n) {
        CharSequence c = n.getClassName();
        if (c == null) return "?";
        String s = c.toString();
        return s.substring(s.lastIndexOf('.') + 1);
    }

    private static String winType(int t) {
        switch (t) {
            case AccessibilityWindowInfo.TYPE_APPLICATION: return "app";
            case AccessibilityWindowInfo.TYPE_INPUT_METHOD: return "keyboard";
            case AccessibilityWindowInfo.TYPE_SYSTEM: return "system";
            default: return "w" + t;
        }
    }

    /**
     * Inserts text at the cursor of the field being typed in. Returns "pasted", "set" or "nofield"
     * (with lastDiag set). Adds a leading space after a word, and always ends with a space.
     */
    String insert(String text) {
        StringBuilder diag = new StringBuilder();
        AccessibilityNodeInfo node = findField(diag);
        if (node == null) {
            lastDiag = diag.length() == 0 ? "no windows visible to the service" : diag.toString().trim();
            return "nofield";
        }
        lastDiag = "";

        String current = "";
        CharSequence cs = node.getText();
        boolean hint = Build.VERSION.SDK_INT >= 26 && node.isShowingHintText();
        if (cs != null && !hint) current = cs.toString();
        int s = node.getTextSelectionStart();
        int e = node.getTextSelectionEnd();
        if (s < 0 || s > current.length()) { s = current.length(); e = s; }
        if (e < s || e > current.length()) e = s;

        String out = text;
        if (s > 0 && !Character.isWhitespace(current.charAt(s - 1)) && !out.startsWith("\n")) out = " " + out;
        if (!out.endsWith(" ") && !out.endsWith("\n")) out = out + " ";

        ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null) {
            try {
                cm.setPrimaryClip(ClipData.newPlainText("AFS Dictation", out));
                if (node.performAction(AccessibilityNodeInfo.ACTION_PASTE)) return "pasted";
            } catch (Exception ignored) { }
        }

        String updated = current.substring(0, s) + out + current.substring(e);
        Bundle args = new Bundle();
        args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, updated);
        if (node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) {
            Bundle sel = new Bundle();
            int caret = s + out.length();
            sel.putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_START_INT, caret);
            sel.putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_END_INT, caret);
            node.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, sel);
            return "set";
        }
        lastDiag = "found " + shortClass(node) + " in " + node.getPackageName() + " but it refused paste and set-text";
        return "nofield";
    }
}
