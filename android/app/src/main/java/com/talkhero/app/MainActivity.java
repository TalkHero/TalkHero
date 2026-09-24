package com.talkhero.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private WebView webView;
    private PermissionRequest pendingAudioPermissionRequest;

    private ActivityResultLauncher<String> microphonePermissionLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        microphonePermissionLauncher =
                registerForActivityResult(
                        new ActivityResultContracts.RequestPermission(),
                        isGranted -> {
                            if (pendingAudioPermissionRequest == null) {
                                return;
                            }

                            if (isGranted) {
                                pendingAudioPermissionRequest.grant(
                                        new String[]{
                                                PermissionRequest.RESOURCE_AUDIO_CAPTURE
                                        }
                                );
                            } else {
                                pendingAudioPermissionRequest.deny();
                            }

                            pendingAudioPermissionRequest = null;
                        }
                );

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
                    boolean requestsAudio = false;

                    for (String resource : request.getResources()) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                            requestsAudio = true;
                            break;
                        }
                    }

                    if (!requestsAudio) {
                        request.deny();
                        return;
                    }

                    if (ContextCompat.checkSelfPermission(
                            MainActivity.this,
                            Manifest.permission.RECORD_AUDIO
                    ) == PackageManager.PERMISSION_GRANTED) {

                        request.grant(
                                new String[]{
                                        PermissionRequest.RESOURCE_AUDIO_CAPTURE
                                }
                        );

                        return;
                    }

                    if (pendingAudioPermissionRequest != null) {
                        pendingAudioPermissionRequest.deny();
                    }

                    pendingAudioPermissionRequest = request;

                    microphonePermissionLauncher.launch(
                            Manifest.permission.RECORD_AUDIO
                    );
                });
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                if (pendingAudioPermissionRequest == request) {
                    pendingAudioPermissionRequest = null;
                }

                super.onPermissionRequestCanceled(request);
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
