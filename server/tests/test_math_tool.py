import json
import pytest
from app.ai.tool.math_parser import safe_parse_expr, validate_expression_safety
from app.ai.tool.math_tool import math_tool
from app.ai.agents.router import router_node
from langchain_core.messages import HumanMessage


def test_safe_math_parser_valid():
    expr = safe_parse_expr("x^2 + 5x + 6")
    assert str(expr) == "x**2 + 5*x + 6"

    sin_expr = safe_parse_expr("sin(x)/x")
    assert str(sin_expr) == "sin(x)/x"


def test_safe_math_parser_forbidden_injection():
    invalid_inputs = [
        "__import__('os').system('dir')",
        "eval('1 + 1')",
        "exec('import sys')",
        "open('/etc/passwd')",
        "globals()",
        "locals()",
        "subprocess.Popen()",
    ]
    for expr in invalid_inputs:
        with pytest.raises(ValueError):
            safe_parse_expr(expr)


def test_math_tool_factorization():
    raw_res = math_tool.invoke({"operation": "factor", "expression": "x^2 + 5x + 6"})
    res = json.loads(raw_res)
    assert res["success"] is True
    assert "(x + 2)*(x + 3)" in res["result"] or "(x + 3)*(x + 2)" in res["result"]


def test_math_tool_expansion():
    raw_res = math_tool.invoke({"operation": "expand", "expression": "(x + 2)*(x + 3)"})
    res = json.loads(raw_res)
    assert res["success"] is True
    assert "x**2 + 5*x + 6" in res["result"]


def test_math_tool_simplification():
    raw_res = math_tool.invoke({"operation": "simplify", "expression": "(x^2 - 1)/(x - 1)"})
    res = json.loads(raw_res)
    assert res["success"] is True
    assert "x + 1" in res["result"]


def test_math_tool_solve_equation():
    raw_res = math_tool.invoke({"operation": "solve", "expression": "x^2 - 4 = 0", "symbol": "x"})
    res = json.loads(raw_res)
    assert res["success"] is True
    assert "-2" in res["result"] and "2" in res["result"]


def test_math_tool_derivative():
    raw_res = math_tool.invoke({"operation": "derivative", "expression": "sin(x) * x^2", "symbol": "x"})
    res = json.loads(raw_res)
    assert res["success"] is True
    assert "cos(x)" in res["result"] or "2*x" in res["result"]


def test_math_tool_integral():
    raw_res = math_tool.invoke({
        "operation": "integral",
        "expression": "x^2",
        "symbol": "x",
        "extra_params": '{"lower": 0, "upper": 3}',
    })
    res = json.loads(raw_res)
    assert res["success"] is True
    assert res["result"] == "9"


def test_math_tool_limit():
    raw_res = math_tool.invoke({
        "operation": "limit",
        "expression": "sin(x)/x",
        "symbol": "x",
        "extra_params": '{"point": 0}',
    })
    res = json.loads(raw_res)
    assert res["success"] is True
    assert res["result"] == "1"


def test_math_tool_matrix_determinant():
    raw_res = math_tool.invoke({
        "operation": "matrix_det",
        "expression": "[[1, 2], [3, 4]]",
    })
    res = json.loads(raw_res)
    assert res["success"] is True
    assert res["result"] == "-2"


def test_math_tool_stat_summary():
    raw_res = math_tool.invoke({
        "operation": "stat_summary",
        "expression": "[10, 20, 30, 40, 50]",
    })
    res = json.loads(raw_res)
    assert res["success"] is True
    assert res["result"]["mean"] == 30.0
    assert res["result"]["median"] == 30.0
    assert res["result"]["min"] == 10.0
    assert res["result"]["max"] == 50.0


@pytest.mark.asyncio
async def test_router_decision_for_math():
    state = {
        "messages": [HumanMessage(content="Factor the polynomial x^2 + 5x + 6")],
    }
    decision = await router_node(state)
    assert decision.get("next_step") == "math_agent"
