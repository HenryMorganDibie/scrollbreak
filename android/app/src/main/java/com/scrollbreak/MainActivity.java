package com.scrollbreak;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.View;
import android.view.accessibility.AccessibilityManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import java.util.List;

public class MainActivity extends Activity {

    private EditText groqKeyInput;
    private TextView accessibilityStatus;
    private TextView sessionCount;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        groqKeyInput = findViewById(R.id.groqKeyInput);
        accessibilityStatus = findViewById(R.id.accessibilityStatus);
        sessionCount = findViewById(R.id.sessionCount);

        // Load saved key
        String savedKey = getPrefs().getString("groq_key", "");
        if (!savedKey.isEmpty()) {
            groqKeyInput.setText(savedKey);
            groqKeyInput.setHint("Key saved ✓");
        }

        // Save key button
        Button saveKeyBtn = findViewById(R.id.saveKeyBtn);
        saveKeyBtn.setOnClickListener(v -> {
            String key = groqKeyInput.getText().toString().trim();
            if (key.isEmpty()) { Toast.makeText(this, "Enter a key first", Toast.LENGTH_SHORT).show(); return; }
            getPrefs().edit().putString("groq_key", key).apply();
            Toast.makeText(this, "Key saved ✓", Toast.LENGTH_SHORT).show();
        });

        // Enable accessibility button
        Button enableBtn = findViewById(R.id.enableAccessibilityBtn);
        enableBtn.setOnClickListener(v ->
            startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        );

        // Open web app button
        Button webAppBtn = findViewById(R.id.openWebAppBtn);
        webAppBtn.setOnClickListener(v -> {
            Intent i = new Intent(Intent.ACTION_VIEW,
                android.net.Uri.parse("https://henrymorgandibie.github.io/scrollbreak"));
            startActivity(i);
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateAccessibilityStatus();
        updateSessionCount();
    }

    private void updateAccessibilityStatus() {
        boolean enabled = isAccessibilityServiceEnabled();
        accessibilityStatus.setText(enabled
            ? "✅ Interception active — social media apps will be intercepted"
            : "❌ Not active — tap Enable below to turn on interception");
        accessibilityStatus.setTextColor(enabled ? 0xFF4CAF50 : 0xFFFF5252);
    }

    private void updateSessionCount() {
        String sessionsJson = getPrefs().getString("sessions", "[]");
        try {
            org.json.JSONArray sessions = new org.json.JSONArray(sessionsJson);
            sessionCount.setText(sessions.length() + " sessions logged");
        } catch (Exception e) {
            sessionCount.setText("0 sessions logged");
        }
    }

    private boolean isAccessibilityServiceEnabled() {
        AccessibilityManager am = (AccessibilityManager) getSystemService(ACCESSIBILITY_SERVICE);
        List<AccessibilityServiceInfo> services =
            am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
        for (AccessibilityServiceInfo info : services) {
            if (info.getId().contains("scrollbreak")) return true;
        }
        return false;
    }

    private SharedPreferences getPrefs() {
        return getSharedPreferences("scrollbreak", MODE_PRIVATE);
    }
}
