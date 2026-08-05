# TalkHero Quest Authoring System v1

## Генерація SQL

```powershell
node scripts/build-quests.mjs `
  content/quests/london `
  supabase/migrations/202608020001_seed_generated_static_quests.sql
```

Або додайте `build:quests` із `package-scripts.snippet.json` до `package.json`:

```powershell
npm run build:quests
```

## Застосування

```powershell
npx supabase db push
npx tsc --noEmit
```

Редагуйте JSON-шаблони, а не згенерований SQL. Під час застосування міграції сцени відповідного квесту перезаписуються.
