"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Phase =
  | "idle"
  | "updateP1"
  | "updateP2"
  | "flushP1Start"
  | "flushP1Done"
  | "crash"
  | "restart"
  | "done";

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

export default function AtomicityViolation() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [flushLine, setFlushLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(
    null
  );

  const dbInnerGridRef = useRef<HTMLDivElement | null>(null);
  const memP1RowRef = useRef<HTMLDivElement | null>(null);
  const diskP1RowRef = useRef<HTMLDivElement | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const timeline: { phase: Phase; delay: number }[] = [
      { phase: "updateP1", delay: 750 },
      { phase: "updateP2", delay: 1200 },
      { phase: "flushP1Start", delay: 1500 },
      { phase: "flushP1Done", delay: 1000 },
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

  const crashed = phase === "crash";
  const showCrashBadge = phase === "crash" || phase === "restart" || phase === "done";
  const restarted = phase === "restart" || phase === "done";
  const isFlushingP1 = phase === "flushP1Start";
  const flushedP1 =
    phase === "flushP1Done" || phase === "crash" || phase === "restart" || phase === "done";
  const revealProblem = phase === "done";

  // Buffer starts loaded (10,20) then updates in-place
  const memoryP1 = restarted ? null : phase === "idle" ? 10 : 15;
  const memoryP2 = restarted ? null : phase === "idle" || phase === "updateP1" ? 20 : 25;

  const p1Updated = !restarted && phase !== "idle";
  const p2Updated = !restarted && (phase === "updateP2" || phase === "flushP1Start" || phase === "flushP1Done" || phase === "crash");

  const diskP1 = flushedP1 ? 15 : 10;
  const diskP2 = 20;

  // Anchor the flush animation line to the actual P1 rows (no guessy "middle" positioning)
  useLayoutEffect(() => {
    if (!isFlushingP1) {
      setFlushLine(null);
      return;
    }

    const compute = () => {
      const container = dbInnerGridRef.current;
      const mem = memP1RowRef.current;
      const disk = diskP1RowRef.current;
      if (!container || !mem || !disk) return;

      const c = container.getBoundingClientRect();
      const m = mem.getBoundingClientRect();
      const d = disk.getBoundingClientRect();

      const x1 = m.right - c.left + 10;
      const y1 = m.top - c.top + m.height / 2;
      const x2 = d.left - c.left - 10;
      const y2 = d.top - c.top + d.height / 2;

      setFlushLine({ x1, y1, x2, y2 });
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [isFlushingP1]);

  return (
    <motion.div
      animate={{ x: 0 }}
      transition={{ duration: 0.2 }}
      className="mdx-atomicity-card"
    >
      {/* Header */}
      <div className="mdx-atomicity-header">
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Atomicity violation
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
          className="mdx-atomicity-button"
        >
          {isPlaying ? "↺ Reset" : phase === "done" ? "↺ Replay" : "▶ Play"}
        </button>
      </div>

      <div
        className="mdx-atomicity-layout"
      >
        {/* Client (no success shown; crash happens mid-commit/flush) */}
        <div
          className="mdx-atomicity-panel"
          style={{
            border: `1px solid ${revealProblem ? "rgba(239,68,68,0.55)" : "var(--border-secondary)"}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Client sees
            </div>
            <div style={{ marginTop: "0.6rem" }}>
              <motion.div
                initial={false}
                animate={{ opacity: crashed ? 0.45 : 0.7 }}
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
            </div>
          </div>
        </div>

        {/* DB */}
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
          className="mdx-atomicity-panel mdx-atomicity-db"
          style={{
            border: `1px solid ${showCrashBadge || revealProblem ? "rgba(239,68,68,0.55)" : "var(--border-secondary)"}`,
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

          <div className="mdx-atomicity-db-top">
            <div className="mdx-atomicity-db-top-left">
              <div
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                DB
              </div>

              <AnimatePresence>
                {isFlushingP1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mdx-atomicity-flush-pill"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.22rem 0.65rem",
                      borderRadius: "999px",
                      border: "1px solid var(--accent)",
                      color: "white",
                      background: "var(--accent)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.22)",
                    }}
                  >
                    FLUSH P1
                    <motion.span
                      aria-hidden
                      animate={{ x: [0, 6, 0], opacity: [0.55, 1, 0.55] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                      style={{ display: "inline-block" }}
                    >
                      →
                    </motion.span>
                    DISK
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="mdx-atomicity-db-status">
              {phase === "idle" && "stable"}
              {phase === "updateP1" && "buffer updated"}
              {phase === "updateP2" && "buffer updated"}
              {phase === "flushP1Start" && "flush P1…"}
              {phase === "flushP1Done" && "P1 on disk"}
              {phase === "crash" && "down"}
              {phase === "restart" && "restart"}
              {phase === "done" && "partial"}
            </div>
          </div>

          <div
            className="mdx-atomicity-db-inner"
            ref={dbInnerGridRef}
          >
            {/* Flush animation: Memory(P1) -> Disk(P1) */}
            <AnimatePresence>
              {isFlushingP1 && flushLine && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 5,
                  }}
                >
                  <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${Math.max(1, Math.ceil(dbInnerGridRef.current?.clientWidth ?? 1))} ${Math.max(
                      1,
                      Math.ceil(dbInnerGridRef.current?.clientHeight ?? 1)
                    )}`}
                    preserveAspectRatio="none"
                    style={{ position: "absolute", inset: 0 }}
                    aria-hidden
                  >
                    <line
                      x1={flushLine.x1}
                      y1={flushLine.y1}
                      x2={flushLine.x2}
                      y2={flushLine.y2}
                      stroke="rgba(59,130,246,0.35)"
                      strokeWidth="1"
                      strokeDasharray="3 4"
                    />
                  </svg>

                  <motion.div
                    aria-hidden
                    initial={{ opacity: 0.85 }}
                    animate={{
                      opacity: [0.7, 1, 0.7],
                      left: [flushLine.x1, flushLine.x2],
                      top: [flushLine.y1, flushLine.y2],
                    }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      position: "absolute",
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "var(--accent)",
                      boxShadow: "0 0 0 4px rgba(59,130,246,0.12)",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Memory */}
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "10px",
                border: `1px dashed ${showCrashBadge ? "rgba(239,68,68,0.35)" : (memoryP1 !== null || memoryP2 !== null) ? "rgba(59,130,246,0.45)" : "var(--border-secondary)"
                  }`,
                background:
                  (memoryP1 !== null || memoryP2 !== null) && !crashed
                    ? "rgba(59,130,246,0.05)"
                    : crashed
                      ? "rgba(239,68,68,0.05)"
                      : "transparent",
              }}
            >
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Memory
              </div>
              <div style={{ marginTop: "0.5rem", display: "grid", gap: "0.35rem" }}>
                <motion.div
                  ref={memP1RowRef}
                  animate={
                    isFlushingP1
                      ? { opacity: [0.7, 1, 0.7] }
                      : { opacity: 1 }
                  }
                  transition={isFlushingP1 ? { duration: 0.85, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    alignItems: "baseline",
                    columnGap: "0.6rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: restarted ? "var(--text-tertiary)" : isFlushingP1 ? "var(--accent)" : p1Updated ? "var(--accent)" : "var(--text-primary)",
                  }}
                >
                  <span style={{ opacity: 0.95 }}>P1 =</span>
                  <span style={{ textAlign: "right" }}>{memoryP1 === null ? "—" : memoryP1}</span>
                </motion.div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    alignItems: "baseline",
                    columnGap: "0.6rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: restarted ? "var(--text-tertiary)" : p2Updated ? "var(--accent)" : "var(--text-primary)",
                  }}
                >
                  <span style={{ opacity: 0.95 }}>P2 =</span>
                  <span style={{ textAlign: "right" }}>{memoryP2 === null ? "—" : memoryP2}</span>
                </div>
              </div>
            </div>

            {/* Disk */}
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "10px",
                border: `1px solid ${revealProblem ? "rgba(239,68,68,0.45)" : isFlushingP1 ? "rgba(59,130,246,0.45)" : "var(--border-secondary)"
                  }`,
                background: revealProblem ? "rgba(239,68,68,0.04)" : isFlushingP1 ? "rgba(59,130,246,0.03)" : "transparent",
                position: "relative",
              }}
            >
              <AnimatePresence>
                {revealProblem && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(239,68,68,0.55)",
                      color: "#ef4444",
                      background: "var(--bg-primary)",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    PARTIAL
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Disk
              </div>
              <div style={{ marginTop: "0.5rem", display: "grid", gap: "0.35rem" }}>
                <div
                  ref={diskP1RowRef}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    alignItems: "baseline",
                    columnGap: "0.6rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                  }}
                >
                  <span style={{ opacity: 0.95 }}>P1 =</span>
                  <span style={{ textAlign: "right" }}>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={diskP1}
                        initial={phase === "idle" ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                        style={{ color: flushedP1 ? "var(--accent)" : "var(--text-primary)" }}
                      >
                        {diskP1}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    alignItems: "baseline",
                    columnGap: "0.6rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: revealProblem ? "#ef4444" : "var(--text-primary)",
                  }}
                >
                  <span style={{ opacity: 0.95 }}>P2 =</span>
                  <span style={{ textAlign: "right" }}>{diskP2}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
