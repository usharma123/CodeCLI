package com.example.controller;

import com.example.model.User;
import com.example.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for UserController using standalone MockMvc
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserController Tests")
class UserControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private User testUser;
    private User anotherUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
        objectMapper = new ObjectMapper();
        testUser = new User(1L, "John Doe", "john@example.com");
        anotherUser = new User(2L, "Jane Smith", "jane@example.com");
    }

    @Nested
    @DisplayName("GET /api/users - Get All Users")
    class GetAllUsersTests {

        @Test
        @DisplayName("Should return all users")
        void shouldReturnAllUsers() throws Exception {
            List<User> users = Arrays.asList(testUser, anotherUser);
            when(userService.findAll()).thenReturn(users);

            mockMvc.perform(get("/api/users")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].name").value("John Doe"))
                    .andExpect(jsonPath("$[1].id").value(2))
                    .andExpect(jsonPath("$[1].name").value("Jane Smith"));
        }

        @Test
        @DisplayName("Should return empty list when no users")
        void shouldReturnEmptyListWhenNoUsers() throws Exception {
            when(userService.findAll()).thenReturn(List.of());

            mockMvc.perform(get("/api/users")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }

    @Nested
    @DisplayName("GET /api/users/{id} - Get User By ID")
    class GetUserByIdTests {

        @Test
        @DisplayName("Should return user when found")
        void shouldReturnUserWhenFound() throws Exception {
            when(userService.findById(1L)).thenReturn(Optional.of(testUser));

            mockMvc.perform(get("/api/users/1")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.name").value("John Doe"))
                    .andExpect(jsonPath("$.email").value("john@example.com"));
        }

        @Test
        @DisplayName("Should return 404 when user not found")
        void shouldReturn404WhenUserNotFound() throws Exception {
            when(userService.findById(999L)).thenReturn(Optional.empty());

            mockMvc.perform(get("/api/users/999")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/users - Create User")
    class CreateUserTests {

        @Test
        @DisplayName("Should create user successfully")
        void shouldCreateUserSuccessfully() throws Exception {
            User newUser = new User(null, "New User", "new@example.com");
            User savedUser = new User(3L, "New User", "new@example.com");

            when(userService.create(any(User.class))).thenReturn(savedUser);

            mockMvc.perform(post("/api/users")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(newUser)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(3))
                    .andExpect(jsonPath("$.name").value("New User"))
                    .andExpect(jsonPath("$.email").value("new@example.com"));
        }

        @Test
        @DisplayName("Should return 400 when email already exists")
        void shouldReturn400WhenEmailExists() throws Exception {
            User duplicateUser = new User(null, "Duplicate", "john@example.com");

            when(userService.create(any(User.class)))
                    .thenThrow(new IllegalArgumentException("User with email john@example.com already exists"));

            mockMvc.perform(post("/api/users")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(duplicateUser)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should handle user object correctly")
        void shouldHandleUserObjectCorrectly() throws Exception {
            User userToCreate = new User(null, "Test User", "test@example.com");
            User createdUser = new User(1L, "Test User", "test@example.com");

            when(userService.create(any(User.class))).thenReturn(createdUser);

            mockMvc.perform(post("/api/users")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(userToCreate)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.name").value("Test User"))
                    .andExpect(jsonPath("$.email").value("test@example.com"));
        }
    }

    @Nested
    @DisplayName("PUT /api/users/{id} - Update User")
    class UpdateUserTests {

        @Test
        @DisplayName("Should update user successfully")
        void shouldUpdateUserSuccessfully() throws Exception {
            User updatedDetails = new User(null, "John Updated", "john.updated@example.com");
            User updatedUser = new User(1L, "John Updated", "john.updated@example.com");

            when(userService.update(eq(1L), any(User.class))).thenReturn(updatedUser);

            mockMvc.perform(put("/api/users/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updatedDetails)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.name").value("John Updated"))
                    .andExpect(jsonPath("$.email").value("john.updated@example.com"));
        }

        @Test
        @DisplayName("Should return 404 when user not found for update")
        void shouldReturn404WhenUserNotFoundForUpdate() throws Exception {
            User updatedDetails = new User(null, "Updated", "updated@example.com");

            when(userService.update(eq(999L), any(User.class)))
                    .thenThrow(new IllegalArgumentException("User not found with id: 999"));

            mockMvc.perform(put("/api/users/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updatedDetails)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/users/{id} - Delete User")
    class DeleteUserTests {

        @Test
        @DisplayName("Should delete user successfully")
        void shouldDeleteUserSuccessfully() throws Exception {
            doNothing().when(userService).delete(1L);

            mockMvc.perform(delete("/api/users/1")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("Should return 404 when user not found for delete")
        void shouldReturn404WhenUserNotFoundForDelete() throws Exception {
            doThrow(new IllegalArgumentException("User not found with id: 999"))
                    .when(userService).delete(999L);

            mockMvc.perform(delete("/api/users/999")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Edge Cases and Error Handling")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should return correct response structure for single user")
        void shouldReturnCorrectResponseStructureForSingleUser() throws Exception {
            when(userService.findById(1L)).thenReturn(Optional.of(testUser));

            mockMvc.perform(get("/api/users/1")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isNotEmpty())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.name").exists())
                    .andExpect(jsonPath("$.email").exists());
        }

        @Test
        @DisplayName("Should handle multiple users in list")
        void shouldHandleMultipleUsersInList() throws Exception {
            List<User> users = Arrays.asList(testUser, anotherUser);
            when(userService.findAll()).thenReturn(users);

            mockMvc.perform(get("/api/users")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].name").value("John Doe"))
                    .andExpect(jsonPath("$[0].email").value("john@example.com"))
                    .andExpect(jsonPath("$[1].id").value(2))
                    .andExpect(jsonPath("$[1].name").value("Jane Smith"))
                    .andExpect(jsonPath("$[1].email").value("jane@example.com"));
        }
    }
}
