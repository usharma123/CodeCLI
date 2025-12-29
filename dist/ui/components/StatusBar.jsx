import { Box, Text } from "ink";
import { useSpinnerFrames, useElapsedTime } from "../hooks/useAnimation.js";
import { icons } from "../theme.js";
export function StatusBar({ message, isProcessing = false, startTime, phase, progress, }) {
    const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);
    const elapsed = useElapsedTime(isProcessing ? startTime || null : null);
    if (!isProcessing) {
        return null;
    }
    return (<Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} marginBottom={1}>
      {/* Main status */}
      <Box>
        <Text color="cyan">{spinnerFrame} </Text>
        <Text>{message}</Text>
        {elapsed && <Text dimColor> {elapsed}</Text>}
      </Box>

      {/* Phase */}
      {phase && (<Box>
          <Text dimColor>  {icons.arrowRight} {phase}</Text>
        </Box>)}

      {/* Progress */}
      {progress && progress.total > 0 && (<Box>
          <Text dimColor>
            {"  "}step {progress.current}/{progress.total}
          </Text>
        </Box>)}
    </Box>);
}
export function InlineStatus({ message, isProcessing = false, }) {
    const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);
    if (!isProcessing) {
        return null;
    }
    return (<Box>
      <Text color="cyan">{spinnerFrame} </Text>
      <Text dimColor>{message}</Text>
    </Box>);
}
export function CompletableStatus({ status, loadingMessage = "processing...", successMessage = "done", errorMessage = "failed", startTime, }) {
    const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);
    const elapsed = useElapsedTime(status === "loading" ? startTime || Date.now() : null);
    if (status === "idle") {
        return null;
    }
    if (status === "success") {
        return (<Box marginBottom={1}>
        <Text color="green">{icons.success} </Text>
        <Text color="green">{successMessage}</Text>
      </Box>);
    }
    if (status === "error") {
        return (<Box marginBottom={1}>
        <Text color="red">{icons.error} </Text>
        <Text color="red">{errorMessage}</Text>
      </Box>);
    }
    return (<Box marginBottom={1}>
      <Text color="cyan">{spinnerFrame} </Text>
      <Text>{loadingMessage}</Text>
      {elapsed && <Text dimColor> {elapsed}</Text>}
    </Box>);
}
export function StepStatus({ steps, currentStepMessage }) {
    const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);
    const completedCount = steps.filter((s) => s.status === "completed").length;
    const totalCount = steps.length;
    return (<Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} marginBottom={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text>progress</Text>
        <Text dimColor> {completedCount}/{totalCount}</Text>
      </Box>

      {/* Steps */}
      {steps.map((step) => {
            let icon;
            let color;
            switch (step.status) {
                case "completed":
                    icon = icons.success;
                    color = "green";
                    break;
                case "current":
                    icon = spinnerFrame;
                    color = "cyan";
                    break;
                case "error":
                    icon = icons.error;
                    color = "red";
                    break;
                default:
                    icon = icons.pending;
                    color = "gray";
            }
            return (<Box key={step.id}>
            <Text color={color}>{icon} </Text>
            <Text color={color} dimColor={step.status === "pending"}>
              {step.label}
            </Text>
          </Box>);
        })}

      {/* Current message */}
      {currentStepMessage && (<Box marginTop={1}>
          <Text dimColor>{icons.arrowRight} {currentStepMessage}</Text>
        </Box>)}
    </Box>);
}
