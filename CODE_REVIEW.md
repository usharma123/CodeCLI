# Code Review

## Summary
- Reviewed the conversational agent flow and CLI entry point for resiliency and runtime safety.
- Identified issues that may prevent the agent from functioning as intended or lead to user-facing failures.

## Findings
1. **Fallback model identifier likely invalid**  
   The retry path uses the model id `anthropic/claude-4.5-sonnet`, whereas the primary request uses `anthropic/claude-sonnet-4.5`. The swapped segments look like a typo and will likely cause fallback calls to fail with a 404/400 from OpenRouter instead of providing a second attempt. Align the fallback identifier with a valid model name to keep the recovery path usable.  
   _Location: `src/core/agent.ts`, lines 326-374._

2. **Non-interactive mode still enters an interactive loop**  
   When `process.stdin` is not a TTY, the app logs a warning but still calls `agent.run()`, which relies on readline prompts and an infinite loop waiting for user input. In CI or piping scenarios, this will hang because no input is available. Consider exiting early with a clear error, or provide an alternative code path (e.g., processing scripted commands) for non-interactive environments.  
   _Location: `src/index.ts`, lines 33-78._

3. **Conversation history is unbounded**  
   Every user message, tool response, and follow-up assistant message is appended to `this.messages` without trimming or summarization. Long sessions will eventually exceed the 16k token limit used for completions, causing 400 errors and lost context. Implement context window management (e.g., retaining recent exchanges and summarizing older ones) to keep prompts within the model limits.  
   _Location: `src/core/agent.ts`, lines 277-378 and 634-691._
