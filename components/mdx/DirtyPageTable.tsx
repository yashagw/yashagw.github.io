"use client";

export default function DirtyPageTable() {
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
      <div
        style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "0.75rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        Dirty Page Table (DPT)
      </div>
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: "6px",
          border: "1px solid var(--border-primary)",
          overflow: "hidden",
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "var(--bg-tertiary)",
            borderBottom: "1px solid var(--border-primary)",
            padding: "0.75rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div>Page ID</div>
          <div>RecoveryLSN</div>
        </div>
        {/* Table Rows */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid var(--border-primary)",
            padding: "0.75rem",
            fontSize: "0.75rem",
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div>Page 1</div>
          <div>LSN 35</div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid var(--border-primary)",
            padding: "0.75rem",
            fontSize: "0.75rem",
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div>Page 3</div>
          <div>LSN 40</div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            padding: "0.75rem",
            fontSize: "0.75rem",
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div>Page 5</div>
          <div>LSN 45</div>
        </div>
      </div>
    </div>
  );
}
