---
name: coverage
description: IMMEDIATELY invoke the quality tool for coverage reports. Use for "get coverage", "coverage report", "test coverage" queries.
---

# Coverage Report - IMMEDIATE ACTION REQUIRED

**DO NOT** manually run Maven, read CSV files, or parse XML. **IMMEDIATELY** use the `quality` tool.

## Step 1: Invoke the Quality Tool NOW

```
quality project_path="spring-currency"
```

That's it. The tool handles everything automatically.

## For Other Projects

Find the directory containing `pom.xml` and use that path:

```
quality project_path="<path-to-project-with-pom.xml>"
```

## Options

- `update_baseline=true` - Save metrics as new baseline
- `gate=true` - Fail if quality gates not met

## DO NOT

- Run `mvn test` manually
- Read jacoco.csv directly
- Parse surefire XML files
- Calculate coverage manually

The `quality` tool does all of this automatically and produces a formatted report.
