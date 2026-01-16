"use client";

import { motion } from "framer-motion";
import { projects } from "@/lib/site-config";

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function Projects() {
  return (
    <motion.section
      className="projects-section"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.h3
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        Projects
      </motion.h3>
      <div className="projects-grid">
        {projects.map((project, index) => (
          <motion.div
            key={project.name}
            className="project-card"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.1 }}
            whileHover={{
              y: -4,
              transition: { duration: 0.3, ease: "easeOut" },
            }}
          >
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
                View Code &rarr;
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
