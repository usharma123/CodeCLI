"""
Unit tests for agent.py

Tests the Agent class and its tool registration, routing, and execution logic.
"""

import pytest
from agent import (
    Agent,
    InvocationRecord,
    uppercase_tool,
    word_count_tool,
    reverse_tool,
)


class TestAgent:
    """Test suite for the Agent class."""

    def test_agent_initialization(self):
        """Test that a new Agent starts with empty tools and history."""
        agent = Agent()
        assert agent.tools == {}
        assert agent.history == []
        assert agent.list_tools() == []

    def test_register_tool_success(self):
        """Test successful tool registration."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        assert "uppercase" in agent.tools
        assert agent.tools["uppercase"] == uppercase_tool
        assert agent.list_tools() == ["uppercase"]

    def test_register_multiple_tools(self):
        """Test registering multiple tools."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        agent.register_tool("reverse", reverse_tool)
        
        assert len(agent.tools) == 3
        assert set(agent.list_tools()) == {"uppercase", "word_count", "reverse"}

    def test_register_tool_empty_name_raises_error(self):
        """Test that registering a tool with empty name raises ValueError."""
        agent = Agent()
        
        with pytest.raises(ValueError, match="Tool name must be a non-empty string"):
            agent.register_tool("", uppercase_tool)
        
        with pytest.raises(ValueError, match="Tool name must be a non-empty string"):
            agent.register_tool("   ", uppercase_tool)

    def test_register_tool_duplicate_name_raises_error(self):
        """Test that registering a duplicate tool name raises ValueError."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        with pytest.raises(ValueError, match="Tool 'uppercase' already registered"):
            agent.register_tool("uppercase", word_count_tool)

    def test_unregister_tool_success(self):
        """Test successful tool unregistration."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        
        agent.unregister_tool("uppercase")
        
        assert "uppercase" not in agent.tools
        assert "word_count" in agent.tools
        assert agent.list_tools() == ["word_count"]

    def test_unregister_nonexistent_tool_raises_error(self):
        """Test that unregistering a non-existent tool raises KeyError."""
        agent = Agent()
        
        with pytest.raises(KeyError):
            agent.unregister_tool("nonexistent")

    def test_decide_tool_single_match(self):
        """Test tool decision with a single matching tool."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        
        assert agent.decide_tool("please use UPPERCASE here") == "uppercase"
        assert agent.decide_tool("run word_count on this") == "word_count"

    def test_decide_tool_case_insensitive(self):
        """Test that tool matching is case-insensitive."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        assert agent.decide_tool("UPPERCASE this") == "uppercase"
        assert agent.decide_tool("UpPeRcAsE this") == "uppercase"
        assert agent.decide_tool("uppercase this") == "uppercase"

    def test_decide_tool_multiple_matches_returns_first(self):
        """Test that when multiple tools match, the first registered one wins."""
        agent = Agent()
        agent.register_tool("word", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        
        # "word_count" contains "word", so both match
        # But "word" was registered first
        result = agent.decide_tool("use word_count here")
        assert result == "word"

    def test_decide_tool_no_match(self):
        """Test that decide_tool returns None when no tool matches."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        assert agent.decide_tool("do something else") is None

    def test_decide_tool_empty_tools(self):
        """Test decide_tool with no registered tools."""
        agent = Agent()
        assert agent.decide_tool("any query") is None

    def test_run_with_matching_tool(self):
        """Test run() executes the matching tool."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        result = agent.run("use uppercase here")
        assert result == "USE UPPERCASE HERE"

    def test_run_with_no_matching_tool(self):
        """Test run() echoes the query when no tool matches."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        result = agent.run("do something else")
        assert result == "[echo] do something else"

    def test_run_updates_history(self):
        """Test that run() appends to history."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        agent.run("use uppercase here")
        
        assert len(agent.history) == 1
        record = agent.history[0]
        assert record.query == "use uppercase here"
        assert record.tool_name == "uppercase"
        assert record.result == "USE UPPERCASE HERE"

    def test_run_multiple_calls_history(self):
        """Test that multiple run() calls accumulate in history."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        
        agent.run("use uppercase here")
        agent.run("run word_count on this sentence")
        agent.run("no matching tool")
        
        assert len(agent.history) == 3
        
        assert agent.history[0].tool_name == "uppercase"
        assert agent.history[1].tool_name == "word_count"
        assert agent.history[2].tool_name is None
        assert agent.history[2].result == "[echo] no matching tool"

    def test_last_invocation_with_history(self):
        """Test last_invocation() returns the most recent record."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        agent.run("first query")
        agent.run("second query")
        
        last = agent.last_invocation()
        assert last is not None
        assert last.query == "second query"

    def test_last_invocation_empty_history(self):
        """Test last_invocation() returns None when history is empty."""
        agent = Agent()
        assert agent.last_invocation() is None

    def test_run_with_word_count_tool(self):
        """Test run() with word_count_tool."""
        agent = Agent()
        agent.register_tool("word_count", word_count_tool)
        
        result = agent.run("run word_count on this sentence")
        assert result == "word_count=5"

    def test_run_with_reverse_tool(self):
        """Test run() with reverse_tool."""
        agent = Agent()
        agent.register_tool("reverse", reverse_tool)
        
        result = agent.run("use reverse tool")
        assert result == "loot esrever esu"


class TestBuiltInTools:
    """Test suite for the built-in tool functions."""

    def test_uppercase_tool(self):
        """Test uppercase_tool converts to uppercase."""
        assert uppercase_tool("hello world") == "HELLO WORLD"
        assert uppercase_tool("ALREADY UPPER") == "ALREADY UPPER"
        assert uppercase_tool("MiXeD CaSe") == "MIXED CASE"
        assert uppercase_tool("") == ""

    def test_word_count_tool(self):
        """Test word_count_tool counts words correctly."""
        assert word_count_tool("one two three") == "word_count=3"
        assert word_count_tool("single") == "word_count=1"
        assert word_count_tool("") == "word_count=0"
        assert word_count_tool("  multiple   spaces  ") == "word_count=2"

    def test_reverse_tool(self):
        """Test reverse_tool reverses strings."""
        assert reverse_tool("hello") == "olleh"
        assert reverse_tool("12345") == "54321"
        assert reverse_tool("") == ""
        assert reverse_tool("a") == "a"
        assert reverse_tool("racecar") == "racecar"  # palindrome


class TestInvocationRecord:
    """Test suite for InvocationRecord dataclass."""

    def test_invocation_record_creation(self):
        """Test creating an InvocationRecord."""
        record = InvocationRecord(
            query="test query",
            tool_name="uppercase",
            result="TEST QUERY"
        )
        
        assert record.query == "test query"
        assert record.tool_name == "uppercase"
        assert record.result == "TEST QUERY"

    def test_invocation_record_with_none_tool(self):
        """Test InvocationRecord with None tool_name (echo case)."""
        record = InvocationRecord(
            query="test query",
            tool_name=None,
            result="[echo] test query"
        )
        
        assert record.query == "test query"
        assert record.tool_name is None
        assert record.result == "[echo] test query"


class TestEdgeCases:
    """Test edge cases and integration scenarios."""

    def test_tool_with_special_characters_in_name(self):
        """Test registering and using tools with special characters."""
        agent = Agent()
        agent.register_tool("tool-1", uppercase_tool)
        agent.register_tool("tool_2", word_count_tool)
        
        result = agent.run("use tool-1 here")
        assert result == "USE TOOL-1 HERE"
        
        result = agent.run("use tool_2 here")
        assert result == "word_count=3"

    def test_empty_query(self):
        """Test running with an empty query."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        result = agent.run("")
        assert result == "[echo] "

    def test_query_is_exact_tool_name(self):
        """Test when query is exactly the tool name."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        result = agent.run("uppercase")
        assert result == "UPPERCASE"

    def test_custom_tool_function(self):
        """Test registering and using a custom tool function."""
        def custom_tool(query: str) -> str:
            return f"Custom: {query}"
        
        agent = Agent()
        agent.register_tool("custom", custom_tool)
        
        result = agent.run("use custom tool")
        assert result == "Custom: use custom tool"

    def test_tool_order_preservation(self):
        """Test that tool registration order is preserved."""
        agent = Agent()
        agent.register_tool("first", uppercase_tool)
        agent.register_tool("second", word_count_tool)
        agent.register_tool("third", reverse_tool)
        
        tools = agent.list_tools()
        assert tools == ["first", "second", "third"]

    def test_reregister_after_unregister(self):
        """Test re-registering a tool after unregistering it."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        agent.unregister_tool("uppercase")
        agent.register_tool("uppercase", word_count_tool)  # Different function
        
        result = agent.run("use uppercase here")
        # Should use word_count_tool now
        assert result == "word_count=3"
