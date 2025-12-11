import { detectBuildTool } from "./src/utils/build-tool-detector.js";
import { detectLanguage, resolveTestPath } from "./src/utils/path-resolver.js";
import { isSpringBootProject } from "./src/utils/springboot-detector.js";
import * as path from "path";

async function verify() {
  console.log("=== Phase 1 Verification ===\n");

  // Test 1: Maven Spring Boot project
  console.log("Test 1: Maven Spring Boot Project");
  const mavenProjectPath = "tests/java/springboot";
  const mavenSourceFile = path.join(
    mavenProjectPath,
    "src/main/java/com/example/repository/UserRepository.java"
  );

  const buildConfig = await detectBuildTool(mavenProjectPath);
  console.log(`  Build Tool: ${buildConfig.tool}`);
  console.log(`  Main Source Dir: ${buildConfig.mainSourceDir}`);
  console.log(`  Test Source Dir: ${buildConfig.testSourceDir}`);
  console.log(`  Build File: ${buildConfig.buildFile}`);

  const language = detectLanguage(mavenSourceFile);
  console.log(`  Language: ${language}`);

  const isSpringBoot = await isSpringBootProject(mavenProjectPath, buildConfig);
  console.log(`  Is Spring Boot: ${isSpringBoot}`);

  const testPath = resolveTestPath(mavenSourceFile, buildConfig, language);
  console.log(`  Source: ${mavenSourceFile}`);
  console.log(`  Test Path: ${testPath}`);

  // Verify the path is correct
  const expectedTestPath = path.join(
    mavenProjectPath,
    "src/test/java/com/example/repository/UserRepositoryTest.java"
  );
  const pathCorrect = testPath === expectedTestPath;
  console.log(`  Path Resolution: ${pathCorrect ? "✅ PASS" : "❌ FAIL"}`);

  console.log("\n---\n");

  // Test 2: Gradle Spring Boot project
  console.log("Test 2: Gradle Spring Boot Project");
  const gradleProjectPath = "tests/java/springboot-gradle";
  const gradleSourceFile = path.join(
    gradleProjectPath,
    "src/main/java/com/example/controller/HelloController.java"
  );

  const gradleBuildConfig = await detectBuildTool(gradleProjectPath);
  console.log(`  Build Tool: ${gradleBuildConfig.tool}`);
  console.log(`  Main Source Dir: ${gradleBuildConfig.mainSourceDir}`);
  console.log(`  Test Source Dir: ${gradleBuildConfig.testSourceDir}`);
  console.log(`  Build File: ${gradleBuildConfig.buildFile}`);

  const gradleLanguage = detectLanguage(gradleSourceFile);
  console.log(`  Language: ${gradleLanguage}`);

  const isSpringBootGradle = await isSpringBootProject(
    gradleProjectPath,
    gradleBuildConfig
  );
  console.log(`  Is Spring Boot: ${isSpringBootGradle}`);

  const gradleTestPath = resolveTestPath(
    gradleSourceFile,
    gradleBuildConfig,
    gradleLanguage
  );
  console.log(`  Source: ${gradleSourceFile}`);
  console.log(`  Test Path: ${gradleTestPath}`);

  // Verify the path is correct
  const expectedGradleTestPath = path.join(
    gradleProjectPath,
    "src/test/java/com/example/controller/HelloControllerTest.java"
  );
  const gradlePathCorrect = gradleTestPath === expectedGradleTestPath;
  console.log(`  Path Resolution: ${gradlePathCorrect ? "✅ PASS" : "❌ FAIL"}`);

  console.log("\n=== All Phase 1 tests completed ===");
  console.log(
    `Result: ${pathCorrect && gradlePathCorrect ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`
  );

  // Exit code
  process.exit(pathCorrect && gradlePathCorrect ? 0 : 1);
}

verify().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
