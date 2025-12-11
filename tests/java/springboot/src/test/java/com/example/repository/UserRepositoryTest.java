package com.example.repository;

import com.example.model.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for UserRepository using @DataJpaTest for JPA slice testing
 *
 * @DataJpaTest auto-configures an in-memory H2 database and provides TestEntityManager.
 * It focuses only on JPA components (repositories and entities).
 * Transactions are rolled back after each test automatically.
 */
@DataJpaTest
@Tag("sanity")  // Runs in sanity mode (fast slice testing with H2)
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository repository;

    @Test
    @DisplayName("should save and find entity by ID")
    void testSaveAndFindById() {
        // Arrange: Create test entity
        User user = new User(null, "John Doe", "john@example.com");

        // Act: Persist and flush to database
        User saved = entityManager.persistAndFlush(user);

        // Assert: Find by ID and verify
        Optional<User> found = repository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("John Doe", found.get().getName());
        assertEquals("john@example.com", found.get().getEmail());
    }

    @Test
    @DisplayName("should find all entities")
    void testFindAll() {
        // Arrange: Create and persist multiple test entities
        User user1 = new User(null, "John Doe", "john@example.com");
        User user2 = new User(null, "Jane Doe", "jane@example.com");
        entityManager.persist(user1);
        entityManager.persist(user2);
        entityManager.flush();

        // Act
        List<User> users = repository.findAll();

        // Assert
        assertEquals(2, users.size());
    }

    @Test
    @DisplayName("findByEmail should return user when email exists")
    void testFindByEmailWhenExists() {
        // Arrange
        User user = new User(null, "John Doe", "john@example.com");
        entityManager.persistAndFlush(user);

        // Act
        Optional<User> found = repository.findByEmail("john@example.com");

        // Assert
        assertTrue(found.isPresent());
        assertEquals("John Doe", found.get().getName());
    }

    @Test
    @DisplayName("findByEmail should return empty when email does not exist")
    void testFindByEmailWhenNotExists() {
        // Act
        Optional<User> found = repository.findByEmail("nonexistent@example.com");

        // Assert
        assertFalse(found.isPresent());
    }

    @Test
    @DisplayName("existsByEmail should return true when email exists")
    void testExistsByEmailWhenExists() {
        // Arrange
        User user = new User(null, "John Doe", "john@example.com");
        entityManager.persistAndFlush(user);

        // Act
        boolean exists = repository.existsByEmail("john@example.com");

        // Assert
        assertTrue(exists);
    }

    @Test
    @DisplayName("existsByEmail should return false when email does not exist")
    void testExistsByEmailWhenNotExists() {
        // Act
        boolean exists = repository.existsByEmail("nonexistent@example.com");

        // Assert
        assertFalse(exists);
    }

    @Test
    @DisplayName("should update existing entity")
    void testUpdate() {
        // Arrange: Persist entity
        User user = new User(null, "John Doe", "john@example.com");
        User saved = entityManager.persistAndFlush(user);

        // Act: Modify and save
        saved.setName("John Updated");
        User updated = repository.save(saved);
        entityManager.flush();
        entityManager.clear();

        // Assert: Fetch entity again and verify changes
        Optional<User> found = repository.findById(updated.getId());
        assertTrue(found.isPresent());
        assertEquals("John Updated", found.get().getName());
    }

    @Test
    @DisplayName("should delete entity")
    void testDelete() {
        // Arrange: Persist entity
        User user = new User(null, "John Doe", "john@example.com");
        User saved = entityManager.persistAndFlush(user);
        Long userId = saved.getId();

        // Act: Delete entity
        repository.deleteById(userId);
        entityManager.flush();

        // Assert: Verify entity no longer exists
        Optional<User> result = repository.findById(userId);
        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("should enforce unique email constraint")
    void testUniqueEmailConstraint() {
        // Arrange
        User user1 = new User(null, "John Doe", "duplicate@example.com");
        User user2 = new User(null, "Jane Doe", "duplicate@example.com");

        // Act & Assert
        entityManager.persist(user1);
        entityManager.flush();

        // Attempting to persist duplicate email should fail
        assertThrows(Exception.class, () -> {
            entityManager.persist(user2);
            entityManager.flush();
        });
    }
}
