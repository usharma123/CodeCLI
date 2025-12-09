import java.util.Arrays;

/**
 * Simple backtracking Sudoku solver.
 * 
 * Uses 0 to represent empty cells. Runs a depth-first search trying digits
 * 1-9, validating row/column/box constraints at each step.
 */
public class Sudoku {
    private static final int SIZE = 9;
    private static final int EMPTY = 0;

    public static void main(String[] args) {
        int[][] board = {
            {5, 3, 0, 0, 7, 0, 0, 0, 0},
            {6, 0, 0, 1, 9, 5, 0, 0, 0},
            {0, 9, 8, 0, 0, 0, 0, 6, 0},
            {8, 0, 0, 0, 6, 0, 0, 0, 3},
            {4, 0, 0, 8, 0, 3, 0, 0, 1},
            {7, 0, 0, 0, 2, 0, 0, 0, 6},
            {0, 6, 0, 0, 0, 0, 2, 8, 0},
            {0, 0, 0, 4, 1, 9, 0, 0, 5},
            {0, 0, 0, 0, 8, 0, 0, 7, 9}
        };

        System.out.println("Initial board:");
        printBoard(board);

        if (solve(board)) {
            System.out.println("\nSolved:");
            printBoard(board);
        } else {
            System.out.println("No solution exists for the provided board.");
        }
    }

    /** Attempts to solve the board in-place. */
    public static boolean solve(int[][] board) {
        int[] empty = findEmpty(board);
        if (empty == null) {
            return true; // solved
        }

        int row = empty[0];
        int col = empty[1];

        for (int num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
                board[row][col] = num;

                if (solve(board)) {
                    return true;
                }

                board[row][col] = EMPTY; // backtrack
            }
        }
        return false;
    }

    /** Checks whether placing num at (row, col) is valid. */
    private static boolean isValid(int[][] board, int row, int col, int num) {
        // Row and column check
        for (int i = 0; i < SIZE; i++) {
            if (board[row][i] == num || board[i][col] == num) {
                return false;
            }
        }

        // 3x3 box check
        int boxRow = (row / 3) * 3;
        int boxCol = (col / 3) * 3;
        for (int r = boxRow; r < boxRow + 3; r++) {
            for (int c = boxCol; c < boxCol + 3; c++) {
                if (board[r][c] == num) {
                    return false;
                }
            }
        }

        return true;
    }

    /** Finds the next empty cell, or null if solved. */
    private static int[] findEmpty(int[][] board) {
        for (int r = 0; r < SIZE; r++) {
            for (int c = 0; c < SIZE; c++) {
                if (board[r][c] == EMPTY) {
                    return new int[] { r, c };
                }
            }
        }
        return null;
    }

    /** Prints the board with grid separators. */
    public static void printBoard(int[][] board) {
        for (int r = 0; r < SIZE; r++) {
            if (r % 3 == 0 && r != 0) {
                System.out.println("------+-------+------");
            }
            for (int c = 0; c < SIZE; c++) {
                if (c % 3 == 0 && c != 0) {
                    System.out.print("| ");
                }
                System.out.print(board[r][c] == EMPTY ? ". " : board[r][c] + " ");
            }
            System.out.println();
        }
    }
}
