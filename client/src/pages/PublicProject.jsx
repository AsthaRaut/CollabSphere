import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicProject } from "../services/api.js";
import Icon from "../components/Icon.jsx";
import Logo from "../components/Logo.jsx";
import useTheme from "../components/useTheme.js";
import { Avatar, Empty, Loader, Markdown, formatDate, formatSize } from "../components/ui.jsx";

export default function PublicProject() {
  const { slug } = useParams();
  const { theme, toggle } = useTheme();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicProject(slug).then(setData).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    if (data) document.title = `${data.project.name} · CollabSphere`;
  }, [data]);

  return (
    <>
      <div className="aurora" />
      <header className="nav-top">
        <Link to="/"><Logo /></Link>
        <div className="row">
          <span className="badge badge-green"><Icon name="eye" size={12} /> Read-only</span>
          <button className="icon-btn" onClick={toggle} aria-label="Toggle theme"><Icon name={theme === "dark" ? "sun" : "moon"} /></button>
          <Link to="/register" className="btn btn-primary btn-sm">Join CollabSphere</Link>
        </div>
      </header>

      <main className="public">
        {error ? (
          <Empty icon="lock" title="This page is not available" text={error} action={<Link className="btn" to="/">Go to CollabSphere</Link>} />
        ) : !data ? (
          <Loader label="Loading project" />
        ) : (
          <>
            <section className="public-hero">
              <p className="eyebrow">Public project</p>
              <h1>{data.project.name}</h1>
              <p className="lead">{data.project.description}</p>
              <div className="row" style={{ marginTop: 20, flexWrap: "wrap" }}>
                <span className="avatar-stack">
                  {data.project.members.map((m) => <Avatar key={m._id} name={m.name} size={34} />)}
                </span>
                <span className="hint">
                  By {data.project.owner.name}
                  {data.project.members.length > 1 ? ` and ${data.project.members.length - 1} other${data.project.members.length > 2 ? "s" : ""}` : ""} · since {formatDate(data.project.createdAt)}
                </span>
              </div>
            </section>

            <div className="stack">
              {data.project.readme && (
                <section className="card">
                  <div className="card-head"><h3><Icon name="book" /> README</h3></div>
                  <Markdown>{data.project.readme}</Markdown>
                </section>
              )}

              {data.notes.length > 0 && (
                <section className="stack">
                  <h2 style={{ fontSize: "1.5rem" }}>Notes</h2>
                  {data.notes.map((n) => (
                    <article className="public-note" key={n._id}>
                      <h3>{n.title}</h3>
                      <p className="by">{n.createdBy?.name} · {formatDate(n.createdAt)}</p>
                      <Markdown>{n.content}</Markdown>
                    </article>
                  ))}
                </section>
              )}

              {data.files.length > 0 && (
                <section className="card">
                  <div className="card-head"><h3><Icon name="file" /> Files</h3><span className="badge">{data.files.length}</span></div>
                  {data.files.map((f) => (
                    <div className="member" key={f._id}>
                      <Icon name="file" />
                      <div className="meta"><strong>{f.fileName}</strong><span>{formatSize(f.fileSize)} · {formatDate(f.createdAt)}</span></div>
                    </div>
                  ))}
                </section>
              )}

              {!data.project.readme && data.notes.length === 0 && (
                <Empty icon="book" title="Nothing published yet" text="The owner has not shared a README or notes on this page." />
              )}
            </div>
          </>
        )}
      </main>

      <footer className="site-foot">Shared with CollabSphere · Designed &amp; built by <b>Astha</b></footer>
    </>
  );
}
