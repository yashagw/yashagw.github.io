"use client";

export default function TransactionTable() {
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
        Transaction Table (TT)
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
          <div>Transaction ID</div>
          <div>LastLSN</div>
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
          <div>Txn 100</div>
          <div>LSN 42</div>
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
          <div>Txn 101</div>
          <div>LSN 45</div>
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
          <div>Txn 102</div>
          <div>LSN 48</div>
        </div>
      </div>
    </div>
  );
}
