package com.scrollbreak;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.accessibility.AccessibilityEvent;

import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class ScrollBreakAccessibilityService extends AccessibilityService {

    // Social media packages to intercept
    private static final Map<String, String> TARGET_APPS = new HashMap<String, String>() {{
        put("com.twitter.android", "Twitter/X");
        put("com.instagram.android", "Instagram");
        put("com.zhiliaoapp.musically", "TikTok");
        put("com.google.android.youtube", "YouTube");
        put("com.reddit.frontpage", "Reddit");
        put("com.facebook.katana", "Facebook");
        put("com.snapchat.android", "Snapchat");
    }};

    private String lastInterceptedPackage = "";
    private long lastInterceptTime = 0;
    private static final long COOLDOWN_MS = 30 * 60 * 1000; // 30 min cooldown per app

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;

        String packageName = event.getPackageName() != null
                ? event.getPackageName().toString() : "";

        if (!TARGET_APPS.containsKey(packageName)) return;

        // Check if intention was recently set for this app (cooldown)
        SharedPreferences prefs = getSharedPreferences("scrollbreak", MODE_PRIVATE);
        long lastSet = prefs.getLong("intention_set_" + packageName, 0);
        if (System.currentTimeMillis() - lastSet < COOLDOWN_MS) return;

        // Avoid duplicate triggers
        if (packageName.equals(lastInterceptedPackage)
                && System.currentTimeMillis() - lastInterceptTime < 5000) return;

        lastInterceptedPackage = packageName;
        lastInterceptTime = System.currentTimeMillis();

        // Launch intention overlay
        String platformName = TARGET_APPS.get(packageName);
        Intent intent = new Intent(this, IntentionActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("platform", platformName);
        intent.putExtra("package", packageName);
        startActivity(intent);
    }

    @Override
    public void onInterrupt() {}

    // Called by IntentionActivity when user sets intention — starts cooldown
    public static void markIntentionSet(android.content.Context ctx, String packageName) {
        ctx.getSharedPreferences("scrollbreak", MODE_PRIVATE)
                .edit()
                .putLong("intention_set_" + packageName, System.currentTimeMillis())
                .apply();
    }
}
