"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { contactLinks, introParagraphs, siteConfig } from "@/lib/site-config";

// Parse [url]{text} pattern into HTML links
function parseLinks(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const linkRegex = /\[([^\]]+)\]\{([^}]+)\}/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the link
    const linkUrl = match[1];
    const linkText = match[2];
    parts.push(
      <a
        key={keyIndex++}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {linkText}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
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

const photoVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      delay: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const contactVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <motion.div
          className="hero-text"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="greeting" variants={itemVariants}>
            Hello
          </motion.div>
          {introParagraphs.map((paragraph, index) => (
            <motion.p
              key={index}
              className="intro-paragraph"
              variants={itemVariants}
            >
              {parseLinks(paragraph)}
            </motion.p>
          ))}

          <motion.div
            className="contact-info"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{ delayChildren: 0.5, staggerChildren: 0.05 }}
          >
            {contactLinks.map((contact) => (
              <motion.span
                key={contact.text}
                className="contact-item"
                variants={contactVariants}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src={contact.icon}
                  alt={contact.text}
                  width={18}
                  height={18}
                  className="contact-icon"
                />
                <a
                  href={contact.url}
                  {...(contact.newTab || !contact.url.startsWith("mailto:")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {contact.text}
                </a>
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
        <motion.div
          className="hero-image"
          variants={photoVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="profile-photo-container">
            <Image
              src="/images/profile.jpg"
              alt={siteConfig.author}
              width={180}
              height={180}
              className="profile-photo"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
