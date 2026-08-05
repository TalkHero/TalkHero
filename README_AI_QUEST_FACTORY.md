# TalkHero AI Quest Factory v1

Пакет працює поверх уже встановленого Quest Authoring System v1.

## 1. API key

```powershell
$env:OPENAI_API_KEY="ваш_ключ"
```

Необов'язково:

```powershell
$env:OPENAI_QUEST_MODEL="gpt-4o-mini"
```

## 2. Згенерувати квест

```powershell
node scripts/generate-ai-quest.mjs `
  content/quest-requests/bank-a2.json `
  content/generated/bank.json
```

## 3. Переглянути JSON

```text
content/generated/bank.json
```

Фабрика автоматично нормалізує scene codes, passive evaluation, choice options,
expectedAnswer, retries, початкову narration і фінальну completion.

## 4. Перетворити JSON на SQL

```powershell
node scripts/build-quests.mjs `
  content/generated `
  supabase/migrations/202608020002_seed_ai_generated_quests.sql
```

## 5. Застосувати

```powershell
npx supabase db push
npx tsc --noEmit
```

Перед db push обов'язково перегляньте навчальний зміст згенерованого JSON.
