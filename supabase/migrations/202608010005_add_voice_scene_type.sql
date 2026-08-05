alter table public.quest_scenes
drop constraint if exists quest_scenes_scene_type_check;

alter table public.quest_scenes
add constraint quest_scenes_scene_type_check
check (
  scene_type in (
    'narration',
    'dialogue',
    'choice',
    'input',
    'translate',
    'voice',
    'completion'
  )
);
