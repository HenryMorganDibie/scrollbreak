package com.scrollbreak;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.AsyncTask;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class IntentionActivity extends Activity {

    private String platform;
    private String packageName;
    private int selectedMinutes = 15;
    private EditText intentInput;
    private TextView aiResponseText;
    private Button proceedBtn;
    private View aiBox;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Show over lock screen / other apps
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        );

        setContentView(R.layout.activity_intention);

        platform = getIntent().getStringExtra("platform");
        packageName = getIntent().getStringExtra("package");

        // Set platform name
        TextView platformLabel = findViewById(R.id.platformLabel);
        platformLabel.setText(platform);

        intentInput = findViewById(R.id.intentInput);
        aiResponseText = findViewById(R.id.aiResponse);
        aiBox = findViewById(R.id.aiBox);
        proceedBtn = findViewById(R.id.proceedBtn);

        // Time limit selection
        RadioGroup timeGroup = findViewById(R.id.timeGroup);
        timeGroup.setOnCheckedChangeListener((group, checkedId) -> {
            if (checkedId == R.id.time10) selectedMinutes = 10;
            else if (checkedId == R.id.time15) selectedMinutes = 15;
            else if (checkedId == R.id.time20) selectedMinutes = 20;
            else if (checkedId == R.id.time30) selectedMinutes = 30;
        });

        // Proceed button
        proceedBtn.setOnClickListener(v -> {
            String intent = intentInput.getText().toString().trim();
            if (intent.isEmpty()) {
                intentInput.setError("Write your intention first");
                return;
            }
            saveSession(intent);
            ScrollBreakAccessibilityService.markIntentionSet(this, packageName);

            String groqKey = getPrefs().getString("groq_key", "");
            if (!groqKey.isEmpty()) {
                proceedBtn.setEnabled(false);
                proceedBtn.setText("Getting coaching...");
                new GroqTask(intent, groqKey).execute();
            } else {
                finish();
            }
        });

        // Skip button
        findViewById(R.id.skipBtn).setOnClickListener(v -> {
            ScrollBreakAccessibilityService.markIntentionSet(this, packageName);
            finish();
        });
    }

    private void saveSession(String intention) {
        SharedPreferences prefs = getPrefs();
        String sessionsJson = prefs.getString("sessions", "[]");
        try {
            JSONArray sessions = new JSONArray(sessionsJson);
            JSONObject session = new JSONObject();
            session.put("id", System.currentTimeMillis());
            session.put("platform", platform);
            session.put("intention", intention);
            session.put("timeLimitMins", selectedMinutes);
            session.put("timestamp", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'",
                    Locale.US).format(new Date()));
            session.put("source", "android");
            sessions.put(0, session);
            // Keep last 200
            while (sessions.length() > 200) sessions.remove(sessions.length() - 1);
            prefs.edit().putString("sessions", sessions.toString()).apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private SharedPreferences getPrefs() {
        return getSharedPreferences("scrollbreak", MODE_PRIVATE);
    }

    // Async Groq API call
    private class GroqTask extends AsyncTask<Void, Void, String> {
        private final String intention;
        private final String apiKey;

        GroqTask(String intention, String apiKey) {
            this.intention = intention;
            this.apiKey = apiKey;
        }

        @Override
        protected String doInBackground(Void... voids) {
            try {
                URL url = new URL("https://api.groq.com/openai/v1/chat/completions");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Authorization", "Bearer " + apiKey);
                conn.setDoOutput(true);

                String prompt = "You are a mindful digital wellness coach. 2 sentences max.\n" +
                        "User is opening " + platform + ". Intention: \"" + intention + "\". " +
                        "Limit: " + selectedMinutes + " min.\n" +
                        "One sharp observation on their intention + one practical tip. No lists.";

                JSONObject body = new JSONObject();
                body.put("model", "llama-3.3-70b-versatile");
                body.put("max_tokens", 150);
                JSONArray messages = new JSONArray();
                JSONObject msg = new JSONObject();
                msg.put("role", "user");
                msg.put("content", prompt);
                messages.put(msg);
                body.put("messages", messages);

                OutputStream os = conn.getOutputStream();
                os.write(body.toString().getBytes("UTF-8"));
                os.close();

                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) sb.append(line);
                reader.close();

                JSONObject response = new JSONObject(sb.toString());
                return response.getJSONArray("choices")
                        .getJSONObject(0)
                        .getJSONObject("message")
                        .getString("content");

            } catch (Exception e) {
                return null;
            }
        }

        @Override
        protected void onPostExecute(String result) {
            if (result != null) {
                aiBox.setVisibility(View.VISIBLE);
                aiResponseText.setText(result);
                proceedBtn.setText("PROCEED TO " + platform.toUpperCase());
                proceedBtn.setEnabled(true);
                proceedBtn.setOnClickListener(v -> finish());
            } else {
                finish();
            }
        }
    }

    @Override
    public void onBackPressed() {
        // Don't let back button bypass the intention screen
        // User must either set intention or skip
    }
}
