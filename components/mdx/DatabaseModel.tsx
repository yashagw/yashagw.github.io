"use client";

import { motion } from "framer-motion";

// RAM Chip Icon - simplified hardware-inspired design
const RamIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Main chip body */}
    <rect x="4" y="6" width="16" height="12" rx="1" />
    {/* Pins on bottom */}
    <line x1="7" y1="18" x2="7" y2="21" />
    <line x1="10" y1="18" x2="10" y2="21" />
    <line x1="14" y1="18" x2="14" y2="21" />
    <line x1="17" y1="18" x2="17" y2="21" />
    {/* Pins on top */}
    <line x1="7" y1="6" x2="7" y2="3" />
    <line x1="10" y1="6" x2="10" y2="3" />
    <line x1="14" y1="6" x2="14" y2="3" />
    <line x1="17" y1="6" x2="17" y2="3" />
    {/* Inner detail */}
    <rect x="7" y="9" width="10" height="6" rx="0.5" />
  </svg>
);

// Disk Platter Icon - simplified hardware-inspired design
const DiskIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Outer platter */}
    <circle cx="12" cy="12" r="9" />
    {/* Inner ring */}
    <circle cx="12" cy="12" r="5" />
    {/* Center spindle */}
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// Arrow with animated glow
const DataFlowArrow = ({
  direction,
  label,
}: {
  direction: "left" | "right";
  label: string;
}) => {
  const isLoad = direction === "left";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <span
        style={{
          fontSize: "0.7rem",
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-mono)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: isLoad ? 0 : 1.5,
        }}
        style={{
          display: "flex",
          alignItems: "center",
          color: "var(--accent)",
        }}
      >
        {isLoad ? (
          <svg width="40" height="12" viewBox="0 0 40 12">
            <defs>
              <filter id="glow-load" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M38 6 L8 6 M8 6 L14 2 M8 6 L14 10"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              filter="url(#glow-load)"
            />
          </svg>
        ) : (
          <svg width="40" height="12" viewBox="0 0 40 12">
            <defs>
              <filter id="glow-flush" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M2 6 L32 6 M32 6 L26 2 M32 6 L26 10"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              filter="url(#glow-flush)"
            />
          </svg>
        )}
      </motion.div>
    </div>
  );
};

export default function DatabaseModel() {
  return (
    <div
      style={{
        margin: "2rem 0",
        padding: "1.5rem",
        background: "var(--bg-secondary)",
        borderRadius: "8px",
        border: "1px solid var(--border-primary)",
      }}
    >
      {/* Main container - horizontal on desktop, vertical on mobile */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          gap: "1rem",
        }}
        className="database-model-layout"
      >
        {/* Memory Block */}
        <div
          style={{
            flex: 1,
            padding: "1.25rem",
            background: "var(--bg-primary)",
            borderRadius: "8px",
            border: "2px dashed var(--border-primary)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
              color: "var(--text-primary)",
            }}
          >
            <RamIcon />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Memory</div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                (Volatile)
              </div>
            </div>
          </div>

          {/* Buffer Pool */}
          <div
            style={{
              flex: 1,
              background: "var(--bg-tertiary)",
              borderRadius: "6px",
              padding: "0.75rem",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Buffer Pool
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {/* Buffer slots */}
              <div
                style={{
                  height: "28px",
                  background: "var(--bg-secondary)",
                  borderRadius: "4px",
                  border: "1px solid var(--border-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-secondary)",
                }}
              >
                Page 2
              </div>
              <div
                style={{
                  height: "28px",
                  background: "var(--bg-secondary)",
                  borderRadius: "4px",
                  border: "1px dashed var(--border-secondary)",
                }}
              />
              <div
                style={{
                  height: "28px",
                  background: "var(--bg-secondary)",
                  borderRadius: "4px",
                  border: "1px dashed var(--border-secondary)",
                }}
              />
            </div>
          </div>

          {/* Properties */}
          <div
            style={{
              marginTop: "0.75rem",
              fontSize: "0.7rem",
              color: "var(--text-tertiary)",
              lineHeight: 1.5,
            }}
          >
            <div>• Fast access</div>
            <div>• Lost on crash</div>
          </div>
        </div>

        {/* Arrows Column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            padding: "0.5rem 0",
          }}
          className="database-model-arrows"
        >
          <DataFlowArrow direction="left" label="Load" />
          <DataFlowArrow direction="right" label="Flush" />
        </div>

        {/* Disk Block */}
        <div
          style={{
            flex: 1,
            padding: "1.25rem",
            background: "var(--bg-primary)",
            borderRadius: "8px",
            border: "2px solid var(--border-primary)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
              color: "var(--text-primary)",
            }}
          >
            <DiskIcon />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Disk</div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                (Stable Storage)
              </div>
            </div>
          </div>

          {/* Data Pages */}
          <div
            style={{
              flex: 1,
              background: "var(--bg-tertiary)",
              borderRadius: "6px",
              padding: "0.75rem",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Data Pages
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {["Page 1", "Page 2", "Page 3"].map((page) => (
                <div
                  key={page}
                  style={{
                    height: "28px",
                    background: "var(--bg-secondary)",
                    borderRadius: "4px",
                    border: "1px solid var(--border-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {page}
                </div>
              ))}
            </div>
          </div>

          {/* Properties */}
          <div
            style={{
              marginTop: "0.75rem",
              fontSize: "0.7rem",
              color: "var(--text-tertiary)",
              lineHeight: 1.5,
            }}
          >
            <div>• Slow access</div>
            <div>• Survives crash</div>
          </div>
        </div>
      </div>
    </div>
  );
}
