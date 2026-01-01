+++
title = "Replication in Distributed Systems: Notes from DDIA"
date = 2026-01-01
taxonomies = { tags = ["Design Data Intensive Applications"] }
+++

I've been reading through "Designing Data-Intensive Applications" and taking notes on replication. It's one of those topics that seems simple at first but gets really interesting once you dig into the trade-offs. Here's what I've learned.

At its core, replication is about keeping copies of the same data on multiple machines connected over a network. But the devil's in the details - there are several ways to do this, each with their own pros and cons.

---

## Single Leader Model

This is probably the most common approach. You have one node designated as the **leader** (or primary), and all write operations go to it. The **followers** (or replicas) just copy data from the leader. Reads can come from either the leader or followers, which is nice for scaling read-heavy workloads.

The obvious downside? If you can't connect to the leader, you can't write to the database. That's a single point of failure for writes.

### Replication Modes

There are two main ways to replicate: synchronous and asynchronous. The choice here is all about the trade-off between durability and performance.

**Synchronous replication** means the leader waits for the follower to confirm before telling the client "okay, done!". The follower always has an up-to-date copy, and if the leader fails, your data is safe on the follower.

The catch is that if your synchronous follower is slow or goes down, your writes get blocked. A single follower failure can stall the whole system. That's why most systems use synchronous replication for just one follower (or maybe two), not all of them.

**Asynchronous replication** is the opposite - the leader says "got it!" immediately and copies to followers in the background. This means the leader can keep chugging along even if followers are lagging or failing. It works really well when you have many followers or they're spread across different regions.

The downside? Followers can lag behind, and if the leader crashes before replicating, those confirmed writes might be lost. You told the client it worked, but if the leader's data is lost (e.g., disk failure), those writes are gone even though they were confirmed.

### Setting up New Followers

When you need to add a new follower, you can't just copy the database while it's running - that would be inconsistent. Instead, you take a **snapshot** of the leader's data at a point in time, copy that over, then fetch and apply all the changes that happened since the snapshot. Once it's caught up, it can start replicating in real time.

### Node Outages

What happens when a node goes down?

**Follower failure** is relatively easy to handle. The follower knows exactly where it left off (via a timestamp or offset), so when it comes back, it just asks the leader for everything that happened since then and catches up.

**Leader failure** is where it gets messy. This is where **failover** comes in - you need to promote a follower to become the new leader. Sounds simple, but it's actually one of the trickiest parts of distributed systems.

With automatic failover, the system needs to:

1. **Detect the leader is dead** - Usually done with timeouts (like, if no response for ~30 seconds, assume it's dead)
2. **Choose a new leader** - Either through an election or a controller node picks the follower with the most up-to-date data. This requires consensus, which is its own can of worms.
3. **Reconfigure everything** - Point all clients and followers to the new leader. And if the old leader comes back? It better step down and become a follower, or you're in trouble.

The problems with failover are real:

- **Data loss** - If you're using async replication, the new leader might have missed some writes from the old leader. Those writes often just get discarded, which breaks your durability guarantees. You told the client it worked, but now it's gone.

- **External inconsistency** - Lost or reused data (like auto-increment IDs) can cause weird inconsistencies with other systems.

- **Split brain** - This is the nightmare scenario. Two nodes both think they're the leader, both accept writes, and now you have data corruption. Safety mechanisms might shut down nodes, sometimes both of them by mistake.

- **Timeout tuning** - Too long and recovery is slow. Too short and you get unnecessary failovers during network hiccups or load spikes.

The practical reality? Failover is complex and risky. Some teams actually prefer manual failover even when automatic is available, because at least then a human is making the decision with full context. These are fundamental distributed systems problems - you're always trading off consistency, availability, durability, and latency.

### Replication Logs

How does the leader actually tell followers what changed? There are a few approaches:

**Statement-Based Replication** - The leader just sends the SQL statements (INSERT, UPDATE, DELETE) to followers. Simple and compact, but it breaks with nondeterministic operations like `NOW()` or `RAND()`, and you can run into ordering issues.

**Write-Ahead Log (WAL) Shipping** - The leader sends its low-level storage log (the actual byte-level changes). This is efficient and exact, but it's tightly coupled to the storage engine, making version upgrades difficult.

**Logical (Row-Based) Log Replication** - This replicates row-level changes (which rows were inserted, updated, or deleted). It's decoupled from storage internals, so you can have different versions, and it's easier for external systems to consume (think Change Data Capture).

**Trigger-Based Replication** - Uses database triggers or application logic to capture changes. Very flexible, but higher overhead and more error-prone than the built-in methods.

### Problems with Replication Lag

When followers lag behind the leader, you can get some weird consistency issues. Here are the main ones:

**Reading Your Own Writes** - You just wrote something, but when you read it back from a lagging follower, it's not there yet. This is confusing for users. The guarantee you need: users must always see their own updates. Common fix: read from the leader for recently modified data, or wait until replicas catch up.

**Monotonic Reads** - A user might read newer data first, then hit a slower replica and see older data. Time appears to go backward. The guarantee: once a user sees newer data, they should never see older data later. Solution: route all reads from the same user to the same replica.

**Consistent Prefix Reads** - Causally related writes can be seen out of order. Like seeing an answer before the question. This breaks causality and is just confusing. The guarantee: writes should always be seen in the same order. This is especially important in partitioned (sharded) databases where different partitions might replicate at different speeds.

---

## Multi-Leader Model

What if you have multiple leaders? Each leader acts as a follower to the other leaders. This gets complicated fast.

**Why would you do this?** Multi-datacenter setups are the main use case. Each datacenter has its own leader, so writes are served locally - way lower latency. If one datacenter goes down, the others can keep accepting writes. Network issues in one region? Traffic can route to leaders in other regions. It's all about availability and performance.

**The downsides?** It's very hard to manage. Auto-increment IDs become a nightmare. Data integrity is tricky. And write conflicts are inevitable. You get complex conflict resolution and weaker consistency guarantees. It's a trade-off.

**Related idea** - Offline-first client apps are basically multi-leader systems. Each device writes locally and syncs/resolves conflicts when it comes back online. Same idea with collaborative editing tools like Google Docs.

**Handling Write Conflicts**

When two leaders write to the same data, you have a conflict. How do you handle it?

- **Avoid conflicts where possible** - Route all writes from a single user to the same leader. For that user, it's basically a single-leader setup, which reduces concurrent conflicts.

- **Automatically converge to a single state** - Pick a winner. Latest timestamp (last-write-wins), larger unique ID, higher replica/leader priority. Simple, but these can cause silent data loss.

- **Preserve all writes and resolve later** - Keep all conflicting versions and let the application or user resolve it at read time. No data loss, but now your application has to deal with this complexity.

**Topologies**

How do the leaders talk to each other? There are a few patterns:

1. **All-to-all** - Every leader replicates to every other leader
2. **Star topology** - One designated root, others replicate through it
3. **Circular topology** - Each leader replicates to the next in a circle

Each has different trade-offs in terms of latency and failure scenarios.

---

## Leaderless Model

No leader at all! Any node can accept reads and writes. The client sends writes to multiple replicas directly. If one node fails to write, it might hold stale data, but the system keeps going.

This model favors high availability and low latency, but you might occasionally get stale reads. Each record carries version information (like a version number or vector clock) so you can tell what's up-to-date. For example, successful replicas might have version 7, while a failed replica still has version 6.

### Handling Stale Replicas

How do you fix stale data?

**Read Repair** - When reading, the client fetches from multiple replicas. If it sees an older version (v6) alongside a newer one (v7), it updates the stale replica right then and there. Fixes things opportunistically during normal reads.

**Anti-Entropy Process** - A background process that periodically compares replicas and repairs out-of-date data. Doesn't rely on client reads, so it'll catch things even if nobody's reading that particular key.

### Quorum

Here's how you ensure you're reading the latest data. With **n replicas total**:

- A write succeeds after **w nodes** acknowledge
- A read queries **r nodes**

The **quorum condition** is: **w + r > n**. This ensures that the nodes you read from overlap with the nodes you wrote to, so you're guaranteed to see the latest write.

For fault tolerance:

- **w < n** means writes work even if some nodes are down
- **r < n** means reads work even if some nodes are down

Examples:

- **n = 3, w = 2, r = 2** → tolerates 1 node failure
- **n = 5, w = 3, r = 3** → tolerates 2 node failures

You send requests to all replicas, but **w** and **r** determine how many successful replies you need.

### Sloppy Quorum

Normally, a write should go to a fixed set of replicas. But what if some of those are down? With sloppy quorum, the system doesn't wait - it just writes to any available nodes so the request can succeed. This keeps things highly available, but it breaks the strict quorum guarantees. The problem is that writes might go to different nodes than the ones you read from, so the overlap that ensures you see your latest writes isn't guaranteed.

### Hinted Handoff

The node that temporarily stored the write remembers where it was supposed to go. When the original replica comes back online, the temporary node forwards the data to it. Then everything goes back to normal.

Even with quorum, stale reads can still happen in practice. Here's why:

- **Sloppy quorum** - Writes might go to different nodes than the ones you read from, so overlap isn't guaranteed
- **Concurrent writes** - Order is unclear; picking a winner (like last-write-wins) can cause data loss, especially with clock skew
- **Read-write race** - A read happening at the same time as a write might see old or new data depending on which replicas it hits
- **Partial write failures** - A write might succeed on some replicas but fail overall, and those successful writes don't get rolled back
- **Replica recovery from stale data** - If a node with new data fails and gets restored from an old replica, you might drop below **w** up-to-date replicas
- **Unlucky timing** - Even with everything set up correctly, rare timing races can still return stale values

Distributed systems are hard.

### Detecting Concurrent Writes

In Dynamo-style (leaderless) databases, multiple clients can write to the same key at the same time. Network delays and failures mean writes might arrive in different orders at different nodes, and there's no global write ordering. If nodes just overwrite values, replicas can become permanently inconsistent. Conflicts are unavoidable, even with quorums and during read repair or hinted handoff.

**Last Write Wins (LWW)**

This is the simple approach: keep the "most recent" write (usually determined by timestamps) and throw away the rest. But here's the problem - concurrent writes have no true ordering, so LWW just picks an arbitrary one. This can cause silent data loss even for successful writes, thanks to clock skew.

It's okay for caching, but unsafe when you can't lose data. The only safe use is with immutable data where each write uses a unique key (like a UUID) to avoid concurrent updates entirely.

### Happens-Before and Concurrency

An operation **A happens before B** if B knows about A, depends on A, or builds on A. Two operations are **concurrent** if neither knows about the other.

Key insight: concurrency is defined by **causal dependency**, not by clock time.

**Why Time Is Not Used**

In distributed systems, clocks are unreliable and networks are unpredictable. Two operations might happen far apart in time but still be concurrent if network delays prevent them from seeing each other. What matters is **information flow**, not timestamps. This is a really important mental model shift.

**Detecting Concurrent Writes**

In leaderless databases, writes can reach replicas in different orders. If replicas just overwrite values, they can become permanently inconsistent. The system needs to figure out: did this write happen before that one, or are they concurrent?

**Capturing Happens-Before Using Versions**

Here's how you do it:

- The server keeps a **version number per key**, incremented on each write
- Clients must **read before writing** (they can't just write blindly)
- A write includes the **version number from the prior read** (the version the client expects to see)
- When the server gets a write:
  - If the stored version **equals** the provided version, it accepts the write and increments the version (this write happened after the client's read)
  - If the stored version is **higher** than the provided version, it keeps both versions as concurrent (someone else wrote concurrently)

This lets the server identify causal dependencies without even looking at the actual values.

**Concurrent Values (Siblings)**

When writes are concurrent, the server keeps **multiple versions** of the same key, called **siblings**. Clients get all the siblings, merge them somehow, and write back the merged value. Over time, older versions get overwritten, so you get eventual consistency without losing writes.

**Merging and Deletions**

Merging siblings is handled by the application. For add-only data like a shopping cart, you can just take the union. But for deletions, simple union doesn't work - you need **tombstones** (deletion markers) to preserve removals during merges.

**Automatic Merging**

To make this easier, some systems provide **CRDTs** (Conflict-free Replicated Data Types). These are data structures that can automatically merge concurrent values while staying correct, including handling deletions.
