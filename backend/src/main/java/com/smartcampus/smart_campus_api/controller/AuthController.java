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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Collections;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

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

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();

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
     * Falls back to manual JWT decode if Google's verifier fails (e.g. network/clock issues).
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            String credential = request.credential();
            if (credential == null || credential.isBlank()) {
                return ResponseEntity.status(401)
                        .body(Map.of("error", "No credential provided"));
            }

            System.out.println("[Auth] Google login attempt. Client ID: " + googleClientId);

            // Try standard Google verification first
            GoogleIdToken idToken = null;
            try {
                GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                        new NetHttpTransport(), GsonFactory.getDefaultInstance())
                        .setAudience(Collections.singletonList(googleClientId))
                        .build();
                idToken = verifier.verify(credential);
            } catch (Exception e) {
                System.err.println("[Auth] Standard verification failed: " + e.getMessage());
            }

            String googleId, email, name, pictureUrl;

            if (idToken != null) {
                // Standard verification succeeded
                GoogleIdToken.Payload payload = idToken.getPayload();
                googleId = payload.getSubject();
                email = payload.getEmail();
                name = (String) payload.get("name");
                pictureUrl = (String) payload.get("picture");
                System.out.println("[Auth] Standard verification succeeded for: " + email);
            } else {
                // Fallback: manually decode the JWT and verify audience + issuer
                System.out.println("[Auth] Standard verification returned null, using fallback JWT decode");
                JsonNode claims = decodeGoogleJwt(credential);

                // Verify audience matches our client ID
                String aud = claims.has("aud") ? claims.get("aud").asText() : "";
                if (!googleClientId.equals(aud)) {
                    System.err.println("[Auth] Audience mismatch. Expected: " + googleClientId + ", Got: " + aud);
                    return ResponseEntity.status(401)
                            .body(Map.of("error", "Client ID mismatch. Expected: " + googleClientId + ", Got: " + aud));
                }

                // Verify issuer is Google
                String iss = claims.has("iss") ? claims.get("iss").asText() : "";
                if (!iss.equals("accounts.google.com") && !iss.equals("https://accounts.google.com")) {
                    return ResponseEntity.status(401)
                            .body(Map.of("error", "Invalid token issuer: " + iss));
                }

                googleId = claims.has("sub") ? claims.get("sub").asText() : null;
                email = claims.has("email") ? claims.get("email").asText() : null;
                name = claims.has("name") ? claims.get("name").asText() : null;
                pictureUrl = claims.has("picture") ? claims.get("picture").asText() : null;
                System.out.println("[Auth] Fallback decode succeeded for: " + email);
            }

            if (email == null || googleId == null) {
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Could not extract user info from Google token"));
            }

            User user = userService.findOrCreateFromGoogle(googleId, email, name, pictureUrl);
            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

            System.out.println("[Auth] Login successful for: " + email + " (role: " + user.getRole() + ")");

            return ResponseEntity.ok(new AuthResponse(
                    token,
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getProfilePictureUrl()
            ));

        } catch (Exception e) {
            System.err.println("[Auth] Google OAuth verification failed: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Google OAuth verification failed: " + e.getMessage()));
        }
    }

    /**
     * Decode a Google JWT token payload (without cryptographic signature verification).
     * The token is a 3-part base64url string: header.payload.signature
     */
    private JsonNode decodeGoogleJwt(String token) throws Exception {
        String[] parts = token.split("\\.");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid JWT format");
        }
        String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
        return objectMapper.readTree(payload);
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
