import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  addMember, removeMember, saveReadme, makeProjectPublic, makeProjectPrivate, deleteProject, generateReadme
} from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icon.jsx";
import { Avatar, Markdown, copyText, formatDate } from "../components/ui.jsx";

export default function ProjectOverview() {
  const { project, reload, isOwner } = useOutletContext();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [readme, setReadme] = useState(project.readme || "");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState("");

  const publicLink = project.publicSlug ? `${window.location.origin}/p/${project.publicSlug}` : "";

  const run = async (key, fn, okMessage) => {
    setBusy(key);
    try {
      await fn();
      if (okMessage) toast.success(okMessage);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const onAddMember = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addMember(project._id, email);
      setEmail("");
      await reload();
      toast.success("Member added");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const generate = () =>
    run("ai", async () => {
      const info = `Name: ${project.name}\nDescription: ${project.description}\nMembers: ${project.members.map((m) => m.name).join(", ")}`;
      const d = await generateReadme(info, project.name);
      setReadme(d.readme);
      setEditing(true);
    }, "README drafted by Gemini. Review it, then save.");

  const saveDraft = () =>
    run("save", async () => {
      await saveReadme(project._id, readme);
      await reload();
      setEditing(false);
    }, "README saved");

  const togglePublic = () =>
    run("public", async () => {
      if (project.isPublic) await makeProjectPrivate(project._id);
      else await makeProjectPublic(project._id);
      await reload();
    }, project.isPublic ? "Project is private again" : "Project is now public");

  const onDelete = async () => {
    if (!window.confirm(`Delete "${project.name}" with all of its notes and files? This cannot be undone.`)) return;
    await run("delete", async () => {
      await deleteProject(project._id);
      navigate("/app/projects");
    }, "Project deleted");
  };

  return (
    <div className="two-col">
      <div className="stack">
        <section className="card">
          <div className="card-head">
            <h3><Icon name="book" /> README</h3>
            <div className="row">
              {isOwner && (
                <>
                  <button className="btn btn-ai btn-sm" onClick={generate} disabled={busy === "ai"}>
                    {busy === "ai" ? <span className="spinner" /> : <Icon name="spark" size={14} />} Generate with Gemini
                  </button>
                  {!editing && (
                    <button className="btn btn-sm" onClick={() => setEditing(true)}><Icon name="edit" size={14} /> Edit</button>
                  )}
                </>
              )}
            </div>
          </div>

          {editing ? (
            <div className="form">
              <textarea className="textarea" style={{ minHeight: 320, fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem" }} value={readme} onChange={(e) => setReadme(e.target.value)} placeholder="# Project README&#10;&#10;Write Markdown here…" />
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button className="btn btn-ghost" onClick={() => { setReadme(project.readme || ""); setEditing(false); }}>Cancel</button>
                <button className="btn btn-primary" onClick={saveDraft} disabled={busy === "save"}>
                  {busy === "save" && <span className="spinner" />} Save README
                </button>
              </div>
            </div>
          ) : project.readme ? (
            <Markdown>{project.readme}</Markdown>
          ) : (
            <p className="hint">
              No README yet. {isOwner ? "Write one yourself or let Gemini draft it from your project details." : "The owner has not added one."}
            </p>
          )}
        </section>

        {isOwner && (
          <section className="card danger-zone">
            <div className="card-head"><h3 style={{ color: "var(--red)" }}><Icon name="trash" /> Danger zone</h3></div>
            <div className="row-between">
              <p className="hint">Deleting a project removes all of its notes and uploaded files.</p>
              <button className="btn btn-danger btn-sm" onClick={onDelete} disabled={busy === "delete"}>Delete project</button>
            </div>
          </section>
        )}
      </div>

      <div className="stack">
        <section className="card">
          <div className="card-head">
            <h3><Icon name="users" /> Team</h3>
            <span className="badge">{project.members.length}</span>
          </div>

          {project.members.map((m) => (
            <div className="member" key={m._id}>
              <Avatar name={m.name} size={38} />
              <div className="meta">
                <strong>{m.name}</strong>
                <span>{m.email}</span>
              </div>
              {m._id === project.owner._id ? (
                <span className="badge badge-accent">Owner</span>
              ) : (
                isOwner && (
                  <button className="icon-btn" aria-label={`Remove ${m.name}`} onClick={() => {
                    if (window.confirm(`Remove ${m.name} from this project?`)) {
                      run("rm", async () => { await removeMember(project._id, m._id); await reload(); }, "Member removed");
                    }
                  }}>
                    <Icon name="x" size={16} />
                  </button>
                )
              )}
            </div>
          ))}

          {isOwner && (
            <form className="row" style={{ marginTop: 16 }} onSubmit={onAddMember}>
              <input className="input" type="email" required placeholder="Teammate's email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn btn-primary" disabled={adding} aria-label="Add member">
                {adding ? <span className="spinner" /> : <Icon name="userPlus" size={16} />}
              </button>
            </form>
          )}
          <p className="hint" style={{ marginTop: 10 }}>Created {formatDate(project.createdAt)} by {project.owner.name}</p>
        </section>

        <section className="card">
          <div className="card-head">
            <h3><Icon name="globe" /> Public page</h3>
            {isOwner && (
              <button className={`btn btn-sm ${project.isPublic ? "" : "btn-primary"}`} onClick={togglePublic} disabled={busy === "public"}>
                {project.isPublic ? "Make private" : "Make public"}
              </button>
            )}
          </div>
          {project.isPublic ? (
            <>
              <div className="share-box">
                <code>{publicLink}</code>
                <button className="btn btn-sm" onClick={async () => ((await copyText(publicLink)) ? toast.success("Link copied") : toast.error("Could not copy the link"))}>
                  <Icon name="copy" size={14} /> Copy
                </button>
              </div>
              <p className="hint" style={{ marginTop: 10 }}>
                Anyone with this link can read the README, notes marked as shared, team and file names. They cannot edit anything.
              </p>
              <a className="btn btn-sm btn-block" style={{ marginTop: 12 }} href={publicLink} target="_blank" rel="noreferrer">
                <Icon name="eye" size={14} /> Open public page
              </a>
            </>
          ) : (
            <p className="hint">This project is private. Make it public to share a read-only page through a unique link.</p>
          )}
        </section>
      </div>
    </div>
  );
}
