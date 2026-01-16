"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LogRecord {
  id: number;
  type: "START" | "UPDATE" | "COMMIT";
  txnId: number;
  pageId?: string;
  oldValue?: number;
  newValue?: number;
  lsn: number;
}

interface PageState {
  id: string;
  value: number;
  pageLSN: number;
  isDirty: boolean;
  isOnDisk: boolean;
  inBuffer: boolean;
}

const INITIAL_DISK_PAGE: PageState = {
  id: "Page1",
  value: 3,
  pageLSN: 0,
  isDirty: false,
  isOnDisk: true,
  inBuffer: false,
};

const STEPS = [
  {
    step: 0,
    description: "Initial state: Page1 on disk (A = 3)",
    initial: true,
  },
  {
    step: 1,
    description: "Load Page1 from disk into buffer",
    loadPage: true,
  },
  {
    step: 2,
    description: "Write START record to log buffer",
    logRecord: { type: "START" as const, txnId: 100 },
  },
  {
    step: 3,
    description: "Update Page1 buffer in memory (A = 3 → 4)",
    updatePage: true,
  },
  {
    step: 4,
    description: "Write UPDATE record to log buffer",
    logRecord: { type: "UPDATE" as const, txnId: 100, pageId: "Page1", oldValue: 3, newValue: 4 },
  },
  {
    step: 5,
    description: "Write COMMIT record to log buffer",
    logRecord: { type: "COMMIT" as const, txnId: 100 },
  },
  {
    step: 6,
    description: "Flush log buffer to disk and acknowledge success to client",
    flushLog: true,
    ackClient: true,
  },
  {
    step: 7,
    description: "Background: Write Page1 buffer to disk later",
    flushPage: true,
  },
];

export default function WALVisualization() {
  const [currentStep, setCurrentStep] = useState(0);
  const [logBuffer, setLogBuffer] = useState<LogRecord[]>([]);
  const [logDisk, setLogDisk] = useState<LogRecord[]>([]);
  const [diskPage, setDiskPage] = useState<PageState>(INITIAL_DISK_PAGE);
  const [bufferPage, setBufferPage] = useState<PageState | null>(null);
  const [lsnCounter, setLsnCounter] = useState(1);
  const [isFlushingPage, setIsFlushingPage] = useState(false);
  const [flushingPageData, setFlushingPageData] = useState<PageState | null>(null);

  // Add CSS animation for gradient
  useEffect(() => {
    const styleId = "wal-gradient-animation";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleStepForward = useCallback(() => {
    if (currentStep >= STEPS.length - 1) return;
    setCurrentStep((prev) => prev + 1);
  }, [currentStep]);

  // Recompute state based on current step
  useEffect(() => {
    // Step 0 is initial state - page only on disk, nothing in buffer
    if (currentStep === 0) {
      setLogBuffer([]);
      setLogDisk([]);
      setDiskPage(INITIAL_DISK_PAGE);
      setBufferPage(null);
      setLsnCounter(1);
      setIsFlushingPage(false);
      return;
    }

    // Track state as we replay steps
    let lsn = 1;
    let logBufferState: LogRecord[] = [];
    let logDiskState: LogRecord[] = [];
    let diskPageState = INITIAL_DISK_PAGE;
    let bufferPageState: PageState | null = null;
    let shouldFlushPage = false;

    // Replay steps from 1 to currentStep
    for (let i = 1; i <= currentStep; i++) {
      const step = STEPS[i];

      if (step.loadPage) {
        bufferPageState = {
          id: "Page1",
          value: 3,
          pageLSN: 0,
          isDirty: false,
          isOnDisk: false,
          inBuffer: true,
        };
      }

      if (step.updatePage && bufferPageState) {
        bufferPageState = {
          ...bufferPageState,
          value: 4,
          isDirty: true,
        };
      }

      if (step.logRecord) {
        const record: LogRecord = {
          id: i,
          type: step.logRecord.type,
          txnId: step.logRecord.txnId,
          pageId: step.logRecord.pageId,
          oldValue: step.logRecord.oldValue,
          newValue: step.logRecord.newValue,
          lsn: lsn,
        };
        logBufferState = [...logBufferState, record];

        if (step.logRecord.type === "UPDATE" && bufferPageState) {
          bufferPageState = {
            ...bufferPageState,
            pageLSN: lsn,
          };
        }
        lsn++;
      }

      if (step.flushLog) {
        logDiskState = [...logDiskState, ...logBufferState];
        logBufferState = [];
      }

      if (step.flushPage && bufferPageState) {
        diskPageState = {
          ...bufferPageState,
          isOnDisk: true,
          inBuffer: false,
        };
        bufferPageState = null;
        shouldFlushPage = true;
      }
    }

    // Apply all state updates at once
    setLogBuffer(logBufferState);
    setLogDisk(logDiskState);
    setDiskPage(diskPageState);
    // Store page data before flushing for animation
    if (shouldFlushPage && currentStep === 7 && bufferPageState) {
      setFlushingPageData({ ...bufferPageState });
      setIsFlushingPage(true);
      setTimeout(() => {
        setIsFlushingPage(false);
        setFlushingPageData(null);
      }, 1200);
    } else {
      setIsFlushingPage(false);
      setFlushingPageData(null);
    }
    
    setBufferPage(bufferPageState);
    setLsnCounter(lsn);
  }, [currentStep]);

  const handleStepBackward = useCallback(() => {
    if (currentStep <= 0) return;
    setCurrentStep((prev) => prev - 1);
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setLogBuffer([]);
    setLogDisk([]);
    setDiskPage(INITIAL_DISK_PAGE);
    setBufferPage(null);
    setLsnCounter(1);
    setIsFlushingPage(false);
    setFlushingPageData(null);
  }, []);

  const currentStepData = STEPS[currentStep] || STEPS[0];

  return (
    <div
      className="wal-visualization"
      style={{
        margin: "2rem 0",
        padding: "1.5rem",
        background: "var(--bg-secondary)",
        borderRadius: "8px",
        border: "1px solid var(--border-primary)",
        position: "relative",
      }}
    >

      {/* Step description and navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
          gap: "1rem",
          minHeight: "2.5rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 500, lineHeight: "1.4" }}>
            Step {currentStepData.step}: {currentStepData.description}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
          <button
            onClick={handleStepBackward}
            disabled={currentStep <= 0}
            style={{
              padding: "0.4rem 0.6rem",
              background: currentStep <= 0 ? "var(--bg-primary)" : "var(--bg-tertiary)",
              color: currentStep <= 0 ? "var(--text-tertiary)" : "var(--text-primary)",
              border: "1px solid var(--border-primary)",
              borderRadius: "4px",
              cursor: currentStep <= 0 ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              opacity: currentStep <= 0 ? 0.5 : 1,
              transition: "opacity 0.2s ease",
            }}
            title="Previous step"
          >
            ‹
          </button>
          <span
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              minWidth: "60px",
              textAlign: "center",
            }}
          >
            {currentStepData.step}
          </span>
          <button
            onClick={handleStepForward}
            disabled={currentStep >= STEPS.length - 1}
            style={{
              padding: "0.4rem 0.6rem",
              background:
                currentStep >= STEPS.length - 1 ? "var(--bg-primary)" : "var(--bg-tertiary)",
              color:
                currentStep >= STEPS.length - 1 ? "var(--text-tertiary)" : "var(--text-primary)",
              border: "1px solid var(--border-primary)",
              borderRadius: "4px",
              cursor: currentStep >= STEPS.length - 1 ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              opacity: currentStep >= STEPS.length - 1 ? 0.5 : 1,
              transition: "opacity 0.2s ease",
            }}
            title="Next step"
          >
            ›
          </button>
          <button
            onClick={reset}
            style={{
              padding: "0.4rem 0.6rem",
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-primary)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.75rem",
              marginLeft: "0.25rem",
              transition: "opacity 0.2s ease",
            }}
            title="Reset to beginning"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Four Column Layout: Log Buffer | Log Disk | Buffer (Memory) | Disk */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "1rem",
          marginBottom: "1rem",
          alignItems: "start",
        }}
      >
        {/* Log Buffer Column */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: "2rem 1rem",
              background: "var(--bg-tertiary)",
              borderRadius: "4px",
              marginBottom: "0.5rem",
              fontWeight: 600,
              fontSize: "0.875rem",
              textAlign: "center",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            Log Buffer (Memory)
          </div>
          <div
            style={{
              height: "350px",
              padding: "1rem",
              background: "var(--bg-primary)",
              borderRadius: "4px",
              border: "2px dashed var(--border-primary)",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <AnimatePresence>
              {logBuffer.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    marginBottom: "0.5rem",
                    padding: "0.75rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "4px",
                    border: "1px solid var(--border-primary)",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <div>
                    [{record.type} Txn {record.txnId}
                    {record.type === "UPDATE" && (
                      <>
                        , {record.pageId}, {record.oldValue}→{record.newValue}
                      </>
                    )}
                    ]
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {logBuffer.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "var(--text-tertiary)",
                  textAlign: "center",
                  fontSize: "0.875rem",
                  width: "100%",
                }}
              >
                Empty
              </div>
            )}
          </div>
        </div>

        {/* Log Disk Column */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: "2rem 1rem",
              background: "var(--bg-tertiary)",
              borderRadius: "4px",
              marginBottom: "0.5rem",
              fontWeight: 600,
              fontSize: "0.875rem",
              textAlign: "center",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            Log Disk (Stable Storage)
          </div>
          <div
            style={{
              height: "350px",
              padding: "1rem",
              background: "var(--bg-primary)",
              borderRadius: "4px",
              border: "2px solid var(--border-primary)",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <AnimatePresence>
              {logDisk.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    marginBottom: "0.5rem",
                    padding: "0.75rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "4px",
                    border: "1px solid var(--border-primary)",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <div>
                    [{record.type} Txn {record.txnId}
                    {record.type === "UPDATE" && (
                      <>
                        , {record.pageId}, {record.oldValue}→{record.newValue}
                      </>
                    )}
                    ]
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {logDisk.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "var(--text-tertiary)",
                  textAlign: "center",
                  fontSize: "0.875rem",
                  width: "100%",
                }}
              >
                Empty
              </div>
            )}
          </div>
        </div>

        {/* Buffer (Memory) Column */}
        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          <div
            style={{
              padding: "2rem 1rem",
              background: "var(--bg-tertiary)",
              borderRadius: "4px",
              marginBottom: "0.5rem",
              fontWeight: 600,
              fontSize: "0.875rem",
              textAlign: "center",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            Buffer (Memory)
          </div>
          <div
            style={{
              height: "350px",
              padding: "1rem",
              background: "var(--bg-primary)",
              borderRadius: "4px",
              border: "2px dashed var(--border-primary)",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <AnimatePresence>
              {bufferPage && !isFlushingPage ? (
                <motion.div
                  key={`buffer-${bufferPage.id}`}
                  initial={currentStep === 1 ? { opacity: 0, scale: 0.9 } : false}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    padding: "1rem",
                    background: currentStep === 3
                      ? "rgba(59, 130, 246, 0.1)"
                      : "var(--bg-secondary)",
                    borderRadius: "4px",
                    border: `2px solid ${
                      currentStep === 3 ? "var(--accent)" : "var(--border-primary)"
                    }`,
                    fontSize: "0.875rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{bufferPage.id}</div>
                  <div>
                    Value: <strong>A = {bufferPage.value}</strong>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
            {!bufferPage && !isFlushingPage && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "var(--text-tertiary)",
                  textAlign: "center",
                  fontSize: "0.875rem",
                  width: "100%",
                }}
              >
                Empty
              </div>
            )}
          </div>
        </div>

        {/* Disk Column */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: "2rem 1rem",
              background: "var(--bg-tertiary)",
              borderRadius: "4px",
              marginBottom: "0.5rem",
              fontWeight: 600,
              fontSize: "0.875rem",
              textAlign: "center",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            Disk (Stable Storage)
          </div>
          <div
            style={{
              height: "350px",
              padding: "1rem",
              background: "var(--bg-primary)",
              borderRadius: "4px",
              border: "2px solid var(--border-primary)",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <AnimatePresence mode="wait">
              {isFlushingPage && flushingPageData ? (
                // Animated page moving from buffer to disk (same pattern as logs)
                <motion.div
                  key={`disk-flush-${flushingPageData.value}`}
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    padding: "1rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "4px",
                    border: "2px solid var(--border-primary)",
                    fontSize: "0.875rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{flushingPageData.id}</div>
                  <div>
                    Value: <strong>A = {flushingPageData.value}</strong>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`disk-${diskPage.value}`}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    padding: "1rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "4px",
                    border: "2px solid var(--border-primary)",
                    fontSize: "0.875rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{diskPage.id}</div>
                  <div>
                    Value: <strong>A = {diskPage.value}</strong>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
