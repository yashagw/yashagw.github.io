"use client";

import { motion } from "framer-motion";
import { projects } from "@/lib/site-config";

export default function Projects() {
  return (
    <motion.section
      className="projects-section"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
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
              {project.tags.map((tag) => (
                <span key={tag} className="tech-tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="project-links">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View &rarr;
              </a>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
