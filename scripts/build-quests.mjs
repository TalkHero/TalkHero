import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const esc = (v) => String(v).replaceAll("'", "''");
const txt = (v) => v == null ? "null" : `'${esc(v)}'`;
const js = (v) => `'${esc(JSON.stringify(v ?? {}))}'::jsonb`;

function validate(q, file) {
  const errors = [];
  for (const key of ["campaignSlug","episodeSlug","slug","title","description","questType","cefrLevel"]) {
    if (!q[key]) errors.push(`${key} is required`);
  }
  if (!Array.isArray(q.scenes) || !q.scenes.length) errors.push("scenes are required");
  const codes = new Set();
  for (const [i,s] of (q.scenes ?? []).entries()) {
    if (!s.code) errors.push(`scenes[${i}].code is required`);
    else if (codes.has(s.code)) errors.push(`duplicate scene code: ${s.code}`);
    else codes.add(s.code);
    if (!s.type) errors.push(`scenes[${i}].type is required`);
    if (!s.content) errors.push(`scenes[${i}].content is required`);
    const passive = ["narration","dialogue","completion"].includes(s.type);
    if (!passive && s.evaluation?.mode !== "manual" && !s.expectedAnswer) {
      errors.push(`scenes[${i}] requires expectedAnswer`);
    }
  }
  if (q.scenes?.at(-1)?.type !== "completion") errors.push("final scene must be completion");
  if (errors.length) throw new Error([`Invalid template: ${file}`,...errors.map(e=>`- ${e}`)].join("\n"));
}

function build(q) {
  const meta = {
    ...(q.metadata ?? {}),
    staticQuest: true,
    generatedBy: "TalkHero Quest Authoring System v1",
    ...(q.adventure ? { adventure:q.adventure.slug, location:q.adventure.location } : {}),
  };
  const config = {version:1,sceneCount:q.scenes.length,staticTest:true,generated:true};
  const tuples = q.scenes.map((s,i) => `  (
    quest_uuid, act_uuid, ${txt(s.code)}, ${i}, ${txt(s.type)},
    ${txt(s.speaker ?? null)}, ${txt(s.content)}, ${txt(s.prompt ?? null)},
    ${js(s.options ?? [])}, ${s.expectedAnswer == null ? "null" : js(s.expectedAnswer)},
    ${txt(q.scenes[i+1]?.code ?? null)}, '{}'::jsonb,
    ${js(s.evaluation ?? {})}, ${js(s.metadata ?? {})}
  )`).join(",\n");

  return `-- Generated quest: ${esc(q.title)}
do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin
  select id into campaign_uuid from public.quest_campaigns
  where slug = ${txt(q.campaignSlug)} and status = 'published';
  if campaign_uuid is null then raise exception 'Campaign not found: ${esc(q.campaignSlug)}'; end if;

  select id into episode_uuid from public.quest_episodes
  where campaign_id = campaign_uuid and slug = ${txt(q.episodeSlug)} and status = 'published';
  if episode_uuid is null then raise exception 'Episode not found: ${esc(q.episodeSlug)}'; end if;

  select id into quest_uuid from public.quests
  where episode_id = episode_uuid and slug = ${txt(q.slug)};

  if quest_uuid is null then
    insert into public.quests (
      episode_id, slug, title, description, quest_type, cefr_level,
      order_index, estimated_minutes, xp_reward, coin_reward, status, config, metadata
    ) values (
      episode_uuid, ${txt(q.slug)}, ${txt(q.title)}, ${txt(q.description)},
      ${txt(q.questType)}, ${txt(q.cefrLevel)}, ${q.orderIndex}, ${q.estimatedMinutes},
      ${q.xpReward}, ${q.coinReward}, 'published', ${js(config)}, ${js(meta)}
    ) returning id into quest_uuid;
  else
    update public.quests set
      title=${txt(q.title)}, description=${txt(q.description)}, quest_type=${txt(q.questType)},
      cefr_level=${txt(q.cefrLevel)}, order_index=${q.orderIndex},
      estimated_minutes=${q.estimatedMinutes}, xp_reward=${q.xpReward}, coin_reward=${q.coinReward},
      status='published', config=${js(config)},
      metadata=coalesce(metadata,'{}'::jsonb)||${js(meta)}, updated_at=now()
    where id=quest_uuid;
  end if;

  select id
  into act_uuid
  from public.quest_acts
  where quest_id = quest_uuid
  order by order_index
  limit 1;

  if act_uuid is null then
    insert into public.quest_acts (
      quest_id,
      act_code,
      title,
      description,
      order_index,
      status,
      checkpoint,
      metadata
    ) values (
      quest_uuid,
      ${txt(q.act.code)},
      ${txt(q.act.title)},
      ${txt(q.act.description)},
      0,
      'published',
      false,
      '{"generated":true}'::jsonb
    )
    returning id into act_uuid;
  else
    update public.quest_acts
    set
      act_code = ${txt(q.act.code)},
      title = ${txt(q.act.title)},
      description = ${txt(q.act.description)},
      order_index = 0,
      status = 'published',
      updated_at = now()
    where id = act_uuid;
  end if;

  delete from public.quest_scenes where quest_id=quest_uuid;

  insert into public.quest_scenes (
    quest_id, act_id, scene_code, order_index, scene_type, speaker,
    content, prompt, options, expected_answer, next_scene_code,
    branching, evaluation_config, metadata
  ) values
${tuples};
end $$;
`;
}

async function main() {
  const input = path.resolve(process.argv[2] ?? "content/quests/london");
  const output = path.resolve(process.argv[3] ?? "supabase/migrations/202608020001_seed_generated_static_quests.sql");
  const names = input.endsWith(".json") ? [input] :
    (await readdir(input)).filter(n=>n.endsWith(".json")).sort().map(n=>path.join(input,n));
  if (!names.length) throw new Error(`No quest JSON files found in ${input}`);

  const parts = ["-- Generated by TalkHero Quest Authoring System v1", ""];
  for (const file of names) {
    const q = JSON.parse(await readFile(file,"utf8"));
    validate(q,file);
    parts.push(build(q));
    console.log(`✓ ${q.slug}: ${q.scenes.length} scenes`);
  }
  await mkdir(path.dirname(output),{recursive:true});
  await writeFile(output,parts.join("\n"),"utf8");
  console.log(`Generated: ${output}`);
}

main().catch(e=>{console.error(e);process.exitCode=1;});
