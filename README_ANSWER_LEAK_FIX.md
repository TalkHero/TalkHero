# TalkHero AI Quest Factory — Answer Leak Fix

## Що виправлено

- правильна відповідь більше не може бути записана в `content`;
- правильна відповідь більше не може бути записана в `prompt`;
- `Your response to ...` та подібні заголовки відхиляються;
- виправлені пошкоджені UTF-8 fallback-повідомлення;
- генерація завершується помилкою до запису JSON, якщо знайдено витік;
- доданий валідатор усіх файлів у `content/generated`.

## Встановлення

Розпакувати в корінь:

```text
C:\TalkHero\Web
```

## Перевірити поточний Bank

```powershell
node scripts/validate-generated-quests.mjs `
  content/generated
```

Поточний `bank.json` має завершитися помилкою — це очікувано, бо він містить витік відповіді.

## Перегенерувати Bank

Переконайтеся, що API-ключ встановлено:

```powershell
$env:OPENAI_API_KEY="..."
```

Потім:

```powershell
Remove-Item ".\content\generated\bank.json"

node scripts/generate-ai-quest.mjs `
  content/quest-requests/bank-a2.json `
  content/generated/bank.json
```

Перевірити новий файл:

```powershell
node scripts/validate-generated-quests.mjs `
  content/generated
```

## Побудувати нову міграцію

Не змінюйте стару застосовану міграцію. Створіть нову:

```powershell
node scripts/build-quests.mjs `
  content/generated `
  supabase/migrations/202608020005_fix_bank_answer_leaks.sql
```

Потім:

```powershell
npx supabase db push
npx tsc --noEmit
```

Міграція перезапише сцени Bank виправленою версією.
