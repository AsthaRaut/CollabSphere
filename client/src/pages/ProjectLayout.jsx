import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { getProjectById } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "../components/Icon.jsx";
import { Empty, Loader } from "../components/ui.jsx";

export default function ProjectLayout() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const d = await getProjectById(id);
      setProject(d.project);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    setProject(null);
    reload();
  }, [reload]);

  if (error) {
    return (
      <Empty
        icon="lock"
        title="Cannot open this project"
        text={error}
        action={<Link to="/app/projects" className="btn">Back to projects</Link>}
      />
    );
  }
  if (!project) return <Loader label="Opening project" />;

  const isOwner = project.owner._id === user.id;
  const base = `/app/projects/${id}`;

  return (
    <>
      <div className="project-hero">
        <Link to="/app/projects" className="back-link"><Icon name="arrow" size={14} /> All projects</Link>
        <div className="row" style={{ gap: 16, alignItems: "flex-start" }}>
          <span className="project-orb" style={{ width: 56, height: 56, fontSize: "1.6rem", borderRadius: 18 }}>
            {project.name[0]?.toUpperCase()}
          </span>
          <div>
            <div className="row" style={{ flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)", fontWeight: 800 }}>{project.name}</h1>
              {project.isPublic ? (
                <span className="badge badge-green"><Icon name="globe" size={12} /> Public</span>
              ) : (
                <span className="badge"><Icon name="lock" size={12} /> Private</span>
              )}
            </div>
            <p className="lead" style={{ marginTop: 6 }}>{project.description}</p>
          </div>
        </div>
      </div>

      <nav className="tabs" aria-label="Project sections">
        <NavLink to={base} end><Icon name="book" size={16} /> Overview</NavLink>
        <NavLink to={`${base}/notes`}><Icon name="edit" size={16} /> Notes</NavLink>
        <NavLink to={`${base}/files`}><Icon name="file" size={16} /> Files</NavLink>
        <NavLink to={`${base}/analytics`}><Icon name="chart" size={16} /> Analytics</NavLink>
      </nav>

      <Outlet context={{ project, reload, isOwner, setProject }} />
    </>
  );
}
