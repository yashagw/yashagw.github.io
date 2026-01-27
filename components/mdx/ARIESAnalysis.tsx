"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LogRecord {
    lsn: number;
    type: "START" | "UPDATE" | "COMMIT" | "CHECKPOINT";
    txnId?: number;
    pageId?: string;
    oldValue?: number;
    newValue?: number;
}

interface TTEntry {
    txnId: number;
    status: "active" | "committed";
    lastLSN: number;
}

interface DPTEntry {
    pageId: string;
    recLSN: number;
}

// Scenario: 4 transactions, 2 commit (winners), 2 don't (losers)
const LOG_RECORDS: LogRecord[] = [
    { lsn: 1, type: "START", txnId: 100 },
    { lsn: 2, type: "UPDATE", txnId: 100, pageId: "P1", oldValue: 5, newValue: 10 },
    { lsn: 3, type: "START", txnId: 101 },
    { lsn: 4, type: "UPDATE", txnId: 101, pageId: "P2", oldValue: 20, newValue: 25 },
    { lsn: 5, type: "START", txnId: 102 },
    { lsn: 6, type: "UPDATE", txnId: 102, pageId: "P3", oldValue: 30, newValue: 35 },
    { lsn: 7, type: "COMMIT", txnId: 100 },
    { lsn: 8, type: "CHECKPOINT" },
    { lsn: 9, type: "START", txnId: 103 },
    { lsn: 10, type: "UPDATE", txnId: 103, pageId: "P4", oldValue: 40, newValue: 45 },
    { lsn: 11, type: "UPDATE", txnId: 101, pageId: "P1", oldValue: 10, newValue: 15 },
    { lsn: 12, type: "COMMIT", txnId: 102 },
    { lsn: 13, type: "UPDATE", txnId: 103, pageId: "P2", oldValue: 25, newValue: 30 },
];

const CHECKPOINT_TT: TTEntry[] = [
    { txnId: 101, status: "active", lastLSN: 4 },
    { txnId: 102, status: "active", lastLSN: 6 },
];

const CHECKPOINT_DPT: DPTEntry[] = [
    { pageId: "P1", recLSN: 2 },
    { pageId: "P2", recLSN: 4 },
    { pageId: "P3", recLSN: 6 },
];

const STEPS = [
    { step: 0, title: "System crashed after LSN 13. Start recovery by finding the last checkpoint.", scrollToLSN: 8 },
    { step: 1, title: "Found CHECKPOINT at LSN 8. Restore Transaction Table and Dirty Page Table from checkpoint.", highlightLSN: 8, restoreCheckpoint: true, scrollToLSN: 8 },
    { step: 2, title: "Scan LSN 9: T103 starts. Add T103 to Transaction Table.", highlightLSN: 9, scanLSN: 9, scrollToLSN: 9 },
    { step: 3, title: "Scan LSN 10: T103 updates P4 (40→45). Add P4 to Dirty Page Table.", highlightLSN: 10, scanLSN: 10, scrollToLSN: 10 },
    { step: 4, title: "Scan LSN 11: T101 updates P1 (10→15). P1 already in DPT, keep existing recLSN.", highlightLSN: 11, scanLSN: 11, scrollToLSN: 11 },
    { step: 5, title: "Scan LSN 12: T102 commits. Mark T102 as Winner.", highlightLSN: 12, scanLSN: 12, scrollToLSN: 12 },
    { step: 6, title: "Scan LSN 13: T103 updates P2 (25→30). P2 already in DPT, keep existing recLSN.", highlightLSN: 13, scanLSN: 13, scrollToLSN: 13 },
    { step: 7, title: "Analysis complete! Found 2 Losers (T101, T103). RedoLSN = 2 (smallest recLSN).", complete: true, scrollToLSN: 8 },
];

function getLogTypeLabel(record: LogRecord): string {
    if (record.type === "START") return "START";
    if (record.type === "COMMIT") return "CMT";
    if (record.type === "CHECKPOINT") return "CKPT";
    if (record.type === "UPDATE") return record.pageId || "UPD";
    return record.type;
}

// Custom scrollbar styles
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

export default function ARIESAnalysis() {
    const [currentStep, setCurrentStep] = useState(0);
    const [tt, setTT] = useState<TTEntry[]>([]);
    const [dpt, setDPT] = useState<DPTEntry[]>([]);
    const [scanPosition, setScanPosition] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const lsnRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Auto-scroll to the relevant LSN
    useEffect(() => {
        const scrollToLSN = STEPS[currentStep].scrollToLSN;
        if (scrollToLSN && scrollContainerRef.current && lsnRefs.current[scrollToLSN]) {
            const container = scrollContainerRef.current;
            const element = lsnRefs.current[scrollToLSN];
            if (element) {
                const containerRect = container.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                const scrollLeft = element.offsetLeft - container.offsetWidth / 2 + element.offsetWidth / 2;
                container.scrollTo({ left: scrollLeft, behavior: "smooth" });
            }
        }
    }, [currentStep]);

    useEffect(() => {
        if (currentStep === 0) {
            setTT([]);
            setDPT([]);
            setScanPosition(null);
            return;
        }

        let newTT: TTEntry[] = [];
        let newDPT: DPTEntry[] = [];
        let scan: number | null = null;

        for (let i = 1; i <= currentStep; i++) {
            const step = STEPS[i];

            if (step.restoreCheckpoint) {
                newTT = [...CHECKPOINT_TT];
                newDPT = [...CHECKPOINT_DPT];
                scan = 8;
            }

            if (step.scanLSN) {
                scan = step.scanLSN;
                const record = LOG_RECORDS.find(r => r.lsn === step.scanLSN);

                if (record?.type === "START" && record.txnId) {
                    if (!newTT.find(e => e.txnId === record.txnId)) {
                        newTT = [...newTT, { txnId: record.txnId, status: "active", lastLSN: record.lsn }];
                    }
                }

                if (record?.type === "UPDATE" && record.txnId) {
                    const ttIdx = newTT.findIndex(e => e.txnId === record.txnId);
                    if (ttIdx >= 0) {
                        newTT = [...newTT];
                        newTT[ttIdx] = { ...newTT[ttIdx], lastLSN: record.lsn };
                    }
                    if (record.pageId && !newDPT.find(e => e.pageId === record.pageId)) {
                        newDPT = [...newDPT, { pageId: record.pageId, recLSN: record.lsn }];
                    }
                }

                if (record?.type === "COMMIT" && record.txnId) {
                    const ttIdx = newTT.findIndex(e => e.txnId === record.txnId);
                    if (ttIdx >= 0) {
                        newTT = [...newTT];
                        newTT[ttIdx] = { ...newTT[ttIdx], status: "committed", lastLSN: record.lsn };
                    }
                }
            }
        }

        setTT(newTT);
        setDPT(newDPT);
        setScanPosition(scan);
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
    const isComplete = currentStep >= 7;
    const redoLSN = isComplete && dpt.length > 0 ? Math.min(...dpt.map(e => e.recLSN)) : null;

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
                        background: "rgba(0, 212, 255, 0.15)",
                        border: "1px solid rgba(0, 212, 255, 0.3)",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#00d4ff",
                        fontFamily: "var(--font-mono)",
                    }}
                >
                    ANALYSIS
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
                <div style={{ color: "#00d4ff", fontWeight: 600, marginBottom: "0.25rem" }}>Step {currentStep + 1}:</div>
                <div style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>{currentStepData.title}</div>
            </div>

            {/* Log Timeline */}
            <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Log Records (scanning forward →)
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
                        const isHighlighted = currentStepData.highlightLSN === record.lsn;
                        const isScanned = scanPosition !== null && record.lsn <= scanPosition && record.lsn >= 8;
                        const isCheckpoint = record.type === "CHECKPOINT";
                        const isCrash = record.lsn === 13;
                        const hasTxn = record.txnId !== undefined;

                        return (
                            <motion.div
                                key={record.lsn}
                                ref={(el) => { lsnRefs.current[record.lsn] = el; }}
                                animate={{
                                    scale: isHighlighted ? 1.05 : 1,
                                    borderColor: isHighlighted ? "#00d4ff" : isCheckpoint ? "#fbbf24" : isScanned ? "rgba(0, 212, 255, 0.4)" : "var(--border-primary)",
                                }}
                                style={{
                                    minWidth: "68px",
                                    padding: "0.5rem 0.4rem",
                                    borderRadius: "4px",
                                    border: "2px solid",
                                    fontFamily: "var(--font-mono)",
                                    textAlign: "center",
                                    background: isHighlighted ? "rgba(0, 212, 255, 0.1)" : isScanned ? "rgba(0, 212, 255, 0.03)" : "var(--bg-secondary)",
                                    position: "relative",
                                    flexShrink: 0,
                                }}
                            >
                                {/* TX badge at top */}
                                {hasTxn && (
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
                                )}
                                {isCheckpoint && (
                                    <div style={{
                                        position: "absolute",
                                        top: "-10px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: "#fbbf24",
                                        color: "#000",
                                        padding: "2px 6px",
                                        borderRadius: "3px",
                                        fontSize: "0.65rem",
                                        fontWeight: 600,
                                    }}>
                                        CKPT
                                    </div>
                                )}
                                {/* LSN number */}
                                <div style={{ fontWeight: 600, color: isHighlighted ? "#00d4ff" : "var(--text-primary)", fontSize: "1.1rem", marginTop: hasTxn || isCheckpoint ? "0.2rem" : 0 }}>
                                    {record.lsn}
                                </div>
                                {/* Log type */}
                                <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", marginTop: "0.1rem" }}>
                                    {getLogTypeLabel(record)}
                                </div>
                                {/* Value change for UPDATE */}
                                {record.type === "UPDATE" && (
                                    <div style={{ color: "var(--text-tertiary)", fontSize: "0.65rem" }}>
                                        {record.oldValue}→{record.newValue}
                                    </div>
                                )}
                                {isCrash && <div style={{ position: "absolute", top: "-10px", right: "-8px", fontSize: "1rem" }}>💥</div>}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* TT and DPT */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem" }}>
                {/* Transaction Table */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Transaction Table
                    </div>
                    <div
                        style={{
                            padding: "0.75rem",
                            background: "var(--bg-primary)",
                            borderRadius: "6px",
                            border: "1px solid var(--border-primary)",
                            minHeight: "14rem",
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: tt.length === 0 ? "center" : "flex-start",
                        }}
                    >
                        <AnimatePresence>
                            {tt.length === 0 ? (
                                <div style={{ color: "var(--text-tertiary)", fontSize: "0.9rem", textAlign: "center" }}>(empty — waiting for checkpoint)</div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    {tt.map((entry) => {
                                        const isLoser = isComplete && entry.status === "active";
                                        return (
                                            <motion.div
                                                key={entry.txnId}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    fontSize: "0.9rem",
                                                    fontFamily: "var(--font-mono)",
                                                    padding: "0.5rem 0.75rem",
                                                    background: isLoser ? "rgba(239, 68, 68, 0.1)" : "var(--bg-secondary)",
                                                    borderRadius: "4px",
                                                    border: entry.status === "committed" ? "1px solid rgba(34, 197, 94, 0.3)" : isLoser ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid transparent",
                                                }}
                                            >
                                                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>T{entry.txnId}</span>
                                                <span style={{ color: entry.status === "committed" ? "#22c55e" : isLoser ? "#ef4444" : "#fbbf24", fontWeight: 500 }}>
                                                    {entry.status === "committed" ? "✓ Winner" : isLoser ? "✗ Loser" : "active"} <span style={{ color: "var(--text-tertiary)", fontSize: "0.8rem" }}>(LSN {entry.lastLSN})</span>
                                                </span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Dirty Page Table */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Dirty Page Table
                    </div>
                    <div
                        style={{
                            padding: "0.75rem",
                            background: "var(--bg-primary)",
                            borderRadius: "6px",
                            border: "1px solid var(--border-primary)",
                            minHeight: "11rem",
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: dpt.length === 0 ? "center" : "flex-start",
                        }}
                    >
                        <AnimatePresence>
                            {dpt.length === 0 ? (
                                <div style={{ color: "var(--text-tertiary)", fontSize: "0.9rem", textAlign: "center" }}>(empty — waiting for checkpoint)</div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    {dpt.map((entry) => {
                                        const isRedoStart = redoLSN !== null && entry.recLSN === redoLSN;
                                        return (
                                            <motion.div
                                                key={entry.pageId}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    fontSize: "0.9rem",
                                                    fontFamily: "var(--font-mono)",
                                                    padding: "0.5rem 0.75rem",
                                                    background: isRedoStart ? "rgba(0, 255, 136, 0.1)" : "var(--bg-secondary)",
                                                    borderRadius: "4px",
                                                    border: isRedoStart ? "1px solid rgba(0, 255, 136, 0.3)" : "1px solid transparent",
                                                }}
                                            >
                                                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{entry.pageId}</span>
                                                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    {isRedoStart && (
                                                        <span style={{ color: "#00ff88", fontSize: "0.75rem", fontWeight: 600 }}>← RedoLSN</span>
                                                    )}
                                                    <span style={{ color: isRedoStart ? "#00ff88" : "var(--text-secondary)" }}>recLSN: {entry.recLSN}</span>
                                                </span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

        </div>
    );
}
