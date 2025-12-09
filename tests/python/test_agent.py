"""
Unit tests for agent.py

Tests cover:
- Agent initialization
- Tool registration and unregistration
- Tool listing
- Tool decision logic
- Query execution
- History tracking
- Edge cases and error handling
"""

import pytest
from agent import (
    Agent,
    InvocationRecord,
    uppercase_tool,
    word_count_tool,
    reverse_tool,
)


class TestAgentInitialization:
    """Test Agent initialization and default state."""

    def test_agent_default_initialization(self):
        """Agent should initialize with empty tools and history."""
        agent = Agent()
        assert agent.tools == {}
        assert agent.history == []

    def test_agent_list_tools_empty(self):
        """list_tools should return empty list for new agent."""
        agent = Agent()
        assert agent.list_tools() == []


class TestToolRegistration:
    """Test tool registration functionality."""

    def test_register_single_tool(self):
        """Should successfully register a single tool."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        assert "uppercase" in agent.tools
        assert agent.list_tools() == ["uppercase"]

    def test_register_multiple_tools(self):
        """Should successfully register multiple tools."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        agent.register_tool("reverse", reverse_tool)
        
        assert len(agent.tools) == 3
        assert set(agent.list_tools()) == {"uppercase", "word_count", "reverse"}

    def test_register_duplicate_tool_raises_error(self):
        """Registering a duplicate tool name should raise ValueError."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        with pytest.raises(ValueError, match="already registered"):
            agent.register_tool("uppercase", word_count_tool)

    def test_register_empty_name_raises_error(self):
        """Registering with empty name should raise ValueError."""
        agent = Agent()
        
        with pytest.raises(ValueError, match="non-empty string"):
            agent.register_tool("", uppercase_tool)

    def test_register_whitespace_name_raises_error(self):
        """Registering with whitespace-only name should raise ValueError."""
        agent = Agent()
        
        with pytest.raises(ValueError, match="non-empty string"):
            agent.register_tool("   ", uppercase_tool)

    def test_register_non_string_name_raises_error(self):
        """Registering with non-string name should raise ValueError."""
        agent = Agent()
        
        with pytest.raises(ValueError, match="non-empty string"):
            agent.register_tool(123, uppercase_tool)


class TestToolUnregistration:
    """Test tool unregistration functionality."""

    def test_unregister_existing_tool(self):
        """Should successfully unregister an existing tool."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        assert "uppercase" in agent.tools
        
        agent.unregister_tool("uppercase")
        assert "uppercase" not in agent.tools
        assert agent.list_tools() == []

    def test_unregister_nonexistent_tool_raises_error(self):
        """Unregistering a non-existent tool should raise KeyError."""
        agent = Agent()
        
        with pytest.raises(KeyError):
            agent.unregister_tool("nonexistent")

    def test_unregister_one_of_many_tools(self):
        """Should unregister only the specified tool."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        agent.register_tool("reverse", reverse_tool)
        
        agent.unregister_tool("word_count")
        
        assert "word_count" not in agent.tools
        assert "uppercase" in agent.tools
        assert "reverse" in agent.tools
        assert set(agent.list_tools()) == {"uppercase", "reverse"}


class TestToolDecision:
    """Test the tool decision logic."""

    def test_decide_tool_exact_match(self):
        """Should find tool when query contains exact tool name."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        assert agent.decide_tool("use uppercase please") == "uppercase"

    def test_decide_tool_case_insensitive(self):
        """Tool matching should be case-insensitive."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        assert agent.decide_tool("use UPPERCASE please") == "uppercase"
        assert agent.decide_tool("use UpPeRcAsE please") == "uppercase"

    def test_decide_tool_no_match(self):
        """Should return None when no tool matches."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        assert agent.decide_tool("do something else") is None

    def test_decide_tool_multiple_matches_returns_first(self):
        """When multiple tools match, should return first registered."""
        agent = Agent()
        agent.register_tool("word", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        
        # "word" is registered first and matches
        assert agent.decide_tool("use word_count") == "word"

    def test_decide_tool_substring_match(self):
        """Tool name as substring should match."""
        agent = Agent()
        agent.register_tool("count", word_count_tool)
        
        assert agent.decide_tool("word_count this") == "count"

    def test_decide_tool_empty_query(self):
        """Empty query should not match any tool."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        assert agent.decide_tool("") is None


class TestAgentRun:
    """Test the agent's run method."""

    def test_run_with_matching_tool(self):
        """Should execute the matching tool."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        result = agent.run("use uppercase on this")
        assert result == "USE UPPERCASE ON THIS"

    def test_run_without_matching_tool(self):
        """Should echo the query when no tool matches."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        result = agent.run("do something else")
        assert result == "[echo] do something else"

    def test_run_with_word_count_tool(self):
        """Should correctly execute word_count_tool."""
        agent = Agent()
        agent.register_tool("word_count", word_count_tool)
        
        result = agent.run("run word_count on this sentence")
        assert result == "word_count=5"

    def test_run_with_reverse_tool(self):
        """Should correctly execute reverse_tool."""
        agent = Agent()
        agent.register_tool("reverse", reverse_tool)
        
        result = agent.run("reverse hello")
        assert result == "olleh esrever"

    def test_run_updates_history(self):
        """Each run should append to history."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        assert len(agent.history) == 0
        
        agent.run("use uppercase")
        assert len(agent.history) == 1
        
        agent.run("do something")
        assert len(agent.history) == 2

    def test_run_history_records_correct_data(self):
        """History should record query, tool_name, and result."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        result = agent.run("use uppercase here")
        
        record = agent.history[0]
        assert isinstance(record, InvocationRecord)
        assert record.query == "use uppercase here"
        assert record.tool_name == "uppercase"
        assert record.result == "USE UPPERCASE HERE"

    def test_run_history_records_echo(self):
        """History should record None for tool_name when echoing."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        
        result = agent.run("no match")
        
        record = agent.history[0]
        assert record.query == "no match"
        assert record.tool_name is None
        assert record.result == "[echo] no match"

    def test_run_multiple_queries(self):
        """Should handle multiple sequential queries correctly."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        
        result1 = agent.run("use uppercase")
        result2 = agent.run("run word_count here")
        result3 = agent.run("no tool")
        
        assert result1 == "USE UPPERCASE"
        assert result2 == "word_count=3"
        assert result3 == "[echo] no tool"
        assert len(agent.history) == 3


class TestLastInvocation:
    """Test the last_invocation method."""

    def test_last_invocation_empty_history(self):
        """Should return None when history is empty."""
        agent = Agent()
        assert agent.last_invocation() is None

    def test_last_invocation_single_record(self):
        """Should return the only record."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        agent.run("use uppercase")
        
        last = agent.last_invocation()
        assert last is not None
        assert last.query == "use uppercase"
        assert last.tool_name == "uppercase"

    def test_last_invocation_multiple_records(self):
        """Should return the most recent record."""
        agent = Agent()
        agent.register_tool("uppercase", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        
        agent.run("first query uppercase")
        agent.run("second query word_count")
        agent.run("third query")
        
        last = agent.last_invocation()
        assert last is not None
        assert last.query == "third query"
        assert last.tool_name is None
        assert last.result == "[echo] third query"


class TestExampleTools:
    """Test the example tool functions."""

    def test_uppercase_tool(self):
        """uppercase_tool should convert to uppercase."""
        assert uppercase_tool("hello world") == "HELLO WORLD"
        assert uppercase_tool("MiXeD CaSe") == "MIXED CASE"
        assert uppercase_tool("") == ""

    def test_word_count_tool(self):
        """word_count_tool should count words correctly."""
        assert word_count_tool("one two three") == "word_count=3"
        assert word_count_tool("single") == "word_count=1"
        assert word_count_tool("") == "word_count=0"
        assert word_count_tool("  multiple   spaces  ") == "word_count=2"

    def test_reverse_tool(self):
        """reverse_tool should reverse the string."""
        assert reverse_tool("hello") == "olleh"
        assert reverse_tool("racecar") == "racecar"
        assert reverse_tool("") == ""
        assert reverse_tool("a b c") == "c b a"


class TestIntegrationScenarios:
    """Test complete workflows and integration scenarios."""

    def test_complete_workflow(self):
        """Test a complete agent workflow."""
        agent = Agent()
        
        # Start with no tools
        assert agent.list_tools() == []
        
        # Register tools
        agent.register_tool("uppercase", uppercase_tool)
        agent.register_tool("word_count", word_count_tool)
        
        # Use tools
        result1 = agent.run("please use uppercase")
        assert result1 == "PLEASE USE UPPERCASE"
        
        result2 = agent.run("run word_count on this")
        assert result2 == "word_count=4"
        
        # Check history
        assert len(agent.history) == 2
        assert agent.last_invocation().result == "word_count=4"
        
        # Unregister a tool
        agent.unregister_tool("uppercase")
        
        # Now uppercase query should echo
        result3 = agent.run("use uppercase again")
        assert result3 == "[echo] use uppercase again"

    def test_tool_priority_order(self):
        """Test that tool registration order matters for matching."""
        agent = Agent()
        
        # Register in specific order
        agent.register_tool("test", lambda q: "test_tool")
        agent.register_tool("testing", lambda q: "testing_tool")
        
        # "test" matches first
        result = agent.run("use testing")
        assert result == "test_tool"

    def test_custom_tool_function(self):
        """Test registering custom tool functions."""
        agent = Agent()
        
        def custom_tool(query: str) -> str:
            return f"Custom: {query}"
        
        agent.register_tool("custom", custom_tool)
        result = agent.run("use custom tool")
        
        assert result == "Custom: use custom tool"

    def test_lambda_tool_function(self):
        """Test registering lambda functions as tools."""
        agent = Agent()
        
        agent.register_tool("double", lambda q: q + q)
        result = agent.run("double this")
        
        assert result == "double thisdouble this"
