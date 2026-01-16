"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navigation, siteConfig } from "@/lib/site-config";

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export default function Header() {
  const pathname = usePathname();

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(url);
  };

  return (
    <motion.header
      className="site-header"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container">
        <div className="header-content">
          <motion.h1
            className="site-name"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Link href="/">{siteConfig.author}</Link>
          </motion.h1>
          <motion.nav
            className="main-nav"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
          >
            {navigation.map((item) =>
              item.newTab ? (
                <motion.a
                  key={item.name}
                  href={item.url}
                  className="nav-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={navItemVariants}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.name}
                </motion.a>
              ) : (
                <motion.span key={item.name} variants={navItemVariants}>
                  <Link
                    href={item.url}
                    className={`nav-item ${isActive(item.url) ? "active" : ""}`}
                  >
                    {item.name}
                  </Link>
                </motion.span>
              )
            )}
          </motion.nav>
        </div>
      </div>
    </motion.header>
  );
}
