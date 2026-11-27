const REQUIRED_FIXTURE_ENV = [
  "RUBI_QA_STORY_PRODUCT_ID",
  "RUBI_QA_STORY_TITLE",
  "RUBI_QA_RIGHTS_PRODUCT_ID",
  "RUBI_QA_RIGHTS_STORY_TITLE",
  "RUBI_QA_APPROVED_STORY_PRODUCT_ID",
  "RUBI_QA_APPROVED_STORY_TITLE",
  "RUBI_QA_APPROVED_STORY_PRODUCT_TITLE",
  "RUBI_QA_STALE_STORY_TITLE",
  "RUBI_QA_INACTIVE_PRODUCT_PRODUCT_ID",
  "RUBI_QA_INACTIVE_PRODUCT_STORY_TITLE",
  "RUBI_QA_INACTIVE_SUPPLIER_PRODUCT_ID",
  "RUBI_QA_INACTIVE_SUPPLIER_STORY_TITLE",
];

const REQUIRED_CREDENTIAL_ENV = [
  "RUBI_QA_MASTER_EMAIL",
  "RUBI_QA_MASTER_PASSWORD",
  "RUBI_QA_CONSUMER_EMAIL",
  "RUBI_QA_CONSUMER_PASSWORD",
];

export function resolveRubiStagingTarget(env = process.env) {
  if (env.RUBI_STAGING_CONFIRMATION !== "I_CONFIRM_DISPOSABLE_STAGING") {
    throw new Error("Explicit disposable-staging confirmation is required.");
  }
  if (env.RUBI_STAGING_ALLOW_MUTATING_FIXTURES !== "YES_DISPOSABLE_STAGING_FIXTURES_ONLY") {
    throw new Error("The staging environment has not authorized mutation of disposable Story fixtures.");
  }

  const rawTarget = env.RUBI_STAGING_BASE_URL;
  if (!rawTarget) throw new Error("RUBI_STAGING_BASE_URL is required.");

  let target;
  try {
    target = new URL(rawTarget);
  } catch {
    throw new Error("RUBI_STAGING_BASE_URL must be a valid absolute URL.");
  }

  if (target.protocol !== "https:") {
    throw new Error("Story staging E2E requires HTTPS.");
  }
  if (target.username || target.password || target.search || target.hash || target.pathname !== "/") {
    throw new Error("Staging URL must be an origin only, without credentials, path, query or fragment.");
  }

  const host = target.hostname.toLowerCase();
  const labels = host.split(".");
  const hasNonProductionLabel = labels.some((label) => /(^|[-])(staging|preview|qa|test|dev)([-]|$)/.test(label));
  const hasProductionLabel = labels.some((label) => /(^|[-])(prod|production|live)([-]|$)/.test(label));
  if (!hasNonProductionLabel || hasProductionLabel) {
    throw new Error("Target hostname must explicitly identify a non-production staging, preview, QA, test or dev environment.");
  }

  if (!env.RUBI_STAGING_ALLOWED_ORIGIN || env.RUBI_STAGING_ALLOWED_ORIGIN !== target.origin) {
    throw new Error("RUBI_STAGING_ALLOWED_ORIGIN must exactly match the approved HTTPS origin.");
  }

  const missing = [...REQUIRED_CREDENTIAL_ENV, ...REQUIRED_FIXTURE_ENV].filter((key) => !env[key]?.trim());
  if (missing.length) {
    throw new Error("Staging Story E2E is missing required isolated credentials/fixtures: " + missing.join(", "));
  }

  return target.origin;
}
