import { projects } from "@/lib/site-config";

export default function Projects() {
  return (
    <section className="projects-section">
      <h3>Projects</h3>
      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.name} className="project-card">
            <div className="project-title">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {project.name}
              </a>
            </div>
            <p className="project-description">{project.description}</p>
            <div className="project-tech">
              {project.tags.map((tag, index) => (
                <span key={tag} className="tech-tag">
                  #{tag}{index < project.tags.length - 1 ? " " : ""}
                </span>
              ))}
            </div>
            <div className="project-links">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Code &rarr;
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
