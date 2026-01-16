"use client";

import { motion } from "framer-motion";
import { skills } from "@/lib/site-config";

export default function TechStack() {
  return (
    <motion.section
      className="tech-stack"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="tech-categories">
        <div className="tech-group">
          <span className="tech-label">Languages: </span>
          {skills.languages.map((lang, index) => (
            <span key={lang}>
              <span className="tech-item">{lang}</span>
              {index < skills.languages.length - 1 && ", "}
            </span>
          ))}
        </div>

        <div className="tech-group">
          <span className="tech-label">Tools: </span>
          {skills.technologies.map((tech, index) => (
            <span key={tech}>
              <span className="tech-item">{tech}</span>
              {index < skills.technologies.length - 1 && ", "}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
