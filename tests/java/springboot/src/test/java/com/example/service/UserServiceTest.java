package com.example.service;

import com.example.model.User;
import com.example.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

/**
 * Test class for UserService using Mockito for unit testing
 *
 * @ExtendWith(MockitoExtension.class) enables Mockito annotations.
 * This is a pure unit test - no Spring context is loaded (fastest tests).
 * Use @Mock for dependencies and @InjectMocks for the class under test.
 */
@ExtendWith(MockitoExtension.class)
@Tag("smoke")  // Runs in smoke mode (fastest tests, no Spring context)
class UserServiceTest {

    @Mock
    private UserRepository repository;

    @InjectMocks
    private UserService service;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "John Doe", "john@example.com");
    }

    @Test
    @DisplayName("findAll should return all items")
    void testFindAll() {
        // Arrange: Create mock data
        List<User> mockData = Arrays.asList(testUser, new User(2L, "Jane Doe", "jane@example.com"));
        when(repository.findAll()).thenReturn(mockData);

        // Act: Call the service method
        List<User> result = service.findAll();

        // Assert: Verify the result
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(mockData, result);
        verify(repository).findAll();
    }

    @Test
    @DisplayName("findById should return item when it exists")
    void testFindByIdWhenExists() {
        // Arrange
        when(repository.findById(1L)).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = service.findById(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testUser, result.get());
        verify(repository).findById(1L);
    }

    @Test
    @DisplayName("findById should return empty when not found")
    void testFindByIdWhenNotFound() {
        // Arrange
        when(repository.findById(999L)).thenReturn(Optional.empty());

        // Act
        Optional<User> result = service.findById(999L);

        // Assert
        assertFalse(result.isPresent());
        verify(repository).findById(999L);
    }

    @Test
    @DisplayName("create should save and return new item")
    void testCreate() {
        // Arrange
        User newUser = new User(null, "New User", "new@example.com");
        User savedUser = new User(3L, "New User", "new@example.com");
        when(repository.existsByEmail("new@example.com")).thenReturn(false);
        when(repository.save(newUser)).thenReturn(savedUser);

        // Act
        User result = service.create(newUser);

        // Assert
        assertNotNull(result);
        assertEquals(3L, result.getId());
        assertEquals("New User", result.getName());
        verify(repository).existsByEmail("new@example.com");
        verify(repository).save(newUser);
    }

    @Test
    @DisplayName("create should throw exception when email exists")
    void testCreateDuplicateEmail() {
        // Arrange
        User duplicateUser = new User(null, "Duplicate", "john@example.com");
        when(repository.existsByEmail("john@example.com")).thenReturn(true);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> service.create(duplicateUser));
        verify(repository).existsByEmail("john@example.com");
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("update should modify existing item")
    void testUpdate() {
        // Arrange
        User updatedData = new User(null, "John Updated", "john.updated@example.com");
        when(repository.findById(1L)).thenReturn(Optional.of(testUser));
        when(repository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = service.update(1L, updatedData);

        // Assert
        assertNotNull(result);
        verify(repository).findById(1L);
        verify(repository).save(testUser);
    }

    @Test
    @DisplayName("update should throw exception when user not found")
    void testUpdateNotFound() {
        // Arrange
        User updatedData = new User(null, "Updated", "updated@example.com");
        when(repository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> service.update(999L, updatedData));
        verify(repository).findById(999L);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("delete should remove item")
    void testDelete() {
        // Arrange
        when(repository.existsById(1L)).thenReturn(true);
        doNothing().when(repository).deleteById(1L);

        // Act
        service.delete(1L);

        // Assert
        verify(repository).existsById(1L);
        verify(repository).deleteById(1L);
    }

    @Test
    @DisplayName("delete should throw exception when user not found")
    void testDeleteNotFound() {
        // Arrange
        when(repository.existsById(999L)).thenReturn(false);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> service.delete(999L));
        verify(repository).existsById(999L);
        verify(repository, never()).deleteById(any());
    }
}
