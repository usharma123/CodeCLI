"""
test_agent.py

Unit tests for agent.py
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
        """Test that a new agent starts with empty tools and history."""
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
        """Test that registering a tool with an empty name raises ValueError."""
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

    def test_unregister_tool_not_found_raises_error(self):
        """Test that unregistering a non-existent tool raises KeyError."""
        agent = Agent()
        
        with pytest.raises(KeyError):
            agent.unregister_tool("nonexistent")

    def test_list_tools_returns_copy(self):
        """Test that list_tools returns a list (not affecting internal state)."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        tools_list = agent.list_tools()
        tools_list.append("fake_tool")
        
        # Original agent should not be affected
        assert agent.list_tools() == ["uppercase"]

    def test_decide_tool_single_match(self):
        """Test decide_tool with a single matching tool."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        assert agent.decide_tool("please use UPPERCASE here") == "uppercase"
        assert agent.decide_tool("UPPERCASE this") == "uppercase"
        assert agent.decide_tool("uppercase") == "uppercase"

    def test_decide_tool_case_insensitive(self):
        """Test that decide_tool is case-insensitive."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        assert agent.decide_tool("UPPERCASE") == "uppercase"
        assert agent.decide_tool("UpPeRcAsE") == "uppercase"
        assert agent.decide_tool("uppercase") == "uppercase"

    def test_decide_tool_no_match(self):
        """Test decide_tool when no tool matches."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        assert agent.decide_tool("please do something else") is None
        assert agent.decide_tool("") is None

    def test_decide_tool_multiple_matches_first_wins(self):
        """Test that when multiple tools match, the first registered wins."""
        agent = Agent()
        agent.register_tool("word", lambda x: "word_tool")
        agent.register_tool("word_count", word_count_tool)
        
        # "word" is registered first and matches
        result = agent.decide_tool("use word_count please")
        assert result == "word"

    def test_decide_tool_insertion_order(self):
        """Test that tool matching respects insertion order."""
        agent = Agent()
        agent.register_tool("reverse", reverse_tool)
        agent.register_tool("uppercase", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        
        # Only "reverse" matches
        assert agent.decide_tool("reverse this") == "reverse"
        
        # Only "uppercase" matches
        assert agent.decide_tool("uppercase this") == "uppercase"
        
        # If query contains multiple tool names, first registered wins
        assert agent.decide_tool("reverse and uppercase") == "reverse"

    def test_run_with_matching_tool(self):
        """Test run() when a tool matches the query."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        result = agent.run("please use UPPERCASE here")
        
        assert result == "PLEASE USE UPPERCASE HERE"

    def test_run_with_no_matching_tool(self):
        """Test run() when no tool matches (echo behavior)."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        result = agent.run("do something else")
        
        assert result == "[echo] do something else"

    def test_run_updates_history(self):
        """Test that run() appends to history."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        agent.run("use uppercase")
        agent.run("do something else")
        
        assert len(agent.history) == 2
        
        # First invocation
        assert agent.history[0].query == "use uppercase"
        assert agent.history[0].tool_name == "uppercase"
        assert agent.history[0].result == "USE UPPERCASE"
        
        # Second invocation
        assert agent.history[1].query == "do something else"
        assert agent.history[1].tool_name is None
        assert agent.history[1].result == "[echo] do something else"

    def test_last_invocation_with_history(self):
        """Test last_invocation() returns the most recent record."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        agent.run("first query")
        agent.run("second query")
        agent.run("third query")
        
        last = agent.last_invocation()
        
        assert last is not None
        assert last.query == "third query"
        assert last.result == "[echo] third query"

    def test_last_invocation_empty_history(self):
        """Test last_invocation() returns None when history is empty."""
        agent = Agent()
        
        assert agent.last_invocation() is None

    def test_run_multiple_queries(self):
        """Test running multiple queries with different tools."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        agent.register_tool("reverse", reverse_tool)
        
        result1 = agent.run("use uppercase on this")
        result2 = agent.run("run word_count here")
        result3 = agent.run("reverse this text")
        result4 = agent.run("no tool matches")
        
        assert result1 == "USE UPPERCASE ON THIS"
        assert result2 == "word_count=3"
        assert result3 == "txet siht esrever"
        assert result4 == "[echo] no tool matches"
        
        assert len(agent.history) == 4


class TestInvocationRecord:
    """Test suite for the InvocationRecord dataclass."""

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
        """Test InvocationRecord with None tool_name."""
        record = InvocationRecord(
            query="test query",
            tool_name=None,
            result="[echo] test query"
        )
        
        assert record.query == "test query"
        assert record.tool_name is None
        assert record.result == "[echo] test query"


class TestTools:
    """Test suite for the example tool functions."""

    def test_uppercase_tool(self):
        """Test the uppercase_tool function."""
        assert uppercase_tool("hello world") == "HELLO WORLD"
        assert uppercase_tool("ALREADY UPPER") == "ALREADY UPPER"
        assert uppercase_tool("MiXeD CaSe") == "MIXED CASE"
        assert uppercase_tool("") == ""

    def test_word_count_tool(self):
        """Test the word_count_tool function."""
        assert word_count_tool("hello world") == "word_count=2"
        assert word_count_tool("one") == "word_count=1"
        assert word_count_tool("one two three four five") == "word_count=5"
        assert word_count_tool("") == "word_count=0"
        assert word_count_tool("   spaces   between   ") == "word_count=2"

    def test_reverse_tool(self):
        """Test the reverse_tool function."""
        assert reverse_tool("hello") == "olleh"
        assert reverse_tool("hello world") == "dlrow olleh"
        assert reverse_tool("") == ""
        assert reverse_tool("a") == "a"
        assert reverse_tool("racecar") == "racecar"


class TestAgentIntegration:
    """Integration tests for Agent with various scenarios."""

    def test_agent_workflow(self):
        """Test a complete workflow with the agent."""
        agent = Agent()
        
        # Start with no tools
        assert agent.run("hello") == "[echo] hello"
        
        # Register tools
        agent.register_tool("uppercase", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        
        # Use tools
        assert agent.run("use uppercase") == "USE UPPERCASE"
        assert agent.run("run word_count on this") == "word_count=4"
        
        # Unregister a tool
        agent.unregister_tool("uppercase")
        
        # Tool no longer works
        assert agent.run("use uppercase") == "[echo] use uppercase"
        
        # Other tool still works
        assert agent.run("word_count test") == "word_count=2"
        
        # Check history
        assert len(agent.history) == 5

    def test_agent_with_custom_tool(self):
        """Test agent with a custom tool function."""
        agent = Agent()
        
        def custom_tool(query: str) -> str:
            return f"Custom: {query}"
        
        agent.register_tool("custom", custom_tool)
        
        result = agent.run("use custom tool")
        assert result == "Custom: use custom tool"
        
        last = agent.last_invocation()
        assert last.tool_name == "custom"

    def test_agent_tool_name_substring_matching(self):
        """Test that tool names are matched as substrings."""
        agent = Agent()
        agent.register_tool("count", lambda x: "count_tool")
        
        # "count" is a substring of these queries
        assert agent.run("word_count") == "count_tool"
        assert agent.run("counting") == "count_tool"
        assert agent.run("account") == "count_tool"

    def test_agent_empty_query(self):
        """Test agent behavior with empty query."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        result = agent.run("")
        assert result == "[echo] "
        
        last = agent.last_invocation()
        assert last.query == ""
        assert last.tool_name is None
