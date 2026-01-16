"use client";

import { motion } from "framer-motion";
import { footerLinks, siteConfig } from "@/lib/site-config";

const footerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      delay: 0.2,
    },
  },
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      variants={footerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container">
        <div className="footer-content">
          <div className="social-links">
            {footerLinks.map((link) => (
              <motion.a
                key={link.text}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                {link.text}
              </motion.a>
            ))}
          </div>
          <div className="copyright">
            &copy; {currentYear} {siteConfig.author} &bull; Built with{" "}
            <a
              href="https://nextjs.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Next.js
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
