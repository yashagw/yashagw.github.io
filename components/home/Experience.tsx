"use client";

import { motion } from "framer-motion";
import { companies } from "@/lib/site-config";

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

const titleVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const companyVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function Experience() {
  return (
    <motion.section
      className="experience-section"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.h3 variants={titleVariants}>Work Experience</motion.h3>
      <div className="experience-list">
        {companies.map((company, companyIndex) => (
          <motion.div
            key={company.name}
            className="company-block"
            variants={companyVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: companyIndex * 0.1 }}
          >
            <h4 className="company-title">
              <a
                href={company.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {company.name}
              </a>
            </h4>

            {company.positions.map((position, index) => (
              <motion.div
                key={index}
                className="position"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
              >
                <div className="position-header">
                  <span className="role">{position.title}</span>
                  <span className="period">{position.duration}</span>
                </div>
                {position.points && (
                  <ul className="position-points">
                    {position.points.map((point, pointIndex) => (
                      <li key={pointIndex}>{point}</li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
