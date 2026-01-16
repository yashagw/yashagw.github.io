import { footerLinks, siteConfig } from "@/lib/site-config";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="social-links">
            {footerLinks.map((link) => (
              <a
                key={link.text}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.text}
              </a>
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
    </footer>
  );
}
