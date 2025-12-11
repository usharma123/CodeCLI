/**
 * Generates a Spring Boot Controller test using @WebMvcTest
 * @param className - Name of the controller class
 * @param packageName - Java package name
 * @returns Complete test class content
 */
export function generateControllerTest(className, packageName) {
    const serviceName = className.replace("Controller", "Service");
    const testClassName = `${className}Test`;
    return `package ${packageName};

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

/**
 * Test class for ${className} using @WebMvcTest for slice testing
 *
 * @WebMvcTest focuses only on Spring MVC components and auto-configures MockMvc.
 * It does not load the full application context, making tests faster.
 * Use @MockBean to mock dependencies like services.
 */
@WebMvcTest(${className}.class)
@Tag("sanity")  // Runs in sanity mode (fast slice testing, no full context)
class ${testClassName} {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ${serviceName} ${serviceName.substring(0, 1).toLowerCase() + serviceName.substring(1)};

    @Test
    @DisplayName("GET endpoint should return list of items")
    void testGetAll() throws Exception {
        // Arrange: Mock the service response
        // TODO: Create mock data and configure service behavior
        // Example: when(service.findAll()).thenReturn(mockList);

        // Act & Assert: Perform request and verify response
        mockMvc.perform(get("/api/resource")  // TODO: Update endpoint path
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));  // TODO: Update expected size

        // TODO: Verify service was called
        // verify(service).findAll();
    }

    @Test
    @DisplayName("GET by ID should return single item")
    void testGetById() throws Exception {
        // TODO: Implement GET by ID test
        // 1. Mock service.findById(id) to return test data
        // 2. Perform GET request to /api/resource/{id}
        // 3. Assert status is 200 OK
        // 4. Assert response body contains expected data
        // 5. Verify service.findById was called with correct ID
    }

    @Test
    @DisplayName("POST should create new item")
    void testCreate() throws Exception {
        // TODO: Implement POST test
        // 1. Create test JSON request body
        // 2. Mock service.create() to return saved entity
        // 3. Perform POST request with JSON body
        // 4. Assert status is 201 CREATED
        // 5. Assert response contains created entity
        // 6. Verify service.create was called
    }

    @Test
    @DisplayName("PUT should update existing item")
    void testUpdate() throws Exception {
        // TODO: Implement PUT test
        // Similar to POST but use put() instead of post()
        // Assert status is 200 OK for successful update
    }

    @Test
    @DisplayName("DELETE should remove item")
    void testDelete() throws Exception {
        // TODO: Implement DELETE test
        // 1. Mock service.delete(id) to do nothing (void method)
        // 2. Perform DELETE request to /api/resource/{id}
        // 3. Assert status is 204 NO_CONTENT
        // 4. Verify service.delete was called with correct ID
    }

    @Test
    @DisplayName("GET by ID should return 404 when not found")
    void testGetByIdNotFound() throws Exception {
        // TODO: Test error handling
        // 1. Mock service.findById(id) to throw EntityNotFoundException
        // 2. Perform GET request
        // 3. Assert status is 404 NOT_FOUND
    }
}
`;
}
/**
 * Generates a Spring Boot Service test using Mockito
 * @param className - Name of the service class
 * @param packageName - Java package name
 * @returns Complete test class content
 */
export function generateServiceTest(className, packageName) {
    const repositoryName = className.replace("Service", "Repository");
    const testClassName = `${className}Test`;
    return `package ${packageName};

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
 * Test class for ${className} using Mockito for unit testing
 *
 * @ExtendWith(MockitoExtension.class) enables Mockito annotations.
 * This is a pure unit test - no Spring context is loaded (fastest tests).
 * Use @Mock for dependencies and @InjectMocks for the class under test.
 */
@ExtendWith(MockitoExtension.class)
@Tag("smoke")  // Runs in smoke mode (fastest tests, no Spring context)
class ${testClassName} {

    @Mock
    private ${repositoryName} repository;

    @InjectMocks
    private ${className} service;

    @BeforeEach
    void setUp() {
        // Optional: Initialize test data or common mock behaviors
    }

    @Test
    @DisplayName("findAll should return all items")
    void testFindAll() {
        // Arrange: Create mock data
        // TODO: Create test entities
        // Example: List<Entity> mockData = Arrays.asList(entity1, entity2);
        // when(repository.findAll()).thenReturn(mockData);

        // Act: Call the service method
        // List<Entity> result = service.findAll();

        // Assert: Verify the result
        // assertNotNull(result);
        // assertEquals(mockData.size(), result.size());
        // verify(repository).findAll();
    }

    @Test
    @DisplayName("findById should return item when it exists")
    void testFindByIdWhenExists() {
        // TODO: Implement findById test for existing entity
        // 1. Create mock entity with ID
        // 2. Mock repository.findById(id) to return Optional.of(entity)
        // 3. Call service.findById(id)
        // 4. Assert result is present and equals mock entity
        // 5. Verify repository.findById was called
    }

    @Test
    @DisplayName("findById should throw exception when not found")
    void testFindByIdWhenNotFound() {
        // TODO: Implement findById test for non-existent entity
        // 1. Mock repository.findById(id) to return Optional.empty()
        // 2. Assert service.findById(id) throws exception
        // Example: assertThrows(EntityNotFoundException.class, () -> service.findById(999L));
    }

    @Test
    @DisplayName("create should save and return new item")
    void testCreate() {
        // TODO: Implement create test
        // 1. Create test entity
        // 2. Mock repository.save(entity) to return saved entity with ID
        // 3. Call service.create(entity)
        // 4. Assert returned entity has ID
        // 5. Verify repository.save was called
    }

    @Test
    @DisplayName("update should modify existing item")
    void testUpdate() {
        // TODO: Implement update test
        // 1. Create existing entity mock
        // 2. Mock repository.findById to return existing entity
        // 3. Mock repository.save to return updated entity
        // 4. Call service.update(id, updatedData)
        // 5. Assert changes were applied
        // 6. Verify repository methods were called
    }

    @Test
    @DisplayName("delete should remove item")
    void testDelete() {
        // TODO: Implement delete test
        // 1. Mock repository.existsById(id) to return true
        // 2. Mock repository.deleteById(id) (void method)
        // 3. Call service.delete(id)
        // 4. Verify repository.deleteById was called with correct ID
    }

    @Test
    @DisplayName("business logic validation works correctly")
    void testBusinessLogic() {
        // TODO: Add tests for any business logic in the service
        // Examples: validation rules, calculations, transformations
    }
}
`;
}
/**
 * Generates a Spring Boot Repository test using @DataJpaTest
 * @param className - Name of the repository interface
 * @param packageName - Java package name
 * @param entityName - Name of the entity class
 * @returns Complete test class content
 */
export function generateRepositoryTest(className, packageName, entityName) {
    const testClassName = `${className}Test`;
    const entity = entityName || className.replace("Repository", "");
    return `package ${packageName};

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
 * Test class for ${className} using @DataJpaTest for JPA slice testing
 *
 * @DataJpaTest auto-configures an in-memory H2 database and provides TestEntityManager.
 * It focuses only on JPA components (repositories and entities).
 * Transactions are rolled back after each test automatically.
 */
@DataJpaTest
@Tag("sanity")  // Runs in sanity mode (fast slice testing with H2)
class ${testClassName} {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ${className} repository;

    @Test
    @DisplayName("should save and find entity by ID")
    void testSaveAndFindById() {
        // Arrange: Create test entity
        // TODO: Create entity instance
        // Example: ${entity} entity = new ${entity}();
        // entity.setName("Test Name");

        // Act: Persist and flush to database
        // ${entity} saved = entityManager.persistAndFlush(entity);

        // Assert: Find by ID and verify
        // Optional<${entity}> found = repository.findById(saved.getId());
        // assertTrue(found.isPresent());
        // assertEquals("Test Name", found.get().getName());
    }

    @Test
    @DisplayName("should find all entities")
    void testFindAll() {
        // TODO: Implement findAll test
        // 1. Create and persist multiple test entities
        // 2. Call repository.findAll()
        // 3. Assert list size matches number of persisted entities
    }

    @Test
    @DisplayName("custom query method should work correctly")
    void testCustomQueryMethod() {
        // TODO: Test any custom query methods defined in repository
        // Example: If repository has findByEmail(String email)
        // 1. Persist entity with specific email
        // 2. Call repository.findByEmail(email)
        // 3. Assert entity is found
        // 4. Call with non-existent email
        // 5. Assert empty result
    }

    @Test
    @DisplayName("should update existing entity")
    void testUpdate() {
        // TODO: Implement update test
        // 1. Persist entity
        // 2. Modify a field
        // 3. Call repository.save(entity)
        // 4. Flush and clear persistence context
        // 5. Fetch entity again and verify changes
    }

    @Test
    @DisplayName("should delete entity")
    void testDelete() {
        // TODO: Implement delete test
        // 1. Persist entity
        // 2. Call repository.deleteById(id)
        // 3. Flush changes
        // 4. Verify entity no longer exists
        // Optional<${entity}> result = repository.findById(id);
        // assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("should handle relationships correctly")
    void testRelationships() {
        // TODO: If entity has relationships (OneToMany, ManyToOne, etc.)
        // Test that relationships are persisted and fetched correctly
    }
}
`;
}
/**
 * Generates a Spring Boot Integration test using @SpringBootTest
 * @param applicationClassName - Name of the main application class
 * @param packageName - Java package name
 * @returns Complete test class content
 */
export function generateIntegrationTest(applicationClassName, packageName) {
    const testClassName = `${applicationClassName}IntegrationTest`;
    return `package ${packageName};

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
 * Integration test for ${applicationClassName} using @SpringBootTest
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
class ${testClassName} {

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
        // TODO: Implement complete CRUD workflow test

        // 1. CREATE: Post new entity
        // Example:
        // Entity newEntity = new Entity(null, "Test Name", "test@example.com");
        // ResponseEntity<Entity> createResponse = restTemplate.postForEntity(
        //     getBaseUrl() + "/api/entities",
        //     newEntity,
        //     Entity.class
        // );
        // assertEquals(HttpStatus.CREATED, createResponse.getStatusCode());
        // assertNotNull(createResponse.getBody().getId());

        // 2. READ: Get the created entity
        // Long entityId = createResponse.getBody().getId();
        // ResponseEntity<Entity> getResponse = restTemplate.getForEntity(
        //     getBaseUrl() + "/api/entities/" + entityId,
        //     Entity.class
        // );
        // assertEquals(HttpStatus.OK, getResponse.getStatusCode());
        // assertEquals("Test Name", getResponse.getBody().getName());

        // 3. UPDATE: Modify the entity
        // Entity updatedEntity = getResponse.getBody();
        // updatedEntity.setName("Updated Name");
        // restTemplate.put(getBaseUrl() + "/api/entities/" + entityId, updatedEntity);

        // 4. VERIFY UPDATE: Get entity again and check changes
        // ResponseEntity<Entity> verifyResponse = restTemplate.getForEntity(
        //     getBaseUrl() + "/api/entities/" + entityId,
        //     Entity.class
        // );
        // assertEquals("Updated Name", verifyResponse.getBody().getName());

        // 5. DELETE: Remove the entity
        // restTemplate.delete(getBaseUrl() + "/api/entities/" + entityId);

        // 6. VERIFY DELETION: Attempt to get deleted entity
        // ResponseEntity<Entity> deletedResponse = restTemplate.getForEntity(
        //     getBaseUrl() + "/api/entities/" + entityId,
        //     Entity.class
        // );
        // assertEquals(HttpStatus.NOT_FOUND, deletedResponse.getStatusCode());
    }

    @Test
    @DisplayName("GET all endpoint should return list")
    void testGetAll() {
        // TODO: Test GET all endpoint
        // ResponseEntity<Entity[]> response = restTemplate.getForEntity(
        //     getBaseUrl() + "/api/entities",
        //     Entity[].class
        // );
        // assertEquals(HttpStatus.OK, response.getStatusCode());
        // assertNotNull(response.getBody());
    }

    @Test
    @DisplayName("invalid request should return appropriate error")
    void testErrorHandling() {
        // TODO: Test error handling
        // Example: Try to create entity with invalid data
        // ResponseEntity<String> response = restTemplate.postForEntity(
        //     getBaseUrl() + "/api/entities",
        //     invalidEntity,
        //     String.class
        // );
        // assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("security/authentication should work correctly")
    void testSecurity() {
        // TODO: If application has security enabled
        // Test that protected endpoints require authentication
        // Test that authorized requests work correctly
    }
}
`;
}
/**
 * Generates a Component test (generic fallback)
 * @param className - Name of the component class
 * @param packageName - Java package name
 * @returns Complete test class content
 */
export function generateComponentTest(className, packageName) {
    const testClassName = `${className}Test`;
    return `package ${packageName};

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Test class for ${className}
 *
 * This is a generic component test using Mockito.
 * Adjust annotations and setup based on your component's specific role.
 */
@ExtendWith(MockitoExtension.class)
@Tag("smoke")
class ${testClassName} {

    // TODO: Add @Mock annotations for dependencies
    // @Mock
    // private SomeDependency dependency;

    @InjectMocks
    private ${className} component;

    @Test
    @DisplayName("component should perform its function correctly")
    void testComponentFunction() {
        // TODO: Implement test for component's main function
        // 1. Arrange: Set up test data and mock behaviors
        // 2. Act: Call the component method
        // 3. Assert: Verify the expected outcome
        // 4. Verify: Check that dependencies were called correctly
    }

    @Test
    @DisplayName("component should handle edge cases")
    void testEdgeCases() {
        // TODO: Test edge cases and boundary conditions
    }

    @Test
    @DisplayName("component should handle errors gracefully")
    void testErrorHandling() {
        // TODO: Test error handling
        // Example: assertThrows(ExpectedException.class, () -> component.method());
    }
}
`;
}
/**
 * Main function to generate appropriate Spring Boot test based on component type
 * @param componentType - Type of Spring Boot component
 * @param className - Name of the class
 * @param packageName - Java package name
 * @param entityName - Optional entity name for repository tests
 * @returns Complete test class content
 */
export function generateSpringBootTest(componentType, className, packageName, entityName) {
    switch (componentType) {
        case "controller":
            return generateControllerTest(className, packageName);
        case "service":
            return generateServiceTest(className, packageName);
        case "repository":
            return generateRepositoryTest(className, packageName, entityName);
        case "configuration":
        case "component":
            return generateComponentTest(className, packageName);
        default:
            return generateComponentTest(className, packageName);
    }
}
