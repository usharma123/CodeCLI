import { Box, Text } from "ink";
import { useSpinnerFrames, useElapsedTime } from "../hooks/useAnimation.js";
import { icons } from "../theme.js";
const spinnerFrames = {
    dots: icons.spinnerDots,
    line: icons.spinnerLine,
    pulse: icons.spinnerPulse,
};
const spinnerSpeeds = {
    dots: 80,
    line: 100,
    pulse: 200,
};
export function Spinner({ label = "processing...", style = "dots", color = "cyan", showElapsed = true, startTime, }) {
    const frames = spinnerFrames[style];
    const speed = spinnerSpeeds[style];
    const frame = useSpinnerFrames(frames, speed);
    const elapsed = useElapsedTime(showElapsed ? (startTime || Date.now()) : null);
    return (<Box>
      <Text color={color}>{frame} </Text>
      <Text>{label}</Text>
      {showElapsed && elapsed && <Text dimColor> {elapsed}</Text>}
    </Box>);
}
export function StatusSpinner({ label = "processing...", style = "dots", color = "cyan", showElapsed = true, startTime, status = "loading", successMessage = "done", errorMessage = "failed", }) {
    const frames = spinnerFrames[style];
    const speed = spinnerSpeeds[style];
    const frame = useSpinnerFrames(frames, speed);
    const elapsed = useElapsedTime(status === "loading" ? (startTime || Date.now()) : null);
    if (status === "success") {
        return (<Box>
        <Text color="green">{icons.success} </Text>
        <Text color="green">{successMessage}</Text>
      </Box>);
    }
    if (status === "error") {
        return (<Box>
        <Text color="red">{icons.error} </Text>
        <Text color="red">{errorMessage}</Text>
      </Box>);
    }
    return (<Box>
      <Text color={color}>{frame} </Text>
      <Text>{label}</Text>
      {showElapsed && elapsed && <Text dimColor> {elapsed}</Text>}
    </Box>);
}
// Inline spinner
export function InlineSpinner({ color = "cyan" }) {
    const frame = useSpinnerFrames(icons.spinnerDots, 80);
    return <Text color={color}>{frame}</Text>;
}
export function MultiStageSpinner({ stages }) {
    const frame = useSpinnerFrames(icons.spinnerDots, 80);
    return (<Box flexDirection="column">
      {stages.map((stage, i) => {
            let icon;
            let color;
            switch (stage.status) {
                case "success":
                    icon = icons.success;
                    color = "green";
                    break;
                case "error":
                    icon = icons.error;
                    color = "red";
                    break;
                case "loading":
                    icon = frame;
                    color = "cyan";
                    break;
                default:
                    icon = icons.pending;
                    color = "gray";
            }
            return (<Box key={i}>
            <Text color={color}>{icon} </Text>
            <Text color={color} dimColor={stage.status === "pending"}>
              {stage.label}
            </Text>
          </Box>);
        })}
    </Box>);
}
