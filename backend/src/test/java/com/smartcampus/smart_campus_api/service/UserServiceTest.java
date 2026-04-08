package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.exception.ResourceNotFoundException;
import com.smartcampus.smart_campus_api.model.Role;
import com.smartcampus.smart_campus_api.model.User;
import com.smartcampus.smart_campus_api.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for UserService — OAuth find-or-create and role management.
 *
 * @author Member 4 (M4)
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void findOrCreateFromGoogle_shouldReturnExistingUserByGoogleId() {
        User existing = User.builder()
                .id(1L).googleId("google-123").email("test@sliit.lk")
                .name("Old Name").role(Role.USER).build();

        when(userRepository.findByGoogleId("google-123")).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.findOrCreateFromGoogle("google-123", "test@sliit.lk", "New Name", "pic.jpg");

        assertEquals("New Name", result.getName());
        assertEquals("pic.jpg", result.getProfilePictureUrl());
    }

    @Test
    void findOrCreateFromGoogle_shouldLinkGoogleIdToExistingEmailUser() {
        User existing = User.builder()
                .id(2L).email("existing@sliit.lk").name("Existing").role(Role.ADMIN).build();

        when(userRepository.findByGoogleId("new-google-id")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("existing@sliit.lk")).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.findOrCreateFromGoogle("new-google-id", "existing@sliit.lk", "Existing", "pic.jpg");

        assertEquals("new-google-id", result.getGoogleId());
        assertEquals(Role.ADMIN, result.getRole()); // should preserve existing role
    }

    @Test
    void findOrCreateFromGoogle_shouldCreateNewUserWithDefaultRole() {
        when(userRepository.findByGoogleId("brand-new")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("new@sliit.lk")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.findOrCreateFromGoogle("brand-new", "new@sliit.lk", "New User", "pic.jpg");

        assertEquals(Role.USER, result.getRole());
        assertEquals("new@sliit.lk", result.getEmail());
    }

    @Test
    void updateRole_shouldChangeUserRole() {
        User user = User.builder().id(1L).email("user@sliit.lk").name("User").role(Role.USER).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.updateRole(1L, Role.ADMIN);
        assertEquals(Role.ADMIN, result.getRole());
    }

    @Test
    void updateRole_shouldThrowWhenUserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userService.updateRole(999L, Role.ADMIN));
    }
}
