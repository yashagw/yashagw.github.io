"use client";

import { motion } from "framer-motion";
import { education } from "@/lib/site-config";

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

export default function Education() {
  return (
    <motion.section
      className="education-section"
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
        Education
      </motion.h3>
      <div className="education-list">
        {education.map((edu, index) => (
          <motion.div
            key={index}
            className="education-item"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="education-header">
              <div className="education-main">
                <h4 className="institution">{edu.institution}</h4>
                <p className="degree">
                  {edu.degree}
                  {edu.field && ` in ${edu.field}`}
                </p>
              </div>
              <div className="education-meta">
                <span className="duration">{edu.year}</span>
                {edu.gpa && <span className="gpa">{edu.gpa}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
