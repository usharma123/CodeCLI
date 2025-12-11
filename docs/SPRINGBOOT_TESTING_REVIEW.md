# Spring Boot Testing Review

This document captures a code-review-style assessment of the Spring Boot testing functionality in the CLI. It highlights coverage gaps and risky assumptions that could lead to incorrect detection or irrelevant test generation.

## Findings

### Detection coverage is too narrow
- The CLI only scans for `pom.xml` with specific Spring Boot starters. Gradle-based projects or Maven modules that use alternative starter sets will not be recognized as Spring Boot apps, so Spring-aware test generation will never be triggered.

### Project layout assumptions are brittle
- Test generation assumes a Maven-standard Java layout (maps `/src/main/` to `/src/test/` and expects `.java` sources). Projects written in Kotlin, using non-standard source roots, or organized as nested modules will resolve to invalid target paths and produce unusable tests.

### Repository detection misses common patterns
- Repository handling relies on renaming `Service` to `Repository` and checking for `extends JpaRepository`. Reactive repositories, custom naming schemes, or non-JPA data layers fall through to generic component templates, losing repository-specific guidance.

### Integration template is HTTP-centric
- The integration test template is hard-wired to `TestRestTemplate` and CRUD-style HTTP calls. Reactive stacks (e.g., `WebTestClient`) or applications that focus on messaging, batch jobs, or schedulers receive mismatched scaffolding and assertions.

## Recommendations
- Broaden framework detection to include Gradle builds and a wider range of Spring Boot starters.
- Derive test target paths from the project build tool (Maven/Gradle) and language (Java/Kotlin) rather than hard-coded string replacements.
- Expand repository heuristics to recognize reactive (`ReactiveCrudRepository`), custom base classes, and annotation-based repositories.
- Offer multiple integration templates (HTTP, reactive HTTP, messaging, batch) and select them based on detected dependencies.
