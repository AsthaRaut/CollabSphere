import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import { Avatar, timeAgo } from "./ui.jsx";

export default function ProjectCard({ project }) {
  return (
    <Link to={`/app/projects/${project._id}`} className="project-card">
      <div className="row-between">
        <span className="project-orb">{project.name[0]?.toUpperCase()}</span>
        {project.isPublic ? (
          <span className="badge badge-green"><Icon name="globe" size={12} /> Public</span>
        ) : (
          <span className="badge"><Icon name="lock" size={12} /> Private</span>
        )}
      </div>
      <div>
        <h3>{project.name}</h3>
      </div>
      <p>{project.description}</p>
      <div className="project-meta">
        <span className="avatar-stack">
          {project.members?.slice(0, 4).map((m) => <Avatar key={m._id} name={m.name} size={26} />)}
        </span>
        <span className="counts">
          <span><Icon name="edit" size={13} /> {project.noteCount ?? 0}</span>
          <span><Icon name="file" size={13} /> {project.fileCount ?? 0}</span>
        </span>
        <span>{timeAgo(project.updatedAt)}</span>
      </div>
    </Link>
  );
}
