#!/bin/bash

# Generate TEST_REPORT.md from test results
# This script aggregates Python and Java test results into a markdown report

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_FILE="$PROJECT_ROOT/TEST_REPORT.md"

# Initialize report
cat > "$REPORT_FILE" << 'EOF'
# Test Report

Generated: $(date '+%Y-%m-%d %H:%M:%S')

## Summary

| Language | Total | Passed | Failed | Status |
|----------|-------|--------|--------|--------|
EOF

# Function to add Python results
add_python_results() {
    if [ -f "$PROJECT_ROOT/tests/python/test-report.json" ]; then
        TOTAL=$(python3 -c "import json; data=json.load(open('$PROJECT_ROOT/tests/python/test-report.json')); print(data.get('summary', {}).get('total', 0))")
        PASSED=$(python3 -c "import json; data=json.load(open('$PROJECT_ROOT/tests/python/test-report.json')); print(data.get('summary', {}).get('passed', 0))")
        FAILED=$(python3 -c "import json; data=json.load(open('$PROJECT_ROOT/tests/python/test-report.json')); print(data.get('summary', {}).get('failed', 0))")

        if [ "$FAILED" -eq 0 ]; then
            STATUS="✅ PASS"
        else
            STATUS="❌ FAIL"
        fi

        echo "| Python   | $TOTAL | $PASSED | $FAILED | $STATUS |" >> "$REPORT_FILE"
    fi
}

# Function to add Java results
add_java_results() {
    if [ -d "$PROJECT_ROOT/tests/java/target/surefire-reports" ]; then
        cd "$PROJECT_ROOT/tests/java/target/surefire-reports"

        TOTAL=$(find . -name "TEST-*.xml" -exec grep -h 'tests="' {} \; | sed 's/.*tests="\([0-9]*\)".*/\1/' | awk '{s+=$1} END {print s}')
        FAILURES=$(find . -name "TEST-*.xml" -exec grep -h 'failures="' {} \; | sed 's/.*failures="\([0-9]*\)".*/\1/' | awk '{s+=$1} END {print s}')
        ERRORS=$(find . -name "TEST-*.xml" -exec grep -h 'errors="' {} \; | sed 's/.*errors="\([0-9]*\)".*/\1/' | awk '{s+=$1} END {print s}')

        TOTAL=${TOTAL:-0}
        FAILURES=${FAILURES:-0}
        ERRORS=${ERRORS:-0}
        FAILED=$((FAILURES + ERRORS))
        PASSED=$((TOTAL - FAILED))

        if [ "$FAILED" -eq 0 ]; then
            STATUS="✅ PASS"
        else
            STATUS="❌ FAIL"
        fi

        echo "| Java     | $TOTAL | $PASSED | $FAILED | $STATUS |" >> "$REPORT_FILE"
        cd "$PROJECT_ROOT"
    fi
}

# Add results
add_python_results
add_java_results

# Add failure details
cat >> "$REPORT_FILE" << 'EOF'

## Failure Details

EOF

# Add Python failures
if [ -f "$PROJECT_ROOT/tests/python/test-report.json" ]; then
    echo "### Python Test Failures" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    python3 << 'PYEOF' >> "$REPORT_FILE"
import json
import sys

try:
    with open('tests/python/test-report.json', 'r') as f:
        data = json.load(f)

    failures = [t for t in data.get('tests', []) if t.get('outcome') == 'failed']

    if not failures:
        print("No failures.")
    else:
        for test in failures:
            print(f"#### {test.get('nodeid', 'Unknown test')}")
            print()
            if test.get('call', {}).get('longrepr'):
                print("```")
                print(test['call']['longrepr'])
                print("```")
            print()
except:
    print("Could not parse Python test results.")
PYEOF
fi

# Add Java failures
if [ -d "$PROJECT_ROOT/tests/java/target/surefire-reports" ]; then
    echo "### Java Test Failures" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    cd "$PROJECT_ROOT/tests/java/target/surefire-reports"

    # Find failed tests in XML reports
    if ls TEST-*.xml >/dev/null 2>&1; then
        grep -l 'failures="[^0]' TEST-*.xml 2>/dev/null | while read file; do
            echo "#### Failed tests in $(basename $file .xml | sed 's/TEST-//')" >> "$REPORT_FILE"
            echo "" >> "$REPORT_FILE"
            echo "See: \`tests/java/target/surefire-reports/$file\`" >> "$REPORT_FILE"
            echo "" >> "$REPORT_FILE"
        done
    else
        echo "No Java test results found." >> "$REPORT_FILE"
    fi

    cd "$PROJECT_ROOT"
fi

# Add commands section
cat >> "$REPORT_FILE" << 'EOF'

## Rerun Commands

### Run all tests
```bash
bash scripts/test-runner.sh --mode full
```

### Run specific language
```bash
# Python only
bash scripts/test-runner.sh --language python

# Java only
bash scripts/test-runner.sh --language java
```

### Run with coverage
```bash
bash scripts/test-runner.sh --coverage
```

### Run smoke tests (fast)
```bash
bash scripts/test-runner.sh --mode smoke
```

## Coverage Reports

- **Python**: `tests/python/htmlcov/index.html` (if coverage enabled)
- **Java**: `tests/java/target/site/jacoco/index.html` (if coverage enabled)

EOF

echo "✓ Report generated: $REPORT_FILE"
