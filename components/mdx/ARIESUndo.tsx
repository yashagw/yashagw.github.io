"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PageState {
    pageId: string;
    value: number;
    pageLSN: number;
}

interface CLR {
    lsn: number;
    pageId: string;
    undoesLSN: number;
}

interface LoserUpdate {
    lsn: number;
    txnId: number;
    pageId: string;
    oldValue: number;
    newValue: number;
}

const INITIAL_PAGES: PageState[] = [
    { pageId: "P1", value: 15, pageLSN: 11 },
    { pageId: "P2", value: 30, pageLSN: 13 },
    { pageId: "P3", value: 35, pageLSN: 6 },
    { pageId: "P4", value: 45, pageLSN: 10 },
];

const LOSER_UPDATES: LoserUpdate[] = [
    { lsn: 13, txnId: 103, pageId: "P2", oldValue: 25, newValue: 30 },
    { lsn: 11, txnId: 101, pageId: "P1", oldValue: 10, newValue: 15 },
    { lsn: 10, txnId: 103, pageId: "P4", oldValue: 40, newValue: 45 },
    { lsn: 4, txnId: 101, pageId: "P2", oldValue: 20, newValue: 25 },
];

const STEPS = [
    { step: 0, title: "Losers: T101 and T103. Undo their changes backward, writing CLRs for each.", scrollToLSN: 13 },
    { step: 1, title: "Undo LSN 13: T103 → P2. Revert 30→25. Write CLR 14.", undoLSN: 13, revertPage: "P2", revertTo: 25, clr: { lsn: 14, pageId: "P2", undoesLSN: 13 }, scrollToLSN: 13 },
    { step: 2, title: "Undo LSN 11: T101 → P1. Revert 15→10. Write CLR 15.", undoLSN: 11, revertPage: "P1", revertTo: 10, clr: { lsn: 15, pageId: "P1", undoesLSN: 11 }, scrollToLSN: 11 },
    { step: 3, title: "Undo LSN 10: T103 → P4. Revert 45→40. Write CLR 16.", undoLSN: 10, revertPage: "P4", revertTo: 40, clr: { lsn: 16, pageId: "P4", undoesLSN: 10 }, scrollToLSN: 10 },
    { step: 4, title: "Undo LSN 4: T101 → P2. Revert 25→20. Write CLR 17.", undoLSN: 4, revertPage: "P2", revertTo: 20, clr: { lsn: 17, pageId: "P2", undoesLSN: 4 }, scrollToLSN: 4 },
    { step: 5, title: "Undo complete! All uncommitted changes erased. Database is now consistent.", complete: true, scrollToLSN: 4 },
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

export default function ARIESUndo() {
    const [currentStep, setCurrentStep] = useState(0);
    const [pages, setPages] = useState<PageState[]>(INITIAL_PAGES);
    const [clrs, setCLRs] = useState<CLR[]>([]);
    const [undoneUpdates, setUndoneUpdates] = useState<number[]>([]);
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
        const newCLRs: CLR[] = [];
        const undone: number[] = [];

        for (let i = 1; i <= currentStep; i++) {
            const step = STEPS[i];
            if (step.revertPage && step.revertTo !== undefined) {
                newPages = newPages.map(p =>
                    p.pageId === step.revertPage ? { ...p, value: step.revertTo!, pageLSN: step.clr?.lsn || p.pageLSN } : p
                );
            }
            if (step.clr) newCLRs.push(step.clr);
            if (step.undoLSN) undone.push(step.undoLSN);
        }

        setPages(newPages);
        setCLRs(newCLRs);
        setUndoneUpdates(undone);
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

    const getPageStatus = (pageId: string) => {
        const loserPages = ["P1", "P2", "P4"];
        if (!loserPages.includes(pageId)) return "clean";

        const relevantUndos = LOSER_UPDATES.filter(u => u.pageId === pageId);
        const allUndone = relevantUndos.every(u => undoneUpdates.includes(u.lsn));
        return allUndone ? "restored" : "uncommitted";
    };

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
                        background: "rgba(255, 136, 68, 0.15)",
                        border: "1px solid rgba(255, 136, 68, 0.3)",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#ff8844",
                        fontFamily: "var(--font-mono)",
                    }}
                >
                    UNDO
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
            <div style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", background: "var(--bg-primary)", borderRadius: "6px", border: "1px solid var(--border-primary)" }}>
                <span style={{ color: "#ff8844", fontWeight: 600 }}>Step {currentStep + 1}:</span>{" "}
                <span style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>{currentStepData.title}</span>
            </div>

            {/* Loser Updates + CLRs */}
            <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Loser Updates (← scanning backward) → CLRs Generated
                </div>
                <div
                    ref={scrollContainerRef}
                    className="aries-log-scroll"
                    style={{
                        display: "flex",
                        gap: "0.4rem",
                        alignItems: "center",
                        overflowX: "auto",
                        padding: "0.75rem",
                        background: "var(--bg-primary)",
                        borderRadius: "6px",
                        border: "1px solid var(--border-primary)",
                    }}
                >
                    {LOSER_UPDATES.map((update) => {
                        const isCurrentUndo = currentStepData.undoLSN === update.lsn;
                        const isUndone = undoneUpdates.includes(update.lsn);

                        return (
                            <motion.div
                                key={update.lsn}
                                ref={(el) => { lsnRefs.current[update.lsn] = el; }}
                                animate={{
                                    scale: isCurrentUndo ? 1.05 : 1,
                                    borderColor: isCurrentUndo ? "#ff8844" : isUndone ? "var(--text-tertiary)" : "#ef4444",
                                    opacity: isUndone && !isCurrentUndo ? 0.4 : 1,
                                }}
                                style={{
                                    minWidth: "68px",
                                    padding: "0.5rem 0.4rem",
                                    borderRadius: "4px",
                                    border: "2px solid",
                                    fontFamily: "var(--font-mono)",
                                    textAlign: "center",
                                    background: isCurrentUndo ? "rgba(255, 136, 68, 0.1)" : "var(--bg-secondary)",
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
                                    background: "#ef4444",
                                    color: "#fff",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    fontSize: "0.65rem",
                                    fontWeight: 600,
                                }}>
                                    T{update.txnId}
                                </div>
                                {/* LSN number */}
                                <div style={{ fontWeight: 600, marginTop: "0.2rem", color: isCurrentUndo ? "#ff8844" : "var(--text-primary)", fontSize: "1.1rem" }}>
                                    {update.lsn}
                                </div>
                                {/* Page ID */}
                                <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", marginTop: "0.1rem" }}>
                                    {update.pageId}
                                </div>
                                {/* Value change */}
                                <div style={{ color: "var(--text-tertiary)", fontSize: "0.65rem" }}>
                                    {update.oldValue}→{update.newValue}
                                </div>
                                {/* UNDONE badge */}
                                {isUndone && (
                                    <div style={{
                                        position: "absolute",
                                        bottom: "-12px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: "#ff8844",
                                        color: "#000",
                                        padding: "2px 8px",
                                        borderRadius: "3px",
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                    }}>
                                        UNDONE
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}

                    <div style={{ color: "var(--text-tertiary)", fontSize: "1.5rem", padding: "0 0.5rem", flexShrink: 0 }}>→</div>

                    {/* CLRs */}
                    <AnimatePresence>
                        {clrs.map((clr) => (
                            <motion.div
                                key={clr.lsn}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    minWidth: "68px",
                                    padding: "0.5rem 0.4rem",
                                    borderRadius: "4px",
                                    border: "2px solid rgba(34, 197, 94, 0.5)",
                                    fontFamily: "var(--font-mono)",
                                    textAlign: "center",
                                    background: "rgba(34, 197, 94, 0.05)",
                                    position: "relative",
                                    flexShrink: 0,
                                }}
                            >
                                {/* CLR badge at top */}
                                <div style={{
                                    position: "absolute",
                                    top: "-10px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    background: "#22c55e",
                                    color: "#000",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    fontSize: "0.65rem",
                                    fontWeight: 600,
                                }}>
                                    CLR
                                </div>
                                {/* LSN number */}
                                <div style={{ fontWeight: 600, marginTop: "0.2rem", color: "#22c55e", fontSize: "1.1rem" }}>
                                    {clr.lsn}
                                </div>
                                {/* Page ID */}
                                <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", marginTop: "0.1rem" }}>
                                    {clr.pageId}
                                </div>
                                {/* Undoes which LSN */}
                                <div style={{ color: "var(--text-tertiary)", fontSize: "0.65rem" }}>
                                    undo {clr.undoesLSN}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {clrs.length === 0 && (
                        <div style={{ minWidth: "68px", padding: "0.5rem 0.4rem", borderRadius: "4px", border: "2px dashed var(--border-primary)", color: "var(--text-tertiary)", fontSize: "0.85rem", textAlign: "center", flexShrink: 0 }}>
                            CLRs
                        </div>
                    )}
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
                        const isBeingReverted = currentStepData.revertPage === page.pageId;
                        const status = getPageStatus(page.pageId);

                        return (
                            <motion.div
                                key={page.pageId}
                                animate={{
                                    scale: isBeingReverted ? 1.03 : 1,
                                    borderColor: isBeingReverted ? "#ff8844" : status === "restored" ? "#22c55e" : status === "uncommitted" ? "rgba(239, 68, 68, 0.5)" : "var(--border-primary)",
                                }}
                                style={{
                                    padding: "1rem",
                                    background: isBeingReverted ? "rgba(255, 136, 68, 0.1)" : status === "restored" ? "rgba(34, 197, 94, 0.05)" : status === "uncommitted" ? "rgba(239, 68, 68, 0.05)" : "var(--bg-secondary)",
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
                                        style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", color: isBeingReverted ? "#ff8844" : status === "restored" ? "#22c55e" : "var(--text-primary)", fontWeight: 600, margin: "0.3rem 0" }}
                                    >
                                        {page.value}
                                    </motion.div>
                                </AnimatePresence>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                                    {status === "restored" ? "✓ restored" : status === "uncommitted" ? "⚠ uncommitted" : ""}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
