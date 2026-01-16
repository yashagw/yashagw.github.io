"use client";

import { motion } from "framer-motion";

interface CalloutProps {
  type?: "info" | "warning" | "tip" | "note";
  title?: string;
  children: React.ReactNode;
}

const styles = {
  info: {
    background: "#e7f3ff",
    borderColor: "#0066cc",
    icon: "i",
  },
  warning: {
    background: "#fff3cd",
    borderColor: "#cc9900",
    icon: "!",
  },
  tip: {
    background: "#d4edda",
    borderColor: "#28a745",
    icon: "*",
  },
  note: {
    background: "#f8f9fa",
    borderColor: "#6c757d",
    icon: "N",
  },
};

export default function Callout({ type = "info", title, children }: CalloutProps) {
  const style = styles[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: style.background,
        borderLeft: `4px solid ${style.borderColor}`,
        padding: "1rem 1.25rem",
        borderRadius: "0 6px 6px 0",
        margin: "1.5rem 0",
      }}
    >
      {title && (
        <div
          style={{
            fontWeight: 600,
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              background: style.borderColor,
              color: "white",
              width: "1.25rem",
              height: "1.25rem",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: "bold",
            }}
          >
            {style.icon}
          </span>
          {title}
        </div>
      )}
      <div style={{ lineHeight: 1.6 }}>{children}</div>
    </motion.div>
  );
}
