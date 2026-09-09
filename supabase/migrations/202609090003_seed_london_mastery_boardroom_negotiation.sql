-- =========================================================
-- TalkHero Campaign #6
-- C2: London Mastery
-- Mission #1: Boardroom Negotiation
-- =========================================================

do $$
declare
  campaign_uuid uuid;
  episode_uuid uuid;
  quest_uuid uuid;
  act_uuid uuid;
begin

  insert into public.quest_campaigns (
    slug, title, description, cefr_level, status, order_index, metadata
  ) values (
    'london-mastery',
    'London Mastery',
    'Опануйте англійську на рівні C2 у ситуаціях, де важливі нюанс, підтекст, точність, дипломатичність і здатність впливати на співрозмовника.',
    'C2',
    'published',
    5,
    $json$
    {
      "adventure": {
        "location": "London, United Kingdom",
        "subtitle": "Точність. Вплив. Майстерність.",
        "theme": "mastery-and-influence"
      }
    }
    $json$::jsonb
  )
  on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    cefr_level = excluded.cefr_level,
    status = excluded.status,
    order_index = excluded.order_index,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into campaign_uuid;

  insert into public.quest_episodes (
    campaign_id, slug, title, description, order_index, status, metadata
  ) values (
    campaign_uuid,
    'mastery-and-influence',
    'Mastery & Influence',
    'Складні професійні та суспільні ситуації, де потрібно читати підтекст, керувати тоном, аргументувати без спрощень і звучати природно на рівні C2.',
    0,
    'published',
    $json$
    {
      "adventure": {
        "subtitle": "Говоріть так, щоб вас не просто розуміли — вам довіряли."
      }
    }
    $json$::jsonb
  )
  on conflict (campaign_id, slug) do update set
    title = excluded.title,
    description = excluded.description,
    order_index = excluded.order_index,
    status = excluded.status,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into episode_uuid;

  select id into quest_uuid
  from public.quests
  where episode_id = episode_uuid
    and slug = 'boardroom-negotiation';

  if quest_uuid is not null then
    raise exception 'Quest boardroom-negotiation already exists; refusing to overwrite existing content or progress';
  end if;

  insert into public.quests (
    episode_id, slug, title, description, quest_type, cefr_level,
    order_index, estimated_minutes, xp_reward, coin_reward,
    status, config, metadata
  ) values (
    episode_uuid,
    'boardroom-negotiation',
    'Boardroom Negotiation',
    'Проведіть складні переговори на рівні ради директорів: захистіть стратегічну позицію, визнайте обґрунтовані ризики, відреагуйте на прихований спротив і сформулюйте компроміс без втрати ключових інтересів.',
    'conversation',
    'C2',
    0,
    24,
    400,
    160,
    'published',
    $qjson${"version":1,"sceneCount":16}$qjson$::jsonb,
    $json$
    {
      "adventure": {
        "campaignSlug": "london-mastery",
        "subtitle": "Переговори на рівні ради директорів",
        "objectives": [
          "сформулювати стратегічну позицію з точними застереженнями",
          "відокремити принципову незгоду від переговорної тактики",
          "реагувати на імпліцитні заперечення та підтекст",
          "дипломатично оскаржити припущення співрозмовника",
          "визнавати ризик без послаблення власної позиції",
          "переформульовувати конфлікт у спільну проблему",
          "будувати умовний компроміс із чіткими межами",
          "завершувати переговори мовою взаємної відповідальності"
        ]
      },
      "location": "london-executive-boardroom",
      "difficulty": "C2",
      "premiumMission": true
    }
    $json$::jsonb
  )
  returning id into quest_uuid;

  insert into public.quest_acts (
    quest_id, act_code, title, description, order_index,
    status, checkpoint, metadata
  ) values (
    quest_uuid,
    'main',
    'The Boardroom',
    'Negotiate the final terms of a strategic partnership under pressure.',
    0,
    'published',
    false,
    $qjson${"cefrLevel":"C2","focus":["nuance","implication","strategic framing","diplomatic challenge","conditional compromise"]}$qjson$::jsonb
  )
  returning id into act_uuid;

  insert into public.quest_scenes (
    quest_id, act_id, scene_code, order_index, scene_type, speaker,
    content, prompt, options, expected_answer, next_scene_code,
    branching, evaluation_config, metadata
  ) values

  -- 0 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'briefing', 0, 'narration', null,
    $txt$Ви представляєте технологічну компанію на фінальному раунді переговорів щодо стратегічного партнерства. Інша сторона хоче ексклюзивні права на британському ринку. Для вас ексклюзивність можлива лише за умови гарантованого мінімального обсягу продажів і перегляду умов через дванадцять місяців. Сьогодні рішення має бути прийняте.$txt$,
    null, $qjson$[]$qjson$::jsonb, null, 'evelyn-opening',
    $qjson${}$qjson$::jsonb, $qjson${}$qjson$::jsonb,
    $qjson${"location":"London Executive Boardroom","emotion":"high-stakes","cefrLevel":"C2"}$qjson$::jsonb
  ),

  -- 1 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'evelyn-opening', 1, 'dialogue', 'Evelyn',
    $txt$We are broadly aligned, but I think we should be candid about the point that remains unresolved. From our perspective, exclusivity is not an optional extra; it is what makes the investment commercially defensible. If that is still a red line for you, we may be further apart than yesterday's discussion suggested.$txt$,
    null, $qjson$[]$qjson$::jsonb, null, 'frame-position',
    $qjson${}$qjson$::jsonb, $qjson${}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","emotion":"controlled","cefrLevel":"C2"}$qjson$::jsonb
  ),

  -- 2 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'frame-position', 2, 'input', 'Evelyn',
    $txt$Respond without rejecting exclusivity outright. Clarify that the issue is not exclusivity itself but the commercial conditions that would make it sustainable for your side.$txt$,
    $txt$Сформулюйте позицію дипломатично. Покажіть, що ви розумієте логіку Evelyn, але змініть рамку дискусії: проблема не в самому принципі ексклюзивності, а в тому, як розподіляється ризик.$txt$,
    $qjson$[]$qjson$::jsonb, null, 'evelyn-volume-pressure', $qjson${}$qjson$::jsonb,
    $qjson${"mode":"ai","points":45,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Сильна C2-відповідь: ви не відкинули пропозицію, а змінили рамку переговорів і зберегли простір для угоди.","feedbackIncorrect":"Не просто скажіть, що ви не погоджуєтеся. Визнайте логіку іншої сторони й поясніть, за яких умов ексклюзивність може стати прийнятною."}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","goal":"reframe exclusivity as a question of balanced commercial risk rather than reject it","skill":"strategic-framing","cefrLevel":"C2","aiConversation":true,"minTurns":1,"maxTurns":2}$qjson$::jsonb
  ),

  -- 3 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'evelyn-volume-pressure', 3, 'dialogue', 'Evelyn',
    $txt$I understand the distinction, but there is a practical difficulty. We would be committing significant distribution and marketing resources before demand is proven. A guaranteed minimum on our side effectively asks us to absorb the uncertainty twice: once through the investment and again through the volume commitment.$txt$,
    null, $qjson$[]$qjson$::jsonb, null, 'acknowledge-risk',
    $qjson${}$qjson$::jsonb, $qjson${}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","emotion":"analytical"}$qjson$::jsonb
  ),

  -- 4 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'acknowledge-risk', 4, 'input', 'Evelyn',
    $txt$Acknowledge Evelyn's concern without conceding the principle of a minimum commitment. Then explain why exclusivity without measurable performance would shift too much risk to your company.$txt$,
    $txt$Використайте concession + counterweight. Наприклад: “I take the point that…, but the difficulty from our side is…” Не копіюйте приклад дослівно — сформулюйте природну C2-відповідь.$txt$,
    $qjson$[]$qjson$::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I take the point that the upfront investment creates genuine exposure for you. The difficulty from our side is that granting exclusivity without any measurable performance threshold would leave us carrying the opportunity cost if the market develops more slowly than expected.",
        "That concern is entirely reasonable, and I would not want to understate the investment you are making. Equally, though, unrestricted exclusivity would prevent us from responding if agreed commercial objectives were not being met."
      ]
    }
    $json$::jsonb,
    'evelyn-subtext', $qjson${}$qjson$::jsonb,
    $qjson${"mode":"ai","points":40,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Добре: ви визнали реальний ризик іншої сторони, але не віддали ключову переговорну позицію.","feedbackIncorrect":"Потрібні дві частини: щире визнання їхнього ризику та точне пояснення ризику для вашої сторони."}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","goal":"acknowledge the counterpart risk while preserving the need for measurable performance","skill":"concession-and-counterweight","cefrLevel":"C2"}$qjson$::jsonb
  ),

  -- 5 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'evelyn-subtext', 5, 'dialogue', 'Evelyn',
    $txt$Then perhaps the underlying question is one of confidence. If you genuinely believed our team could build the market at the pace we have discussed, I am not sure you would need the protection you are asking for.$txt$,
    null, $qjson$[]$qjson$::jsonb, null, 'challenge-premise',
    $qjson${}$qjson$::jsonb, $qjson${}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","emotion":"probing","subtext":"She is framing contractual safeguards as evidence that you lack confidence in her company."}$qjson$::jsonb
  ),

  -- 6 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'challenge-premise', 6, 'input', 'Evelyn',
    $txt$Challenge the premise politely. Make clear that confidence in a partner and responsible risk management are not mutually exclusive.$txt$,
    $txt$На C2 важливо не захищатися емоційно. Назвіть приховане припущення у позиції Evelyn і спокійно відокремте довіру до партнера від управління ризиком.$txt$,
    $qjson$[]$qjson$::jsonb, null, 'evelyn-offer', $qjson${}$qjson$::jsonb,
    $qjson${"mode":"ai","points":50,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Точно. Ви оскаржили саме припущення, а не особу чи компетентність співрозмовника.","feedbackIncorrect":"Не сперечайтеся з Evelyn напряму про рівень довіри. Покажіть, що довіра та контрактний захист виконують різні функції."}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","goal":"politely expose and challenge the false equivalence between confidence and absence of safeguards","skill":"challenging-an-implicit-premise","cefrLevel":"C2","aiConversation":true,"minTurns":1,"maxTurns":2}$qjson$::jsonb
  ),

  -- 7 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'evelyn-offer', 7, 'dialogue', 'Evelyn',
    $txt$All right. Suppose we accept a performance mechanism in principle. I could take a softer threshold back to my board: no guaranteed purchase volume, but a review after eighteen months if revenue falls materially below the joint forecast.$txt$,
    null, $qjson$[]$qjson$::jsonb, null, 'read-offer',
    $qjson${}$qjson$::jsonb, $qjson${}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","emotion":"measured","subtext":"Evelyn has moved on the principle but wants a longer review period and a vague trigger."}$qjson$::jsonb
  ),

  -- 8 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'read-offer', 8, 'choice', 'Evelyn',
    $txt$Which response best recognises the movement in Evelyn's offer while protecting your key interests?$txt$,
    $txt$Оберіть відповідь, яка не знецінює поступку Evelyn, але уточнює слабкі місця пропозиції: 18 місяців і нечіткий критерій “materially below”.$txt$,
    $json$
    [
      {"id":"a","text":"That still does not work for us. We need twelve months and a fixed minimum volume."},
      {"id":"b","text":"That gets us closer. If we can define the performance trigger objectively and bring the first review forward to twelve months, I think we may have the basis of an agreement."},
      {"id":"c","text":"Eighteen months is probably fine, provided your board is comfortable with it."}
    ]
    $json$::jsonb,
    $qjson${"optionId":"b"}$qjson$::jsonb,
    'evelyn-definition', $qjson${}$qjson$::jsonb,
    $qjson${"mode":"exact","points":35,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Саме так. Ви визнали прогрес, а потім перетворили дві розмиті умови на конкретні переговорні питання.","feedbackIncorrect":"На C2 варто спочатку визнати реальну поступку, а потім точно визначити, що ще потрібно змінити."}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","skill":"negotiation-calibration","cefrLevel":"C2"}$qjson$::jsonb
  ),

  -- 9 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'evelyn-definition', 9, 'dialogue', 'Evelyn',
    $txt$Twelve months is difficult, though not necessarily impossible. My bigger concern is the trigger. A rigid revenue figure could penalise us for market conditions neither side controls. I would want some room for judgement.$txt$,
    null, $qjson$[]$qjson$::jsonb, null, 'define-trigger',
    $qjson${}$qjson$::jsonb, $qjson${}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","emotion":"constructive"}$qjson$::jsonb
  ),

  -- 10 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'define-trigger', 10, 'input', 'Evelyn',
    $txt$Propose a sophisticated performance trigger that combines an objective benchmark with room to consider exceptional market conditions.$txt$,
    $txt$Запропонуйте не “жорстку цифру” і не повністю суб'єктивне рішення. Поєднайте вимірюваний показник із механізмом перегляду обставин.$txt$,
    $qjson$[]$qjson$::jsonb, null, 'evelyn-final-resistance', $qjson${}$qjson$::jsonb,
    $qjson${"mode":"ai","points":55,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Відмінно. Ви поєднали об'єктивність із гнучкістю — саме така конструкція природна для складних переговорів.","feedbackIncorrect":"Дайте конкретну базу для оцінки результату, але додайте механізм, який врахує виняткові ринкові обставини."}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","goal":"design a hybrid performance trigger combining objective metrics with contextual review","skill":"precision-and-qualification","cefrLevel":"C2","aiConversation":true,"minTurns":1,"maxTurns":2}$qjson$::jsonb
  ),

  -- 11 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'evelyn-final-resistance', 11, 'dialogue', 'Evelyn',
    $txt$That is more workable. Let me test one final point. If the review is at twelve months and the threshold is missed, I cannot agree to exclusivity disappearing automatically. We would need a genuine opportunity to remedy the shortfall.$txt$,
    null, $qjson$[]$qjson$::jsonb, null, 'conditional-compromise',
    $qjson${}$qjson$::jsonb, $qjson${}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","emotion":"firm"}$qjson$::jsonb
  ),

  -- 12 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'conditional-compromise', 12, 'input', 'Evelyn',
    $txt$Offer a conditional compromise: accept a remedy period, but make it time-limited and linked to a concrete recovery plan.$txt$,
    $txt$Ваша відповідь має містити умову, межу та наслідок. Уникайте надмірно категоричного тону.$txt$,
    $qjson$[]$qjson$::jsonb,
    $json$
    {
      "acceptedAnswers": [
        "I think we can accommodate that, provided the remedy period is clearly defined. If the threshold is missed, we could allow a further ninety days against an agreed recovery plan, after which exclusivity would be reconsidered if performance had not materially improved.",
        "A cure period seems reasonable. I would suggest ninety days, with specific corrective actions agreed at the twelve-month review and a further decision on exclusivity if those actions do not restore performance."
      ]
    }
    $json$::jsonb,
    'evelyn-summary-request', $qjson${}$qjson$::jsonb,
    $qjson${"mode":"ai","points":45,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Сильний компроміс: ви дали іншій стороні реальний механізм виправлення, але не залишили умову безстроковою.","feedbackIncorrect":"Додайте три елементи: обмежений строк, конкретний план виправлення та зрозумілий наслідок, якщо результат не відновиться."}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","goal":"offer a bounded remedy period without surrendering the performance safeguard","skill":"conditional-compromise","cefrLevel":"C2"}$qjson$::jsonb
  ),

  -- 13 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'evelyn-summary-request', 13, 'dialogue', 'Evelyn',
    $txt$I can work with that. Before we ask the lawyers to turn this into drafting, give me your understanding of where we have landed. I want to make sure neither of us leaves the room with a different version of the deal.$txt$,
    null, $qjson$[]$qjson$::jsonb, null, 'final-summary',
    $qjson${}$qjson$::jsonb, $qjson${}$qjson$::jsonb,
    $qjson${"npcId":"london-mastery-boardroom-negotiation-evelyn-harcourt","role":"Board Strategy Director","emotion":"decisive"}$qjson$::jsonb
  ),

  -- 14 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'final-summary', 14, 'input', 'Evelyn',
    $txt$Summarise the agreement precisely: exclusivity, twelve-month review, hybrid performance trigger, exceptional-market-condition review, and a ninety-day remedy period with a recovery plan.$txt$,
    $txt$Завершіть переговори як C2-мовець: стисло, точно, без двозначності. Не просто перелічіть пункти — покажіть логіку взаємного балансу.$txt$,
    $qjson$[]$qjson$::jsonb, null, 'complete', $qjson${}$qjson$::jsonb,
    $qjson${"mode":"ai","points":60,"allowRetry":true,"maxAttempts":2,"feedbackCorrect":"Відмінне завершення. Ви точно зафіксували домовленість і підкреслили взаємний баланс ризику та відповідальності.","feedbackIncorrect":"Підсумок має охопити всі п’ять елементів угоди та чітко показати, коли запускається перегляд і що відбувається після нього."}$qjson$::jsonb,
    $json$
    {
      "npcId": "london-mastery-boardroom-negotiation-evelyn-harcourt",
      "role": "Board Strategy Director",
      "goal": "summarise the negotiated agreement accurately and with appropriate executive-level nuance",
      "skill": "synthesis-and-precision",
      "cefrLevel": "C2",
      "aiConversation": true,
      "minTurns": 1,
      "maxTurns": 2,
      "learnedWords": [
        "commercially defensible",
        "red line",
        "opportunity cost",
        "performance threshold",
        "underlying assumption",
        "remedy period",
        "recovery plan",
        "reconsider exclusivity"
      ]
    }
    $json$::jsonb
  ),

  -- 15 -----------------------------------------------------
  (
    quest_uuid, act_uuid, 'complete', 15, 'completion', null,
    'Місію завершено! Ви провели складні переговори C2-рівня: працювали з підтекстом, стратегічним фреймінгом, поступками, умовними компромісами та точним фінальним підсумком.',
    null, $qjson$[]$qjson$::jsonb, null, null,
    $qjson${}$qjson$::jsonb, $qjson${}$qjson$::jsonb,
    $qjson${"summary":"Boardroom Negotiation completed","cefrLevel":"C2","skills":["strategic framing","challenging assumptions","diplomatic disagreement","conditional compromise","executive synthesis"]}$qjson$::jsonb
  );

end $$;
