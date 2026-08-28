-- =========================================================
-- TalkHero
-- London Life / At the Launderette
-- Replace Maya with Chloe
-- =========================================================

update public.quest_scenes
set
  speaker = 'Chloe',
  metadata = jsonb_set(
    coalesce(metadata, '{}'::jsonb),
    '{npcId}',
    '"london-life-at-the-launderette-chloe"'::jsonb,
    true
  ),
  updated_at = now()
where metadata ->> 'npcId' = 'london-life-at-the-launderette-maya';