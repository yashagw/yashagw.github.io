"use client";

import { motion } from "framer-motion";
import { companies } from "@/lib/site-config";

export default function Experience() {
  return (
    <motion.section
      className="experience-section"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h3>Experience</h3>
      <div className="experience-list">
        {companies.map((company) => (
          <div key={company.name} className="company-block">
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
              <div key={index} className="position">
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
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.section>
  );
}
