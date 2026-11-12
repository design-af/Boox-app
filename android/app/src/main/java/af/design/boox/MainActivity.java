package af.design.boox;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local plugins must be registered before the bridge starts.
        registerPlugin(NarratorPlugin.class);
        registerPlugin(TemplateFilesPlugin.class);
        registerPlugin(DictationPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        openRequestedPage(intent);
    }

    /** Native parts (e.g. the Dictation panel) can open a tool page with the extra "afsOpen". */
    private void openRequestedPage(Intent intent) {
        if (intent == null || getBridge() == null) return;
        String page = intent.getStringExtra("afsOpen");
        if (page == null || !page.matches("[A-Za-z0-9/_.#=-]+")) return;
        intent.removeExtra("afsOpen");
        WebView wv = getBridge().getWebView();
        String url = getBridge().getLocalUrl() + "/" + page;
        wv.postDelayed(() -> wv.loadUrl(url), 400);
    }
}
