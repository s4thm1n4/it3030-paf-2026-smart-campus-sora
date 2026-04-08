package com.smartcampus.smart_campus_api.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for JwtUtil — token generation, extraction, and validation.
 *
 * @author Member 4 (M4)
 */
class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        // Use a test secret (must be >= 32 bytes for HMAC-SHA256)
        jwtUtil = new JwtUtil("TestJwtSecretKeyForCIOnlyNotForProductionUse123456", 86400000L);
    }

    @Test
    void generateToken_shouldReturnNonNullToken() {
        String token = jwtUtil.generateToken(1L, "test@sliit.lk", "USER");
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void extractUserId_shouldReturnCorrectId() {
        String token = jwtUtil.generateToken(42L, "admin@sliit.lk", "ADMIN");
        assertEquals(42L, jwtUtil.extractUserId(token));
    }

    @Test
    void extractRole_shouldReturnCorrectRole() {
        String token = jwtUtil.generateToken(1L, "tech@sliit.lk", "TECHNICIAN");
        assertEquals("TECHNICIAN", jwtUtil.extractRole(token));
    }

    @Test
    void extractClaims_shouldContainEmailClaim() {
        String token = jwtUtil.generateToken(1L, "user@sliit.lk", "USER");
        Claims claims = jwtUtil.extractClaims(token);
        assertEquals("user@sliit.lk", claims.get("email", String.class));
    }

    @Test
    void isTokenValid_shouldReturnTrueForValidToken() {
        String token = jwtUtil.generateToken(1L, "test@sliit.lk", "USER");
        assertTrue(jwtUtil.isTokenValid(token));
    }

    @Test
    void isTokenValid_shouldReturnFalseForExpiredToken() {
        // Create a JwtUtil with 0ms expiration — token expires immediately
        JwtUtil expiredJwtUtil = new JwtUtil("TestJwtSecretKeyForCIOnlyNotForProductionUse123456", 0L);
        String token = expiredJwtUtil.generateToken(1L, "test@sliit.lk", "USER");
        assertFalse(expiredJwtUtil.isTokenValid(token));
    }

    @Test
    void isTokenValid_shouldReturnFalseForTamperedToken() {
        String token = jwtUtil.generateToken(1L, "test@sliit.lk", "USER");
        // Tamper with the token by flipping a character
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";
        assertFalse(jwtUtil.isTokenValid(tampered));
    }

    @Test
    void isTokenValid_shouldReturnFalseForGarbageInput() {
        assertFalse(jwtUtil.isTokenValid("not.a.jwt"));
        assertFalse(jwtUtil.isTokenValid(""));
    }

    @Test
    void differentUsers_shouldProduceDifferentTokens() {
        String token1 = jwtUtil.generateToken(1L, "a@sliit.lk", "USER");
        String token2 = jwtUtil.generateToken(2L, "b@sliit.lk", "ADMIN");
        assertNotEquals(token1, token2);
    }

    @Test
    void extractClaims_shouldContainSubjectAsUserId() {
        String token = jwtUtil.generateToken(99L, "test@sliit.lk", "MANAGER");
        Claims claims = jwtUtil.extractClaims(token);
        assertEquals("99", claims.getSubject());
    }
}
