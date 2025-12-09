# Sudoku Solver Unit Tests

This directory contains a Sudoku solver implementation and comprehensive unit tests.

## Files

- `Sudoku.java` - A backtracking Sudoku solver implementation
- `SudokuTest.java` - JUnit 5 unit tests for the Sudoku solver
- `junit-platform-console-standalone.jar` - JUnit test runner

## Running the Tests

### Compile the code:
```bash
javac -cp junit-platform-console-standalone.jar:. Sudoku.java SudokuTest.java
```

### Run the tests:
```bash
java -jar junit-platform-console-standalone.jar --class-path . --scan-class-path
```

## Test Coverage

The test suite includes 12 comprehensive tests:

1. **Test solving a valid easy Sudoku puzzle** - Verifies the solver can solve a standard puzzle
2. **Test solving an already solved puzzle** - Ensures the solver recognizes complete boards
3. **Test solving a puzzle with only one empty cell** - Tests minimal solving scenario
4. **Test unsolvable puzzle (invalid initial state)** - Verifies the solver returns false for invalid puzzles
5. **Test empty board (all zeros)** - Tests solving from a completely blank board
6. **Test puzzle with minimal clues** - Tests solving with very few initial numbers
7. **Test hard puzzle** - Verifies the solver can handle difficult puzzles
8. **Test that solve modifies board in-place** - Ensures the board is modified directly
9. **Test printBoard doesn't throw exception** - Verifies the print method works correctly
10. **Test solution has no duplicates in rows** - Validates row constraints
11. **Test solution has no duplicates in columns** - Validates column constraints
12. **Test solution has no duplicates in 3x3 boxes** - Validates box constraints

## Test Results

All 12 tests pass successfully, confirming that:
- The solver correctly solves valid Sudoku puzzles
- The solver properly validates Sudoku constraints (rows, columns, 3x3 boxes)
- The solver handles edge cases (empty boards, already solved, unsolvable)
- The solver modifies the board in-place as expected
- The print functionality works without errors

## Implementation Details

The Sudoku solver uses a backtracking algorithm:
1. Finds the next empty cell (represented by 0)
2. Tries digits 1-9 in that cell
3. Validates row, column, and 3x3 box constraints
4. Recursively solves the remaining board
5. Backtracks if no valid solution is found

The test suite includes helper methods:
- `isValidSudoku()` - Validates a complete Sudoku solution
- `deepCopy()` - Creates a deep copy of a 2D array for comparison
