"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const STEPS = [
  { id: 0, label: "Client Request", duration: 400, icon: "request" },
  { id: 1, label: "Load Page", duration: 300, icon: "load" },
  { id: 2, label: "Update Buffer", duration: 200, icon: "update" },
  { id: 3, label: "Write to Disk", duration: 1500, icon: "disk", slow: true },
  { id: 4, label: "Ack Success", duration: 400, icon: "success" },
];

export default function SynchronousWrites() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  const reset = useCallback(() => {
    setCurrentStep(-1);
    setIsPlaying(false);
    setIsDone(false);
    setHasAutoPlayed(false);
  }, []);

  const startAnimation = useCallback(() => {
    setCurrentStep(-1);
    setIsDone(false);
    setIsPlaying(true);
  }, []);

  // Auto-play when component comes into view
  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasAutoPlayed || isDone) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasAutoPlayed && !isPlaying && !isDone) {
          setHasAutoPlayed(true);
          startAnimation();
        }
      },
      {
        threshold: 0.3, // Start when 30% of the component is visible
        rootMargin: "0px",
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [hasAutoPlayed, isPlaying, isDone, startAnimation]);

  useEffect(() => {
    if (!isPlaying) return;

    let timeout: NodeJS.Timeout;

    const runStep = (stepIndex: number) => {
      if (stepIndex >= STEPS.length) {
        // Animation complete - stop and mark as done
        setIsPlaying(false);
        setIsDone(true);
        return;
      }

      setCurrentStep(stepIndex);
      timeout = setTimeout(() => {
        runStep(stepIndex + 1);
      }, STEPS[stepIndex].duration);
    };

    // Start the animation
    timeout = setTimeout(() => runStep(0), 500);

    return () => clearTimeout(timeout);
  }, [isPlaying]);

  useEffect(() => {
    const container = timelineScrollRef.current;
    if (!container) return;

    // Only auto-scroll when the timeline actually overflows.
    const isOverflowing = container.scrollWidth > container.clientWidth + 1;
    if (!isOverflowing) return;

    // Wait a frame so layout/DOM is stable.
    const raf = requestAnimationFrame(() => {
      if (currentStep < 0) {
        container.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      const stepEl = stepRefs.current[currentStep];
      if (!stepEl) return;

      const containerRect = container.getBoundingClientRect();
      const stepRect = stepEl.getBoundingClientRect();

      // Convert step position into container scroll coordinates, then center it.
      const stepCenter =
        stepRect.left - containerRect.left + container.scrollLeft + stepRect.width / 2;
      const targetLeft = stepCenter - container.clientWidth / 2;

      const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth);
      const clampedLeft = Math.min(maxLeft, Math.max(0, targetLeft));

      container.scrollTo({ left: clampedLeft, behavior: "smooth" });
    });

    return () => cancelAnimationFrame(raf);
  }, [currentStep]);

  const getStepStatus = (stepId: number) => {
    if (currentStep < 0) return "pending";
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "active";
    return "pending";
  };

  return (
    <div
      ref={containerRef}
      className="syncwrites"
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
        className="syncwrites-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div
          className="syncwrites-title"
          style={{
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            fontWeight: 500,
          }}
        >
          Synchronous Write Flow
        </div>
        <button
          onClick={() => {
            if (isPlaying) {
              reset();
              return;
            }
            startAnimation();
          }}
          className="syncwrites-toggle"
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
          {isPlaying ? "↺ Reset" : isDone ? "↺ Replay" : "▶ Play"}
        </button>
      </div>

      {/* Timeline */}
      <div className="syncwrites-timeline-scroll" ref={timelineScrollRef}>
        <div className="syncwrites-timeline" style={{ position: "relative" }}>
          {/* Progress line background */}
          <div
            className="syncwrites-line"
            style={{
              position: "absolute",
              top: "calc(var(--syncwrites-circle) / 2)",
              left: "calc(var(--syncwrites-circle) / 2)",
              right: "calc(var(--syncwrites-circle) / 2)",
              height: "2px",
              background: "var(--border-secondary)",
              zIndex: 0,
            }}
          />

          {/* Steps */}
          <div
            className="syncwrites-steps"
            style={{
              display: "flex",
              justifyContent: "space-between",
              position: "relative",
              zIndex: 1,
            }}
          >
            {STEPS.map((step) => {
              const status = getStepStatus(step.id);
              const isActive = status === "active";
              const isCompleted = status === "completed";
              const isSlow = step.slow && isActive;

              return (
                <div
                  key={step.id}
                  className="syncwrites-step"
                  data-slow={step.slow ? "true" : "false"}
                  ref={(el) => {
                    stepRefs.current[step.id] = el;
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {/* Step circle */}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.2 : 1,
                      backgroundColor: isCompleted
                        ? "var(--accent)"
                        : isActive
                          ? step.slow
                            ? "#f59e0b"
                            : "var(--accent)"
                          : "var(--bg-tertiary)",
                      borderColor: isCompleted
                        ? "var(--accent)"
                        : isActive
                          ? step.slow
                            ? "#f59e0b"
                            : "var(--accent)"
                          : "var(--border-primary)",
                    }}
                    transition={{ duration: 0.2 }}
                    style={{
                      width: "var(--syncwrites-circle)",
                      height: "var(--syncwrites-circle)",
                      borderRadius: "50%",
                      border: "2px solid",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--bg-tertiary)",
                    }}
                  >
                    {isCompleted ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span
                        style={{
                          fontSize: "clamp(0.6rem, 2.6vw, 0.7rem)",
                          fontWeight: 600,
                          color: isActive ? "white" : "var(--text-tertiary)",
                        }}
                      >
                        {step.id + 1}
                      </span>
                    )}
                  </motion.div>

                  {/* Step label */}
                  <div
                    className="syncwrites-stepLabel"
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.65rem",
                      fontFamily: "var(--font-mono)",
                      color: isActive
                        ? step.slow
                          ? "#f59e0b"
                          : "var(--accent)"
                        : isCompleted
                          ? "var(--text-primary)"
                          : "var(--text-tertiary)",
                      textAlign: "center",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {step.label}
                  </div>

                  {/* Slow indicator - always reserve space */}
                  <div
                    style={{
                      marginTop: "0.25rem",
                      height: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {step.slow && (
                      <motion.div
                        animate={{ opacity: isSlow ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          fontSize: "0.6rem",
                          color: "#f59e0b",
                          fontFamily: "var(--font-mono)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <motion.span
                          animate={{ opacity: isSlow ? [1, 0.3, 1] : 0 }}
                          transition={{ duration: 0.6, repeat: isSlow ? Infinity : 0 }}
                        >
                          ●
                        </motion.span>
                        BLOCKING
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time indicator - animated */}
      <div
        className="syncwrites-timeBox"
        style={{
          marginTop: "1.5rem",
          padding: "0.75rem",
          background: "var(--bg-primary)",
          borderRadius: "6px",
          border: "1px solid var(--border-secondary)",
        }}
      >
        <div
          className="syncwrites-timeHeader"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.7rem",
            color: "var(--text-tertiary)",
            marginBottom: "0.5rem",
          }}
        >
          <span>Elapsed Time</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>
            Memory: ~ns | Disk: ~ms
          </span>
        </div>
        <div
          style={{
            display: "flex",
            height: "12px",
            borderRadius: "4px",
            overflow: "hidden",
            background: "var(--bg-tertiary)",
            gap: "2px",
          }}
        >
          {STEPS.map((step) => {
            const status = getStepStatus(step.id);
            const isActive = status === "active";
            const isCompleted = status === "completed";
            const isSlow = step.slow;

            return (
              <div
                key={step.id}
                style={{
                  flex: step.duration / 100,
                  background: "var(--bg-secondary)",
                  borderRadius: "2px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Fill bar */}
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{
                    width: isCompleted ? "100%" : isActive ? "100%" : "0%",
                  }}
                  transition={{
                    duration: isActive ? step.duration / 1000 : 0.2,
                    ease: "linear",
                  }}
                  style={{
                    height: "100%",
                    background: isSlow ? "#f59e0b" : "var(--accent)",
                    borderRadius: "2px",
                  }}
                />
                {/* Label for disk */}
                {isSlow && (
                  <span
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      fontSize: "0.5rem",
                      color: isCompleted || isActive ? "white" : "var(--text-tertiary)",
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      whiteSpace: "nowrap",
                      zIndex: 1,
                    }}
                  >
                    DISK I/O
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
