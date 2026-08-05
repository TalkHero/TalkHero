# TalkHero Learning Coach v1

Скопіюйте файли в корінь проєкту. Потім застосуйте інструкцію з `lib/quests/LEARNING_FEEDBACK_PATCH.txt` до `lib/quests/types.ts`.

Перевірка:

```powershell
npx tsc --noEmit
npm run build
```

База даних не змінюється. Старий `feedback: string` підтримується.
