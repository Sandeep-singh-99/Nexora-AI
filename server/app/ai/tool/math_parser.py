import re
from typing import Any, Dict, List, Set, Union
import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor,
)

# Forbidden keywords/patterns to prevent arbitrary code execution or introspection
FORBIDDEN_PATTERNS: Set[str] = {
    "__",
    "import",
    "eval",
    "exec",
    "globals",
    "locals",
    "getattr",
    "setattr",
    "delattr",
    "hasattr",
    "compile",
    "open",
    "file",
    "os",
    "sys",
    "subprocess",
    "lambda",
    "builtins",
    "breakpoint",
    "input",
    "memoryview",
}

DEFAULT_TRANSFORMATIONS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)


def validate_expression_safety(expr_str: str) -> None:
    """Validates that expression string contains no dangerous Python keywords or patterns."""
    if not expr_str or not isinstance(expr_str, str):
        raise ValueError("Expression must be a non-empty string.")

    if len(expr_str) > 1000:
        raise ValueError("Expression string exceeds maximum allowed length of 1000 characters.")

    lowered = expr_str.lower()
    for pattern in FORBIDDEN_PATTERNS:
        # Match whole words or forbidden substrings like '__'
        if pattern == "__" and "__" in lowered:
            raise ValueError("Forbidden pattern detected in mathematical expression: '__'")
        elif re.search(r"\b" + re.escape(pattern) + r"\b", lowered):
            raise ValueError(f"Forbidden keyword detected in mathematical expression: '{pattern}'")


def safe_parse_expr(
    expr_str: str,
    local_dict: Union[Dict[str, Any], None] = None,
    evaluate: bool = True,
) -> sp.Expr:
    """Safely parses a math string into a SymPy expression using restricted grammar."""
    validate_expression_safety(expr_str)

    # Allowed safe symbols and standard math functions
    default_symbols = {
        "x": sp.Symbol("x"),
        "y": sp.Symbol("y"),
        "z": sp.Symbol("z"),
        "t": sp.Symbol("t"),
        "n": sp.Symbol("n"),
        "a": sp.Symbol("a"),
        "b": sp.Symbol("b"),
        "c": sp.Symbol("c"),
        "k": sp.Symbol("k"),
        "pi": sp.pi,
        "E": sp.E,
        "e": sp.E,
        "oo": sp.oo,
        "sin": sp.sin,
        "cos": sp.cos,
        "tan": sp.tan,
        "asin": sp.asin,
        "acos": sp.acos,
        "atan": sp.atan,
        "sinh": sp.sinh,
        "cosh": sp.cosh,
        "tanh": sp.tanh,
        "exp": sp.exp,
        "log": sp.log,
        "ln": sp.log,
        "sqrt": sp.sqrt,
        "abs": sp.Abs,
        "factorial": sp.factorial,
        "gamma": sp.gamma,
        "floor": sp.floor,
        "ceiling": sp.ceiling,
        "Matrix": sp.Matrix,
    }

    if local_dict:
        default_symbols.update(local_dict)

    try:
        parsed = parse_expr(
            expr_str,
            local_dict=default_symbols,
            transformations=DEFAULT_TRANSFORMATIONS,
            evaluate=evaluate,
        )
        return parsed
    except Exception as e:
        raise ValueError(f"Failed to parse mathematical expression '{expr_str}': {str(e)}")
