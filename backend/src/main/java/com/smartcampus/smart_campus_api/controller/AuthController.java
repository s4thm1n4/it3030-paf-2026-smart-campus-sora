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

import java.util.Collections;

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
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.credential());
            if (idToken == null) {
                return ResponseEntity.status(401).build();
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
            return ResponseEntity.status(401).build();
        }
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

