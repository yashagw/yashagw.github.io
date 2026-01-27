"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

// RAM Chip Icon
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
    <rect x="4" y="6" width="16" height="12" rx="1" />
    <line x1="7" y1="18" x2="7" y2="21" />
    <line x1="10" y1="18" x2="10" y2="21" />
    <line x1="14" y1="18" x2="14" y2="21" />
    <line x1="17" y1="18" x2="17" y2="21" />
    <line x1="7" y1="6" x2="7" y2="3" />
    <line x1="10" y1="6" x2="10" y2="3" />
    <line x1="14" y1="6" x2="14" y2="3" />
    <line x1="17" y1="6" x2="17" y2="3" />
    <rect x="7" y="9" width="10" height="6" rx="0.5" />
  </svg>
);

// Disk Platter Icon
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
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

type Phase = "idle" | "load1" | "load2" | "modify" | "dirty" | "flushing" | "flushed" | "done";

interface BufferSlot {
  pageId: number | null;
  value: number | null;
  isDirty: boolean;
}

const INITIAL_BUFFERS: BufferSlot[] = [
  { pageId: null, value: null, isDirty: false },
  { pageId: null, value: null, isDirty: false },
  { pageId: null, value: null, isDirty: false },
];

const INITIAL_DISK = [
  { id: 1, value: 5 },
  { id: 2, value: 10 },
  { id: 3, value: 15 },
];

export default function DatabaseModel() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [buffers, setBuffers] = useState<BufferSlot[]>(INITIAL_BUFFERS);
  const [diskPages, setDiskPages] = useState(INITIAL_DISK);

  const reset = useCallback(() => {
    setPhase("idle");
    setIsPlaying(false);
    setBuffers(INITIAL_BUFFERS);
    setDiskPages(INITIAL_DISK);
  }, []);

  const startAnimation = useCallback(() => {
    reset();
    setIsPlaying(true);
  }, [reset]);

  // Auto-play when component comes into view
  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasAutoPlayed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAutoPlayed && !isPlaying) {
          setHasAutoPlayed(true);
          startAnimation();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [hasAutoPlayed, isPlaying, startAnimation]);

  // Animation sequence - slower timing
  useEffect(() => {
    if (!isPlaying) return;

    const sequence: { phase: Phase; delay: number; action?: () => void }[] = [
      // Load Page 2 into first buffer
      {
        phase: "load1",
        delay: 1200,
        action: () => setBuffers(prev => [
          { pageId: 2, value: 10, isDirty: false },
          prev[1],
          prev[2],
        ]),
      },
      // Load Page 3 into second buffer
      {
        phase: "load2",
        delay: 1200,
        action: () => setBuffers(prev => [
          prev[0],
          { pageId: 3, value: 15, isDirty: false },
          prev[2],
        ]),
      },
      // Modify Page 2 in buffer
      {
        phase: "modify",
        delay: 800,
      },
      {
        phase: "dirty",
        delay: 1200,
        action: () => setBuffers(prev => [
          { pageId: 2, value: 42, isDirty: true },
          prev[1],
          prev[2],
        ]),
      },
      // Flush Page 2 to disk
      {
        phase: "flushing",
        delay: 1500,
      },
      {
        phase: "flushed",
        delay: 1000,
        action: () => {
          setDiskPages(prev => prev.map(p => p.id === 2 ? { ...p, value: 42 } : p));
          setBuffers(prev => [
            { pageId: 2, value: 42, isDirty: false },
            prev[1],
            prev[2],
          ]);
        },
      },
      { phase: "done", delay: 500 },
    ];

    let timeouts: NodeJS.Timeout[] = [];
    let cumulative = 600;

    sequence.forEach(({ phase, delay, action }) => {
      const t = setTimeout(() => {
        action?.();
        setPhase(phase);
      }, cumulative);
      timeouts.push(t);
      cumulative += delay;
    });

    const endTimeout = setTimeout(() => {
      setIsPlaying(false);
    }, cumulative);
    timeouts.push(endTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, [isPlaying]);

  const showLoadArrow = phase === "load1" || phase === "load2";
  const showFlushArrow = phase === "flushing" || phase === "flushed";

  return (
    <div
      ref={containerRef}
      style={{
        margin: "2rem 0",
        padding: "1.5rem",
        background: "var(--bg-secondary)",
        borderRadius: "8px",
        border: "1px solid var(--border-primary)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
          Buffer Pool Operations
        </div>
        <button
          onClick={() => {
            if (isPlaying) {
              reset();
            } else {
              startAnimation();
            }
          }}
          style={{
            padding: "0.25rem 0.5rem",
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-primary)",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.7rem",
            fontFamily: "var(--font-mono)",
          }}
        >
          {isPlaying ? "↺ Reset" : "↺ Replay"}
        </button>
      </div>

      {/* Main Layout */}
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
              <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                (Volatile)
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: "var(--bg-tertiary)",
              borderRadius: "6px",
              padding: "0.75rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 500 }}>
              Buffer Pool
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {buffers.map((slot, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    backgroundColor: slot.isDirty
                      ? "rgba(251, 191, 36, 0.15)"
                      : "var(--bg-secondary)",
                    borderColor: slot.isDirty
                      ? "rgba(251, 191, 36, 0.5)"
                      : "var(--border-secondary)",
                  }}
                  style={{
                    height: "32px",
                    borderRadius: "4px",
                    border: slot.pageId !== null ? "1px solid var(--border-secondary)" : "1px dashed var(--border-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontFamily: "var(--font-mono)",
                    color: slot.pageId !== null ? "var(--text-primary)" : "var(--text-tertiary)",
                    gap: "0.5rem",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {slot.pageId !== null ? (
                    <motion.div
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                    >
                      <span>Page {slot.pageId}</span>
                      <span style={{ color: "var(--text-tertiary)" }}>|</span>
                      <motion.span
                        key={slot.value}
                        initial={{ scale: 1.3, color: slot.isDirty ? "#fbbf24" : "var(--accent)" }}
                        animate={{ scale: 1, color: slot.isDirty ? "#fbbf24" : "var(--text-secondary)" }}
                        style={{ fontWeight: slot.isDirty ? 600 : 400 }}
                      >
                        A = {slot.value}
                      </motion.span>
                      {slot.isDirty && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{
                            fontSize: "0.6rem",
                            color: "#fbbf24",
                            background: "rgba(251, 191, 36, 0.2)",
                            padding: "1px 4px",
                            borderRadius: "2px",
                          }}
                        >
                          dirty
                        </motion.span>
                      )}
                    </motion.div>
                  ) : (
                    <span style={{ opacity: 0.5 }}>empty</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "0.75rem", fontSize: "0.7rem", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
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
          {/* Load Arrow */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                fontSize: "0.7rem",
                color: showLoadArrow ? "var(--accent)" : "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: showLoadArrow ? 600 : 400,
              }}
            >
              Load
            </span>
            <motion.div
              animate={{ opacity: showLoadArrow ? 1 : 0.4 }}
              style={{ color: "var(--accent)" }}
            >
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
                  filter={showLoadArrow ? "url(#glow-load)" : undefined}
                />
              </svg>
            </motion.div>
          </div>

          {/* Flush Arrow */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                fontSize: "0.7rem",
                color: showFlushArrow ? "#22c55e" : "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: showFlushArrow ? 600 : 400,
              }}
            >
              Flush
            </span>
            <motion.div
              animate={{ opacity: showFlushArrow ? 1 : 0.4 }}
              style={{ color: "#22c55e" }}
            >
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
                  filter={showFlushArrow ? "url(#glow-flush)" : undefined}
                />
              </svg>
            </motion.div>
          </div>
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
              <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                (Stable Storage)
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: "var(--bg-tertiary)",
              borderRadius: "6px",
              padding: "0.75rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 500 }}>
              Data Pages
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {diskPages.map((page) => {
                const isBeingFlushed = phase === "flushed" && page.id === 2;
                return (
                  <motion.div
                    key={page.id}
                    animate={{
                      backgroundColor: isBeingFlushed ? "rgba(34, 197, 94, 0.15)" : "var(--bg-secondary)",
                      borderColor: isBeingFlushed ? "rgba(34, 197, 94, 0.5)" : "var(--border-secondary)",
                    }}
                    style={{
                      height: "32px",
                      borderRadius: "4px",
                      border: "1px solid var(--border-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-secondary)",
                      gap: "0.5rem",
                    }}
                  >
                    <span>Page {page.id}</span>
                    <span style={{ color: "var(--text-tertiary)" }}>|</span>
                    <motion.span
                      key={page.value}
                      initial={isBeingFlushed ? { scale: 1.3, color: "#22c55e" } : false}
                      animate={{ scale: 1, color: "var(--text-secondary)" }}
                    >
                      A = {page.value}
                    </motion.span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: "0.75rem", fontSize: "0.7rem", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
            <div>• Slow access</div>
            <div>• Survives crash</div>
          </div>
        </div>
      </div>
    </div>
  );
}
