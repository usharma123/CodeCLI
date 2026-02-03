#!/usr/bin/env python3
"""
Terminal-based Pong Game
Controls: W/S for left paddle, Up/Down arrows for right paddle
"""

import curses
import time


class PongGame:
    def __init__(self):
        self.board_width = 80
        self.board_height = 24
        self.paddle_height = 4
        self.paddle_width = 1

        # Ball position and velocity
        self.ball_x = self.board_width // 2
        self.ball_y = self.board_height // 2
        self.ball_dx = 1
        self.ball_dy = 1

        # Paddle positions
        self.left_paddle_y = (self.board_height - self.paddle_height) // 2
        self.right_paddle_y = (self.board_height - self.paddle_height) // 2
        self.left_paddle_x = 2
        self.right_paddle_x = self.board_width - 3

        # Scores
        self.left_score = 0
        self.right_score = 0

        # Game state
        self.paused = False
        self.game_over = False
        self.winner = None

        # Speed control
        self.base_delay = 0.05
        self.current_delay = self.base_delay

    def reset_ball(self):
        """Reset ball to center with random direction"""
        self.ball_x = self.board_width // 2
        self.ball_y = self.board_height // 2
        self.ball_dx = 1 if (self.left_score + self.right_score) % 2 == 0 else -1
        self.ball_dy = 1 if (self.left_score + self.right_score) % 2 == 0 else -1

    def update(self):
        """Update game state"""
        if self.paused or self.game_over:
            return

        # Move ball
        self.ball_x += self.ball_dx
        self.ball_y += self.ball_dy

        # Top/bottom wall collision
        if self.ball_y <= 0 or self.ball_y >= self.board_height - 1:
            self.ball_dy *= -1
            self.ball_y = max(0, min(self.ball_y, self.board_height - 1))

        # Left paddle collision
        if self.ball_x == self.left_paddle_x + 1:
            if self.left_paddle_y <= self.ball_y <= self.left_paddle_y + self.paddle_height - 1:
                self.ball_dx *= -1
                self.ball_x = self.left_paddle_x + 1
                self.increase_speed()

        # Right paddle collision
        if self.ball_x == self.right_paddle_x - 1:
            if self.right_paddle_y <= self.ball_y <= self.right_paddle_y + self.paddle_height - 1:
                self.ball_dx *= -1
                self.ball_x = self.right_paddle_x - 1
                self.increase_speed()

        # Score detection
        if self.ball_x <= 0:
            self.right_score += 1
            self.reset_ball()
            self.current_delay = self.base_delay
        elif self.ball_x >= self.board_width - 1:
            self.left_score += 1
            self.reset_ball()
            self.current_delay = self.base_delay

        # Check for winner (first to 5)
        if self.left_score >= 5:
            self.game_over = True
            self.winner = "Left"
        elif self.right_score >= 5:
            self.game_over = True
            self.winner = "Right"

    def increase_speed(self):
        """Slightly increase ball speed"""
        self.current_delay = max(0.02, self.current_delay * 0.97)

    def move_left_paddle(self, direction):
        """Move left paddle up or down"""
        self.left_paddle_y = max(0, min(
            self.left_paddle_y + direction,
            self.board_height - self.paddle_height
        ))

    def move_right_paddle(self, direction):
        """Move right paddle up or down"""
        self.right_paddle_y = max(0, min(
            self.right_paddle_y + direction,
            self.board_height - self.paddle_height
        ))

    def draw(self, stdscr):
        """Draw the game board"""
        stdscr.clear()

        # Draw top and bottom walls
        stdscr.addstr(0, 0, "=" * self.board_width)
        stdscr.addstr(self.board_height - 1, 0, "=" * self.board_width)

        # Draw center line (dotted)
        for y in range(1, self.board_height - 1):
            stdscr.addch(y, self.board_width // 2, "|")

        # Draw scores
        score_text = f" {self.left_score} | {self.right_score} "
        score_x = (self.board_width - len(score_text)) // 2
        stdscr.addstr(1, score_x, score_text)

        # Draw paddles
        for i in range(self.paddle_height):
            stdscr.addch(self.left_paddle_y + i, self.left_paddle_x, "█")
            stdscr.addch(self.right_paddle_y + i, self.right_paddle_x, "█")

        # Draw ball
        stdscr.addch(self.ball_y, self.ball_x, "●")

        # Draw game info
        controls_text = "Controls: W/S (Left) | ↑/↓ (Right) | P (Pause) | Q (Quit)"
        info_y = self.board_height
        stdscr.addstr(info_y, 0, controls_text)

        if self.paused:
            pause_text = " - PAUSED - "
            pause_x = (self.board_width - len(pause_text)) // 2
            stdscr.addstr(self.board_height // 2, pause_x, pause_text)

        if self.game_over:
            game_over_text = f" GAME OVER! {self.winner} wins! "
            restart_text = "Press R to restart or Q to quit"
            game_over_x = (self.board_width - len(game_over_text)) // 2
            restart_x = (self.board_width - len(restart_text)) // 2
            stdscr.addstr(self.board_height // 2 - 1, game_over_x, game_over_text)
            stdscr.addstr(self.board_height // 2 + 1, restart_x, restart_text)

        stdscr.refresh()

    def run(self, stdscr):
        """Main game loop"""
        curses.curs_set(0)  # Hide cursor
        stdscr.nodelay(True)  # Non-blocking input
        stdscr.timeout(50)  # Refresh every 50ms

        while True:
            self.draw(stdscr)

            if self.game_over:
                key = stdscr.getch()
                if key == ord('r') or key == ord('R'):
                    # Restart game
                    self.__init__()
                elif key == ord('q') or key == ord('Q'):
                    break
                continue

            if self.paused:
                key = stdscr.getch()
                if key == ord('p') or key == ord('P'):
                    self.paused = False
                elif key == ord('q') or key == ord('Q'):
                    break
                continue

            # Handle input
            key = stdscr.getch()
            if key == -1:
                pass  # No key pressed
            elif key == ord('w') or key == ord('W'):
                self.move_left_paddle(-1)
            elif key == ord('s') or key == ord('S'):
                self.move_left_paddle(1)
            elif key == curses.KEY_UP:
                self.move_right_paddle(-1)
            elif key == curses.KEY_DOWN:
                self.move_right_paddle(1)
            elif key == ord('p') or key == ord('P'):
                self.paused = True
            elif key == ord('q') or key == ord('Q'):
                break

            self.update()
            time.sleep(self.current_delay)


def main():
    game = PongGame()
    try:
        curses.wrapper(game.run)
    except KeyboardInterrupt:
        print("\nGame ended by user")


if __name__ == "__main__":
    main()