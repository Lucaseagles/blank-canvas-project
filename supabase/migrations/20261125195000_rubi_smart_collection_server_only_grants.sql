-- Sprint 310: smart collection mutations are server-only.
-- Public storefront reads remain available; authenticated clients cannot bypass
-- the audited Owner RPC by writing collection rows directly.

REVOKE ALL PRIVILEGES ON TABLE
  public.curated_collections,
  public.collection_items,
  public.collection_candidates
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.curated_collections,
  public.collection_items
TO anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE
  public.curated_collections,
  public.collection_items,
  public.collection_candidates
TO service_role;

COMMENT ON TABLE public.curated_collections IS
  'Public reads are allowed for active collections; all mutations must use the Owner-gated audited server RPC.';
COMMENT ON TABLE public.collection_items IS
  'Public reads are allowed only through active-collection RLS; all mutations must use the Owner-gated audited server RPC.';
COMMENT ON TABLE public.collection_candidates IS
  'Candidate records are server-only; all reads and mutations must use Owner-gated server functions and audited RPCs.';
