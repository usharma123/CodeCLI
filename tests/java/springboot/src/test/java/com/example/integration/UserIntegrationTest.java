package com.example.integration;

import com.example.model.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for Application using @SpringBootTest
 *
 * @SpringBootTest loads the full application context and starts the embedded server.
 * Use RANDOM_PORT to avoid port conflicts when running tests in parallel.
 * TestRestTemplate is provided for making real HTTP requests to the application.
 *
 * These tests are slower but verify the entire application works together.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")  // Uses application-test.yml configuration
@Tag("integration")  // Runs in full mode (comprehensive but slow)
class UserIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String getBaseUrl() {
        return "http://localhost:" + port;
    }

    @Test
    @DisplayName("application context should load successfully")
    void contextLoads() {
        // This test verifies that the Spring application context starts without errors
        // If any configuration issues exist, this test will fail during context loading
    }

    @Test
    @DisplayName("complete CRUD workflow should work end-to-end")
    void testCrudWorkflow() {
        // 1. CREATE: Post new user
        User newUser = new User(null, "Integration Test User", "integration@example.com");
        ResponseEntity<User> createResponse = restTemplate.postForEntity(
                getBaseUrl() + "/api/users",
                newUser,
                User.class
        );
        assertEquals(HttpStatus.CREATED, createResponse.getStatusCode());
        assertNotNull(createResponse.getBody());
        assertNotNull(createResponse.getBody().getId());
        assertEquals("Integration Test User", createResponse.getBody().getName());

        // 2. READ: Get the created user
        Long userId = createResponse.getBody().getId();
        ResponseEntity<User> getResponse = restTemplate.getForEntity(
                getBaseUrl() + "/api/users/" + userId,
                User.class
        );
        assertEquals(HttpStatus.OK, getResponse.getStatusCode());
        assertEquals("Integration Test User", getResponse.getBody().getName());
        assertEquals("integration@example.com", getResponse.getBody().getEmail());

        // 3. UPDATE: Modify the user
        User updatedUser = getResponse.getBody();
        updatedUser.setName("Updated Integration User");
        updatedUser.setEmail("updated.integration@example.com");
        restTemplate.put(getBaseUrl() + "/api/users/" + userId, updatedUser);

        // 4. VERIFY UPDATE: Get user again and check changes
        ResponseEntity<User> verifyResponse = restTemplate.getForEntity(
                getBaseUrl() + "/api/users/" + userId,
                User.class
        );
        assertEquals(HttpStatus.OK, verifyResponse.getStatusCode());
        assertEquals("Updated Integration User", verifyResponse.getBody().getName());
        assertEquals("updated.integration@example.com", verifyResponse.getBody().getEmail());

        // 5. DELETE: Remove the user
        restTemplate.delete(getBaseUrl() + "/api/users/" + userId);

        // 6. VERIFY DELETION: Attempt to get deleted user
        ResponseEntity<User> deletedResponse = restTemplate.getForEntity(
                getBaseUrl() + "/api/users/" + userId,
                User.class
        );
        assertEquals(HttpStatus.NOT_FOUND, deletedResponse.getStatusCode());
    }

    @Test
    @DisplayName("GET all endpoint should return list")
    void testGetAll() {
        ResponseEntity<User[]> response = restTemplate.getForEntity(
                getBaseUrl() + "/api/users",
                User[].class
        );
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    @DisplayName("POST with duplicate email should return 400")
    void testCreateDuplicateEmail() {
        // Create first user
        User user1 = new User(null, "User 1", "duplicate@example.com");
        ResponseEntity<User> response1 = restTemplate.postForEntity(
                getBaseUrl() + "/api/users",
                user1,
                User.class
        );
        assertEquals(HttpStatus.CREATED, response1.getStatusCode());

        // Try to create second user with same email
        User user2 = new User(null, "User 2", "duplicate@example.com");
        ResponseEntity<User> response2 = restTemplate.postForEntity(
                getBaseUrl() + "/api/users",
                user2,
                User.class
        );
        assertEquals(HttpStatus.BAD_REQUEST, response2.getStatusCode());

        // Cleanup
        if (response1.getBody() != null && response1.getBody().getId() != null) {
            restTemplate.delete(getBaseUrl() + "/api/users/" + response1.getBody().getId());
        }
    }

    @Test
    @DisplayName("GET non-existent user should return 404")
    void testGetNonExistentUser() {
        ResponseEntity<User> response = restTemplate.getForEntity(
                getBaseUrl() + "/api/users/99999",
                User.class
        );
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("DELETE non-existent user should return 404")
    void testDeleteNonExistentUser() {
        ResponseEntity<Void> response = restTemplate.exchange(
                getBaseUrl() + "/api/users/99999",
                org.springframework.http.HttpMethod.DELETE,
                null,
                Void.class
        );
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
