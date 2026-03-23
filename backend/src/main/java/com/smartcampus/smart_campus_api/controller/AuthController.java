package com.smartcampus.smart_campus_api.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.smartcampus.smart_campus_api.dto.AuthResponse;
import com.smartcampus.smart_campus_api.dto.GoogleLoginRequest;
import com.smartcampus.smart_campus_api.dto.UserProfileResponse;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.security.JwtUtil;
import com.smartcampus.smart_campus_api.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * MODULE E — Authentication & Authorization
 * Handles Google OAuth2 login and returns a JWT token.
 *
 * Endpoints:
 *   POST /api/auth/google   — verify Google credential, return JWT
 *   GET  /api/auth/me       — return current logged-in user's profile
 *
 * @author Member 4 (M4)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * POST /api/auth/google
     * Receives the Google ID token from the React frontend (@react-oauth/google),
     * verifies it with Google, finds or creates the user, and returns a JWT.
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        // Quick runtime sanity check: ensure the Google client ID was configured.
        if (googleClientId == null || googleClientId.isBlank() || googleClientId.contains("YOUR_GOOGLE_CLIENT_ID")) {
            log.error("Google client ID is not configured properly: '{}'", googleClientId);
            return ResponseEntity.status(500).body(authError(
                    "Server misconfiguration: spring.security.oauth2.client.registration.google.client-id is not set. " +
                    "Please set it to the same value as the frontend VITE_GOOGLE_CLIENT_ID (see README / .env)."));
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.credential());
            if (idToken == null) {
                return ResponseEntity.status(401).body(authError(
                        "Google could not verify the sign-in token. Check that spring.security.oauth2.client.registration.google.client-id matches your frontend VITE_GOOGLE_CLIENT_ID."));
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            User user = userService.findOrCreateFromGoogle(googleId, email, name, pictureUrl);
            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

            return ResponseEntity.ok(new AuthResponse(
                    token,
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getProfilePictureUrl()
            ));

        } catch (Exception e) {
            log.warn("Google login failed: {}", e.getMessage());
            log.debug("Google login stack trace", e);
            return ResponseEntity.status(401).body(authError(
                    "Google sign-in could not be completed. Check: (1) Google Client ID matches frontend and backend, (2) PostgreSQL is running, (3) see server logs."));
        }
    }

    private static Map<String, Object> authError(String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", 401);
        body.put("error", "Unauthorized");
        body.put("message", message);
        return body;
    }

    /**
     * GET /api/auth/me
     * Returns the profile of the currently authenticated user.
     * Requires a valid JWT in the Authorization header.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getProfilePictureUrl()
        ));
    }
}

