import { useState, useEffect } from "react";
/**
 * Hook for pulsing animation effect
 * Returns a boolean that alternates at the specified interval
 */
export function usePulse(intervalMs = 500) {
    const [active, setActive] = useState(true);
    useEffect(() => {
        const interval = setInterval(() => {
            setActive((v) => !v);
        }, intervalMs);
        return () => clearInterval(interval);
    }, [intervalMs]);
    return active;
}
/**
 * Hook for cycling through spinner frames
 * Returns the current frame string
 */
export function useSpinnerFrames(frames, intervalMs = 80) {
    const [index, setIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((i) => (i + 1) % frames.length);
        }, intervalMs);
        return () => clearInterval(interval);
    }, [frames.length, intervalMs]);
    return frames[index];
}
/**
 * Hook for typewriter effect
 * Returns progressively more characters of the input string
 */
export function useTypewriter(text, charIntervalMs = 50, startDelay = 0) {
    const [displayedLength, setDisplayedLength] = useState(0);
    const [started, setStarted] = useState(false);
    useEffect(() => {
        // Reset when text changes
        setDisplayedLength(0);
        setStarted(false);
        // Start delay
        const startTimeout = setTimeout(() => {
            setStarted(true);
        }, startDelay);
        return () => clearTimeout(startTimeout);
    }, [text, startDelay]);
    useEffect(() => {
        if (!started)
            return;
        if (displayedLength >= text.length)
            return;
        const timeout = setTimeout(() => {
            setDisplayedLength((l) => l + 1);
        }, charIntervalMs);
        return () => clearTimeout(timeout);
    }, [started, displayedLength, text.length, charIntervalMs]);
    return text.slice(0, displayedLength);
}
/**
 * Hook for counting up animation
 * Animates from 0 to target value
 */
export function useCountUp(target, durationMs = 1000, startDelay = 0) {
    const [value, setValue] = useState(0);
    const [started, setStarted] = useState(false);
    useEffect(() => {
        setValue(0);
        setStarted(false);
        const startTimeout = setTimeout(() => {
            setStarted(true);
        }, startDelay);
        return () => clearTimeout(startTimeout);
    }, [target, startDelay]);
    useEffect(() => {
        if (!started)
            return;
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            // Ease out cubic
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(target * easedProgress));
            if (progress >= 1) {
                clearInterval(interval);
            }
        }, 16);
        return () => clearInterval(interval);
    }, [started, target, durationMs]);
    return value;
}
/**
 * Hook for elapsed time display
 * Returns formatted elapsed time string that updates every second
 */
export function useElapsedTime(startTime) {
    const [elapsed, setElapsed] = useState("");
    useEffect(() => {
        if (!startTime) {
            setElapsed("");
            return;
        }
        const update = () => {
            const ms = Date.now() - startTime;
            const seconds = ms / 1000;
            if (seconds < 1) {
                setElapsed(`${Math.floor(ms)}ms`);
            }
            else if (seconds < 60) {
                setElapsed(`${seconds.toFixed(1)}s`);
            }
            else {
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                setElapsed(`${mins}m ${secs}s`);
            }
        };
        update();
        const interval = setInterval(update, 100);
        return () => clearInterval(interval);
    }, [startTime]);
    return elapsed;
}
/**
 * Hook for progress animation
 * Smoothly animates from current to target progress
 */
export function useAnimatedProgress(target, durationMs = 300) {
    const [current, setCurrent] = useState(target);
    useEffect(() => {
        const startValue = current;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            // Ease out
            const easedProgress = 1 - Math.pow(1 - progress, 2);
            const newValue = startValue + (target - startValue) * easedProgress;
            setCurrent(newValue);
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        // Use setTimeout as fallback since requestAnimationFrame may not work in terminal
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 2);
            const newValue = startValue + (target - startValue) * easedProgress;
            setCurrent(newValue);
            if (progress >= 1) {
                clearInterval(interval);
            }
        }, 16);
        return () => clearInterval(interval);
    }, [target, durationMs]);
    return current;
}
/**
 * Hook for fade in/out effect
 * Returns opacity value (0 or 1) with configurable delay
 */
export function useFadeIn(delay = 0) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const timeout = setTimeout(() => {
            setVisible(true);
        }, delay);
        return () => clearTimeout(timeout);
    }, [delay]);
    return visible;
}
/**
 * Hook for blink effect (for emphasis)
 * Blinks specified number of times then stays visible
 */
export function useBlink(blinkCount = 3, intervalMs = 200) {
    const [visible, setVisible] = useState(true);
    const [blinksRemaining, setBlinksRemaining] = useState(blinkCount * 2);
    useEffect(() => {
        if (blinksRemaining <= 0) {
            setVisible(true);
            return;
        }
        const timeout = setTimeout(() => {
            setVisible((v) => !v);
            setBlinksRemaining((b) => b - 1);
        }, intervalMs);
        return () => clearTimeout(timeout);
    }, [blinksRemaining, intervalMs]);
    return visible;
}
