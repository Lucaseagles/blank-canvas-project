# Sprint 325 — Premium differentiated partner onboarding

**Classification:** upgrade-only. No V1 matrix point claimed.

## Objective

Give every commercial partner a guided, welcoming introduction that explains the selected partnership before collecting qualification details. The experience must adapt to affiliates, nano/micro creators, influencers and experts rather than presenting one generic form.

## Delivered in this sprint

- Premium partner-specific selection cards with clear role descriptions.
- Dedicated explanation for the selected partnership: expectations, eligibility principles and the dashboard capabilities relevant to that role.
- Nano and micro creator distinction stored as a qualification answer while preserving the existing database partner_type enum.
- Required niche/specialty and primary channel selection; public social handle remains optional.
- Affiliate invitation from the consumer app continues to open the same onboarding with the affiliate path preselected.
- No minimum follower count or purchase requirement is introduced.
- Existing authenticated server validation and atomic onboarding RPC remain the only profile-writing path.
- Partner requests remain pending until human commercial approval; onboarding never grants product access, campaign eligibility or commissions.

## Experience roadmap

All partnership categories must complete this onboarding before application submission. After approval, the partner portal will evolve into role-specific workspaces:
- Affiliate: referral links, storefront, group/channel promotion, campaign kits, attribution and confirmed commissions.
- Nano/micro creator: short-video studio, creator feed, niche campaigns and content performance.
- Influencer: campaign calendar, rights/licensing, briefs, launch kits and channel analytics.
- Expert: educational campaign briefs, authority content, product education and specialist storefront.

These are product directions, not claims that every module is already available. Future workspace releases must use approved products, licensed content and confirmed commerce events.

## Guardrails

- Follower count is contextual only and never a sole approval rule.
- No guaranteed income or earnings claims.
- Commission rates and special incentives require Master approval and margin validation.
- Consumer affiliate acquisition stays opt-in and uses the existing readiness gate.
- The public profile and creator feed remain separate from private application data.
- No database enum expansion or new migration is required for nano/micro; the distinction is stored in validated qualification_answers.

## Validation

- Extend the onboarding quiz regression with partner-specific copy, nano/micro qualification and consumer invite routing.
- Required gates: Sprint 33 QA, Hub V1 Integration QA, TypeScript, ESLint, production build and authenticated four-profile E2E.
