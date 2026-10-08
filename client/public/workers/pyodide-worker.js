// Nexora AI - Pyodide WebAssembly Web Worker
// Executes Python code entirely client-side in a secure, sandboxed Web Worker thread.

let pyodide = null;
let initPromise = null;

async function getOrInitPyodide() {
  if (pyodide) return pyodide;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    self.postMessage({
      type: "status",
      status: "initializing",
      message: "Downloading & initializing Pyodide WebAssembly runtime (v0.27.2)..."
    });

    try {
      importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js");
      pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/"
      });

      // Stream stdout and stderr in real-time
      pyodide.setStdout({
        batched: (text) => {
          self.postMessage({ type: "stdout", text: text + "\n" });
        }
      });

      pyodide.setStderr({
        batched: (text) => {
          self.postMessage({ type: "stderr", text: text + "\n" });
        }
      });

      self.postMessage({
        type: "status",
        status: "ready",
        message: "Python WebAssembly runtime is ready."
      });

      return pyodide;
    } catch (err) {
      const errMsg = err?.message || String(err);
      self.postMessage({
        type: "status",
        status: "error",
        message: "Pyodide initialization failed: " + errMsg
      });
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

function stripMarkdownFences(str) {
  if (!str) return "";
  let s = str.trim();
  if (s.startsWith("```")) {
    const lines = s.split("\n");
    if (lines.length > 0 && lines[0].trim().startsWith("```")) {
      lines.shift();
    }
    if (lines.length > 0 && lines[lines.length - 1].trim().startsWith("```")) {
      lines.pop();
    }
    s = lines.join("\n").trim();
  }
  return s;
}

self.onmessage = async (e) => {
  const data = e.data || {};
  const { id, type, code: rawCode } = data;
  const code = stripMarkdownFences(rawCode);

  if (type === "init") {
    try {
      await getOrInitPyodide();
      self.postMessage({ id, type: "init_success" });
    } catch (err) {
      self.postMessage({ id, type: "init_error", error: err?.message || String(err) });
    }
    return;
  }

  if (type === "run") {
    const startTime = performance.now();
    try {
      const py = await getOrInitPyodide();

      // Check if imports require any external packages (e.g. numpy, pandas, sympy, scipy)
      try {
        if (typeof py.loadPackagesFromImports === "function") {
          self.postMessage({
            type: "status",
            status: "packages",
            message: "Inspecting imports and auto-loading packages if needed..."
          });
          await py.loadPackagesFromImports(code);
        }
      } catch (pkgErr) {
        // If package is not in pyodide standard repo, let Python interpreter produce standard ImportError
        console.warn("Pyodide package import check note:", pkgErr);
      }

      self.postMessage({
        type: "status",
        status: "running",
        message: "Executing Python..."
      });

      // Execute Python code
      const rawResult = await py.runPythonAsync(code);
      const executionTimeMs = Math.round(performance.now() - startTime);

      let resultStr = undefined;
      if (rawResult !== undefined && rawResult !== null) {
        if (typeof rawResult === "object" && typeof rawResult.toString === "function") {
          resultStr = rawResult.toString();
        } else {
          resultStr = String(rawResult);
        }
        if (rawResult && typeof rawResult.destroy === "function") {
          rawResult.destroy();
        }
      }

      self.postMessage({
        id,
        type: "done",
        success: true,
        result: resultStr,
        executionTimeMs
      });
    } catch (err) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      const errMsg = err?.message || String(err);
      self.postMessage({
        id,
        type: "done",
        success: false,
        error: errMsg,
        executionTimeMs
      });
    }
  }
};
