import {
  readFile,
  writeFile,
} from "node:fs/promises";

const file =
  "supabase/migrations/202608030001_enable_bank_learning_coach.sql";

let sql = await readFile(
  file,
  "utf8",
);

const oldSelect = `  select id into act_uuid from public.quest_acts
  where quest_id=quest_uuid and act_code='bank-services';`;

const newSelect = `  select id
  into act_uuid
  from public.quest_acts
  where quest_id = quest_uuid
  order by order_index
  limit 1;`;

if (!sql.includes(oldSelect)) {
  throw new Error(
    "Act lookup block was not found.",
  );
}

sql = sql.replace(
  oldSelect,
  newSelect,
);

const oldUpdate = `  else
    update public.quest_acts set
      title='Bank Services', description='Engage with bank services for currency exchange.',
      status='published', updated_at=now()
    where id=act_uuid;
  end if;`;

const newUpdate = `  else
    update public.quest_acts
    set
      act_code = 'bank-services',
      title = 'Bank Services',
      description = 'Engage with bank services for currency exchange.',
      order_index = 0,
      status = 'published',
      updated_at = now()
    where id = act_uuid;
  end if;`;

if (!sql.includes(oldUpdate)) {
  throw new Error(
    "Act update block was not found.",
  );
}

sql = sql.replace(
  oldUpdate,
  newUpdate,
);

// Забираємо BOM, якщо він випадково існує.
sql = sql.replace(/^\uFEFF/, "");

await writeFile(
  file,
  sql,
  "utf8",
);

console.log(
  "✓ Migration patched as UTF-8 without BOM",
);
