# Design

Use Prisma 7 and its PostgreSQL driver adapter. Explicit models store validated domain JSON alongside relational identity/version columns. Dataset-scoped foreign keys preserve patient/profile/context/analysis/review/plan links. Database triggers reject historical updates and deletes; explicit dataset deletion is the reset boundary.

Repositories parse writes and reads using existing Zod contracts. Transactions roll back the complete operation on failure. This storage boundary provides no authority or publication approval; future services must enforce identity, freshness, evidence and finalized physician review. No clinical UI changes in P0-01.

Tests: unit tests validate synthetic seeds and input rejection. Integration tests explicitly require a disposable PostgreSQL database, apply real migrations, seed two datasets and prove unique versions, referential integrity, rollback, immutability and isolated deletion. No in-memory substitute counts as database verification.

Update architecture and environment setup. The English brief supersedes older language instructions. Docker engine unavailable at pickup; report and continue implementation.
