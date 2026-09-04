-- =========================================================
-- TalkHero
-- B2: London Professional
-- Mission #6: The Deadline Problem
-- =========================================================

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin

  select id into campaign_uuid
  from public.quest_campaigns
  where slug = 'london-professional';

  if campaign_uuid is null then
    raise exception 'Campaign london-professional not found';
  end if;

  select id into episode_uuid
  from public.quest_episodes
  where campaign_id = campaign_uuid
    and slug = 'professional-life';

  if episode_uuid is null then
    raise exception 'Episode professional-life not found';
  end if;

  insert into public.quests (
    episode_id, slug, title, description, quest_type, cefr_level,
    order_index, estimated_minutes, xp_reward, coin_reward,
    status, config, metadata
  ) values (
    episode_uuid,
    'deadline-problem',
    'The Deadline Problem',
    'Врятуйте проєкт, який відстає від графіка: визначте справжню причину затримки, захистіть критичний результат, скоригуйте scope та побудуйте реалістичний recovery plan.',
    'conversation',
    'B2',
    5,
    20,
    220,
    85,
    'published',
    $json$
    {
      "version": 1,
      "sceneCount": 16
    }
    $json$::jsonb,
    $json$
    {
      "adventure": {
        "campaignSlug": "london-professional",
        "subtitle": "Врятуйте проєкт, що відстає від графіка",
        "objectives": [
          "діагностувати причину затримки без пошуку винних",
          "відокремлювати критичний результат від бажаного scope",
          "пріоритезувати роботу під жорстким дедлайном",
          "не жертвувати критичною якістю заради швидкості",
          "пояснювати погані новини професійно",
          "пропонувати реалістичний recovery plan",
          "визначати ownership і контрольні точки",
          "узгоджувати конкретний план до дедлайну"
        ]
      },
      "location": "london-creative-studio"
    }
    $json$::jsonb
  )
  on conflict (episode_id, slug) do update set
    title = excluded.title,
    description = excluded.description,
    quest_type = excluded.quest_type,
    cefr_level = excluded.cefr_level,
    order_index = excluded.order_index,
    estimated_minutes = excluded.estimated_minutes,
    xp_reward = excluded.xp_reward,
    coin_reward = excluded.coin_reward,
    status = excluded.status,
    config = excluded.config,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into quest_uuid;

  insert into public.quest_acts (
    quest_id, act_code, title, description,
    order_index, status, checkpoint, metadata
  ) values (
    quest_uuid,
    'main',
    'Recovering the Project',
    'Перетворіть проблему з дедлайном на керований recovery plan.',
    0,
    'published',
    false,
    '{"adventure":true}'::jsonb
  )
  on conflict (quest_id, act_code) do update set
    title = excluded.title,
    description = excluded.description,
    order_index = excluded.order_index,
    status = excluded.status,
    checkpoint = excluded.checkpoint,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into act_uuid;

  delete from public.quest_scenes
  where quest_id = quest_uuid;

  insert into public.quest_scenes (
    quest_id, act_id, scene_code, order_index, scene_type,
    speaker, content, prompt, options, expected_answer,
    next_scene_code, branching, evaluation_config, metadata
  ) values

  -- 0 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'briefing', 0, 'narration', null,
    $txt$До важливої презентації клієнту залишилося п'ять робочих днів. Команда мала підготувати повний набір дизайнів для нової кампанії, але робота суттєво відстає від графіка. Chloe, Creative Lead, просить терміново переглянути ситуацію та вирішити, що реально можна врятувати до дедлайну.$txt$,
    null, '[]'::jsonb, null, 'chloe-opening',
    '{}'::jsonb, '{}'::jsonb,
    $json${"location":"London Creative Studio"}$json$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'chloe-opening', 1, 'dialogue', 'Chloe',
    $txt$We've got a problem. The client presentation is next Friday, but the design work is much further behind than I expected. If we continue with the current plan, I don't think we'll finish everything in time.$txt$,
    null, '[]'::jsonb, null, 'diagnose-problem',
    '{}'::jsonb, '{}'::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "emotion":"thinking"
    }
    $json$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'diagnose-problem', 2, 'input', 'Chloe',
    $txt$Do not jump straight to a solution or blame the team. Ask focused questions to understand why the project is behind and what work remains.$txt$,
    $txt$Спочатку діагностуйте проблему. Поставте конкретні запитання про причини затримки, незавершену роботу та залежності.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers":[
        "Before we decide what to change, I'd like to understand where the delay is coming from. Which deliverables are still unfinished, what is blocking them, and are there any dependencies that could create further delays?",
        "Let's identify the problem first. Which parts of the design are behind schedule, why have they taken longer than expected, and what work is still required before the presentation?"
      ]
    }
    $json$::jsonb,
    'chloe-capacity',
    '{}'::jsonb,
    $json$
    {
      "mode":"ai",
      "points":30,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви почали з діагностики проблеми, а не з припущень чи пошуку винних.",
      "feedbackIncorrect":"Не переходьте одразу до рішення. Спочатку з'ясуйте причину затримки, обсяг незавершеної роботи та критичні залежності."
    }
    $json$::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "goal":"diagnose a delivery problem using focused questions without assigning blame",
      "skill":"problem-solving",
      "cefr":"B2"
    }
    $json$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'chloe-capacity', 3, 'dialogue', 'Chloe',
    $txt$Two things happened. The client requested several revisions this week, and one of our designers has been off sick. We still have twelve deliverables left, but realistically the team can finish about seven to a good standard before Friday.$txt$,
    null, '[]'::jsonb, null, 'prioritise-outcome',
    '{}'::jsonb, '{}'::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "emotion":"neutral"
    }
    $json$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'prioritise-outcome', 4, 'input', 'Chloe',
    $txt$Separate the essential business outcome from the original list of deliverables. Explain what should determine priority.$txt$,
    $txt$Не намагайтеся врятувати всі 12 deliverables. Визначте, що клієнту справді потрібно для успішної презентації, і запропонуйте принцип пріоритезації.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers":[
        "If we can only complete seven properly, we should identify which deliverables are essential for the client to understand and approve the campaign. I'd prioritise the pieces that support the main concept and key customer journey, rather than treating every item as equally important.",
        "The priority should be the minimum set that allows the client to evaluate the campaign effectively. Let's rank the twelve deliverables by business importance and dependencies, then protect the highest-value seven."
      ]
    }
    $json$::jsonb,
    'chloe-scope',
    '{}'::jsonb,
    $json$
    {
      "mode":"ai",
      "points":35,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильно. Ви відокремили критичний результат від початкового списку робіт і запропонували принцип пріоритезації.",
      "feedbackIncorrect":"Не достатньо сказати «зробимо найважливіше». Поясніть, за яким критерієм визначите, що справді необхідно клієнту до презентації."
    }
    $json$::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "goal":"prioritise deliverables according to the essential business outcome",
      "skill":"critical-evaluation",
      "cefr":"B2"
    }
    $json$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'chloe-scope', 5, 'dialogue', 'Chloe',
    $txt$That makes sense. The client definitely needs the campaign concept, the landing page and the main social assets. Some secondary formats and alternative versions would be useful, but they aren't essential for the presentation.$txt$,
    null, '[]'::jsonb, null, 'cut-scope',
    '{}'::jsonb, '{}'::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "emotion":"encouraging"
    }
    $json$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'cut-scope', 6, 'input', 'Chloe',
    $txt$Propose a concrete scope reduction. State what must be completed now and what can move after the presentation.$txt$,
    $txt$Запропонуйте конкретний reduced scope: що команда завершує до п'ятниці, а що свідомо переносить на наступний етап.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers":[
        "I'd protect the campaign concept, landing page and core social assets for Friday. We can move the secondary formats and alternative versions into a follow-up batch after the presentation. That gives the client a complete core story without spreading the team across lower-priority work.",
        "Let's commit to the core concept, landing page and primary social assets for the presentation, and defer the secondary adaptations and optional variants. That keeps the essential scope achievable while preserving the remaining work for the next phase."
      ]
    }
    $json$::jsonb,
    'chloe-quality-risk',
    '{}'::jsonb,
    $json$
    {
      "mode":"ai",
      "points":35,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Чудово. Ви зробили scope reduction конкретним: визначили protected scope і deferred work.",
      "feedbackIncorrect":"Потрібно назвати конкретно, що залишається в п'ятничному scope, а що переноситься. Абстрактного «зробимо менше» недостатньо."
    }
    $json$::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "goal":"define a concrete reduced scope under deadline pressure",
      "skill":"prioritisation",
      "cefr":"B2"
    }
    $json$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'chloe-quality-risk', 7, 'dialogue', 'Chloe',
    $txt$There's another possibility. If everyone works late for the rest of the week, we might be able to finish almost everything. We'd have much less time for review, though, and mistakes could slip through.$txt$,
    null, '[]'::jsonb, null, 'protect-quality',
    '{}'::jsonb, '{}'::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "emotion":"challenging"
    }
    $json$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'protect-quality', 8, 'input', 'Chloe',
    $txt$Respond to the overtime proposal. Balance urgency with quality and delivery risk rather than simply saying yes or no.$txt$,
    $txt$Не використовуйте overtime як магічне рішення. Поясніть, чому review і quality control мають залишитися в плані, та запропонуйте безпечніший компроміс.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers":[
        "Some additional effort may help, but I wouldn't build the recovery plan around excessive overtime or remove the review stage. Rushing all twelve items could create errors just before the client meeting. I'd rather reduce the scope, protect review time and use limited extra capacity only for genuinely critical work.",
        "We can consider targeted overtime for the highest-priority items, but not as a substitute for a realistic plan. We still need proper review and quality control. A smaller, well-tested set of deliverables is safer than presenting more work with avoidable mistakes."
      ]
    }
    $json$::jsonb,
    'chloe-pressure',
    '{}'::jsonb,
    $json$
    {
      "mode":"ai",
      "points":40,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Добре. Ви не перетворили overtime на заміну плануванню та захистили критичний review і quality control.",
      "feedbackIncorrect":"Не обіцяйте врятувати весь scope лише додатковими годинами. Врахуйте ризик помилок, review time і стійкість плану."
    }
    $json$::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "goal":"protect critical quality controls while responding to deadline pressure",
      "skill":"professional-judgement",
      "cefr":"B2"
    }
    $json$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'chloe-pressure', 9, 'dialogue', 'Chloe',
    $txt$I agree, but we still have to tell the account team today. They're expecting everything on Friday. I don't want this to sound like we're making excuses or blaming the client for the revisions.$txt$,
    null, '[]'::jsonb, null, 'communicate-delay',
    '{}'::jsonb, '{}'::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "emotion":"thinking"
    }
    $json$::jsonb
  ),

  -- 10 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'communicate-delay', 10, 'input', 'Chloe',
    $txt$Communicate the bad news professionally. State the situation, relevant causes and proposed response without sounding defensive or assigning blame.$txt$,
    $txt$Сформулюйте повідомлення account team: факт затримки → короткий контекст без виправдань → конкретний recovery proposal.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers":[
        "We're currently behind the original production plan. The recent revisions and reduced team capacity have affected the schedule, and completing all twelve items by Friday would put quality at risk. We're therefore proposing that we protect the core campaign deliverables for the presentation and complete the secondary assets immediately afterwards.",
        "The full original scope is no longer realistic for Friday because the workload has changed and our available capacity is lower than planned. Rather than compromise the presentation, we'd like to deliver the essential campaign materials to a strong standard and schedule the lower-priority adaptations as the next batch."
      ]
    }
    $json$::jsonb,
    'chloe-recovery',
    '{}'::jsonb,
    $json$
    {
      "mode":"ai",
      "points":40,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Сильна комунікація: факт, нейтральний контекст і рішення без пошуку винних.",
      "feedbackIncorrect":"Не приховуйте проблему і не перекладайте відповідальність. Повідомте факт, коротко поясніть контекст та одразу запропонуйте recovery plan."
    }
    $json$::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "goal":"communicate a delivery problem transparently without blame or excuses",
      "skill":"professional-communication",
      "cefr":"B2"
    }
    $json$::jsonb
  ),

  -- 11 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'chloe-recovery', 11, 'dialogue', 'Chloe',
    $txt$Good. If we reduce the scope, I also want to make sure we don't reach Thursday and discover that we're still behind. How would you structure the rest of the week so we know early if the recovery plan is working?$txt$,
    null, '[]'::jsonb, null, 'recovery-plan',
    '{}'::jsonb, '{}'::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "emotion":"encouraging"
    }
    $json$::jsonb
  ),

  -- 12 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'recovery-plan', 12, 'input', 'Chloe',
    $txt$Create an operational recovery plan with priorities, ownership, checkpoints and an escalation rule.$txt$,
    $txt$Побудуйте керований recovery plan. Вкажіть priority work, ownership, контрольні точки протягом тижня та що робити, якщо команда знову відстає.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers":[
        "I'd lock the reduced scope today and assign an owner to each critical deliverable. We should have a short progress check every morning and a formal review on Wednesday to confirm that the core work is on track. If any critical item slips at that point, we escalate immediately and either reallocate capacity or remove another lower-priority item rather than waiting until Thursday.",
        "First, confirm the seven priority deliverables and clear ownership for each one. Then track progress daily, with a Wednesday checkpoint for design completion and review readiness. If the forecast moves outside the plan, Chloe should raise it immediately so we can adjust resources or scope before the client presentation is at risk."
      ]
    }
    $json$::jsonb,
    'priority-choice',
    '{}'::jsonb,
    $json$
    {
      "mode":"ai",
      "points":45,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Відмінно. Це вже recovery plan, а не побажання: є priorities, ownership, checkpoints та escalation rule.",
      "feedbackIncorrect":"План має бути керованим. Додайте конкретні пріоритети, відповідальних, контрольну точку та правило дії при новому відставанні."
    }
    $json$::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "goal":"build an operational recovery plan with ownership, checkpoints and escalation",
      "skill":"planning",
      "cefr":"B2"
    }
    $json$::jsonb
  ),

  -- 13 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'priority-choice', 13, 'choice', 'Chloe',
    $txt$It's Wednesday afternoon. One critical landing-page design is still behind. What is the best response?$txt$,
    $txt$Оберіть дію, яка використовує recovery plan, а не просто сподівається, що команда наздожене графік.$txt$,
    $json$
    [
      {
        "id":"escalate-adjust",
        "text":"Escalate now, reassess the remaining work and either reallocate capacity or remove another lower-priority item to protect the critical landing page.",
        "value":"escalate-adjust"
      },
      {
        "id":"wait",
        "text":"Wait until Thursday evening. The team may still catch up without changing anything.",
        "value":"wait"
      },
      {
        "id":"skip-review",
        "text":"Keep all deliverables and recover the time by removing the final quality review.",
        "value":"skip-review"
      }
    ]
    $json$::jsonb,
    '{"optionId":"escalate-adjust"}'::jsonb,
    'final-plan',
    '{}'::jsonb,
    $json$
    {
      "mode":"exact",
      "points":15,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Правильно. Checkpoint має запускати дію: проблему ескалують зараз і коригують resources або scope, поки ще є час.",
      "feedbackIncorrect":"Не чекайте останнього дня і не жертвуйте критичним review. Використайте checkpoint для ранньої корекції плану."
    }
    $json$::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "goal":"respond to a missed recovery checkpoint with early corrective action"
    }
    $json$::jsonb
  ),

  -- 14 ----------------------------------------------------
  (
    quest_uuid, act_uuid, 'final-plan', 14, 'input', 'Chloe',
    $txt$Summarise the recovery agreement: the problem, protected outcome, reduced scope, quality safeguards, ownership, checkpoints and communication plan.$txt$,
    $txt$Фінальна B2-відповідь: problem → protected outcome → reduced scope → quality control → ownership/checkpoints → communication.$txt$,
    '[]'::jsonb,
    $json$
    {
      "acceptedAnswers":[
        "We're behind because the workload changed while our available capacity fell, so completing the full original scope by Friday is no longer realistic. We'll protect the campaign concept, landing page and core social assets and move the secondary formats and variants to the next phase. We won't remove essential review just to create the appearance of being on time. Each priority deliverable will have a clear owner, we'll review progress daily with a formal Wednesday checkpoint, and any further risk will be escalated immediately. We'll tell the account team today what has changed, what we can reliably deliver and when the remaining work will follow.",
        "The recovery plan is to protect a strong client presentation rather than attempt all twelve items at reduced quality. We'll complete the essential campaign materials for Friday and defer the lower-priority adaptations. Owners will be assigned to every critical item, progress will be checked daily and Wednesday will be the escalation checkpoint. Quality review remains mandatory. We'll communicate the revised scope now and provide early warning if the forecast changes again."
      ]
    }
    $json$::jsonb,
    'complete',
    '{}'::jsonb,
    $json$
    {
      "mode":"ai",
      "points":50,
      "allowRetry":true,
      "maxAttempts":2,
      "feedbackCorrect":"Відмінно. Ви перетворили кризу дедлайну на конкретний recovery plan із пріоритетами, quality safeguards, ownership, checkpoints та прозорою комунікацією.",
      "feedbackIncorrect":"Фінальний план має з'єднати проблему, protected outcome, reduced scope, quality control, ownership, checkpoints та спосіб комунікації."
    }
    $json$::jsonb,
    $json$
    {
      "npcId":"london-professional-deadline-problem-chloe",
      "role":"Creative Lead",
      "goal":"synthesise a complete and operational deadline recovery plan",
      "skill":"synthesis",
      "cefr":"B2"
    }
    $json$::jsonb
  ),

  -- 15 / system completion --------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    $txt$Recovery plan погоджено. Ви діагностували причину відставання, захистили критичний результат, скоротили scope замість нереалістичної обіцянки, зберегли quality control і створили план із ownership, checkpoints та ранньою ескалацією.$txt$,
    null, '[]'::jsonb, null, null,
    '{}'::jsonb, '{}'::jsonb,
    $json$
    {
      "summary":"The Deadline Problem completed",
      "learnedWords":[
        "recovery plan",
        "deliverable",
        "capacity",
        "priority",
        "dependency",
        "checkpoint",
        "escalation",
        "quality control"
      ]
    }
    $json$::jsonb
  );

end $$;



