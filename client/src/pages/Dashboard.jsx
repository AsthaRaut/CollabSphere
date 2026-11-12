import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getProjects } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icon.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import CreateProjectModal from "../components/CreateProjectModal.jsx";
import { Empty, Loader, PageHead, Stat } from "../components/ui.jsx";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState(null);
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

  if (!projects) return <Loader label="Loading your workspace" />;

  const notes = projects.reduce((s, p) => s + p.noteCount, 0);
  const files = projects.reduce((s, p) => s + p.fileCount, 0);
  const people = new Set(projects.flatMap((p) => p.members.map((m) => m._id)));
  people.delete(user.id);

  return (
    <>
      <PageHead
        eyebrow="Dashboard"
        title={`${greeting()}, ${user.name.split(" ")[0]}`}
        text="Here is what is happening across your projects."
        actions={
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} /> New project
          </button>
        }
      />

      <section className="stats">
        <Stat icon="folder" label="Projects" value={projects.length} tone="amber" />
        <Stat icon="edit" label="Notes written" value={notes} tone="blue" />
        <Stat icon="file" label="Files shared" value={files} tone="green" />
        <Stat icon="users" label="Collaborators" value={people.size} tone="violet" />
      </section>

      <div className="row-between" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: "1.3rem" }}>Recent projects</h2>
        {projects.length > 0 && <Link to="/app/projects" className="btn btn-ghost btn-sm">View all <Icon name="arrow" size={14} /></Link>}
      </div>

      {projects.length === 0 ? (
        <Empty
          icon="folder"
          title="No projects yet"
          text="Create your first project to start writing notes, sharing files and inviting teammates."
          action={<button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" size={16} /> Create project</button>}
        />
      ) : (
        <div className="grid">
          {projects.slice(0, 6).map((p) => <ProjectCard key={p._id} project={p} />)}
        </div>
      )}

      {creating && <CreateProjectModal onClose={() => setCreating(false)} />}
    </>
  );
}
