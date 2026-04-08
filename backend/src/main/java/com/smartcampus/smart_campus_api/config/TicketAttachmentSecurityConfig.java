package com.smartcampus.smart_campus_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Public read access for stored ticket images (browser {@code <img>} cannot send JWT).
 * Filenames are UUID-based.
 */
@Configuration
public class TicketAttachmentSecurityConfig {

    @Bean
    @Order(0)
    public SecurityFilterChain ticketAttachmentChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/files/tickets/**")
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .csrf(csrf -> csrf.disable());
        return http.build();
    }
}
