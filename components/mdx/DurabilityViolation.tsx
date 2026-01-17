"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Phase = "idle" | "updateBuffer" | "ack" | "crash" | "restart" | "done";

const FlameIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    focusable="false"
  >
    <path
      d="M12.6 2.4c.3 2.6-.6 4.2-2.1 5.7-1.4 1.4-2.9 3-2.9 5.5 0 2.8 2.3 5.1 5.1 5.1 2.6 0 4.7-2 5.1-4.5.2-1.1.1-2.1-.2-3.2-.4 1-1.1 1.8-2.1 2.5.2-2.9-1.3-4.7-2.9-6.2C13.6 5.9 12.9 4.4 12.6 2.4Z"
      fill="currentColor"
    />
    <path
      d="M12 11.4c-1.6 1.1-2.6 2.5-2.6 4.1 0 1.6 1.3 2.9 2.9 2.9s2.9-1.3 2.9-2.9c0-.9-.4-1.7-1.1-2.4.1.8-.1 1.6-.7 2.2.1-1.6-.7-2.6-1.4-3.2Z"
      fill="currentColor"
      opacity="0.85"
    />
  </svg>
);

export default function DurabilityViolation() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  const reset = useCallback(() => {
    setPhase("idle");
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const timeline: { phase: Phase; delay: number }[] = [
      { phase: "updateBuffer", delay: 700 },
      { phase: "ack", delay: 1400 },
      { phase: "crash", delay: 1500 },
      { phase: "restart", delay: 1300 },
      { phase: "done", delay: 1100 },
    ];

    let idx = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const runNext = () => {
      if (idx >= timeline.length) {
        setIsPlaying(false);
        return;
      }
      const { phase: next, delay } = timeline[idx];
      timeout = setTimeout(() => {
        setPhase(next);
        idx += 1;
        runNext();
      }, delay);
    };

    runNext();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mobileMql = window.matchMedia("(max-width: 640px)");
    const narrowMql = window.matchMedia("(max-width: 380px)");

    const sync = () => {
      setIsMobile(mobileMql.matches);
      setIsNarrow(narrowMql.matches);
    };

    sync();
    mobileMql.addEventListener("change", sync);
    narrowMql.addEventListener("change", sync);
    return () => {
      mobileMql.removeEventListener("change", sync);
      narrowMql.removeEventListener("change", sync);
    };
  }, []);

  const bufferValue = phase === "updateBuffer" || phase === "ack" || phase === "crash" ? 4 : null;
  const clientAcked = phase === "ack" || phase === "crash" || phase === "restart" || phase === "done";
  const crashed = phase === "crash";
  const restarted = phase === "restart" || phase === "done";
  const revealMismatch = phase === "done";
  const showCrashBadge = phase === "crash" || phase === "restart" || phase === "done";

  return (
    <motion.div
      animate={{ x: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        margin: "2rem 0",
        padding: "1rem",
        borderRadius: "12px",
        border: "1px solid var(--border-primary)",
        background: "var(--bg-secondary)",
        position: "relative",
      }}
    >
      <AnimatePresence>
        {crashed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "12px",
              background: "rgba(239,68,68,0.08)",
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: isMobile ? "center" : "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: isMobile ? "wrap" : "nowrap",
        }}
      >
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Durability violation
          </div>
        </div>

        <button
          onClick={() => {
            if (isPlaying) {
              reset();
              return;
            }
            setPhase("idle");
            setIsPlaying(true);
          }}
          style={{
            padding: isMobile ? "0.4rem 0.65rem" : "0.45rem 0.75rem",
            background: "transparent",
            color: "var(--text-primary)",
            border: "1px solid var(--border-primary)",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: isMobile ? "0.72rem" : "0.75rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {isPlaying ? "↺ Reset" : phase === "done" ? "↺ Replay" : "▶ Play"}
        </button>
      </div>

      {/* Simple visual */}
      <div
        style={{
          marginTop: "0.9rem",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr",
          gap: isNarrow ? "0.6rem" : "0.75rem",
          alignItems: "stretch",
        }}
      >
        {/* Client */}
        <div
          style={{
            padding: isNarrow ? "0.8rem" : "0.9rem",
            borderRadius: "10px",
            border: `1px solid ${revealMismatch ? "rgba(239,68,68,0.55)" : "var(--border-secondary)"}`,
            background: "var(--bg-primary)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "0.75rem",
            minHeight: isMobile ? 0 : 140,
          }}
        >
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Client sees
            </div>
            <div style={{ marginTop: "0.6rem" }}>
              <AnimatePresence mode="wait">
                {clientAcked ? (
                  <motion.div
                    key="client-acked"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      padding: "0.55rem 0.7rem",
                      borderRadius: "10px",
                      border: `1px solid ${revealMismatch ? "rgba(239,68,68,0.65)" : "rgba(34,197,94,0.55)"}`,
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                    }}
                  >
                    <span style={{ fontWeight: 800, color: revealMismatch ? "#ef4444" : "#22c55e", fontSize: "0.85rem" }}>
                      SUCCESS ✓
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                      A=4
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="client-wait"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    style={{
                      padding: "0.55rem 0.7rem",
                      borderRadius: "10px",
                      border: "1px dashed var(--border-secondary)",
                      color: "var(--text-tertiary)",
                      fontSize: "0.85rem",
                    }}
                  >
                    waiting…
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* DB (Memory + Disk) */}
        <motion.div
          animate={
            crashed
              ? {
                x: [-1, 2, -3, 2, 0],
                rotate: [-0.15, 0.2, -0.25, 0.12, 0],
              }
              : { x: 0, rotate: 0 }
          }
          transition={crashed ? { duration: 0.38 } : { duration: 0.2 }}
          style={{
            padding: isNarrow ? "0.8rem" : "0.9rem",
            borderRadius: "10px",
            border: `1px solid ${showCrashBadge ? "rgba(239,68,68,0.55)" : "var(--border-secondary)"}`,
            background: "var(--bg-primary)",
            position: "relative",
            overflow: "hidden",
            minHeight: isMobile ? 0 : 140,
          }}
        >
          <AnimatePresence>
            {showCrashBadge && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.2rem 0.45rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(239,68,68,0.55)",
                  color: "#ef4444",
                  background: "var(--bg-primary)",
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  zIndex: 2,
                }}
              >
                <FlameIcon size={12} />
                CRASH
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {crashed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(239,68,68,0.06)",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
            )}
          </AnimatePresence>

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              DB
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
              {phase === "idle" && "stable"}
              {phase === "updateBuffer" && "buffer updated"}
              {phase === "ack" && "acked"}
              {phase === "crash" && "down"}
              {phase === "restart" && "restart"}
              {phase === "done" && "mismatch"}
            </div>
          </div>

          <div
            style={{
              marginTop: "0.75rem",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isNarrow ? "0.6rem" : "0.75rem",
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Memory inside DB */}
            <div
              style={{
                padding: isNarrow ? "0.65rem" : "0.75rem",
                borderRadius: "10px",
                border: `1px dashed ${showCrashBadge ? "rgba(239,68,68,0.35)" : bufferValue !== null ? "rgba(59,130,246,0.45)" : "var(--border-secondary)"
                  }`,
                background:
                  bufferValue !== null && !crashed
                    ? "rgba(59,130,246,0.05)"
                    : crashed
                      ? "rgba(239,68,68,0.05)"
                      : "transparent",
              }}
            >
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Memory
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <AnimatePresence mode="wait">
                  {bufferValue !== null && !restarted ? (
                    <motion.div
                      key="db-mem-value"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: crashed ? 0.35 : 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "clamp(1rem, 4.5vw, 1.15rem)",
                        fontWeight: 800,
                        color: crashed ? "#ef4444" : "var(--text-primary)",
                        textDecoration: crashed ? "line-through" : "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      A = {bufferValue}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="db-mem-empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      exit={{ opacity: 0 }}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "clamp(1rem, 4.5vw, 1.15rem)",
                        fontWeight: 800,
                        color: "var(--text-tertiary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      —
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Disk inside DB */}
            <div
              style={{
                padding: isNarrow ? "0.65rem" : "0.75rem",
                borderRadius: "10px",
                border: `1px solid ${revealMismatch ? "rgba(239,68,68,0.45)" : "var(--border-secondary)"}`,
                background: revealMismatch ? "rgba(239,68,68,0.04)" : "transparent",
              }}
            >
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Disk
              </div>
              <div
                style={{
                  marginTop: "0.5rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(1rem, 4.5vw, 1.15rem)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                A = 3
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
