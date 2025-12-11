Prompt: how do we go about implementing this type of robust testing:  Unit Testing: Testing individual components or modules of the software in isolation.
Integration Testing: Testing the interactions and interfaces between different modules or components of the software.
System Testing: Testing the entire integrated system to verify that it meets the specified requirements.
Regression Testing: Re-running existing test cases to ensure that new code changes or bug fixes have not introduced new defects or negatively impacted existing functionality.
User Acceptance Testing (UAT): The final stage of functional testing where end-users or clients validate the software to ensure it meets their business needs and is ready for deployment.
Smoke Testing: A preliminary set of tests to ensure that the most critical functionalities of the software are working correctly before proceeding with more extensive testing.
Sanity Testing: A subset of regression testing that focuses on testing a specific, small area of functionality after a minor change or bug fix.

Plan: 
Pre-Build Testing Gate
Scope
Cover Python agent (python/) and Java apps (java/, currency/, sudoku/).
Use defaults per language: PyTest (Python), JUnit (Java).
Runner designed for pre-build/dev gating: fast smoke/sanity + full mode.
Emit markdown report summarizing failures and suggested fixes.
Steps
Inventory & Assumptions
Confirm existing tests (PyTest under python/, JUnit under sudoku//currency/).
Note missing integration/system cases and required test data.
Python Agent Coverage
Unit: PyTest for core logic in agent.py; mark with unit.
Integration: flow-level tests with fixtures/mocks; mark integration.
System/Smoke: minimal end-to-end guarded by env flags; mark smoke/sanity.
Regression: codify past bugs/edge cases.
Java Apps Coverage
Unit: JUnit for logic classes in Sudoku/Currency; mark @Tag("unit").
Integration: exercise I/O/composition; mark integration.
System/Smoke: main flows with small fixtures; mark smoke/sanity.
Regression: encode known bug cases.
Unified Runner (Pre-Build Friendly)
Add scripts/test-all.sh: installs deps if missing, then runs Python (pytest with markers) and Java (JUnit via Maven/Gradle or javac+console launcher).
Support modes: smoke (fast), sanity (targeted), full (all).
Fail-fast option for smoke; detailed logs for full runs.
Reporting
Generate/update TEST_REPORT.md per run: summary table (suite vs pass/fail), top errors, and suggested fixes.
Include rerun commands and scope selection tips.
Automation Hooks
Document pre-build/CI usage: example GitHub Action and local pre-push guidance.
Ensure commands are non-interactive, idempotent, and cache-friendly.
PRD-Aware Test Generation
Accept PRD PDF as input, extract text (e.g., pdftotext/pdfplumber).
Parse requirements into structured cases (Given/When/Then) and map to suites (unit/integration/system/UAT).
Emit candidate test cases and data into markdown/JSON for review, then feed into runner where applicable.
Keep deterministic output; no network dependencies.
Todos
inv-map: Inventory current tests and gaps.
py-tests: Add/extend PyTest unit/integration/system markers.
java-tests: Add/extend JUnit unit/integration/system coverage.
runner: Create unified pre-build runner with smoke/sanity/full options.
report-md: Generate TEST_REPORT.md with summaries and fixes.
ci-notes: Document CI/pre-push integration steps.
prd-parse: Add PRD PDF ingestion to generate test cases mapped to suites.