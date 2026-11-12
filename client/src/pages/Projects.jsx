import { useEffect, useState } from "react";
import { getProjects } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icon.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import CreateProjectModal from "../components/CreateProjectModal.jsx";
import { Empty, Loader, PageHead } from "../components/ui.jsx";

export default function Projects() {
  const toast = useToast();
  const [projects, setProjects] = useState(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getProjects()
      .then((d) => setProjects(d.projects))
      .catch((e) => {
        toast.error(e.message);
        setProjects([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!projects) return <Loader label="Loading projects" />;

  const shown = projects.filter((p) =>
    `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHead
        eyebrow="Projects"
        title="All your projects"
        text="Every project you own or collaborate on."
        actions={
          <>
            <div className="input-icon">
              <Icon name="search" size={16} />
              <input className="input" placeholder="Search projects" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <Icon name="plus" size={16} /> New project
            </button>
          </>
        }
      />

      {shown.length === 0 ? (
        <Empty
          icon="search"
          title={projects.length ? "No matching projects" : "No projects yet"}
          text={projects.length ? "Try a different search term." : "Create a project to get started."}
        />
      ) : (
        <div className="grid">{shown.map((p) => <ProjectCard key={p._id} project={p} />)}</div>
      )}

      {creating && <CreateProjectModal onClose={() => setCreating(false)} />}
    </>
  );
}
