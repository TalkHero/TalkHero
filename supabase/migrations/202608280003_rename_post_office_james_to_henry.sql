-- =========================================================
-- TalkHero
-- London Life / Post Office
-- Replace James with Henry as the Postal Clerk
-- =========================================================

update public.quest_scenes
set
  speaker = 'Henry',
  metadata = jsonb_set(
    coalesce(metadata, '{}'::jsonb),
    '{npcId}',
    '"london-life-post-office-henry"'::jsonb,
    true
  ),
  updated_at = now()
where metadata ->> 'npcId' = 'london-life-post-office-james';