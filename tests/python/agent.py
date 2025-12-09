"""
agent.py

A small, deterministic "Agent" you can write unit tests for.

Example usage (outside of tests):

    from agent import Agent, uppercase_tool, word_count_tool

    agent = Agent()
    agent.register_tool("uppercase", uppercase_tool)
    agent.register_tool("word_count", word_count_tool)

    print(agent.run("please use UPPERCASE here"))
    print(agent.run("run word_count on this sentence"))
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional, Any

ToolFn = Callable[[str], str]


@dataclass
class InvocationRecord:
    """Record of a single agent invocation."""
    query: str
    tool_name: Optional[str]
    result: str


@dataclass
class Agent:
    """
    Simple, deterministic agent that routes text queries to tools.

    Behavior (good for unit tests):
    - register_tool / unregister_tool change the internal tool registry.
    - run() chooses a tool whose name appears in the query (case-insensitive).
    - if multiple tools match, the earliest registered one wins.
    - if no tool matches, the agent echoes the query.
    - every call to run() appends an InvocationRecord to history.
    """
    tools: Dict[str, ToolFn] = field(default_factory=dict)
    history: List[InvocationRecord] = field(default_factory=list)

    def register_tool(self, name: str, fn: ToolFn) -> None:
        """Register a tool function under a non-empty, unique name."""
        if not isinstance(name, str) or not name.strip():
            raise ValueError("Tool name must be a non-empty string.")
        if name in self.tools:
            raise ValueError(f"Tool {name!r} already registered.")
        self.tools[name] = fn

    def unregister_tool(self, name: str) -> None:
        """Remove a previously registered tool. Raises KeyError if missing."""
        del self.tools[name]

    def list_tools(self) -> List[str]:
        """Return a list of registered tool names."""
        return list(self.tools.keys())

    def decide_tool(self, query: str) -> Optional[str]:
        """
        Decide which tool to use based on the query.

        Strategy:
        - Convert query to lowercase.
        - If a tool name is a substring of the query, it's considered a match.
        - If multiple match, return the first one in insertion order.
        - If none match, return None.
        """
        lowered = query.lower()
        for name in self.tools.keys():
            if name.lower() in lowered:
                return name
        return None

    def run(self, query: str) -> str:
        """
        Process a query using the chosen tool (if any).

        Returns:
        - tool(query) if a tool matches.
        - "[echo] {query}" otherwise.

        Also appends an InvocationRecord to self.history.
        """
        tool_name = self.decide_tool(query)
        if tool_name is None:
            result = f"[echo] {query}"
        else:
            tool = self.tools[tool_name]
            result = tool(query)

        self.history.append(InvocationRecord(query=query,
                                             tool_name=tool_name,
                                             result=result))
        return result

    def last_invocation(self) -> Optional[InvocationRecord]:
        """Return the last invocation record, or None if there is no history."""
        if not self.history:
            return None
        return self.history[-1]


# --- Example tools ----------------------------------------------------------


def uppercase_tool(query: str) -> str:
    """Return the query fully uppercased."""
    return query.upper()


def word_count_tool(query: str) -> str:
    """Return a tiny report with the number of words in the query."""
    count = len(query.split())
    return f"word_count={count}"


def reverse_tool(query: str) -> str:
    """Reverse the entire string."""
    return query[::-1]