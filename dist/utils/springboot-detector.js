import * as fs from "fs";
import * as path from "path";
/**
 * Checks if a project is a Spring Boot project by examining pom.xml
 * @param projectPath - Path to the project directory
 * @returns true if Spring Boot dependencies are found
 */
export async function isSpringBootProject(projectPath) {
    try {
        const pomPath = path.join(projectPath, "pom.xml");
        if (!fs.existsSync(pomPath)) {
            return false;
        }
        const pomContent = fs.readFileSync(pomPath, "utf-8");
        // Check for Spring Boot starter dependencies
        const springBootIndicators = [
            "spring-boot-starter-test",
            "spring-boot-starter-web",
            "spring-boot-starter-data-jpa",
            "spring-boot-starter-parent",
            "org.springframework.boot",
        ];
        return springBootIndicators.some((indicator) => pomContent.includes(indicator));
    }
    catch (error) {
        return false;
    }
}
/**
 * Detects the Spring Boot component type from source code annotations
 * @param sourceCode - Java source code content
 * @returns The component type or null if not a Spring Boot component
 */
export function detectComponentType(sourceCode) {
    // Check for controller annotations (order matters - RestController extends Controller)
    if (/@RestController\b/.test(sourceCode)) {
        return "controller";
    }
    if (/@Controller\b/.test(sourceCode)) {
        return "controller";
    }
    // Check for service annotation
    if (/@Service\b/.test(sourceCode)) {
        return "service";
    }
    // Check for repository annotations
    if (/@Repository\b/.test(sourceCode)) {
        return "repository";
    }
    // Check if it extends JpaRepository (interface-based repository)
    if (/extends\s+JpaRepository\b/.test(sourceCode)) {
        return "repository";
    }
    // Check for configuration annotation
    if (/@Configuration\b/.test(sourceCode)) {
        return "configuration";
    }
    // Check for generic component annotation
    if (/@Component\b/.test(sourceCode)) {
        return "component";
    }
    return null;
}
/**
 * Extracts all Spring Boot annotations from source code
 * @param sourceCode - Java source code content
 * @returns Array of annotation names found
 */
export function extractSpringAnnotations(sourceCode) {
    const annotations = [];
    const springAnnotations = [
        "RestController",
        "Controller",
        "Service",
        "Repository",
        "Component",
        "Configuration",
        "SpringBootApplication",
        "Autowired",
        "RequestMapping",
        "GetMapping",
        "PostMapping",
        "PutMapping",
        "DeleteMapping",
        "PatchMapping",
        "PathVariable",
        "RequestBody",
        "RequestParam",
        "Entity",
        "Table",
        "Id",
        "GeneratedValue",
        "Transactional",
    ];
    for (const annotation of springAnnotations) {
        const regex = new RegExp(`@${annotation}\\b`, "g");
        if (regex.test(sourceCode)) {
            annotations.push(annotation);
        }
    }
    return annotations;
}
/**
 * Extracts the class name from Java source code
 * @param sourceCode - Java source code content
 * @returns The class name or null if not found
 */
export function extractClassName(sourceCode) {
    const classMatch = sourceCode.match(/(?:public\s+)?(?:class|interface)\s+(\w+)/);
    return classMatch ? classMatch[1] : null;
}
/**
 * Extracts the package name from Java source code
 * @param sourceCode - Java source code content
 * @returns The package name or null if not found
 */
export function extractPackageName(sourceCode) {
    const packageMatch = sourceCode.match(/package\s+([\w.]+);/);
    return packageMatch ? packageMatch[1] : null;
}
/**
 * Finds the application.yml or application.properties test config file
 * @param projectPath - Path to the project directory
 * @returns Path to the test config file or null if not found
 */
export async function findTestConfiguration(projectPath) {
    const possiblePaths = [
        path.join(projectPath, "src/test/resources/application-test.yml"),
        path.join(projectPath, "src/test/resources/application-test.properties"),
        path.join(projectPath, "src/test/resources/application.yml"),
        path.join(projectPath, "src/test/resources/application.properties"),
    ];
    for (const configPath of possiblePaths) {
        if (fs.existsSync(configPath)) {
            return configPath;
        }
    }
    return null;
}
/**
 * Checks if a Java file is a main Application class (entry point)
 * @param sourceCode - Java source code content
 * @returns true if it's a Spring Boot application class
 */
export function isApplicationClass(sourceCode) {
    return /@SpringBootApplication\b/.test(sourceCode);
}
