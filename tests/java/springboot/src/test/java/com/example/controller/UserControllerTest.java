package com.example.controller;

import com.example.model.User;
import com.example.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

/**
 * Test class for UserController using @WebMvcTest for slice testing
 *
 * @WebMvcTest focuses only on Spring MVC components and auto-configures MockMvc.
 * It does not load the full application context, making tests faster.
 * Use @MockBean to mock dependencies like services.
 */
@WebMvcTest(UserController.class)
@Tag("sanity")  // Runs in sanity mode (fast slice testing, no full context)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("GET /api/users should return list of users")
    void testGetAllUsers() throws Exception {
        // Arrange
        List<User> users = Arrays.asList(
                new User(1L, "John Doe", "john@example.com"),
                new User(2L, "Jane Doe", "jane@example.com")
        );
        when(userService.findAll()).thenReturn(users);

        // Act & Assert
        mockMvc.perform(get("/api/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("John Doe"))
                .andExpect(jsonPath("$[0].email").value("john@example.com"))
                .andExpect(jsonPath("$[1].name").value("Jane Doe"));

        verify(userService).findAll();
    }

    @Test
    @DisplayName("GET /api/users/{id} should return user when found")
    void testGetUserByIdWhenFound() throws Exception {
        // Arrange
        User user = new User(1L, "John Doe", "john@example.com");
        when(userService.findById(1L)).thenReturn(Optional.of(user));

        // Act & Assert
        mockMvc.perform(get("/api/users/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("John Doe"))
                .andExpect(jsonPath("$.email").value("john@example.com"));

        verify(userService).findById(1L);
    }

    @Test
    @DisplayName("GET /api/users/{id} should return 404 when not found")
    void testGetUserByIdWhenNotFound() throws Exception {
        // Arrange
        when(userService.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/users/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(userService).findById(999L);
    }

    @Test
    @DisplayName("POST /api/users should create user")
    void testCreateUser() throws Exception {
        // Arrange
        User newUser = new User(null, "New User", "new@example.com");
        User savedUser = new User(3L, "New User", "new@example.com");
        when(userService.create(any(User.class))).thenReturn(savedUser);

        // Act & Assert
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.name").value("New User"))
                .andExpect(jsonPath("$.email").value("new@example.com"));

        verify(userService).create(any(User.class));
    }

    @Test
    @DisplayName("POST /api/users should return 400 when email exists")
    void testCreateUserDuplicateEmail() throws Exception {
        // Arrange
        User newUser = new User(null, "Duplicate", "john@example.com");
        when(userService.create(any(User.class)))
                .thenThrow(new IllegalArgumentException("User with email john@example.com already exists"));

        // Act & Assert
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isBadRequest());

        verify(userService).create(any(User.class));
    }

    @Test
    @DisplayName("PUT /api/users/{id} should update user")
    void testUpdateUser() throws Exception {
        // Arrange
        User updatedUser = new User(1L, "John Updated", "john.updated@example.com");
        when(userService.update(eq(1L), any(User.class))).thenReturn(updatedUser);

        // Act & Assert
        mockMvc.perform(put("/api/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("John Updated"))
                .andExpect(jsonPath("$.email").value("john.updated@example.com"));

        verify(userService).update(eq(1L), any(User.class));
    }

    @Test
    @DisplayName("PUT /api/users/{id} should return 404 when user not found")
    void testUpdateUserNotFound() throws Exception {
        // Arrange
        User updatedUser = new User(null, "Updated", "updated@example.com");
        when(userService.update(eq(999L), any(User.class)))
                .thenThrow(new IllegalArgumentException("User not found"));

        // Act & Assert
        mockMvc.perform(put("/api/users/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedUser)))
                .andExpect(status().isNotFound());

        verify(userService).update(eq(999L), any(User.class));
    }

    @Test
    @DisplayName("DELETE /api/users/{id} should delete user")
    void testDeleteUser() throws Exception {
        // Arrange
        doNothing().when(userService).delete(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/users/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        verify(userService).delete(1L);
    }

    @Test
    @DisplayName("DELETE /api/users/{id} should return 404 when user not found")
    void testDeleteUserNotFound() throws Exception {
        // Arrange
        doThrow(new IllegalArgumentException("User not found"))
                .when(userService).delete(999L);

        // Act & Assert
        mockMvc.perform(delete("/api/users/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(userService).delete(999L);
    }
}
