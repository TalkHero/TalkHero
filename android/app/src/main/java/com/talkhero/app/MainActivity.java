package com.talkhero.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = getBridge().getWebView();
        View rootView = webView.getRootView();

        ViewCompat.setOnApplyWindowInsetsListener(rootView, (view, windowInsets) -> {
            Insets systemBars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
            );

            view.setPadding(
                    systemBars.left,
                    systemBars.top,
                    systemBars.right,
                    systemBars.bottom
            );

            return windowInsets;
        });

        ViewCompat.requestApplyInsets(rootView);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> {
                    if (ContextCompat.checkSelfPermission(
                            MainActivity.this,
                            Manifest.permission.RECORD_AUDIO
                    ) != PackageManager.PERMISSION_GRANTED) {
                        request.deny();
                        return;
                    }

                    for (String resource : request.getResources()) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                            request.grant(new String[]{
                                    PermissionRequest.RESOURCE_AUDIO_CAPTURE
                            });
                            return;
                        }
                    }

                    request.deny();
                });
            }
        });

        getOnBackPressedDispatcher().addCallback(
                this,
                new OnBackPressedCallback(true) {
                    @Override
                    public void handleOnBackPressed() {
                        if (webView != null && webView.canGoBack()) {
                            webView.goBack();
                            return;
                        }

                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                    }
                }
        );
    }
}
