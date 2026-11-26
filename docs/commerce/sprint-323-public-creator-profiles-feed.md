# Sprint 323 — Public creator profiles and feed

**Classification:** upgrade-only. No V1 matrix point claimed.

## Objective

Give each approved partner a public creator profile that combines their published content and their already-authorized product storefront, using the existing partner store code.

## Delivery

- Add a public `/creator/:storeCode` route.
- Show only approved partner profiles and submissions whose linked video has been explicitly published by the Owner.
- Native videos are served through short-lived signed URLs from the private videos bucket.
- External social posts are shown as source links only; the app does not scrape, download or republish third-party media.
- The profile connects to the existing public partner storefront and preserves each product's existing referral code.
- The partner portal gains a direct link to preview its public creator profile.
- Public responses omit internal profile IDs, customer data, partner user IDs, email addresses, storage paths and checkout destinations.

## Guardrails

- Approval of a creator submission creates a draft; it does not publish. The public profile only displays videos after the separate Owner publish action.
- Scheduled content is hidden until its scheduled time.
- External URLs must be HTTPS, without embedded credentials or custom ports, and match the supported social host allowlist.
- No social network publishing API, scraping, or automatic reposting is claimed.
- The public creator page uses the existing approved partner storefront; it does not create new grants or commission rates.

## Validation

- Regression suite: `src/lib/rubi-public-creator-profile.test.mjs`.
- Required Sprint 33 QA runs the new suite.
- TypeScript, lint, production build, Hub V1 integration and authenticated E2E are release gates.