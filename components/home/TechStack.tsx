import { skills } from "@/lib/site-config";

export default function TechStack() {
  return (
    <section className="tech-stack">
      <div className="tech-categories">
        <div className="tech-group">
          <span className="tech-label">Languages:</span>{" "}
          {skills.languages.map((lang, index) => (
            <span key={lang}>
              <span className="tech-item">{lang}</span>
              {index < skills.languages.length - 1 && ", "}
            </span>
          ))}
        </div>

        <div className="tech-group">
          <span className="tech-label">Tools & Platforms:</span>{" "}
          {skills.technologies.map((tech, index) => (
            <span key={tech}>
              <span className="tech-item">{tech}</span>
              {index < skills.technologies.length - 1 && ", "}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
