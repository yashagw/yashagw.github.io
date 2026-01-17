+++
title = "Database Recovery Demystified: Understanding ARIES from First Principles"
date = 2026-01-16
hidden = true
tags = ["databases", "recovery", "aries"]
+++

Databases are trusted systems. When an application writes data and receives a success response, it assumes that data persists-even if the process crashes, the machine reboots, or power fails.

Ensuring this guarantee is the responsibility of the recovery subsystem.

Recovery is not an optional feature. It is fundamental to database correctness, tightly coupled with storage, buffering, and transaction execution. To understand recovery, we must first understand how data is stored and modified.

---

## A Minimal Database Model

We start with a simple, realistic database model.

<DatabaseModel />

### Data Pages on Disk

- The database stores data on disk in fixed-size units called **data pages**.
- A page is the smallest unit of disk I/O.
- Pages reside on stable storage.

### The Buffer Pool

The database does not operate on disk pages directly. It uses **buffers**.

- A buffer is a fixed-size memory region holding one data page.
- All reads and writes occur through buffers.
- The disk page remains unchanged until the buffer is explicitly written back.
- The buffer pool has limited capacity-it can only hold a few pages at once.

To modify data:

1. The page is **loaded** from disk into a buffer.
2. The database updates the buffered copy.
3. The buffer is eventually **flushed** back to disk.

The diagram above shows Page 2 currently loaded into a buffer for processing.

> **For simplicity:** We assume each data page holds exactly one row. Updating a row and updating a page are effectively the same operation.

### Naive Design: Synchronous Writes

In our initial design, an update proceeds as follows:

1. Receive the client request.
2. Load the page into a buffer.
3. Update the page in memory.
4. **Write the buffer back to disk immediately.**
5. Report success to the client.

From the client’s perspective, data is durable once step 5 completes. If the system fails before step 5, the disk remains unchanged, and the update is simply lost (which is acceptable since success was never reported).

While correct, this design is impractical.

<SynchronousWrites />

### Why This Design Fails

Forcing a disk write for every update kills performance.

**Disk I/O is Expensive**
Memory operations take nanoseconds; disk writes take milliseconds. If every transaction waits for a physical disk write, latency becomes unacceptable.

**I/O Serializes Execution**
Even with many CPU cores and concurrent transactions, throughput is limited by the disk's write capacity. Transactions queue behind I/O operations, wasting CPU resources.

**No Batching**
Synchronous writes are small and random. Disks perform best with large, sequential writes. Writing one page at a time prevents the IO subsystem from grouping updates efficiently.

---

## Optimizing Performance: Deferred Writes

To solve performance issues, we make a critical design decision: **The database reports success before writing modified pages to disk.**

- Transactions modify pages in memory buffers.
- Once the memory update is complete, the database returns success.
- A background process periodically flushes dirty buffers to disk.

This decouples transaction execution from disk mechanics, enabling high throughput and batched I/O. However, it introduces a major risk.

### What Breaks: Crash Consistency

With deferred writes, "success" no longer implies "on disk."

#### Scenario 1: Durability Violation

Consider a page where `A = 3`.

With deferred writes, the database can acknowledge a transaction even though the updated page is still only in memory.

1. Client sends `UPDATE SET A = 4`.
2. The database updates the **buffer** to `A = 4` (disk is unchanged).
3. The database replies **SUCCESS** to the client.
4. **System crashes** before the background flush writes the dirty page to disk.

<DurabilityViolation />

After restart, memory is gone, and the disk still reads `A = 3`.

The client was told “success” for `A = 4`, but the database state that survived the crash is still `A = 3` - that’s the durability violation.

#### Scenario 2: Atomicity Violation

A tempting reaction is: “fine - at commit time, give up deferred writes and just *force* the modified pages to disk before replying success.”

That would address the durability problem, but once a transaction touches *multiple* pages, forcing page flushes introduces a new failure mode: a crash can land you in the middle of those flushes, leaving a partial transaction on disk.

1. Transaction updates `P1` (buffer).
2. Transaction updates `P2` (buffer).
3. Database writes `P1` to disk.
4. **System crashes before writing `P2`** (the client is still waiting for the commit to finish).

<AtomicityViolation />

What’s wrong here? After restart, the disk reflects a *partial* transaction: `P1` is modified, but `P2` is not. The database state is no longer “all-or-nothing” - atomicity is violated.

#### The Constraint

We need a system that satisfies three conflicting goals:

1. **Performance**: Return success without waiting for random page writes.
2. **Durability**: Never lose a committed update.
3. **Atomicity**: Apply all updates of a transaction or none.

Modifying data pages directly cannot solve this. We need a separate structure.
Before we introduce it, we need language for the two buffer-manager freedoms that created these failure modes: **Steal** and **Force**.

---

## Formalizing the Tradeoffs: Steal and Force

The crash scenarios above stem from two independent design decisions about when dirty pages can be written to disk. These are the **Steal** and **Force** policies.

### Steal Policy

**Can the database write a dirty page to disk before its transaction commits?**

- **Steal**: Yes. The buffer manager can evict any dirty page at any time, even if the transaction is still running.
- **No-Steal**: No. Dirty pages are pinned in memory until commit.

Steal is essential for large transactions. Without it, a transaction modifying thousands of pages would need to hold all of them in memory simultaneously. With Steal, the buffer manager has freedom to reclaim memory.

The cost: if we crash, the disk may contain changes from uncommitted transactions. We need a way to **Undo** them.

### Force Policy

**Must all dirty pages be written to disk before a transaction commits?**

- **Force**: Yes. At commit time, every modified page is flushed to disk.
- **No-Force**: No. Pages can remain dirty in memory after commit.

No-Force is essential for performance. It avoids the synchronous, random I/O we discussed earlier. The database can batch writes and flush pages lazily.

The cost: if we crash, committed updates may not be on disk. We need a way to **Redo** them.

### The Optimal Choice

The table below shows the four possible combinations:

<table>
  <thead>
    <tr>
      <th></th>
      <th>No-Steal</th>
      <th>Steal</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Force</strong></td>
      <td>Simplest. No recovery needed.</td>
      <td>Undo required.</td>
    </tr>
    <tr>
      <td><strong>No-Force</strong></td>
      <td>Redo required.</td>
      <td>Both Undo and Redo.</td>
    </tr>
  </tbody>
</table>

**Force + No-Steal** requires no recovery logic-but it is unusably slow and memory-bound.

Real databases choose **Steal + No-Force** for performance. This combination demands a recovery system capable of both Undo and Redo. The mechanism that enables this is the write-ahead log.

---

## Write-Ahead Logging (WAL)

The solution is to separate **recording intent** from **applying changes**.

We introduce an **append-only log** on disk. This log records every change made to the database.

Log records typically track:

- **Transaction ID**: Which transaction made the change.
- **Type**: `START`, `UPDATE`, `COMMIT`, or `ABORT`.
- **Change**: The page ID, old value (Undo), and new value (Redo).

### The Golden Rule of WAL

**Before a data page is written to disk, the log record describing that change must be persisted.**

Crucially, **before returning success for a transaction, its COMMIT log record must be flushed to disk.**

Since the log is append-only, flushing the commit record is a fast, sequential operation. It automatically flushes all preceding records for that transaction.

### WAL in Action

Let’s revisit `UPDATE Page1 SET A = 4` (initial `A=3`).

We start with Page1 on disk containing `A = 3`, an empty buffer pool, and no active transaction. The database loads Page1 into a buffer-both now show `A = 3`.

Transaction 100 begins. We write `[START Txn 100]` to the log buffer, then update the Page1 buffer: `A = 3 → 4`. The page is marked dirty (this change exists only in memory). Before this dirty page could be written to disk, we must log the change: `[UPDATE Txn 100, Page1, 3->4]` goes to the log buffer, capturing both old value (for undo) and new value (for redo).

The transaction commits. We write `[COMMIT Txn 100]` to the log buffer, then flush the entire log buffer to disk in a single sequential write. All three records (START, UPDATE, COMMIT) are now on stable storage. We acknowledge success to the client. **Crucially, Page1 is still only in the buffer pool-not yet on disk.**

Later, a background process writes the dirty Page1 to disk. By this point, the log already contains a complete record of the change, protecting against crashes.

<WALVisualization />

**The key insight:** When we acknowledge success at commit time, the data page isn't on disk yet. But the log-the history of what happened-is safely persisted. If a crash occurs before the page writeback, we can reconstruct the page state from the log during recovery.

### The Log Sequence Number (LSN)

To link the log and data pages, we assign a unique, monotonically increasing **Log Sequence Number (LSN)** to every log record.

We stamp every data page with a `pageLSN`.

- **pageLSN**: The LSN of the most recent log record that modified this page.

This creates a version check:

- If `pageLSN >= logRecordLSN`, the page **contains** the update.
- If `pageLSN < logRecordLSN`, the page is **stale** compared to the log.

### Handling Crashes with WAL

WAL solves the failure scenarios we defined earlier.

**Scenario 1: Crash after Commit, before Page Write**
_(Revisiting our example where `A` was updated from 3 to 4)_

- The **Log** on disk contains the `UPDATE (3 -> 4)` and `COMMIT` records.
- The **Disk Page** still contains the old value `A = 3`.

During recovery, the database sees the `COMMIT`, notices the page version (`pageLSN`) is old, and **Redoes** the update to ensure `A = 4`. The committed change is preserved.

**Scenario 2: Crash after Page Write, Transaction Aborts**

- The **Disk Page** contains the uncommitted value `A = 4`.
- The **Log** contains the `UPDATE` record but **no** `COMMIT`.

During recovery, the database sees an active transaction that never completed. It uses the old value from the log (`3`) to **Undo** the change, restoring `A = 3`. The uncommitted change is rolled back.

---

## The Cost of Correctness: Recovery Speed

WAL guarantees data safety, but using _only_ the log creates a performance nightmare.

If the database runs for months, the log grows indefinitely. To recover after a crash, we would have to scan the log **from the beginning of time**, replaying millions of updates that were likely already written to disk.

To make recovery fast, we cannot start from zero. We need a way to know the state of the system _at the moment of the crash_:

1. **Which transactions were active?** (So we only undo the losers).
2. **Which pages were dirty?** (So we only redo the missing updates).

### Tracking State in Memory

We solve this by maintaining two in-memory tables:

**Transaction Table (TT)**: Tracks all active transactions. Each entry records the **LastLSN**: the LSN of the most recent log record written by that transaction. This tells us where to start scanning backward during Undo to reverse all changes made by an uncommitted transaction.

<TransactionTable />

**Dirty Page Table (DPT)**: Tracks all modified pages not yet written to disk. Each entry records the **RecoveryLSN**: the LSN of the _first_ change that made the page dirty. This tells us exactly where in the log we need to start "Redo" for that page. If a page is dirty, it means it might contain updates that were never flushed to disk before the crash.

<DirtyPageTable />

### Checkpoints

Since these tables live in volatile memory, we periodically save them to the log. This is a **Checkpoint**.

A checkpoint acts as a shortcut. During recovery, instead of scanning the whole log, the database reads the latest checkpoint to reconstruct the TT and DPT. It then scans forward only from that point.

Checkpoints are purely an optimization for speed. If a checkpoint is corrupted, we just go back to an earlier one.

---

## ARIES Recovery Algorithm

ARIES (Algorithm for Recovery and Isolation Exploiting Semantics) unifies these concepts into a three-phase recovery process.

### Phase 1: Analysis

**Goal:** Rebuild the in-memory state as it existed at the time of the crash.

The analysis phase determines **what to do** by scanning the log from the last checkpoint to the end.

- It identifies **"Loser"** transactions: those that were active at the crash but never committed. These must be undone.
- It identifies **Dirty Pages**: pages that might contain updates that were not flushed to disk.
- It calculates the **RedoLSN**. By looking at the Dirty Page Table, it finds the **smallest RecoveryLSN** among all dirty pages. This represents the oldest update in the entire system that _might_ not have been written to disk. The Redo phase will start scanning from this exact point to ensure no missing updates are skipped.

### Phase 2: Redo

**Goal:** Repeat history to restore the database to the exact state at the moment of the crash.

The Redo phase re-applies **all** updates-even those from "Loser" transactions. It scans the log forward starting from the RedoLSN.

For every update record, it checks the page on disk:

- If `pageLSN >= logRecordLSN`: The page already contains this update. **Skip it.**
- If `pageLSN < logRecordLSN`: The page is stale. **Re-apply the update.**

Crucially, Redo doesn't care if a transaction committed or not. Its only job is to ensure the database state matches the log.

### Phase 3: Undo

**Goal:** Reverse the effects of uncommitted transactions.

Now that the database state is restored, we must remove the changes made by "Loser" transactions.

- The Undo phase scans the log **backward** from the end.
- For every update belonging to a Loser transaction, it applies the "old value" to reverse the change.
- Unlike a simple rollback, ARIES logs these undo operations as **Compensation Log Records (CLRs)**. This ensures that if the system crashes _during_ recovery, we don't end up undoing the same operation twice.

Once Undo is complete, the database is consistent. Committed data is durable; uncommitted data is erased.
