import { useState } from "react";
import { explainContent, generateDocs, generateReadme } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icon.jsx";
import { Markdown, PageHead, copyText } from "../components/ui.jsx";

const MODES = {
  explain: {
    label: "Explain",
    icon: "book",
    hint: "Paste code or notes and get a clear step by step explanation.",
    placeholder: "Paste code or text to explain…",
    run: async (text) => (await explainContent(text, "code")).explanation
  },
  docs: {
    label: "Documentation",
    icon: "file",
    hint: "Turn code into structured Markdown documentation.",
    placeholder: "Paste a function, class or module to document…",
    run: async (text) => (await generateDocs(text)).documentation
  },
  readme: {
    label: "README",
    icon: "edit",
    hint: "Describe your project or paste an overview and get a README draft.",
    placeholder: "Project name, what it does, key features, tech stack…",
    run: async (text) => (await generateReadme(text)).readme
  }
};

export default function AIStudio() {
  const toast = useToast();
  const [mode, setMode] = useState("explain");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const m = MODES[mode];

  const run = async () => {
    if (!input.trim()) {
      toast.error("Add some content first");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      setOutput(await m.run(input));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHead eyebrow="Gemini powered" title="AI Studio" text="A scratchpad for explaining code, writing documentation and drafting READMEs, independent of any project." />

      <div className="tabs" role="tablist">
        {Object.entries(MODES).map(([key, v]) => (
          <button key={key} role="tab" aria-selected={mode === key} className={mode === key ? "active" : ""} onClick={() => { setMode(key); setOutput(""); }}>
            <Icon name={v.icon} size={16} /> {v.label}
          </button>
        ))}
      </div>

      <div className="studio">
        <section className="card">
          <div className="card-head"><h3><Icon name="edit" /> Input</h3></div>
          <p className="hint" style={{ marginBottom: 12 }}>{m.hint}</p>
          <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={m.placeholder} />
          <button className="btn btn-primary btn-lg" style={{ marginTop: 16 }} onClick={run} disabled={loading}>
            {loading ? <span className="spinner" /> : <Icon name="spark" size={18} />} {loading ? "Gemini is working…" : `Generate ${m.label.toLowerCase()}`}
          </button>
        </section>

        <section className="card">
          <div className="card-head">
            <h3><Icon name="spark" /> Result</h3>
            {output && (
              <button className="btn btn-sm" onClick={async () => ((await copyText(output)) ? toast.success("Copied to clipboard") : toast.error("Could not copy"))}>
                <Icon name="copy" size={14} /> Copy
              </button>
            )}
          </div>
          <div className="result-box">
            {loading ? (
              <div className="placeholder-text"><span className="spinner" style={{ width: 28, height: 28 }} /> <p>Gemini is thinking…</p></div>
            ) : output ? (
              <Markdown>{output}</Markdown>
            ) : (
              <div className="placeholder-text"><Icon name="spark" size={30} /><p>Your result will appear here.</p></div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
