# Sprint 367 — channel-specific publication reference guard

**Base:** `main` at `327cad3b0df233785a301a9a48c482bd05a6dfaa`.  
**Focus:** 03.3 — distribution evidence integrity.  
**Classification:** upgrade-only / partial-coverage enabler; **+0 V1 points**.

## Existing gap

The distribution planner supports seven channels and stores `planned` or `manually_published`. Before this change, the manual state required only a non-empty reference of at least eight characters. A URL from an unrelated or spoofed host could therefore be recorded as a publication reference. The manual state is still a human declaration; it does not independently prove that a post is public, reachable, delivered or viewed.

## Delivered

1. Added platform-specific HTTPS permalink validation for Instagram, TikTok, YouTube, Facebook, Pinterest and Telegram.
2. Reject insecure HTTP, credential-bearing URLs, fragments, spoofed hostnames, unsupported paths and malformed provider identifiers.
3. WhatsApp cannot be marked manually published from a share/invite link. It remains planned until a provider-confirmed message connector supplies a real message reference.
4. Added the same validation to the database write boundary with a trigger, so the service-role RPC cannot bypass the application-level guard.
5. Kept planning available for all seven channels; no channel is blocked from draft planning.
6. Updated the Master UI to explain the evidence requirements and prevent selecting the manual publication declaration for WhatsApp.
7. Added unit/contract tests and a disposable local PostgreSQL smoke that tests valid links, spoofed domains, HTTP, malformed references, WhatsApp blocking and rollback of invalid status transitions.

## Safety and semantics

- A valid permalink shape is not proof of external delivery or reach.
- No platform API was called and no social post was published by this PR.
- No credentials or OAuth tokens were added.
- No remote Supabase was modified.
- No analytics, sales, clicks, commissions or payments were fabricated.
- WhatsApp is deliberately fail-closed until an official provider-confirmed connector exists.

## Acceptance

- RUBI organic campaign unit suite.
- Sprint 33 QA.
- Hub V1 Integration QA.
- Authenticated four-profile E2E, including the new PostgreSQL publication-reference smoke.
- All required checks must pass on the exact final PR HEAD.

## Matrix decision

03.3 remains at its existing partial state. This PR improves the quality of manual references and prevents obvious false declarations, but it does not implement official multi-channel publishing or provider delivery confirmation. **No new point is claimed.**

The next complete-coverage gate for 03.3 remains at least one or more official connectors with account authorization, provider-returned publication identifiers, safe retry/idempotency, and independently reviewable provider evidence across the required channels.
