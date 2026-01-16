"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { contactLinks, introParagraphs, siteConfig } from "@/lib/site-config";

function parseLinks(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const linkRegex = /\[([^\]]+)\]\{([^}]+)\}/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
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

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function Hero() {
  return (
    <motion.section
      className="hero"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="hero-content">
        <div className="hero-text">
          <div className="greeting">Hello</div>
          {introParagraphs.map((paragraph, index) => (
            <p key={index} className="intro-paragraph">
              {parseLinks(paragraph)}
            </p>
          ))}

          <div className="contact-info">
            {contactLinks.map((contact) => (
              <span key={contact.text} className="contact-item">
                <Image
                  src={contact.icon}
                  alt={contact.text}
                  width={16}
                  height={16}
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
              </span>
            ))}
          </div>
        </div>
        <div className="hero-image">
          <div className="profile-photo-container">
            <Image
              src="/images/profile.jpg"
              alt={siteConfig.author}
              width={160}
              height={160}
              className="profile-photo"
              priority
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
