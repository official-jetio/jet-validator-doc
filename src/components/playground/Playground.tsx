"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { JetValidator } from "@jetio/validator";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { indentWithTab } from "@codemirror/commands";
import { tags as t } from "@lezer/highlight";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { examples, STARTER, type Example } from "./examples";

type JVOptions = NonNullable<ConstructorParameters<typeof JetValidator>[0]>;

type OptState = {
  allErrors: boolean;
  strict: boolean;
  strictNumbers: boolean;
  validateFormats: boolean;
  errorMessage: boolean;
  $data: boolean;
  async: boolean;
  cache: boolean;
  coerceTypes: "" | "true" | "array";
  useDefaults: "" | "true" | "empty";
  removeAdditional: "" | "true" | "all";
  verbose: "" | "true" | "path" | "value";
};

const defaultOpts: OptState = {
  allErrors: true,
  strict: false,
  strictNumbers: false,
  validateFormats: true,
  errorMessage: false,
  $data: false,
  async: false,
  cache: true,
  coerceTypes: "",
  useDefaults: "",
  removeAdditional: "",
  verbose: "",
};

function toJVOptions(s: OptState): JVOptions {
  const o: Record<string, unknown> = {
    allErrors: s.allErrors,
    strict: s.strict,
    strictNumbers: s.strictNumbers,
    validateFormats: s.validateFormats,
    errorMessage: s.errorMessage,
    $data: s.$data,
    async: s.async,
    cache: s.cache,
  };
  if (s.coerceTypes) o.coerceTypes = s.coerceTypes === "true" ? true : "array";
  if (s.useDefaults) o.useDefaults = s.useDefaults === "true" ? true : "empty";
  if (s.removeAdditional)
    o.removeAdditional = s.removeAdditional === "true" ? true : "all";
  if (s.verbose) o.verbose = s.verbose === "true" ? true : s.verbose;
  return o as JVOptions;
}

function optsFromExample(opts?: JVOptions): OptState {
  const s = { ...defaultOpts };
  if (!opts) return s;
  const o = opts as Record<string, unknown>;
  const bool = (k: keyof OptState) => {
    if (typeof o[k] === "boolean") (s[k] as boolean) = o[k] as boolean;
  };
  bool("allErrors");
  bool("strict");
  bool("strictNumbers");
  bool("validateFormats");
  bool("errorMessage");
  bool("$data");
  bool("async");
  bool("cache");
  if (o.coerceTypes === true) s.coerceTypes = "true";
  else if (o.coerceTypes === "array") s.coerceTypes = "array";
  if (o.useDefaults === true) s.useDefaults = "true";
  else if (o.useDefaults === "empty") s.useDefaults = "empty";
  if (o.removeAdditional === true) s.removeAdditional = "true";
  else if (o.removeAdditional === "all") s.removeAdditional = "all";
  if (o.verbose === true) s.verbose = "true";
  else if (o.verbose === "path" || o.verbose === "value") s.verbose = o.verbose;
  return s;
}

type Level = "log" | "info" | "warn" | "error" | "return" | "system";
type LogEntry = { level: Level; text: string };

const AsyncFunction = Object.getPrototypeOf(async () => {})
  .constructor as new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

function fmt(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  if (typeof v === "function") return v.toString();
  if (v instanceof Error) return v.stack || v.message;
  try {
    const out = JSON.stringify(
      v,
      (_k, val) => (typeof val === "bigint" ? val.toString() : val),
      2,
    );
    return out ?? String(v);
  } catch {
    return String(v);
  }
}

async function runCode(
  code: string,
  jet: JetValidator,
  data: unknown,
): Promise<LogEntry[]> {
  const logs: LogEntry[] = [];
  const push = (level: Level) => (...args: unknown[]) =>
    logs.push({ level, text: args.map(fmt).join(" ") });
  const consoleShim = {
    log: push("log"),
    info: push("info"),
    warn: push("warn"),
    error: push("error"),
    debug: push("log"),
  };
  try {
    const fn = new AsyncFunction("jet", "JetValidator", "data", "console", code);
    const ret = await fn(jet, JetValidator, data, consoleShim);
    if (ret !== undefined) logs.push({ level: "return", text: fmt(ret) });
  } catch (e) {
    logs.push({
      level: "error",
      text: e instanceof Error ? e.stack || e.message : String(e),
    });
  }
  return logs;
}

const cmTheme = EditorView.theme({
  "&": {
    color: "var(--pg-ink)",
    backgroundColor: "var(--pg-editor)",
    fontSize: "13px",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--pg-mono)", lineHeight: "1.6" },
  ".cm-content": { padding: "12px 0", caretColor: "var(--pg-accent)" },
  ".cm-gutters": {
    backgroundColor: "var(--pg-editor)",
    color: "var(--pg-muted)",
    border: "none",
    borderRight: "1px solid var(--pg-line)",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in srgb, var(--pg-accent) 6%, transparent)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--pg-ink)",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--pg-accent)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    { backgroundColor: "var(--pg-accent-soft)" },
  ".cm-matchingBracket": {
    backgroundColor: "var(--pg-accent-soft)",
    outline: "none",
  },
});

const cmHighlight = HighlightStyle.define([
  { tag: t.keyword, color: "var(--pg-tok-keyword)" },
  { tag: [t.string, t.special(t.string)], color: "var(--pg-tok-string)" },
  { tag: [t.number, t.bool, t.null], color: "var(--pg-tok-number)" },
  {
    tag: [t.lineComment, t.blockComment],
    color: "var(--pg-tok-comment)",
    fontStyle: "italic",
  },
  { tag: [t.propertyName, t.definition(t.propertyName)], color: "var(--pg-tok-prop)" },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName)],
    color: "var(--pg-tok-fn)",
  },
  { tag: [t.className, t.typeName], color: "var(--pg-tok-type)" },
  { tag: [t.operator, t.punctuation, t.bracket], color: "var(--pg-muted)" },
  { tag: t.variableName, color: "var(--pg-ink)" },
]);

function Editor({
  value,
  onChange,
  lang,
  minHeight,
  maxHeight,
  runRef,
}: {
  value: string;
  onChange: (v: string) => void;
  lang: "js" | "json";
  minHeight: string;
  maxHeight: string;
  runRef: MutableRefObject<() => void>;
}) {
  const extensions = useMemo(
    () => [
      lang === "json" ? json() : javascript(),
      cmTheme,
      syntaxHighlighting(cmHighlight),
      Prec.highest(
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              runRef.current();
              return true;
            },
          },
        ]),
      ),
      keymap.of([indentWithTab]),
    ],
    [lang, runRef],
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme="none"
      minHeight={minHeight}
      maxHeight={maxHeight}
      extensions={extensions}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        autocompletion: false,
        searchKeymap: false,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        bracketMatching: true,
        closeBrackets: true,
      }}
    />
  );
}

export function Playground() {
  const [code, setCode] = useState(STARTER);
  const [dataText, setDataText] = useState('"hi"');
  const [opts, setOpts] = useState<OptState>(defaultOpts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<() => void>(() => {});

  const grouped = useMemo(() => {
    const map = new Map<string, Example[]>();
    for (const ex of examples) {
      const list = map.get(ex.category) ?? [];
      list.push(ex);
      map.set(ex.category, list);
    }
    return [...map.entries()];
  }, []);

  const run = useCallback(
    async (rawCode: string, rawData: string, optState: OptState) => {
      setRunning(true);
      const pre: LogEntry[] = [];

      let data: unknown = undefined;
      const trimmed = rawData.trim();
      if (trimmed !== "") {
        try {
          data = JSON.parse(trimmed);
        } catch (e) {
          pre.push({
            level: "warn",
            text: `data is not valid JSON — running with data = undefined (${
              e instanceof Error ? e.message : String(e)
            })`,
          });
        }
      }

      const jet = new JetValidator(toJVOptions(optState));
      const out = await runCode(rawCode, jet, data);
      setLogs([...pre, ...out]);
      setRunning(false);
    },
    [],
  );

  const loadExample = useCallback(
    (ex: Example) => {
      const nextOpts = optsFromExample(ex.options);
      const nextData =
        ex.data === undefined ? "" : JSON.stringify(ex.data, null, 2);
      setSelectedId(ex.id);
      setOpts(nextOpts);
      setCode(ex.code);
      setDataText(nextData);
      run(ex.code, nextData, nextOpts);
    },
    [run],
  );

  useEffect(() => {
    loadExample(examples[0]);
  }, [loadExample]);

  useEffect(() => {
    if (consoleRef.current)
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [logs]);

  const onRun = () => run(code, dataText, opts);
  runRef.current = onRun;

  const reset = () => {
    setSelectedId(null);
    setOpts(defaultOpts);
    setCode(STARTER);
    setDataText('"hi"');
    setLogs([]);
  };

  const setOpt = <K extends keyof OptState>(key: K, value: OptState[K]) =>
    setOpts((p) => ({ ...p, [key]: value }));

  return (
    <div className="jvpg">
      <style>{css}</style>

      <div className="jvpg-bar">
        <div className="jvpg-scope">
          in scope: <code>jet</code> · <code>JetValidator</code> ·{" "}
          <code>data</code> · <code>console</code>
        </div>
        <div className="jvpg-bar-actions">
          <button className="jvpg-btn" onClick={reset}>
            Reset
          </button>
          <button
            className="jvpg-btn jvpg-run"
            onClick={onRun}
            disabled={running}
          >
            <span className="jvpg-tri" />
            {running ? "Running" : "Run"}
          </button>
        </div>
      </div>

      <div className="jvpg-opts">
        {(
          [
            "allErrors",
            "strict",
            "strictNumbers",
            "validateFormats",
            "errorMessage",
            "$data",
            "async",
            "cache",
          ] as const
        ).map((key) => (
          <label className="jvpg-opt" key={key}>
            <input
              type="checkbox"
              checked={opts[key] as boolean}
              onChange={(e) => setOpt(key, e.target.checked as never)}
            />
            {key}
          </label>
        ))}
        <Select
          label="coerceTypes"
          value={opts.coerceTypes}
          opts={["", "true", "array"]}
          onChange={(v) => setOpt("coerceTypes", v as OptState["coerceTypes"])}
        />
        <Select
          label="useDefaults"
          value={opts.useDefaults}
          opts={["", "true", "empty"]}
          onChange={(v) => setOpt("useDefaults", v as OptState["useDefaults"])}
        />
        <Select
          label="removeAdditional"
          value={opts.removeAdditional}
          opts={["", "true", "all"]}
          onChange={(v) =>
            setOpt("removeAdditional", v as OptState["removeAdditional"])
          }
        />
        <Select
          label="verbose"
          value={opts.verbose}
          opts={["", "true", "path", "value"]}
          onChange={(v) => setOpt("verbose", v as OptState["verbose"])}
        />
      </div>

      <div className="jvpg-body">
        <aside className="jvpg-presets">
          {grouped.map(([category, list]) => (
            <div className="jvpg-group" key={category}>
              <div className="jvpg-group-name">{category}</div>
              {list.map((ex) => (
                <button
                  key={ex.id}
                  className={
                    "jvpg-preset" + (selectedId === ex.id ? " is-active" : "")
                  }
                  onClick={() => loadExample(ex)}
                  title={ex.description}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <div className="jvpg-work">
          <div className="jvpg-editor">
            <div className="jvpg-editor-head">
              <span>JavaScript</span>
              <span className="jvpg-hint">⌘/Ctrl + Enter to run</span>
            </div>
            <Editor
              value={code}
              onChange={setCode}
              lang="js"
              minHeight="260px"
              maxHeight="440px"
              runRef={runRef}
            />
          </div>

          <div className="jvpg-editor">
            <div className="jvpg-editor-head">
              <span>Data</span>
              <span className="jvpg-hint">JSON, available as `data`</span>
            </div>
            <Editor
              value={dataText}
              onChange={setDataText}
              lang="json"
              minHeight="88px"
              maxHeight="220px"
              runRef={runRef}
            />
          </div>

          <div className="jvpg-console">
            <div className="jvpg-console-head">
              <span>Console</span>
              <button className="jvpg-clear" onClick={() => setLogs([])}>
                clear
              </button>
            </div>
            <div className="jvpg-console-body" ref={consoleRef}>
              {logs.length === 0 ? (
                <div className="jvpg-console-empty">Run to see output.</div>
              ) : (
                logs.map((l, i) => (
                  <div className={"jvpg-line jvpg-" + l.level} key={i}>
                    <span className="jvpg-gutter">
                      {l.level === "return"
                        ? "⟵"
                        : l.level === "error"
                          ? "✕"
                          : l.level === "warn"
                            ? "!"
                            : "›"}
                    </span>
                    <pre>{l.text}</pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  opts,
  onChange,
}: {
  label: string;
  value: string;
  opts: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="jvpg-opt jvpg-opt-sel">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map((o) => (
          <option value={o} key={o}>
            {o === "" ? "off" : o}
          </option>
        ))}
      </select>
    </label>
  );
}

const css = `
.jvpg {
  --pg-surface: #ffffff;
  --pg-sunken: #f6f6f3;
  --pg-editor: #fbfbf9;
  --pg-ink: #1a1a22;
  --pg-muted: #6a6a77;
  --pg-line: #e6e5df;
  --pg-accent: #4a3ae0;
  --pg-accent-soft: #e4e0ff;
  --pg-pass: #0a8f52;
  --pg-fail: #d42a2a;
  --pg-warn: #a76a12;
  --pg-tok-keyword: #8250df;
  --pg-tok-string: #0a7d3f;
  --pg-tok-number: #b3600b;
  --pg-tok-comment: #8a8a97;
  --pg-tok-prop: #1d4ed8;
  --pg-tok-fn: #6b3ad0;
  --pg-tok-type: #b3600b;
  --pg-mono: ui-monospace, "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace;
  color: var(--pg-ink);
  font-size: 14px;
  margin: 1.5rem 0;
  border: 1px solid var(--pg-line);
  border-radius: 14px;
  overflow: hidden;
  background: var(--pg-surface);
}
.dark .jvpg {
  --pg-surface: #14141c;
  --pg-sunken: #0e0e15;
  --pg-editor: #0f0f17;
  --pg-ink: #e9e9f0;
  --pg-muted: #9494a3;
  --pg-line: #2a2a36;
  --pg-accent: #8b7dff;
  --pg-accent-soft: #2b2557;
  --pg-pass: #35c684;
  --pg-fail: #f26a6a;
  --pg-warn: #e0a94a;
  --pg-tok-keyword: #c792ea;
  --pg-tok-string: #7ee0a2;
  --pg-tok-number: #f0b072;
  --pg-tok-comment: #7d7d8c;
  --pg-tok-prop: #82aaff;
  --pg-tok-fn: #b3a0ff;
  --pg-tok-type: #f0b072;
}
.jvpg *, .jvpg *::before, .jvpg *::after { box-sizing: border-box; }
.jvpg code { font-family: var(--pg-mono); font-size: 0.92em; }

.jvpg-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--pg-line);
  flex-wrap: wrap;
}
.jvpg-scope { font-size: 12.5px; color: var(--pg-muted); }
.jvpg-scope code { color: var(--pg-ink); }
.jvpg-bar-actions { display: flex; gap: 8px; }
.jvpg-btn {
  font: inherit;
  font-weight: 600;
  font-size: 13.5px;
  border-radius: 8px;
  padding: 8px 14px;
  border: 1px solid var(--pg-line);
  background: var(--pg-surface);
  color: var(--pg-ink);
  cursor: pointer;
}
.jvpg-btn:hover { border-color: var(--pg-muted); }
.jvpg-run {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--pg-accent);
  border-color: var(--pg-accent);
  color: #fff;
}
.jvpg-run:hover { filter: brightness(1.06); border-color: var(--pg-accent); }
.jvpg-run:disabled { opacity: 0.6; cursor: default; }
.jvpg-tri {
  width: 0; height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid currentColor;
}

.jvpg-opts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  padding: 11px 16px;
  border-bottom: 1px solid var(--pg-line);
  background: var(--pg-sunken);
}
.jvpg-opt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--pg-mono);
  font-size: 12px;
  color: var(--pg-ink);
  cursor: pointer;
  user-select: none;
}
.jvpg-opt input { accent-color: var(--pg-accent); width: 14px; height: 14px; }
.jvpg-opt-sel { color: var(--pg-muted); }
.jvpg-opt-sel select {
  font-family: var(--pg-mono);
  font-size: 11.5px;
  color: var(--pg-ink);
  background: var(--pg-surface);
  border: 1px solid var(--pg-line);
  border-radius: 6px;
  padding: 2px 5px;
}

.jvpg-body { display: grid; grid-template-columns: 200px 1fr; }
@media (max-width: 820px) { .jvpg-body { grid-template-columns: 1fr; } }
.jvpg-presets {
  border-right: 1px solid var(--pg-line);
  padding: 10px 8px;
  max-height: 620px;
  overflow-y: auto;
  background: var(--pg-surface);
}
@media (max-width: 820px) {
  .jvpg-presets {
    border-right: 0;
    border-bottom: 1px solid var(--pg-line);
    max-height: 168px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .jvpg-group { margin: 0; }
}
.jvpg-group { margin-bottom: 12px; }
.jvpg-group-name {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--pg-muted);
  padding: 4px 8px;
}
.jvpg-preset {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  border-radius: 7px;
  padding: 7px 10px;
  cursor: pointer;
  color: inherit;
  font: inherit;
  font-size: 13px;
}
.jvpg-preset:hover { background: var(--pg-sunken); }
.jvpg-preset.is-active {
  background: var(--pg-accent-soft);
  color: var(--pg-accent);
  font-weight: 600;
}

.jvpg-work { min-width: 0; display: flex; flex-direction: column; }
.jvpg-editor { display: flex; flex-direction: column; border-bottom: 1px solid var(--pg-line); }
.jvpg-editor-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 14px;
  font-weight: 600;
  font-size: 13px;
  background: var(--pg-surface);
  border-bottom: 1px solid var(--pg-line);
}
.jvpg-hint { font-size: 11.5px; color: var(--pg-muted); font-weight: 400; font-family: var(--pg-mono); }
.jvpg .cm-editor { background: var(--pg-editor); }

.jvpg-console { display: flex; flex-direction: column; }
.jvpg-console-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  font-weight: 600;
  font-size: 13px;
  background: var(--pg-surface);
}
.jvpg-clear {
  font: inherit;
  font-family: var(--pg-mono);
  font-size: 11.5px;
  border: 1px solid var(--pg-line);
  background: transparent;
  color: var(--pg-muted);
  border-radius: 6px;
  padding: 2px 9px;
  cursor: pointer;
}
.jvpg-clear:hover { color: var(--pg-ink); }
.jvpg-console-body {
  background: var(--pg-sunken);
  border-top: 1px solid var(--pg-line);
  min-height: 120px;
  max-height: 300px;
  overflow: auto;
  padding: 6px 0;
}
.jvpg-console-empty {
  color: var(--pg-muted);
  font-family: var(--pg-mono);
  font-size: 12.5px;
  padding: 12px 16px;
}
.jvpg-line {
  display: grid;
  grid-template-columns: 22px 1fr;
  align-items: start;
  padding: 3px 14px 3px 6px;
  border-bottom: 1px solid color-mix(in srgb, var(--pg-line) 55%, transparent);
}
.jvpg-line pre {
  margin: 0;
  font-family: var(--pg-mono);
  font-size: 12.5px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
.jvpg-gutter {
  font-family: var(--pg-mono);
  font-size: 12px;
  text-align: center;
  color: var(--pg-muted);
  user-select: none;
}
.jvpg-log pre { color: var(--pg-ink); }
.jvpg-info pre { color: var(--pg-accent); }
.jvpg-return { background: color-mix(in srgb, var(--pg-accent) 8%, transparent); }
.jvpg-return pre, .jvpg-return .jvpg-gutter { color: var(--pg-accent); }
.jvpg-warn pre, .jvpg-warn .jvpg-gutter { color: var(--pg-warn); }
.jvpg-error pre, .jvpg-error .jvpg-gutter { color: var(--pg-fail); }
.jvpg-error { background: color-mix(in srgb, var(--pg-fail) 8%, transparent); }

@media (prefers-reduced-motion: reduce) { .jvpg * { transition: none !important; } }
`;
