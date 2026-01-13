# Coverage Tool Workflow

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 INPUT                                       │
│                    User runs: quality tool                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STEP 1: DETECT STALE STATE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Fingerprint  │  │ Git Status   │  │ Timestamp    │  │ Missing      │     │
│  │ Check        │  │ Detection    │  │ Comparison   │  │ Artifacts    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STEP 2: DECIDE TO RUN TESTS?                             │
│                                                                             │
│                         ┌────────────────┐                                  │
│                         │  Tests Stale?  │                                  │
│                         └───────┬────────┘                                  │
│                     ┌───────────┴───────────┐                               │
│                     │                       │                               │
│                Fresh│                       │Stale                          |
│                     ▼                       ▼                               │
│         ┌────────────────────┐   ┌────────────────────┐                     │
│         │ Use existing       │   │ Run tests (Maven   │                     │
│         │ artifacts          │   │ or Gradle)         │                     │
│         └────────────────────┘   └────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 3: EXECUTE TESTS                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Maven: mvn clean test jacoco:report                                 │    │
│  │ Gradle: ./gradlew test jacocoTestReport                             │    │
│  │ Generate JaCoCo CSV & Surefire XML                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STEP 4: PARSE ARTIFACTS                               │
│  ┌────────────────────┐   ┌────────────────────┐                            │
│  │ JaCoCo CSV         │   │ Surefire XML       │                            │
│  │ Coverage Data      │   │ Test Results       │                            │
│  └────────────────────┘   └────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STEP 5: ANALYSIS                                    │
│  ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐   │
│  │ Calculate Coverage │   │ Detect Incidental  │   │ Evaluate Quality   │   │
│  │ Metrics            │   │ Coverage           │   │ Gates + Adjusted   │   │
│  └────────────────────┘   └────────────────────┘   └────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OUTPUT: COVERAGE REPORT                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Coverage     │  │ Quality Gate │  │ Incidental   │  │ Recommen-    │     │
│  │ Summary      │  │ Results      │  │ Coverage     │  │ dations      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Workflow

### Step 1: Detect Stale State

Before generating a report, the tool checks if tests need to be re-run via `checkTestStaleness()`:

The tool uses a **three-layer staleness detection** system:

| Layer | Method | Description |
|-------|--------|-------------|
| **Fingerprint-based** | Content-addressable detection | Computes SHA hash of git HEAD, reads config files, and compares source file metadata (mtime + size) to detect changes even without git operations |
| **Git status** | Git-based detection | Detects deleted/modified/uncommitted test files and deleted `@Test` methods via `git diff` and status |
| **Timestamp-based** | Fallback comparison | Compares artifact modification times (JaCoCo CSV, Surefire XML) vs. newest test source file |
| **Missing artifacts** | Coverage existence | If no coverage data exists, marks as stale |

### Step 2: Decide to Run Tests

The tool determines whether to execute tests:

```
shouldRunTests = (run_tests === true) || (mustRunTests && skip_tests !== true)
```

| Scenario | Tests Run? |
|----------|------------|
| Stale artifacts | Yes |
| Fresh artifacts + `run_tests=false` | No |
| Fresh artifacts + `run_tests=true` | Yes |
| Stale artifacts + `skip_tests=true` | No |

### Step 3: Execute Tests

If tests need to run:

```bash
mvn clean test jacoco:report -B
```

This generates:
- **JaCoCo CSV**: `target/site/jacoco/jacoco.csv`
- **Surefire XML**: `target/surefire-reports/TEST-*.xml`

### Step 4: Parse Artifacts

#### JaCoCo CSV Parser
Extracts coverage metrics:
- **Instruction coverage**: JVM instructions executed
- **Branch coverage**: Conditional branches covered
- **Line coverage**: Source lines covered
- **Method coverage**: Methods called
- **Complexity coverage**: Cyclomatic complexity

#### Surefire XML Parser
Extracts test results:
- Total tests, passed, failed, skipped
- Execution times
- Slowest tests (top 10)
- Failure messages and stack traces

### Step 5: Analysis

#### Calculate Coverage Metrics
Aggregates per-class coverage into overall project metrics:

```
Coverage % = (covered / (covered + missed)) * 100
```

#### Detect Incidental Coverage
Flags classes that show coverage but have **no dedicated test file**:

| Class | JaCoCo Coverage | Dedicated Test | Status |
|-------|-----------------|----------------|--------|
| UserService | 100% | `UserServiceTest.java` | OK |
| Currency | 100% | **None** | INCIDENTAL |

#### Evaluate Quality Gates
Default thresholds (configurable via `.bootstrap/quality-config.json`):

| Gate | Default | Description |
|------|---------|-------------|
| `min_line_coverage` | 70% | Minimum line coverage required |
| `min_branch_coverage` | 60% | Minimum branch coverage required |
| `max_test_drop` | 0 | Maximum absolute test count drop allowed |
| `max_test_drop_percent` | 5% | Maximum percentage test count drop allowed |
| `max_slow_test_ms` | 5000 | Maximum ms per test |

**Test Drop Logic:** Fails only if BOTH absolute count AND percentage thresholds are exceeded.

#### Adjusted Coverage Calculation
When tests are deleted AND coverage also drops, the tool applies a penalty formula to prevent false positives:

```
adjustedCoverage = rawCoverage * (currentTests / baselineTests)
```

This prevents situations where coverage appears stable but tests have been removed.

## Output: Coverage Report

The tool generates a comprehensive report including:

1. **Test Execution Summary**
   - Total tests, passed, failed, skipped
   - Execution duration

2. **Coverage Metrics**
   - Overall and per-class coverage
   - Line, branch, instruction, method coverage

3. **Quality Gate Results**
   - Pass/fail status for each gate
   - Threshold vs actual comparison

4. **Incidental Coverage Warnings**
   - Classes with coverage but no dedicated tests

5. **Recommendations**
   - Actionable improvements to increase coverage

## Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Layer Staleness Detection** | Fingerprint-based + Git status + timestamp comparison for robust CI detection |
| **Maven & Gradle Support** | Automatically detects project type and runs appropriate test command |
| **Artifact Parsing** | Parses JaCoCo CSV and Surefire XML directly (like SonarQube) |
| **Incidental Coverage Detection** | Flags fake coverage from integration tests - identifies classes with coverage but no dedicated tests |
| **Quality Gates** | Enforces minimum coverage thresholds with adjusted coverage calculation |
| **Baseline Management** | Tracks metrics over time, stores in `.bootstrap/quality-baseline.json`, detects regressions |
| **Source Code Scanning** | Detects deleted/added production classes and methods even without artifacts |
| **Suspicious Coverage Pattern Detection** | Flags tests removed but coverage stable (possible test pollution) and large coverage jumps without new tests |
| **CI/CD Integration** | JSON output support for CI integration, non-zero exit on gate failure |
