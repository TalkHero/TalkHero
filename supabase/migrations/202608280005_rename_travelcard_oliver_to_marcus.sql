-- =========================================================
-- TalkHero
-- London Life / Buying a Travelcard
-- Replace Oliver with Marcus
-- =========================================================

update public.quest_scenes
set
  speaker = 'Marcus',
  metadata = jsonb_set(
    coalesce(metadata, '{}'::jsonb),
    '{npcId}',
    '"london-life-buying-a-travelcard-marcus"'::jsonb,
    true
  ),
  updated_at = now()
where metadata ->> 'npcId' = 'london-life-buying-a-travelcard-oliver';