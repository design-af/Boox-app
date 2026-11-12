package af.design.boox;

import android.os.Bundle;

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
}
