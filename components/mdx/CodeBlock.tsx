"use client";

import { useState } from "react";

interface CodeBlockProps {
  children: React.ReactNode;
  language?: string;
  filename?: string;
}

export default function CodeBlock({ children, language, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = typeof children === "string" ? children : "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper" style={{ position: "relative" }}>
      {filename && (
        <div
          style={{
            background: "#e0e0e0",
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            borderRadius: "6px 6px 0 0",
            fontFamily: "monospace",
          }}
        >
          {filename}
        </div>
      )}
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: filename ? "2.5rem" : "0.5rem",
          right: "0.5rem",
          background: "#f0f0f0",
          border: "1px solid #ddd",
          borderRadius: "4px",
          padding: "0.25rem 0.5rem",
          fontSize: "0.75rem",
          cursor: "pointer",
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre
        style={{
          borderRadius: filename ? "0 0 6px 6px" : "6px",
          marginTop: filename ? 0 : undefined,
        }}
      >
        <code className={language ? `language-${language}` : ""}>{children}</code>
      </pre>
    </div>
  );
}
