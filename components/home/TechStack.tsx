"use client";

import { motion } from "framer-motion";
import { skills } from "@/lib/site-config";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function TechStack() {
  return (
    <motion.section
      className="tech-stack"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="tech-categories">
        <motion.div className="tech-group" variants={itemVariants}>
          <span className="tech-label">Languages:</span>{" "}
          {skills.languages.map((lang, index) => (
            <span key={lang}>
              <span className="tech-item">{lang}</span>
              {index < skills.languages.length - 1 && ", "}
            </span>
          ))}
        </motion.div>

        <motion.div className="tech-group" variants={itemVariants}>
          <span className="tech-label">Tools & Platforms:</span>{" "}
          {skills.technologies.map((tech, index) => (
            <span key={tech}>
              <span className="tech-item">{tech}</span>
              {index < skills.technologies.length - 1 && ", "}
            </span>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
