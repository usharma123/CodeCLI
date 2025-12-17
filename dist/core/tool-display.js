import { colors } from "../utils/colors.js";
// Format tool name for display (e.g., "read_file" -> "Read")
export const formatToolName = (name) => {
    const nameMap = {
        read_file: "Read",
        list_files: "List",
        write_file: "Write",
        edit_file: "Update",
        patch_file: "Patch",
        run_command: "Run",
        scaffold_project: "Scaffold",
        run_tests: "Test",
        analyze_test_failures: "Analyze",
        get_coverage: "Coverage",
        detect_changed_files: "Detect",
        generate_tests: "Generate",
        analyze_coverage_gaps: "Gaps",
        generate_regression_test: "Regression",
        generate_mermaid_diagram: "Diagram",
        todo_write: "TodoWrite",
    };
    return nameMap[name] || name.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
};
// Format tool arguments for single-line display
export const formatToolArgs = (name, args) => {
    const safeArgs = args && typeof args === "object"
        ? args
        : {};
    switch (name) {
        case "read_file":
            return safeArgs.path || "";
        case "list_files":
            return safeArgs.path || ".";
        case "write_file":
            return safeArgs.path || "";
        case "edit_file":
            return safeArgs.path || "";
        case "patch_file":
            return safeArgs.path || "";
        case "run_command": {
            const cmd = safeArgs.command || "";
            return cmd.length > 60 ? cmd.substring(0, 57) + "..." : cmd;
        }
        case "scaffold_project":
            return `${safeArgs.template || ""}${safeArgs.name ? `: ${safeArgs.name}` : ""}`;
        case "run_tests": {
            const project = safeArgs.project_path ? ` in ${safeArgs.project_path}` : "";
            return `${safeArgs.mode || "full"} (${safeArgs.language || "all"})${project}`;
        }
        case "analyze_test_failures":
            return safeArgs.language || "unknown";
        case "get_coverage": {
            const lang = safeArgs.language || "unknown";
            const proj = safeArgs.project_path ? ` - ${safeArgs.project_path}` : "";
            return `${lang}${proj}`;
        }
        case "detect_changed_files":
            return `since ${safeArgs.since || "HEAD"}`;
        case "generate_tests":
            return safeArgs.file_path || "";
        case "analyze_coverage_gaps":
            return `${safeArgs.language} (min ${safeArgs.min_coverage || 80}%)`;
        case "generate_regression_test":
            return safeArgs.fixed_file || "";
        case "generate_mermaid_diagram":
            return safeArgs.root_dir || ".";
        case "todo_write": {
            const todos = Array.isArray(safeArgs.todos) ? safeArgs.todos : [];
            const todoCount = todos.length;
            const inProgress = todos.find((t) => t?.status === "in_progress");
            return inProgress
                ? `${todoCount} todos (current: ${inProgress.content})`
                : `${todoCount} todos`;
        }
        default:
            return (typeof args === "string" ? args : JSON.stringify(args ?? {})).substring(0, 50);
    }
};
// Format result summary for tree display
export const formatResultSummary = (name, result) => {
    switch (name) {
        case "read_file": {
            const lines = result.split("\n").length;
            return `Read ${colors.bold}${lines}${colors.reset}${colors.gray} lines`;
        }
        case "list_files": {
            try {
                const files = JSON.parse(result);
                return `Listed ${colors.bold}${files.length}${colors.reset}${colors.gray} paths`;
            }
            catch {
                return "Listed files";
            }
        }
        case "write_file":
            return result.includes("created") ? "File created" : result.includes("overwritten") ? "File overwritten" : result;
        case "edit_file":
            return result.includes("updated") ? "Changes applied" : result;
        case "run_command": {
            if (result.includes("SUCCESS"))
                return `${colors.green}Completed successfully${colors.reset}`;
            if (result.includes("FAILED"))
                return `${colors.red}Failed${colors.reset}`;
            if (result.includes("TIMEOUT"))
                return `${colors.yellow}Timed out${colors.reset}`;
            if (result.includes("cancelled"))
                return `${colors.yellow}Cancelled${colors.reset}`;
            return "Completed";
        }
        case "run_tests": {
            if (result.includes("Status: PASSED"))
                return `${colors.green}All tests passed${colors.reset}`;
            if (result.includes("Status: FAILED"))
                return `${colors.red}Some tests failed${colors.reset}`;
            return "Tests completed";
        }
        case "analyze_test_failures":
            return "Analysis complete";
        case "get_coverage": {
            const match = result.match(/(\d+\.\d+)%/);
            if (match)
                return `Coverage: ${colors.bold}${match[1]}%${colors.reset}${colors.gray}`;
            return "Coverage report ready";
        }
        case "detect_changed_files": {
            const match = result.match(/Filtered: (\d+) files/);
            if (match)
                return `Found ${colors.bold}${match[1]}${colors.reset}${colors.gray} changed files`;
            return "Files detected";
        }
        case "generate_tests":
            return "Test scaffolds generated";
        case "analyze_coverage_gaps": {
            if (result.includes("All files meet") || result.includes("All packages meet")) {
                return `${colors.green}All files meet threshold${colors.reset}`;
            }
            return `${colors.yellow}Gaps identified${colors.reset}`;
        }
        case "generate_regression_test":
            return "Regression test generated";
        case "generate_mermaid_diagram":
            return "Diagram generated";
        case "todo_write": {
            const lines = result.split("\n");
            const pendingCount = lines.filter(l => l.startsWith("○")).length;
            const inProgressCount = lines.filter(l => l.startsWith("→")).length;
            const completedCount = lines.filter(l => l.startsWith("✓")).length;
            const total = pendingCount + inProgressCount + completedCount;
            const parts = [];
            if (completedCount > 0)
                parts.push(`${colors.green}${completedCount} completed${colors.reset}${colors.gray}`);
            if (inProgressCount > 0)
                parts.push(`${colors.yellow}${inProgressCount} in progress${colors.reset}${colors.gray}`);
            if (pendingCount > 0)
                parts.push(`${pendingCount} pending`);
            return `${total} todos (${parts.join(", ")})`;
        }
        default:
            return result.length > 50 ? result.substring(0, 47) + "..." : result;
    }
};
