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
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
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

# Function to run Maven tests in a directory
run_maven_in_dir() {
    local dir="$1"
    local project_name="$2"
    
    cd "$dir"
    
    # Determine Maven goals based on mode
    MVN_ARGS="test -q"
    case $MODE in
        smoke)
            MVN_ARGS="test -q -Dgroups=smoke"
            ;;
        sanity)
            MVN_ARGS="test -q -Dgroups='smoke|sanity'"
            ;;
        full)
            MVN_ARGS="test -q"
            ;;
    esac

    # Add coverage if requested
    if [ "$COVERAGE" = true ]; then
        MVN_ARGS="$MVN_ARGS jacoco:report"
    fi

    # Run Maven tests
    set +e
    if [ "$VERBOSE" = true ]; then
        mvn clean $MVN_ARGS
    else
        mvn clean $MVN_ARGS > maven-output.log 2>&1
    fi
    local exit_code=$?
    set -e

    # Parse results from Surefire reports
    local dir_total=0
    local dir_failures=0
    local dir_errors=0
    
    if [ -d "target/surefire-reports" ]; then
        dir_total=$(find target/surefire-reports -name "TEST-*.xml" -exec grep -h 'tests="' {} \; 2>/dev/null | sed 's/.*tests="\([0-9]*\)".*/\1/' | awk '{s+=$1} END {print s+0}')
        dir_failures=$(find target/surefire-reports -name "TEST-*.xml" -exec grep -h 'failures="' {} \; 2>/dev/null | sed 's/.*failures="\([0-9]*\)".*/\1/' | awk '{s+=$1} END {print s+0}')
        dir_errors=$(find target/surefire-reports -name "TEST-*.xml" -exec grep -h 'errors="' {} \; 2>/dev/null | sed 's/.*errors="\([0-9]*\)".*/\1/' | awk '{s+=$1} END {print s+0}')
    fi
    
    dir_total=${dir_total:-0}
    dir_failures=${dir_failures:-0}
    dir_errors=${dir_errors:-0}
    local dir_failed=$((dir_failures + dir_errors))
    local dir_passed=$((dir_total - dir_failed))
    
    if [ "$dir_total" -gt 0 ]; then
        echo -e "  ${GREEN}✓ ${project_name}: $dir_passed passed${NC}, ${RED}$dir_failed failed${NC} (Total: $dir_total)"
    fi
    
    JAVA_TOTAL=$((JAVA_TOTAL + dir_total))
    JAVA_FAILURES=$((JAVA_FAILURES + dir_failures))
    JAVA_ERRORS=$((JAVA_ERRORS + dir_errors))
    
    if [ $exit_code -ne 0 ]; then
        JAVA_EXIT=1
    fi
    
    cd "$PROJECT_ROOT"
}

# Function to run Java tests
run_java_tests() {
    echo -e "${YELLOW}▶ Running Java Tests...${NC}"

    # Check if Maven is installed
    if ! command -v mvn &> /dev/null; then
        echo -e "${RED}✗ Maven not found. Please install Maven to run Java tests.${NC}"
        return 1
    fi

    local JAVA_DIR="$PROJECT_ROOT/tests/java"
    JAVA_TOTAL=0
    JAVA_FAILURES=0
    JAVA_ERRORS=0
    
    # Run tests in root java dir if it has a pom.xml with tests
    if [ -f "$JAVA_DIR/pom.xml" ]; then
        run_maven_in_dir "$JAVA_DIR" "root"
    fi
    
    # Run tests in subprojects that have pom.xml
    for subdir in "$JAVA_DIR"/*/; do
        if [ -f "${subdir}pom.xml" ]; then
            local project_name=$(basename "$subdir")
            run_maven_in_dir "$subdir" "$project_name"
        fi
    done
    
    local JAVA_FAILED=$((JAVA_FAILURES + JAVA_ERRORS))
    local JAVA_PASSED=$((JAVA_TOTAL - JAVA_FAILED))

    TOTAL_TESTS=$((TOTAL_TESTS + JAVA_TOTAL))
    PASSED_TESTS=$((PASSED_TESTS + JAVA_PASSED))
    FAILED_TESTS=$((FAILED_TESTS + JAVA_FAILED))

    if [ "$JAVA_TOTAL" -gt 0 ]; then
        echo -e "${GREEN}✓ Java Total: $JAVA_PASSED passed${NC}, ${RED}$JAVA_FAILED failed${NC} (Total: $JAVA_TOTAL)"
    else
        echo -e "${YELLOW}No Java tests found${NC}"
    fi
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
