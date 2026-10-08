// Nexora AI - JavaScript & TypeScript Sandboxed Web Worker
// Executes JS/TS client-side with captured console streaming and execution timers.

function formatArgument(arg) {
  if (arg === undefined) return "undefined";
  if (arg === null) return "null";
  if (typeof arg === "string") return arg;
  if (typeof arg === "function") return arg.toString();
  if (typeof arg === "symbol") return arg.toString();
  try {
    return JSON.stringify(arg, null, 2);
  } catch (_) {
    return String(arg);
  }
}

function stripSimpleTypeScript(tsCode) {
  return tsCode
    // Remove type imports: import type { ... } from '...';
    .replace(/import\s+type\s+[^;]+;/g, "")
    // Remove interface definitions
    .replace(/interface\s+\w+(\s*<[^>]+>)?(\s+extends\s+[^{]+)?\s*\{[\s\S]*?\}/g, "")
    // Remove type aliases
    .replace(/type\s+\w+(\s*<[^>]+>)?\s*=[\s\S]*?;/g, "")
    // Remove `as Type` casting
    .replace(/\s+as\s+[A-Za-z0-9_<>\[\]]+/g, "")
    // Remove basic type annotations like `: string`, `: number`, etc.
    .replace(/:\s*(string|number|boolean|any|unknown|void|object|Record<[^>]+>|Array<[^>]+>|[A-Z][a-zA-Z0-9_]*(\[\])?)\b/g, "");
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
  const { id, type, code: rawCode, language } = data;
  const code = stripMarkdownFences(rawCode);

  if (type === "run") {
    const startTime = performance.now();

    // Hijack console methods
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      self.postMessage({ type: "stdout", text: args.map(formatArgument).join(" ") + "\n" });
      originalLog(...args);
    };
    console.info = (...args) => {
      self.postMessage({ type: "stdout", text: args.map(formatArgument).join(" ") + "\n" });
      originalInfo(...args);
    };
    console.warn = (...args) => {
      self.postMessage({ type: "stderr", text: "[WARN] " + args.map(formatArgument).join(" ") + "\n" });
      originalWarn(...args);
    };
    console.error = (...args) => {
      self.postMessage({ type: "stderr", text: args.map(formatArgument).join(" ") + "\n" });
      originalError(...args);
    };

    try {
      let executableCode = code;
      if (language === "typescript" || language === "ts") {
        executableCode = stripSimpleTypeScript(code);
      }

      self.postMessage({
        type: "status",
        status: "running",
        message: "Executing JavaScript..."
      });

      // Wrap in async function for top-level await & return values
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const runner = new AsyncFunction(executableCode);

      const result = await runner();
      const executionTimeMs = Math.round(performance.now() - startTime);

      let resultStr = undefined;
      if (result !== undefined) {
        resultStr = formatArgument(result);
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
      const errMsg = err?.stack || err?.message || String(err);
      self.postMessage({
        id,
        type: "done",
        success: false,
        error: errMsg,
        executionTimeMs
      });
    } finally {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    }
  }
};
