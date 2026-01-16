"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation, siteConfig } from "@/lib/site-config";

export default function Header() {
  const pathname = usePathname();

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(url);
  };

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-content">
          <h1 className="site-name">
            <Link href="/">{siteConfig.author}</Link>
          </h1>
          <nav className="main-nav">
            {navigation.map((item) =>
              item.newTab ? (
                <a
                  key={item.name}
                  href={item.url}
                  className="nav-item"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  href={item.url}
                  className={`nav-item ${isActive(item.url) ? "active" : ""}`}
                >
                  {item.name}
                </Link>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
