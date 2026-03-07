package com.smartcampus.smart_campus_api.dto;

/**
 * Request body for Google OAuth login.
 * The frontend sends the Google ID token credential here.
 *
 * @author Member 4 (M4)
 */
public record GoogleLoginRequest(String credential) {}

