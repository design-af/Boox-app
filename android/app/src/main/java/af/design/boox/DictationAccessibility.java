package af.design.boox;

import android.accessibilityservice.AccessibilityService;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;

import java.util.List;

/**
 * Lets the floating Dictation panel push text into the text field the user is typing in, in any
 * app, without replacing their keyboard. It only acts when the user taps Push; it reads nothing
 * otherwise. Turned on by the user in Settings > Accessibility > AFS Dictation.
 */
public class DictationAccessibility extends AccessibilityService {

    static volatile DictationAccessibility instance;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) { }

    @Override
    public void onInterrupt() { }

    @Override
    public boolean onUnbind(android.content.Intent intent) {
        instance = null;
        return super.onUnbind(intent);
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }

    static boolean isOn() {
        return instance != null;
    }

    private AccessibilityNodeInfo focusedField() {
        String self = getPackageName();
        try {
            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root != null && !self.contentEquals(root.getPackageName() == null ? "" : root.getPackageName())) {
                AccessibilityNodeInfo f = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
                if (f != null && f.isEditable()) return f;
            }
        } catch (Exception ignored) { }
        try {
            List<AccessibilityWindowInfo> wins = getWindows();
            for (AccessibilityWindowInfo w : wins) {
                AccessibilityNodeInfo r = w.getRoot();
                if (r == null) continue;
                if (self.contentEquals(r.getPackageName() == null ? "" : r.getPackageName())) continue;
                AccessibilityNodeInfo f = r.findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
                if (f != null && f.isEditable()) return f;
            }
        } catch (Exception ignored) { }
        return null;
    }

    /**
     * Inserts text at the cursor of the focused field. Returns "pasted", "set" or "nofield".
     * Adds a leading space when the cursor follows a word, and always ends with a space.
     */
    String insert(String text) {
        AccessibilityNodeInfo node = focusedField();
        if (node == null) return "nofield";

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
        return "nofield";
    }
}
