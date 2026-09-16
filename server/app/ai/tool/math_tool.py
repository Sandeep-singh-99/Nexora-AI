import json
import logging
import ast
from typing import Any, Dict, List, Optional, Union
import numpy as np
import scipy.stats as stats
import scipy.optimize as optimize
import sympy as sp
from langchain_core.tools import tool

from app.ai.tool.math_parser import safe_parse_expr, validate_expression_safety

logger = logging.getLogger(__name__)


def parse_matrix_input(matrix_str: str) -> sp.Matrix:
    """Parses a matrix input string formatted as JSON list of lists, e.g., '[[1, 2], [3, 4]]'."""
    validate_expression_safety(matrix_str)
    try:
        # Evaluate safely as literal python nested list
        data = ast.literal_eval(matrix_str)
        if isinstance(data, list):
            return sp.Matrix(data)
    except Exception:
        pass

    # Alternative fallback parsing if passed as sympy expression
    parsed = safe_parse_expr(matrix_str)
    if isinstance(parsed, sp.Matrix):
        return parsed
    raise ValueError(f"Could not parse matrix input from '{matrix_str}'. Expected format like '[[1, 2], [3, 4]]'.")


def parse_list_input(list_str: str) -> List[float]:
    """Parses a numerical array string like '[1.5, 2.3, 4.0, 5.1]'."""
    validate_expression_safety(list_str)
    try:
        data = ast.literal_eval(list_str)
        if isinstance(data, (list, tuple)):
            return [float(x) for x in data]
    except Exception as e:
        raise ValueError(f"Failed to parse list from '{list_str}': {str(e)}")
    raise ValueError(f"Expected array list representation, got '{list_str}'.")


@tool
def math_tool(
    operation: str,
    expression: str,
    symbol: str = "x",
    extra_params: Optional[str] = None,
) -> str:
    """
    Solves mathematical problems using symbolic and numerical computation engines (SymPy, NumPy, SciPy).

    Supports:
    - Symbolic Algebra: 'factor', 'expand', 'simplify', 'solve', 'collect', 'cancel', 'roots'
    - Calculus: 'derivative', 'integral', 'limit', 'series'
    - Matrix Operations: 'matrix_det', 'matrix_inv', 'matrix_eigen', 'matrix_mul'
    - Numerical & Statistics: 'evaluate', 'stat_summary', 'numerical_root'

    Parameters:
    - operation: The operation name to execute (e.g. 'factor', 'solve', 'derivative', 'integral', 'matrix_det', 'stat_summary').
    - expression: The math expression, equation, matrix, or array string (e.g. 'x^2 + 5x + 6', 'sin(x)/x', '[[1, 2], [3, 4]]', '[1, 5, 8, 12]').
    - symbol: Main variable symbol (default 'x').
    - extra_params: Optional additional arguments as JSON string or keyword pair (e.g. '{"lower": 0, "upper": 1}' for integrals, '{"point": 0}' for limits).

    Returns:
    - Structured JSON string with fields: success, operation, input, result, latex, steps, and error.
    """
    op = operation.strip().lower()
    input_str = expression.strip()
    var_sym = sp.Symbol(symbol.strip() if symbol else "x")
    steps: List[str] = []

    # Parse extra_params if present
    parsed_extra: Dict[str, Any] = {}
    if extra_params:
        try:
            if extra_params.strip().startswith("{"):
                parsed_extra = json.loads(extra_params)
            else:
                # Key=Value format
                for item in extra_params.split(","):
                    if "=" in item:
                        k, v = item.split("=", 1)
                        parsed_extra[k.strip()] = v.strip()
        except Exception:
            logger.warning("Could not parse extra_params JSON: %s", extra_params)

    try:
        # 1. ALGEBRA & SYMBOLIC
        if op == "factor":
            expr = safe_parse_expr(input_str)
            res = sp.factor(expr)
            steps.append(f"Parsed input expression: {sp.pretty(expr)}")
            steps.append(f"Factored expression into irreducible components.")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(res),
                "latex": sp.latex(res),
                "steps": steps,
                "error": None,
            })

        elif op == "expand":
            expr = safe_parse_expr(input_str)
            res = sp.expand(expr)
            steps.append(f"Parsed input expression: {sp.pretty(expr)}")
            steps.append(f"Expanded algebraic products and powers.")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(res),
                "latex": sp.latex(res),
                "steps": steps,
                "error": None,
            })

        elif op == "simplify":
            expr = safe_parse_expr(input_str)
            res = sp.simplify(expr)
            steps.append(f"Parsed input expression: {sp.pretty(expr)}")
            steps.append(f"Simplified trigonometric, logarithmic, and algebraic expressions.")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(res),
                "latex": sp.latex(res),
                "steps": steps,
                "error": None,
            })

        elif op in ["solve", "roots"]:
            # Handle equations containing '=' or expressions assumed equal to 0
            if "=" in input_str:
                lhs_str, rhs_str = input_str.split("=", 1)
                lhs = safe_parse_expr(lhs_str)
                rhs = safe_parse_expr(rhs_str)
                eq = sp.Eq(lhs, rhs)
                res = sp.solve(eq, var_sym)
                steps.append(f"Formulated equation: {sp.latex(eq)} = 0")
            else:
                expr = safe_parse_expr(input_str)
                res = sp.solve(expr, var_sym)
                steps.append(f"Solved expression equal to zero: {expr} = 0")

            steps.append(f"Computed roots for symbol '{var_sym}'.")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(res),
                "latex": sp.latex(res),
                "steps": steps,
                "error": None,
            })

        elif op == "collect":
            expr = safe_parse_expr(input_str)
            res = sp.collect(expr, var_sym)
            steps.append(f"Collected terms with respect to symbol '{var_sym}'.")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(res),
                "latex": sp.latex(res),
                "steps": steps,
                "error": None,
            })

        elif op == "cancel":
            expr = safe_parse_expr(input_str)
            res = sp.cancel(expr)
            steps.append(f"Canceled common factors in rational function.")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(res),
                "latex": sp.latex(res),
                "steps": steps,
                "error": None,
            })

        # 2. CALCULUS
        elif op in ["derivative", "differentiate", "diff"]:
            expr = safe_parse_expr(input_str)
            order = int(parsed_extra.get("order", 1))
            res = sp.diff(expr, var_sym, order)
            steps.append(f"Parsed input function: {expr}")
            steps.append(f"Computed derivative of order {order} with respect to '{var_sym}'.")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(res),
                "latex": sp.latex(res),
                "steps": steps,
                "error": None,
            })

        elif op in ["integral", "integrate"]:
            expr = safe_parse_expr(input_str)
            lower = parsed_extra.get("lower")
            upper = parsed_extra.get("upper")

            if lower is not None and upper is not None:
                lower_val = safe_parse_expr(str(lower))
                upper_val = safe_parse_expr(str(upper))
                res = sp.integrate(expr, (var_sym, lower_val, upper_val))
                steps.append(f"Computed definite integral from {lower} to {upper} with respect to '{var_sym}'.")
            else:
                res = sp.integrate(expr, var_sym)
                steps.append(f"Computed indefinite integral with respect to '{var_sym}' (+ C).")

            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(res),
                "latex": sp.latex(res),
                "steps": steps,
                "error": None,
            })

        elif op == "limit":
            expr = safe_parse_expr(input_str)
            point_str = str(parsed_extra.get("point", "0"))
            dir_str = str(parsed_extra.get("dir", "+-"))
            point_val = safe_parse_expr(point_str)
            res = sp.limit(expr, var_sym, point_val, dir=dir_str)
            steps.append(f"Evaluated limit of function as '{var_sym}' approaches {point_str}.")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(res),
                "latex": sp.latex(res),
                "steps": steps,
                "error": None,
            })

        elif op == "series":
            expr = safe_parse_expr(input_str)
            point_str = str(parsed_extra.get("point", "0"))
            n_val = int(parsed_extra.get("n", 6))
            point_val = safe_parse_expr(point_str)
            res = sp.series(expr, var_sym, point_val, n_val)
            steps.append(f"Expanded Taylor/Maclaurin series expansion to order {n_val} around {point_str}.")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(res),
                "latex": sp.latex(res),
                "steps": steps,
                "error": None,
            })

        # 3. MATRIX OPERATIONS
        elif op in ["matrix_det", "determinant"]:
            mat = parse_matrix_input(input_str)
            det = mat.det()
            steps.append(f"Parsed {mat.shape[0]}x{mat.shape[1]} matrix.")
            steps.append(f"Calculated determinant.")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(det),
                "latex": sp.latex(det),
                "steps": steps,
                "error": None,
            })

        elif op in ["matrix_inv", "inverse"]:
            mat = parse_matrix_input(input_str)
            inv = mat.inv()
            steps.append(f"Parsed {mat.shape[0]}x{mat.shape[1]} matrix.")
            steps.append(f"Calculated matrix inverse.")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(inv.tolist()),
                "latex": sp.latex(inv),
                "steps": steps,
                "error": None,
            })

        elif op in ["matrix_eigen", "eigenvalues"]:
            mat = parse_matrix_input(input_str)
            eigenvals = mat.eigenvals()
            steps.append(f"Calculated matrix eigenvalues and multiplicity.")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(eigenvals),
                "latex": sp.latex(eigenvals),
                "steps": steps,
                "error": None,
            })

        # 4. NUMERICAL & STATISTICS (NumPy / SciPy)
        elif op == "evaluate":
            expr = safe_parse_expr(input_str)
            val = sp.N(expr)
            steps.append(f"Evaluated expression numerically: {val}")
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(val),
                "latex": sp.latex(val),
                "steps": steps,
                "error": None,
            })

        elif op in ["stat_summary", "statistics", "stats"]:
            arr = parse_list_input(input_str)
            np_arr = np.array(arr)
            mean_val = float(np.mean(np_arr))
            median_val = float(np.median(np_arr))
            std_val = float(np.std(np_arr, ddof=1)) if len(np_arr) > 1 else 0.0
            var_val = float(np.var(np_arr, ddof=1)) if len(np_arr) > 1 else 0.0
            min_val = float(np.min(np_arr))
            max_val = float(np.max(np_arr))

            res_dict = {
                "count": len(arr),
                "mean": mean_val,
                "median": median_val,
                "std": std_val,
                "variance": var_val,
                "min": min_val,
                "max": max_val,
            }
            steps.append(f"Processed dataset of size {len(arr)} using NumPy/SciPy.")
            steps.append("Computed descriptive statistics (mean, median, standard deviation, variance, min, max).")

            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": res_dict,
                "latex": f"\\mu = {mean_val:.4f}, \\sigma = {std_val:.4f}",
                "steps": steps,
                "error": None,
            })

        elif op in ["numerical_root", "root_finder"]:
            expr = safe_parse_expr(input_str)
            f_lambdified = sp.lambdify(var_sym, expr, "numpy")
            x0 = float(parsed_extra.get("x0", 1.0))
            sol = optimize.root_scalar(f_lambdified, x0=x0)
            res_val = float(sol.root) if sol.converged else None
            steps.append(f"Used SciPy numerical root-finding starting at x0 = {x0}.")
            return json.dumps({
                "success": sol.converged,
                "operation": op,
                "input": input_str,
                "result": res_val,
                "latex": f"x \\approx {res_val:.6f}" if res_val is not None else "Failed to converge",
                "steps": steps,
                "error": None if sol.converged else "Numerical solver failed to converge.",
            })

        else:
            # General fallback: try sympy simplify
            expr = safe_parse_expr(input_str)
            res = sp.simplify(expr)
            return json.dumps({
                "success": True,
                "operation": op,
                "input": input_str,
                "result": str(res),
                "latex": sp.latex(res),
                "steps": ["Parsed and simplified expression via SymPy."],
                "error": None,
            })

    except Exception as e:
        logger.exception("Error executing math tool operation '%s': %s", op, e)
        return json.dumps({
            "success": False,
            "operation": op,
            "input": input_str,
            "result": None,
            "latex": None,
            "steps": steps,
            "error": str(e),
        })
