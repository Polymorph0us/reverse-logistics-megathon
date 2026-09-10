# Backend Integration TODOs

This file tracks every decision the frontend made with a temporary/mocked
assumption because it couldn't be resolved without seeing the real backend.
Each entry below needs a decision from whoever owns the backend before the
real API is wired in. Don't delete entries — check them off once resolved.

## Authentication & Sessions
**What's unresolved:** How JWTs/sessions will be exchanged, and how role enforcement works at the API level.
**Current mock behavior:** Instant mock login without password via `useAuthStore`, keeping role state in client memory without persistence (to allow multi-tab multi-role testing).
**Needs backend input on:** The real `/api/auth/login` payload shape, token expiration rules, and whether role switching requires re-auth.

## Data Synchronization & WebSockets
**What's unresolved:** How real-time events (e.g., fraud alerts) are pushed to active clients.
**Current mock behavior:** Synced across tabs using `localStorage` and the `storage` event listener via `zustand/persist`.
**Needs backend input on:** Should we use WebSockets, SSE (Server-Sent Events), or polling for live regulator updates?

## Blockchain Anchoring
**What's unresolved:** When and how exactly the blockchain hash is generated for a destruction certificate.
**Current mock behavior:** Deterministically hashing the `batchId` + timestamp locally on the client to simulate a `certificateHash` and `blockchainTxId`.
**Needs backend input on:** The exact asynchronous flow (e.g., does the frontend wait for the transaction to confirm, or does it receive a pending status?).

## File Uploads (Photos & Certificates)
**What's unresolved:** How photos of damaged goods or signed certificates are stored.
**Current mock behavior:** Uploading is completely stubbed; no files are kept.
**Needs backend input on:** Will there be a pre-signed URL (S3) flow or direct multipart/form-data upload to the backend?
