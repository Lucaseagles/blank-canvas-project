# Sprint 364 — Story staging readiness

This workflow is intentionally manual and must target an isolated, disposable HTTPS staging environment. Never point it at production.

## GitHub Environment

Create or use the GitHub Actions Environment named `rubi-staging`. Configure the following values there.

### Variables

- `RUBI_STAGING_BASE_URL`: HTTPS origin of the isolated staging app; no credentials, path, query, or fragment.
- `RUBI_STAGING_ALLOWED_ORIGIN`: exact allowed HTTPS origin, matching the staging base URL.
- `RUBI_QA_CHECKOUT_ALLOWED_HOSTS`: comma-separated exact DNS hostnames for the provider sandbox checkout hosts; no schemes, ports, paths or wildcards. Obtain the real sandbox hostnames from the payment provider and never use guessed production hosts.
- `RUBI_QA_STORY_PRODUCT_ID`, `RUBI_QA_STORY_TITLE`
- `RUBI_QA_RIGHTS_PRODUCT_ID`, `RUBI_QA_RIGHTS_STORY_TITLE`
- `RUBI_QA_APPROVED_STORY_PRODUCT_ID`, `RUBI_QA_APPROVED_STORY_TITLE`, `RUBI_QA_APPROVED_STORY_PRODUCT_TITLE`
- `RUBI_QA_STALE_STORY_TITLE`
- `RUBI_QA_INACTIVE_PRODUCT_PRODUCT_ID`, `RUBI_QA_INACTIVE_PRODUCT_STORY_TITLE`
- `RUBI_QA_INACTIVE_SUPPLIER_PRODUCT_ID`, `RUBI_QA_INACTIVE_SUPPLIER_STORY_TITLE`

All IDs and titles must refer to pre-created fixtures dedicated to this staging environment. Do not copy production identifiers or personal data.

### Secrets

- `RUBI_STAGING_ALLOW_MUTATING_FIXTURES`: explicit authorization token/value required by the staging target resolver.
- `RUBI_QA_MASTER_EMAIL` and `RUBI_QA_MASTER_PASSWORD`: isolated QA Master account.
- `RUBI_QA_CONSUMER_EMAIL` and `RUBI_QA_CONSUMER_PASSWORD`: isolated QA consumer account.

Use dedicated test identities with least privilege. Do not reuse a real user's credentials.

## Execution

1. Confirm the environment is isolated and all fixture records are disposable.
2. Confirm the configured URL and allowlisted origin are the exact same staging origin.
3. Manually dispatch **RUBI Story → Offer — Authorized Staging E2E**.
4. Select `I_CONFIRM_DISPOSABLE_STAGING` only after the checks above.
5. Inspect the sanitized artifact `rubi-story-staging-evidence` after completion.

The workflow validates Story → same product → pre-checkout, then intercepts and aborts the outbound browser navigation after confirming it targets HTTPS and an exact hostname in `RUBI_QA_CHECKOUT_ALLOWED_HOSTS`. It deliberately does not contact the payment page, create a checkout session, make a purchase, verify provider callback/round-trip, or prove a completed sale. This is redirect-intent evidence only; it is not a provider round-trip.

## Acceptance and score

The local Hub V1, Sprint 33 QA, and four-profile E2E checks are necessary but not sufficient to close criterion 02.4. Keep the matrix at its existing partial score until the authorized hosted run, the provider sandbox is configured, and every rubric-required provider round-trip assertion is reviewed. Redirect-intent evidence alone does not close the criterion. This readiness work itself adds zero matrix points.
