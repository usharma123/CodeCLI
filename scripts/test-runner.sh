#!/bin/bash

# Unified Test Runner for CodeCLI
# Runs Python (PyTest) and Java (JUnit/Maven) tests with multiple modes
# Supports: smoke, sanity, full testing modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
MODE="full"
LANGUAGE="all"
COVERAGE=false
REPORT=false
VERBOSE=false
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            MODE="$2"
            shift 2
            ;;
        --language|-l)
            LANGUAGE="$2"
            shift 2
            ;;
        --coverage|-c)
            COVERAGE=true
            shift
            ;;
        --report|-r)
            REPORT=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --mode MODE           Test mode: smoke, sanity, full (default: full)"
            echo "  --language LANG       Language: python, java, all (default: all)"
            echo "  --coverage, -c        Generate coverage reports"
            echo "  --report, -r          Generate TEST_REPORT.md"
            echo "  --verbose, -v         Verbose output"
            echo "  --help, -h            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --mode smoke                    # Run smoke tests for all languages"
            echo "  $0 --language python --coverage    # Run Python tests with coverage"
            echo "  $0 --mode full --report            # Run all tests and generate report"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Print banner
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CodeCLI Unified Test Runner v1.0    ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}Mode:${NC}     $MODE"
echo -e "${BLUE}Language:${NC} $LANGUAGE"
echo -e "${BLUE}Coverage:${NC} $COVERAGE"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
PYTHON_EXIT=0
JAVA_EXIT=0

# Function to run Python tests
run_python_tests() {
    echo -e "${YELLOW}▶ Running Python Tests...${NC}"
    cd "$PROJECT_ROOT/tests/python"

    # Check if pytest is installed
    if ! command -v pytest &> /dev/null; then
        echo -e "${YELLOW}Installing Python test dependencies...${NC}"
        pip install -q -r requirements-test.txt
    fi

    # Determine pytest markers based on mode
    PYTEST_ARGS="-v"
    case $MODE in
        smoke)
            PYTEST_ARGS="$PYTEST_ARGS -m smoke --maxfail=1"
            ;;
        sanity)
            PYTEST_ARGS="$PYTEST_ARGS -m 'smoke or sanity' --maxfail=3"
            ;;
        full)
            PYTEST_ARGS="$PYTEST_ARGS"
            ;;
    esac

    # Add coverage if requested
    if [ "$COVERAGE" = true ]; then
        PYTEST_ARGS="$PYTEST_ARGS --cov=. --cov-report=xml --cov-report=html --cov-report=term"
    fi

    # Add JSON report
    PYTEST_ARGS="$PYTEST_ARGS --json-report --json-report-file=test-report.json"

    # Run pytest
    set +e
    if [ "$VERBOSE" = true ]; then
        pytest $PYTEST_ARGS
    else
        pytest $PYTEST_ARGS > pytest-output.log 2>&1
    fi
    PYTHON_EXIT=$?
    set -e

    # Parse results
    if [ -f "test-report.json" ]; then
        PYTHON_TOTAL=$(python3 -c "import json; data=json.load(open('test-report.json')); print(data.get('summary', {}).get('total', 0))")
        PYTHON_PASSED=$(python3 -c "import json; data=json.load(open('test-report.json')); print(data.get('summary', {}).get('passed', 0))")
        PYTHON_FAILED=$(python3 -c "import json; data=json.load(open('test-report.json')); print(data.get('summary', {}).get('failed', 0))")

        TOTAL_TESTS=$((TOTAL_TESTS + PYTHON_TOTAL))
        PASSED_TESTS=$((PASSED_TESTS + PYTHON_PASSED))
        FAILED_TESTS=$((FAILED_TESTS + PYTHON_FAILED))

        echo -e "${GREEN}✓ Python: $PYTHON_PASSED passed${NC}, ${RED}$PYTHON_FAILED failed${NC} (Total: $PYTHON_TOTAL)"
    fi

    cd "$PROJECT_ROOT"
}

# Function to run Java tests
run_java_tests() {
    echo -e "${YELLOW}▶ Running Java Tests...${NC}"
    cd "$PROJECT_ROOT/tests/java"

    # Check if Maven is installed
    if ! command -v mvn &> /dev/null; then
        echo -e "${RED}✗ Maven not found. Please install Maven to run Java tests.${NC}"
        return 1
    fi

    # Clean previous builds
    mvn clean > /dev/null 2>&1 || true

    # Determine Maven goals based on mode
    MVN_ARGS="test"
    case $MODE in
        smoke)
            MVN_ARGS="test -Dgroups=smoke"
            ;;
        sanity)
            MVN_ARGS="test -Dgroups='smoke|sanity'"
            ;;
        full)
            MVN_ARGS="test"
            ;;
    esac

    # Add coverage if requested
    if [ "$COVERAGE" = true ]; then
        MVN_ARGS="$MVN_ARGS jacoco:report"
    fi

    # Run Maven tests
    set +e
    if [ "$VERBOSE" = true ]; then
        mvn $MVN_ARGS
    else
        mvn $MVN_ARGS > maven-output.log 2>&1
    fi
    JAVA_EXIT=$?
    set -e

    # Parse results from Surefire reports
    if [ -d "target/surefire-reports" ]; then
        JAVA_TOTAL=$(find target/surefire-reports -name "TEST-*.xml" -exec grep -h 'tests="' {} \; | sed 's/.*tests="\([0-9]*\)".*/\1/' | awk '{s+=$1} END {print s}')
        JAVA_FAILURES=$(find target/surefire-reports -name "TEST-*.xml" -exec grep -h 'failures="' {} \; | sed 's/.*failures="\([0-9]*\)".*/\1/' | awk '{s+=$1} END {print s}')
        JAVA_ERRORS=$(find target/surefire-reports -name "TEST-*.xml" -exec grep -h 'errors="' {} \; | sed 's/.*errors="\([0-9]*\)".*/\1/' | awk '{s+=$1} END {print s}')

        JAVA_TOTAL=${JAVA_TOTAL:-0}
        JAVA_FAILURES=${JAVA_FAILURES:-0}
        JAVA_ERRORS=${JAVA_ERRORS:-0}
        JAVA_FAILED=$((JAVA_FAILURES + JAVA_ERRORS))
        JAVA_PASSED=$((JAVA_TOTAL - JAVA_FAILED))

        TOTAL_TESTS=$((TOTAL_TESTS + JAVA_TOTAL))
        PASSED_TESTS=$((PASSED_TESTS + JAVA_PASSED))
        FAILED_TESTS=$((FAILED_TESTS + JAVA_FAILED))

        echo -e "${GREEN}✓ Java: $JAVA_PASSED passed${NC}, ${RED}$JAVA_FAILED failed${NC} (Total: $JAVA_TOTAL)"
    fi

    cd "$PROJECT_ROOT"
}

# Run tests based on language selection
if [ "$LANGUAGE" = "python" ] || [ "$LANGUAGE" = "all" ]; then
    run_python_tests
fi

if [ "$LANGUAGE" = "java" ] || [ "$LANGUAGE" = "all" ]; then
    run_java_tests
fi

# Print summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

# Coverage summary
if [ "$COVERAGE" = true ]; then
    echo -e "${BLUE}Coverage Reports:${NC}"
    if [ "$LANGUAGE" = "python" ] || [ "$LANGUAGE" = "all" ]; then
        if [ -f "tests/python/coverage.xml" ]; then
            echo -e "  Python: tests/python/htmlcov/index.html"
        fi
    fi
    if [ "$LANGUAGE" = "java" ] || [ "$LANGUAGE" = "all" ]; then
        if [ -f "tests/java/target/site/jacoco/index.html" ]; then
            echo -e "  Java:   tests/java/target/site/jacoco/index.html"
        fi
    fi
    echo ""
fi

# Generate report if requested
if [ "$REPORT" = true ]; then
    echo -e "${YELLOW}Generating TEST_REPORT.md...${NC}"
    "$PROJECT_ROOT/scripts/generate-report.sh"
fi

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}✗ Tests failed${NC}"
    exit 1
else
    echo -e "${GREEN}✓ All tests passed${NC}"
    exit 0
fi
