# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a terminal-based AI coding agent that uses the OpenRouter API (OpenAI-compatible) with Claude Sonnet 4.5 to perform file operations with built-in safety features. The agent provides an interactive CLI where users can request code changes, and all file modifications require explicit user approval before being applied.

## Development Commands

```bash
# Install dependencies with Bun
bun install

# Run in development mode (Bun runs TypeScript directly)
bun run dev

# Run the agent
bun start

# Build TypeScript to JavaScript (optional)
bun run build
```

## Configuration

The agent requires an OpenRouter API key to function:

1. Create a `.env` file in the project root
2. Add: `OPENROUTER_API_KEY=sk-or-v1-your-api-key-here`
3. Get an API key from: https://openrouter.ai/keys

## Architecture

### Core Components

**Main Agent Class (`AIAgent`)** (src/index.ts:57-340)
- Manages conversation history and message flow
- Handles standard OpenAI tool calls
- Implements retry logic for API errors (max 3 retries)
- All file operations require explicit user confirmation

**Tool System**
The agent uses four file operation tools:
- `read_file`: Read file contents (truncates at 10,000 chars)
- `list_files`: List directory contents (max depth: 3, skips node_modules/.git/hidden files)
- `write_file`: Create or overwrite files (shows preview, requires confirmation)
- `edit_file`: Replace specific text in files (shows diff-style preview, requires confirmation)

### Key Architectural Details

**API Configuration** (src/index.ts:67-74)
- Uses OpenAI SDK with custom base URL: `https://openrouter.ai/api/v1`
- Primary Model: `anthropic/claude-sonnet-4.5` (Anthropic's latest coding model with excellent tool calling)
- Temperature: 0.3 for consistent and reliable code generation
- Max tokens: 2048
- Optional headers: HTTP-Referer and X-Title for app attribution

**Error Recovery** (src/index.ts:220-245)
- Automatic retry on 400 errors (up to 3 attempts)
- Removes problematic messages and adds clarification prompts
- Graceful degradation on tool call errors

**Message Flow**
1. User input → added to message history
2. API call with tools enabled
3. If tool calls detected → execute with user confirmation
4. Tool results → added to history
5. Follow-up API call to generate natural language response

**Safe Mode** (src/index.ts:500-595, 621-742)
- All file writes/edits show preview before execution
- Previews limited to first 20 lines (write_file) or 10 lines (edit_file)
- User must type 'y' or 'yes' to confirm
- Operation cancelled message if user declines

### Tool Implementation Patterns

**Shared Readline Interface** (src/index.ts:381-387)
- Single confirmation interface shared across tools to avoid multiple stdin listeners
- Critical for preventing "Too many listeners" warnings

**File Preview Format**
- write_file: Shows first 20 lines with line count indicator
- edit_file: Shows git-diff style (-/+ with color coding)
- Both use color-coded output for better readability

## TypeScript Configuration

- Module system: NodeNext (ES modules)
- Target: ESNext
- Strict mode enabled
- Output directory: `./dist`
- Source directory: `./src`

## Important Constraints

1. **File Size Limits**
   - read_file truncates at 10,000 characters
   - Tool previews limited (20 lines for write_file, 10 for edit_file)

2. **Directory Traversal**
   - list_files max depth: 3 levels
   - Automatically skips: node_modules, .git, hidden files (starting with .)

3. **Error Handling**
   - Max 3 retry attempts for API errors
   - Invalid tool arguments handled gracefully
   - File not found errors provide helpful messages

4. **Conversation Context**
   - All messages stored in memory during session
   - No persistence between sessions
   - Tool results always added to message history for context

## Model Behavior Notes

- Primary model: `anthropic/claude-sonnet-4.5` - Anthropic's latest Sonnet model optimized for coding and tool calling
- Tool choice is set to "auto" - model decides when to use tools
- Temperature: 0.3 for consistent and deterministic code generation
- JSON parsing includes automatic cleanup for common formatting issues (unterminated strings, trailing commas)
- Tool calls are displayed with full transparency - shows arguments, execution status, and results
- Follow-up responses after tool execution may fail gracefully without breaking the flow
