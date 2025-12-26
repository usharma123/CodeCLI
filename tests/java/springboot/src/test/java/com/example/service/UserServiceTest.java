package com.example.service;

import com.example.model.User;
import com.example.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private User anotherUser;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "John Doe", "john@example.com");
        anotherUser = new User(2L, "Jane Smith", "jane@example.com");
    }

    @Nested
    @DisplayName("FindAll Method Tests")
    class FindAllTests {

        @Test
        @DisplayName("Should return all users")
        void shouldReturnAllUsers() {
            List<User> expectedUsers = Arrays.asList(testUser, anotherUser);
            when(userRepository.findAll()).thenReturn(expectedUsers);

            List<User> result = userService.findAll();

            assertNotNull(result);
            assertEquals(2, result.size());
            verify(userRepository, times(1)).findAll();
        }

        @Test
        @DisplayName("Should return empty list when no users exist")
        void shouldReturnEmptyListWhenNoUsers() {
            when(userRepository.findAll()).thenReturn(List.of());

            List<User> result = userService.findAll();

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("FindById Method Tests")
    class FindByIdTests {

        @Test
        @DisplayName("Should return user when found")
        void shouldReturnUserWhenFound() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            Optional<User> result = userService.findById(1L);

            assertTrue(result.isPresent());
            assertEquals(testUser.getId(), result.get().getId());
            assertEquals(testUser.getName(), result.get().getName());
        }

        @Test
        @DisplayName("Should return empty Optional when user not found")
        void shouldReturnEmptyOptionalWhenNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            Optional<User> result = userService.findById(999L);

            assertFalse(result.isPresent());
        }
    }

    @Nested
    @DisplayName("FindByEmail Method Tests")
    class FindByEmailTests {

        @Test
        @DisplayName("Should return user when email exists")
        void shouldReturnUserWhenEmailExists() {
            when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(testUser));

            Optional<User> result = userService.findByEmail("john@example.com");

            assertTrue(result.isPresent());
            assertEquals("john@example.com", result.get().getEmail());
        }

        @Test
        @DisplayName("Should return empty Optional when email not found")
        void shouldReturnEmptyOptionalWhenEmailNotFound() {
            when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

            Optional<User> result = userService.findByEmail("nonexistent@example.com");

            assertFalse(result.isPresent());
        }
    }

    @Nested
    @DisplayName("Create Method Tests")
    class CreateTests {

        @Test
        @DisplayName("Should create user successfully")
        void shouldCreateUserSuccessfully() {
            User newUser = new User(null, "New User", "new@example.com");
            User savedUser = new User(3L, "New User", "new@example.com");

            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            User result = userService.create(newUser);

            assertNotNull(result);
            assertEquals(3L, result.getId());
            assertEquals("New User", result.getName());
            verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void shouldThrowExceptionWhenEmailExists() {
            User duplicateUser = new User(null, "Duplicate", "john@example.com");

            when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () -> {
                userService.create(duplicateUser);
            });
            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception with correct message when email exists")
        void shouldThrowExceptionWithCorrectMessageWhenEmailExists() {
            User duplicateUser = new User(null, "Duplicate", "john@example.com");

            when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
                userService.create(duplicateUser);
            });

            assertTrue(exception.getMessage().contains("john@example.com"));
        }
    }

    @Nested
    @DisplayName("Update Method Tests")
    class UpdateTests {

        @Test
        @DisplayName("Should update user successfully")
        void shouldUpdateUserSuccessfully() {
            User updatedDetails = new User(null, "John Updated", "john.updated@example.com");
            User updatedUser = new User(1L, "John Updated", "john.updated@example.com");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(updatedUser);

            User result = userService.update(1L, updatedDetails);

            assertNotNull(result);
            assertEquals("John Updated", result.getName());
            verify(userRepository, times(1)).findById(1L);
            verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when user not found for update")
        void shouldThrowExceptionWhenUserNotFoundForUpdate() {
            User updateDetails = new User(null, "Updated", "updated@example.com");

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class, () -> {
                userService.update(999L, updateDetails);
            });
            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception with correct message when user not found")
        void shouldThrowExceptionWithCorrectMessageWhenUserNotFound() {
            User updateDetails = new User(null, "Updated", "updated@example.com");

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
                userService.update(999L, updateDetails);
            });

            assertTrue(exception.getMessage().contains("999"));
        }
    }

    @Nested
    @DisplayName("Delete Method Tests")
    class DeleteTests {

        @Test
        @DisplayName("Should delete user successfully")
        void shouldDeleteUserSuccessfully() {
            when(userRepository.existsById(1L)).thenReturn(true);
            doNothing().when(userRepository).deleteById(1L);

            assertDoesNotThrow(() -> userService.delete(1L));
            verify(userRepository, times(1)).deleteById(1L);
        }

        @Test
        @DisplayName("Should throw exception when user not found for delete")
        void shouldThrowExceptionWhenUserNotFoundForDelete() {
            when(userRepository.existsById(999L)).thenReturn(false);

            assertThrows(IllegalArgumentException.class, () -> {
                userService.delete(999L);
            });
            verify(userRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("Should throw exception with correct message when user not found")
        void shouldThrowExceptionWithCorrectMessageWhenUserNotFoundForDelete() {
            when(userRepository.existsById(999L)).thenReturn(false);

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
                userService.delete(999L);
            });

            assertTrue(exception.getMessage().contains("999"));
        }
    }
}
