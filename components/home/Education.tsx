"use client";

import { motion } from "framer-motion";
import { education } from "@/lib/site-config";

export default function Education() {
  return (
    <motion.section
      className="education-section"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h3>Education</h3>
      <div className="education-list">
        {education.map((edu, index) => (
          <div key={index} className="education-item">
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
          </div>
        ))}
      </div>
    </motion.section>
  );
}
