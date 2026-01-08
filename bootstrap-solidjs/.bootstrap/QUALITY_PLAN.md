# Test Coverage Pipeline for Bootstrap-SolidJS

## Goal
Add a `quality` tool to bootstrap-solidjs that mimics SonarQube's coverage reporting approach by parsing machine artifacts (not stdout) to produce robust, evidence-based quality reports.

## Target: spring-currency Project
```
bootstrap-solidjs/spring-currency/
├── target/
│   ├── site/jacoco/
│   │   ├── jacoco.csv        # Per-class coverage metrics
│   │   └── jacoco.xml        # Aggregate coverage
│   └── surefire-reports/
│       └── TEST-*.xml        # Per-test-class results
└── src/test/java/            # Test source files
```

## Implementation

### New Files in `src/tool/`

1. **`quality-parsers.ts`** - Parse JaCoCo CSV and Surefire XML
2. **`quality-baseline.ts`** - Baseline management and diff calculation
3. **`quality.ts`** - Main quality tool
4. **`quality.txt`** - Tool description

### Tool Definition

```typescript
// quality.ts
export const QualityTool = Tool.define("quality", {
  description: DESCRIPTION,
  parameters: z.object({
    project_path: z.string().describe("Path to Maven/Gradle project root"),
    update_baseline: z.boolean().optional().describe("Save current metrics as new baseline"),
    gate: z.boolean().optional().describe("Fail if quality gates not met"),
  }),
  async execute(params, ctx) {
    // 1. Find and parse artifacts
    // 2. Compute metrics and diff vs baseline
    // 3. Generate report
    // 4. Optionally update baseline
    // 5. Return formatted report
  }
})
```

### Report Format (SonarQube-style)
```
================================================================================
                           QUALITY REPORT
================================================================================
Project: spring-currency
Date:    2026-01-08

SUMMARY
-------
| Metric              | Current  | Baseline | Delta   | Gate   |
|---------------------|----------|----------|---------|--------|
| Tests               | 45       | 50       | -5      | FAIL   |
| Line Coverage       | 72.5%    | 75.0%    | -2.5%   | WARN   |
| Branch Coverage     | 58.3%    | 60.0%    | -1.7%   | PASS   |

WARNINGS
--------
[CRITICAL] 5 tests were REMOVED
[WARNING]  Coverage stable despite test deletions - possible gaming

PER-CLASS COVERAGE
------------------
| Class                    | Line   | Branch | Method |
|--------------------------|--------|--------|--------|
| CurrencyController       | 54.5%  | 0.0%   | 50.0%  |
| ExchangeRateService      | 39.1%  | 0.0%   | 50.0%  |
| ConversionRequest        | 100%   | N/A    | 100%   |

EVIDENCE
--------
- target/site/jacoco/jacoco.csv
- target/surefire-reports/ (25 files)
================================================================================
```

### Key Features

1. **Parse Artifacts, Not Stdout** - Uses jacoco.csv and TEST-*.xml files directly
2. **Per-Class Metrics** - Line, branch, method coverage per class
3. **Baseline Tracking** - Stores in `.bootstrap/quality-baseline.json`
4. **Drift Detection** - Identifies test deletions, coverage drops
5. **Incidental Coverage** - Flags classes covered but not directly tested
6. **Quality Gates** - Configurable thresholds for CI/CD

### Configuration (`.bootstrap/quality-config.json`)
```json
{
  "gates": {
    "min_line_coverage": 70,
    "min_branch_coverage": 60,
    "max_test_drop": 0
  }
}
```
