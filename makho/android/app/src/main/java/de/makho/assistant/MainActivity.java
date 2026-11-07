package de.makho.assistant;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MakhoPlugin.class);
        super.onCreate(savedInstanceState);
        // Makho bleibt sichtbar, solange die App offen ist.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebSettings s = getBridge().getWebView().getSettings();
            // Makhos Stimme und Töne ohne vorheriges Antippen.
            s.setMediaPlaybackRequiresUserGesture(false);
            // Die Schriftgröße des Systems darf das Layout nicht verzerren.
            s.setTextZoom(100);
        }
    }
}
