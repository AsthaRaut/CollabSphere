import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { createNote, deleteNote, explainContent, getNotes, improveNote, updateNote } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icon.jsx";
import { Empty, Loader, Markdown, copyText, timeAgo } from "../components/ui.jsx";

const BLANK = { _id: null, title: "", content: "", shared: false };

const TOOLS = [
  ["bold", "Bold", "**", "**", "bold text"],
  ["italic", "Italic", "_", "_", "italic text"],
  ["heading", "Heading", "## ", "", "Heading"],
  ["list", "List", "- ", "", "List item"],
  ["quote", "Quote", "> ", "", "Quote"],
  ["code", "Code", "`", "`", "code"],
  ["link", "Link", "[", "](https://)", "link text"]
];

export default function Notes() {
  const { project, isOwner } = useOutletContext();
  const { user } = useAuth();
  const toast = useToast();

  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState(BLANK);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ai, setAi] = useState({ kind: "", loading: false, text: "" });
  const areaRef = useRef(null);

  useEffect(() => {
    getNotes(project._id)
      .then((d) => setNotes(d.notes))
      .catch((e) => {
        toast.error(e.message);
        setNotes([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  const canDelete = useMemo(
    () => !!draft._id && (isOwner || notes?.find((n) => n._id === draft._id)?.createdBy?._id === user.id),
    [draft._id, isOwner, notes, user.id]
  );

  const edit = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const open = (note) => {
    if (dirty && !window.confirm("You have unsaved changes. Discard them?")) return;
    setDraft({ _id: note._id, title: note.title, content: note.content, shared: note.shared });
    setDirty(false);
    setAi({ kind: "", loading: false, text: "" });
  };

  const startNew = () => {
    if (dirty && !window.confirm("You have unsaved changes. Discard them?")) return;
    setDraft(BLANK);
    setDirty(false);
    setAi({ kind: "", loading: false, text: "" });
  };

  const wrap = (before, after, placeholder) => {
    const el = areaRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e) || placeholder;
    edit({ content: value.slice(0, s) + before + selected + after + value.slice(e) });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  };

  const save = async () => {
    if (!draft.title.trim() || !draft.content.trim()) {
      toast.error("Please add a title and some content");
      return;
    }
    setSaving(true);
    try {
      if (draft._id) {
        const { note } = await updateNote(draft._id, { title: draft.title, content: draft.content, shared: draft.shared });
        setNotes((list) => list.map((n) => (n._id === note._id ? note : n)));
        toast.success("Note updated");
      } else {
        const { note } = await createNote({ ...draft, projectId: project._id });
        setNotes((list) => [note, ...list]);
        setDraft({ _id: note._id, title: note.title, content: note.content, shared: note.shared });
        toast.success("Note created");
      }
      setDirty(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this note permanently?")) return;
    try {
      await deleteNote(draft._id);
      setNotes((list) => list.filter((n) => n._id !== draft._id));
      setDraft(BLANK);
      setDirty(false);
      setAi({ kind: "", loading: false, text: "" });
      toast.success("Note deleted");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const runAi = async (kind) => {
    if (!draft.content.trim()) {
      toast.error("Write something first, then ask Gemini");
      return;
    }
    setAi({ kind, loading: true, text: "" });
    try {
      const d = kind === "explain" ? await explainContent(draft.content, "note") : await improveNote(draft.content);
      setAi({ kind, loading: false, text: kind === "explain" ? d.explanation : d.suggestions });
    } catch (e) {
      setAi({ kind: "", loading: false, text: "" });
      toast.error(e.message);
    }
  };

  if (!notes) return <Loader label="Loading notes" />;

  return (
    <div className="workspace">
      <aside>
        <button className="btn btn-primary btn-block" style={{ marginBottom: 14 }} onClick={startNew}>
          <Icon name="plus" size={16} /> New note
        </button>
        {notes.length === 0 ? (
          <p className="hint" style={{ padding: "10px 4px" }}>No notes yet. Your first one will appear here.</p>
        ) : (
          <div className="note-list">
            {notes.map((n) => (
              <button key={n._id} className={`note-item ${draft._id === n._id ? "active" : ""}`} onClick={() => open(n)}>
                <strong>{n.title}</strong>
                <p>{n.content.replace(/[#>*_`\-[\]]/g, "").slice(0, 120)}</p>
                <div className="foot">
                  <span>{n.createdBy?.name}</span>
                  <span className="row" style={{ gap: 8 }}>
                    {n.shared && <Icon name="globe" size={12} />}
                    {timeAgo(n.updatedAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      <section>
        {notes.length === 0 && !draft.title && !draft.content && !dirty && (
          <div style={{ marginBottom: 20 }}>
            <Empty icon="edit" title="Write your first note" text="Use Markdown for documentation, brainstorming and task lists. Gemini can explain or improve whatever you write." />
          </div>
        )}

        <div className="editor">
          <input className="editor-title" placeholder="Untitled note" value={draft.title} onChange={(e) => edit({ title: e.target.value })} maxLength={120} />

          <div className="toolbar" role="toolbar" aria-label="Formatting">
            {TOOLS.map(([icon, label, a, b, ph]) => (
              <button key={label} className="icon-btn" title={label} aria-label={label} onClick={() => wrap(a, b, ph)}>
                <Icon name={icon} size={16} />
              </button>
            ))}
            <span className="spacer" />
            <button className={`btn btn-sm ${preview ? "" : "btn-ghost"}`} onClick={() => setPreview(!preview)}>
              <Icon name="eye" size={14} /> {preview ? "Hide preview" : "Show preview"}
            </button>
          </div>

          <div className={`editor-panes ${preview ? "" : "single"}`}>
            <textarea ref={areaRef} className="editor-area" placeholder={"# Start writing in Markdown…\n\n- plan the feature\n- write the docs"} value={draft.content} onChange={(e) => edit({ content: e.target.value })} />
            {preview && (
              <div className="editor-preview">
                {draft.content.trim() ? <Markdown>{draft.content}</Markdown> : <p className="hint">Live preview appears here.</p>}
              </div>
            )}
          </div>

          <div className="editor-foot">
            <div className="group">
              <button className="btn btn-ai btn-sm" onClick={() => runAi("explain")} disabled={ai.loading}>
                {ai.loading && ai.kind === "explain" ? <span className="spinner" /> : <Icon name="spark" size={14} />} Explain this note
              </button>
              <button className="btn btn-ai btn-sm" onClick={() => runAi("improve")} disabled={ai.loading}>
                {ai.loading && ai.kind === "improve" ? <span className="spinner" /> : <Icon name="spark" size={14} />} Suggest improvements
              </button>
              <label className="check" title="Show this note on the project's public page">
                <input type="checkbox" checked={draft.shared} onChange={(e) => edit({ shared: e.target.checked })} />
                Show on public page
              </label>
            </div>
            <div className="group">
              {canDelete && (
                <button className="btn btn-danger btn-sm" onClick={remove}><Icon name="trash" size={14} /> Delete</button>
              )}
              <button className="btn btn-primary" onClick={save} disabled={saving || !dirty}>
                {saving && <span className="spinner" />} {draft._id ? "Save changes" : "Create note"}
              </button>
            </div>
          </div>
        </div>

        {(ai.loading || ai.text) && (
          <div className="ai-panel">
            <div className="card-head">
              <h3><Icon name="spark" /> {ai.kind === "improve" ? "Gemini's suggestions" : "Gemini's explanation"}</h3>
              {ai.text && (
                <div className="row">
                  <button className="btn btn-sm" onClick={async () => ((await copyText(ai.text)) ? toast.success("Copied") : toast.error("Could not copy"))}>
                    <Icon name="copy" size={14} /> Copy
                  </button>
                  <button className="icon-btn" aria-label="Dismiss" onClick={() => setAi({ kind: "", loading: false, text: "" })}><Icon name="x" /></button>
                </div>
              )}
            </div>
            {ai.loading ? <div className="loader" style={{ padding: 24 }}><span className="spinner" /> Gemini is thinking…</div> : <Markdown>{ai.text}</Markdown>}
          </div>
        )}
      </section>
    </div>
  );
}
