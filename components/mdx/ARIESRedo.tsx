"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LogRecord {
    lsn: number;
    txnId: number;
    pageId: string;
    oldValue: number;
    newValue: number;
}

interface PageState {
    pageId: string;
    value: number;
    pageLSN: number;
}

const LOG_RECORDS: LogRecord[] = [
    { lsn: 2, txnId: 100, pageId: "P1", oldValue: 5, newValue: 10 },
    { lsn: 4, txnId: 101, pageId: "P2", oldValue: 20, newValue: 25 },
    { lsn: 6, txnId: 102, pageId: "P3", oldValue: 30, newValue: 35 },
    { lsn: 10, txnId: 103, pageId: "P4", oldValue: 40, newValue: 45 },
    { lsn: 11, txnId: 101, pageId: "P1", oldValue: 10, newValue: 15 },
    { lsn: 13, txnId: 103, pageId: "P2", oldValue: 25, newValue: 30 },
];

const INITIAL_PAGES: PageState[] = [
    { pageId: "P1", value: 10, pageLSN: 2 },
    { pageId: "P2", value: 25, pageLSN: 4 },
    { pageId: "P3", value: 35, pageLSN: 6 },
    { pageId: "P4", value: 40, pageLSN: 0 },
];

const STEPS = [
    { step: 0, title: "Start Redo from RedoLSN = 2. Scan forward and re-apply any missing updates.", scrollToLSN: 2 },
    { step: 1, title: "LSN 2: T100 → P1. pageLSN (2) ≥ logLSN (2). Already on disk — SKIP.", checkLSN: 2, action: "skip", scrollToLSN: 2 },
    { step: 2, title: "LSN 4: T101 → P2. pageLSN (4) ≥ logLSN (4). Already on disk — SKIP.", checkLSN: 4, action: "skip", scrollToLSN: 4 },
    { step: 3, title: "LSN 6: T102 → P3. pageLSN (6) ≥ logLSN (6). Already on disk — SKIP.", checkLSN: 6, action: "skip", scrollToLSN: 6 },
    { step: 4, title: "LSN 10: T103 → P4. pageLSN (0) < logLSN (10). Missing on disk — REDO! Apply 40→45.", checkLSN: 10, action: "redo", applyTo: "P4", newValue: 45, newPageLSN: 10, scrollToLSN: 10 },
    { step: 5, title: "LSN 11: T101 → P1. pageLSN (2) < logLSN (11). Missing on disk — REDO! Apply 10→15.", checkLSN: 11, action: "redo", applyTo: "P1", newValue: 15, newPageLSN: 11, scrollToLSN: 11 },
    { step: 6, title: "LSN 13: T103 → P2. pageLSN (4) < logLSN (13). Missing on disk — REDO! Apply 25→30.", checkLSN: 13, action: "redo", applyTo: "P2", newValue: 30, newPageLSN: 13, scrollToLSN: 13 },
    { step: 7, title: "Redo complete! Database now matches crash-time state (including uncommitted changes).", complete: true, scrollToLSN: 10 },
];

const scrollbarStyles = `
  .aries-log-scroll::-webkit-scrollbar {
    height: 6px;
  }
  .aries-log-scroll::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
  }
  .aries-log-scroll::-webkit-scrollbar-thumb {
    background: rgba(60, 60, 60, 0.8);
    border-radius: 3px;
  }
  .aries-log-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(80, 80, 80, 0.9);
  }
`;

export default function ARIESRedo() {
    const [currentStep, setCurrentStep] = useState(0);
    const [pages, setPages] = useState<PageState[]>(INITIAL_PAGES);
    const [redoActions, setRedoActions] = useState<{ lsn: number; action: string }[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const lsnRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        const scrollToLSN = STEPS[currentStep].scrollToLSN;
        if (scrollToLSN && scrollContainerRef.current && lsnRefs.current[scrollToLSN]) {
            const container = scrollContainerRef.current;
            const element = lsnRefs.current[scrollToLSN];
            if (element) {
                const scrollLeft = element.offsetLeft - container.offsetWidth / 2 + element.offsetWidth / 2;
                container.scrollTo({ left: scrollLeft, behavior: "smooth" });
            }
        }
    }, [currentStep]);

    useEffect(() => {
        let newPages = [...INITIAL_PAGES];
        const actions: { lsn: number; action: string }[] = [];

        for (let i = 1; i <= currentStep; i++) {
            const step = STEPS[i];
            if (step.checkLSN && step.action) {
                actions.push({ lsn: step.checkLSN, action: step.action });
            }
            if (step.applyTo && step.newValue !== undefined && step.newPageLSN !== undefined) {
                newPages = newPages.map(p =>
                    p.pageId === step.applyTo ? { ...p, value: step.newValue!, pageLSN: step.newPageLSN! } : p
                );
            }
        }

        setPages(newPages);
        setRedoActions(actions);
    }, [currentStep]);

    const handleStepForward = useCallback(() => {
        if (currentStep >= STEPS.length - 1) return;
        setCurrentStep(prev => prev + 1);
    }, [currentStep]);

    const handleStepBackward = useCallback(() => {
        if (currentStep <= 0) return;
        setCurrentStep(prev => prev - 1);
    }, [currentStep]);

    const reset = useCallback(() => setCurrentStep(0), []);

    const currentStepData = STEPS[currentStep];

    return (
        <div
            style={{
                margin: "2rem 0",
                padding: isMobile ? "1rem" : "1.5rem",
                background: "var(--bg-secondary)",
                borderRadius: "8px",
                border: "1px solid var(--border-primary)",
            }}
        >
            <style>{scrollbarStyles}</style>

            {/* Header + Navigation */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid var(--border-primary)",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                }}
            >
                <div
                    style={{
                        padding: "0.35rem 0.75rem",
                        background: "rgba(0, 255, 136, 0.15)",
                        border: "1px solid rgba(0, 255, 136, 0.3)",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#00ff88",
                        fontFamily: "var(--font-mono)",
                    }}
                >
                    REDO
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button
                        onClick={handleStepBackward}
                        disabled={currentStep <= 0}
                        style={{
                            padding: "0.4rem 0.75rem",
                            background: currentStep <= 0 ? "var(--bg-primary)" : "var(--bg-tertiary)",
                            color: currentStep <= 0 ? "var(--text-tertiary)" : "var(--text-primary)",
                            border: "1px solid var(--border-primary)",
                            borderRadius: "4px",
                            cursor: currentStep <= 0 ? "not-allowed" : "pointer",
                            fontSize: "1rem",
                            opacity: currentStep <= 0 ? 0.5 : 1,
                        }}
                    >
                        ‹
                    </button>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", minWidth: "55px", textAlign: "center", fontFamily: "var(--font-mono)" }}>
                        {currentStep + 1}/{STEPS.length}
                    </span>
                    <button
                        onClick={handleStepForward}
                        disabled={currentStep >= STEPS.length - 1}
                        style={{
                            padding: "0.4rem 0.75rem",
                            background: currentStep >= STEPS.length - 1 ? "var(--bg-primary)" : "var(--bg-tertiary)",
                            color: currentStep >= STEPS.length - 1 ? "var(--text-tertiary)" : "var(--text-primary)",
                            border: "1px solid var(--border-primary)",
                            borderRadius: "4px",
                            cursor: currentStep >= STEPS.length - 1 ? "not-allowed" : "pointer",
                            fontSize: "1rem",
                            opacity: currentStep >= STEPS.length - 1 ? 0.5 : 1,
                        }}
                    >
                        ›
                    </button>
                    <button
                        onClick={reset}
                        style={{
                            padding: "0.4rem 0.75rem",
                            background: "var(--bg-tertiary)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-primary)",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                        }}
                    >
                        ↺
                    </button>
                </div>
            </div>

            {/* Step description */}
            <div style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", background: "var(--bg-primary)", borderRadius: "6px", border: "1px solid var(--border-primary)", minHeight: "6.8rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ color: "#00ff88", fontWeight: 600, marginBottom: "0.25rem" }}>Step {currentStep + 1}:</div>
                <div style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>{currentStepData.title}</div>
            </div>

            {/* Log Timeline */}
            <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Update Records (scanning forward →)
                </div>
                <div
                    ref={scrollContainerRef}
                    className="aries-log-scroll"
                    style={{
                        display: "flex",
                        gap: "0.4rem",
                        overflowX: "auto",
                        padding: "1.25rem 0.75rem",
                        background: "var(--bg-primary)",
                        borderRadius: "6px",
                        border: "1px solid var(--border-primary)",
                    }}
                >
                    {LOG_RECORDS.map((record) => {
                        const isCurrentCheck = currentStepData.checkLSN === record.lsn;
                        const actionTaken = redoActions.find(a => a.lsn === record.lsn);

                        return (
                            <motion.div
                                key={record.lsn}
                                ref={(el) => { lsnRefs.current[record.lsn] = el; }}
                                animate={{
                                    scale: isCurrentCheck ? 1.05 : 1,
                                    borderColor: isCurrentCheck ? "#00ff88" : actionTaken?.action === "redo" ? "#00ff88" : actionTaken?.action === "skip" ? "var(--text-tertiary)" : "var(--border-primary)",
                                }}
                                style={{
                                    minWidth: "68px",
                                    padding: "0.5rem 0.4rem",
                                    borderRadius: "4px",
                                    border: "2px solid",
                                    fontFamily: "var(--font-mono)",
                                    textAlign: "center",
                                    background: isCurrentCheck ? "rgba(0, 255, 136, 0.1)" : actionTaken?.action === "skip" ? "rgba(100, 100, 100, 0.1)" : "var(--bg-secondary)",
                                    opacity: actionTaken?.action === "skip" ? 0.5 : 1,
                                    position: "relative",
                                    flexShrink: 0,
                                }}
                            >
                                {/* TX badge at top */}
                                <div style={{
                                    position: "absolute",
                                    top: "-10px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    background: "var(--text-tertiary)",
                                    color: "#000",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    fontSize: "0.65rem",
                                    fontWeight: 600,
                                }}>
                                    T{record.txnId}
                                </div>
                                {/* LSN number */}
                                <div style={{ fontWeight: 600, color: isCurrentCheck ? "#00ff88" : "var(--text-primary)", fontSize: "1.1rem", marginTop: "0.2rem" }}>
                                    {record.lsn}
                                </div>
                                {/* Page ID */}
                                <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", marginTop: "0.1rem" }}>
                                    {record.pageId}
                                </div>
                                {/* Value change */}
                                <div style={{ color: "var(--text-tertiary)", fontSize: "0.65rem" }}>
                                    {record.oldValue}→{record.newValue}
                                </div>
                                {/* Action badge */}
                                {actionTaken && (
                                    <div style={{
                                        position: "absolute",
                                        bottom: "-12px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: actionTaken.action === "redo" ? "#00ff88" : "var(--text-tertiary)",
                                        color: "#000",
                                        padding: "2px 8px",
                                        borderRadius: "3px",
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                    }}>
                                        {actionTaken.action === "redo" ? "REDO" : "skip"}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Disk Pages */}
            <div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Data Pages (on disk)
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                        gap: "0.75rem",
                        padding: "0.75rem",
                        background: "var(--bg-primary)",
                        borderRadius: "6px",
                        border: "1px solid var(--border-primary)",
                    }}
                >
                    {pages.map((page) => {
                        const isBeingUpdated = currentStepData.applyTo === page.pageId;
                        const wasUpdated = redoActions.some(a => a.action === "redo" && STEPS.find(s => s.checkLSN === a.lsn)?.applyTo === page.pageId);

                        return (
                            <motion.div
                                key={page.pageId}
                                animate={{
                                    scale: isBeingUpdated ? 1.03 : 1,
                                    borderColor: isBeingUpdated ? "#00ff88" : wasUpdated ? "rgba(0, 255, 136, 0.5)" : "var(--border-primary)",
                                }}
                                style={{
                                    padding: "1rem",
                                    background: isBeingUpdated ? "rgba(0, 255, 136, 0.1)" : "var(--bg-secondary)",
                                    borderRadius: "6px",
                                    border: "2px solid",
                                    textAlign: "center",
                                }}
                            >
                                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                                    {page.pageId}
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={page.value}
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", color: isBeingUpdated ? "#00ff88" : "var(--text-primary)", fontWeight: 600, margin: "0.3rem 0" }}
                                    >
                                        {page.value}
                                    </motion.div>
                                </AnimatePresence>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                                    pageLSN: {page.pageLSN}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
