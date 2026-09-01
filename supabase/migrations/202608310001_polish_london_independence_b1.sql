-- =========================================================
-- TalkHero
-- London Independence B1
-- Final content polish
--
-- Fixes:
-- 1. Returning a Purchase — realistic UK faulty-goods flow.
-- 2. Missing a Train — realistic missed rail connection flow.
-- 3. At the Doctor — examination continuity.
-- 4. Ukrainian service-text consistency.
-- 5. Stronger B1 choice distractors.
--
-- Does NOT change:
-- - scene count
-- - scene order
-- - NPC IDs
-- - rewards
-- - quest structure
-- - AI evaluation mode
-- =========================================================


-- =========================================================
-- 1. JOB INTERVIEW
-- Stronger distractors
-- =========================================================

update public.quest_scenes as s
set options = $json$
[
  {
    "id": "professional",
    "text": "Good morning. Thank you for inviting me. It's nice to meet you.",
    "value": "professional"
  },
  {
    "id": "casual",
    "text": "Hi, Victoria. Nice to meet you. So, what do you want to know?",
    "value": "casual"
  },
  {
    "id": "irrelevant",
    "text": "Good morning. Before we start, could you tell me how much the job pays?",
    "value": "irrelevant"
  }
]
$json$::jsonb
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'job-interview'
  and s.scene_code = 'professional-greeting';


-- =========================================================
-- 2. FIRST DAY AT WORK
-- Stronger distractors
-- =========================================================

update public.quest_scenes as s
set options = $json$
[
  {
    "id": "good",
    "text": "Thanks, Nathan. It's great to be here. I'm looking forward to working with the team.",
    "value": "good"
  },
  {
    "id": "cold",
    "text": "Thanks. I hope everything is ready because I've got a lot to learn today.",
    "value": "cold"
  },
  {
    "id": "wrong",
    "text": "Thanks, Nathan. I just need to know what time I can leave today.",
    "value": "wrong"
  }
]
$json$::jsonb
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'first-day-at-work'
  and s.scene_code = 'reply-to-welcome';


-- =========================================================
-- 3. CALLING CUSTOMER SUPPORT
-- Stronger distractors
-- =========================================================

update public.quest_scenes as s
set options = $json$
[
  {
    "id": "good",
    "text": "Of course. The email address on the account is alex@example.com.",
    "value": "good"
  },
  {
    "id": "bad",
    "text": "The account is mine, so you should already have that information.",
    "value": "bad"
  },
  {
    "id": "irrelevant",
    "text": "I can give you my order number instead if that's easier.",
    "value": "irrelevant"
  }
]
$json$::jsonb
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'calling-customer-support'
  and s.scene_code = 'verify-account';


update public.quest_scenes as s
set options = $json$
[
  {
    "id": "good",
    "text": "Great, thank you for your help. I'll keep an eye out for the email. Have a good day.",
    "value": "good"
  },
  {
    "id": "short",
    "text": "Thanks. I think that's everything.",
    "value": "short"
  },
  {
    "id": "wrong",
    "text": "Thanks. I'll wait for the email, but I still don't really understand what happened.",
    "value": "wrong"
  }
]
$json$::jsonb
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'calling-customer-support'
  and s.scene_code = 'close-call';


-- =========================================================
-- 4. RETURNING A PURCHASE
-- Correct faulty-goods flow + better distractors
-- =========================================================

update public.quest_scenes as s
set
  content = $txt$Yes, that should be fine. I can see the purchase here. As the headphones are faulty and you bought them only a week ago, you can ask for a refund or a replacement. Which would you prefer?$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'returning-a-purchase'
  and s.scene_code = 'proof-accepted';


update public.quest_scenes as s
set
  content = $txt$You would prefer a refund. Ask politely.$txt$,
  prompt = $txt$Ввічливо скажіть, що ви хотіли б повернення коштів замість заміни товару.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'returning-a-purchase'
  and s.scene_code = 'request-refund';


update public.quest_scenes as s
set
  content = $txt$That's absolutely fine. I can arrange a refund. Before I process it, may I ask why you'd rather not have a replacement? It helps us record the problem properly.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'returning-a-purchase'
  and s.scene_code = 'priya-explains-policy';


update public.quest_scenes as s
set
  content = $txt$That makes sense. I'll process the refund as a faulty item. The money will go back to the card you used to pay.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'returning-a-purchase'
  and s.scene_code = 'manager-option';


update public.quest_scenes as s
set
  content = $txt$You do not have the paper receipt, but you have proof of purchase on your phone.$txt$,
  options = $json$
[
  {
    "id": "good",
    "text": "I don't have the paper receipt, but I have the order confirmation and payment on my phone. Would that be enough?",
    "value": "good"
  },
  {
    "id": "rude",
    "text": "I threw the receipt away, but you should still be able to find the purchase somehow.",
    "value": "rude"
  },
  {
    "id": "wrong",
    "text": "I paid by card, so I assumed I wouldn't need to show any proof of purchase.",
    "value": "wrong"
  }
]
$json$::jsonb
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'returning-a-purchase'
  and s.scene_code = 'digital-proof';


update public.quest_scenes as s
set
  content = $txt$Confirm that the refund works for you and ask how long it will take.$txt$,
  prompt = $txt$Підтвердьте, що повернення коштів вам підходить, і уточніть, скільки часу воно зазвичай займає.$txt$,
  options = $json$
[
  {
    "id": "good",
    "text": "That would be perfect, thank you. How long does the refund usually take?",
    "value": "good"
  },
  {
    "id": "weak",
    "text": "Okay, that's fine. I'll wait for it.",
    "value": "weak"
  },
  {
    "id": "wrong",
    "text": "That's fine, but could you send me a replacement as well?",
    "value": "wrong"
  }
]
$json$::jsonb,
  evaluation_config =
    jsonb_set(
      s.evaluation_config,
      '{feedbackIncorrect}',
      to_jsonb(
        'Підтвердьте повернення коштів і запитайте, скільки часу воно займе.'
        ::text
      ),
      true
    )
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'returning-a-purchase'
  and s.scene_code = 'confirm-refund';


update public.quest_scenes as s
set
  content = $txt$Готово! Ви описали несправність товару, надали цифрове підтвердження покупки, ввічливо попросили повернення коштів і пояснили свій вибір.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'returning-a-purchase'
  and s.scene_code = 'complete';


-- =========================================================
-- 5. DINNER WITH FRIENDS
-- Stronger invitation distractors
-- =========================================================

update public.quest_scenes as s
set options = $json$
[
  {
    "id": "good",
    "text": "That sounds great! I'd love to come. Let me know when you decide where you're going.",
    "value": "good"
  },
  {
    "id": "weak",
    "text": "Sounds good. Maybe I'll come if I'm free.",
    "value": "weak"
  },
  {
    "id": "wrong",
    "text": "I'd like to come, but I don't really need to know where you're going.",
    "value": "wrong"
  }
]
$json$::jsonb
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'dinner-with-friends'
  and s.scene_code = 'respond-invitation';


-- =========================================================
-- 6. PLANNING A WEEKEND TRIP
-- Stronger plan distractors
-- =========================================================

update public.quest_scenes as s
set options = $json$
[
  {
    "id": "good",
    "text": "Sounds good. You'll check the trains, I'll compare the hotels, and we'll decide on Thursday evening.",
    "value": "good"
  },
  {
    "id": "weak",
    "text": "Great. Let's both check everything and talk again sometime.",
    "value": "weak"
  },
  {
    "id": "wrong",
    "text": "Sounds good. I'll check the trains, you can compare the hotels, and we'll decide tonight.",
    "value": "wrong"
  }
]
$json$::jsonb
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'planning-a-weekend-trip'
  and s.scene_code = 'confirm-plan';


-- =========================================================
-- 7. HOTEL PROBLEM
-- Stronger final-choice distractors
-- =========================================================

update public.quest_scenes as s
set options = $json$
[
  {
    "id": "good",
    "text": "That sounds good, thank you. I'll move to the new room, you'll arrange the luggage, and breakfast is included tomorrow morning.",
    "value": "good"
  },
  {
    "id": "weak",
    "text": "Thanks. I'll move rooms now and sort the luggage myself.",
    "value": "weak"
  },
  {
    "id": "wrong",
    "text": "That sounds good. I'll stay in this room until ten and move only if it's still cold.",
    "value": "wrong"
  }
]
$json$::jsonb
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'hotel-problem'
  and s.scene_code = 'confirm-solution';


-- =========================================================
-- 8. MISSING A TRAIN
-- Rebuild as a genuine missed National Rail connection.
-- Keep the same 16-scene structure.
-- =========================================================

update public.quest_scenes as s
set content = $txt$Ви подорожуєте за квитком Advance і маєте пересадку. Перший поїзд National Rail прибув приблизно на 25 хвилин пізніше, тому ваш заброньований стикувальний поїзд уже поїхав. Ви звертаєтеся до працівниці станції.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'station-arrival';


update public.quest_scenes as s
set
  content = $txt$Explain what happened.$txt$,
  prompt = $txt$Скажіть, що ваш перший поїзд запізнився приблизно на 25 хвилин і через це ви пропустили заброньовану пересадку.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'explain-missed-train';


update public.quest_scenes as s
set content = $txt$I see. You've got an Advance ticket for a specific itinerary. Normally you need to use the booked services, but because your first National Rail train was delayed, a missed connection is treated differently.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'aisha-ticket';


update public.quest_scenes as s
set
  content = $txt$Clarify what this means.$txt$,
  prompt = $txt$Уточніть, чи потрібно вам купувати новий квиток через пропущену пересадку.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'clarify-rule';


update public.quest_scenes as s
set content = $txt$No, not for the next permitted service. There's a train at 7:20 that you can use with your existing ticket. There's also an earlier 7:05 service, but it isn't covered by your ticket and a new ticket for that one would be £48.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'aisha-options';


update public.quest_scenes as s
set
  content = $txt$Compare the two alternatives.$txt$,
  prompt = $txt$Порівняйте поїзд о 19:20, на який діє ваш поточний квиток, і більш ранній поїзд о 19:05, для якого потрібен новий квиток за £48.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'compare-options';


update public.quest_scenes as s
set content = $txt$It depends on how important those fifteen minutes are. Do you need to arrive by a particular time?$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'important-arrival';


update public.quest_scenes as s
set
  content = $txt$Explain why time matters.$txt$,
  prompt = $txt$Поясніть, що вас мають забрати зі станції приблизно о 20:30, тому ви хочете зрозуміти, наскільки пізніше прибуде поїзд о 19:20.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'explain-constraint';


update public.quest_scenes as s
set content = $txt$The 7:20 should get you there at about 8:15, so only around fifteen minutes later than you originally planned. In your situation, I would probably keep your existing ticket rather than spend £48 for the earlier train.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'aisha-direct-option';


update public.quest_scenes as s
set
  content = $txt$Confirm the ticket rule before deciding.$txt$,
  prompt = $txt$Перепитайте, чи правильно ви зрозуміли: через затримку першого залізничного рейсу ви можете скористатися дозволеним поїздом о 19:20 без купівлі нового квитка.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'request-exception';


update public.quest_scenes as s
set content = $txt$Exactly. I've checked the delay to your first train. Because that rail delay caused you to miss the booked connection, you can take the next permitted service at 7:20 with your existing ticket.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'aisha-checks';


update public.quest_scenes as s
set
  content = $txt$Respond to the proposed solution.$txt$,
  prompt = $txt$Прийміть варіант о 19:20 і поясніть, чому він вам підходить.$txt$,
  options = $json$
[
  {
    "id": "good",
    "text": "That sounds like the best option. If my current ticket is valid and I should arrive only a little later, I'll take the 7:20 service.",
    "value": "good"
  },
  {
    "id": "rude",
    "text": "I'd rather pay £48 for the 7:05 even though it would only save me fifteen minutes.",
    "value": "rude"
  },
  {
    "id": "wrong",
    "text": "Great, so that means I can use my Advance ticket on any train I want now.",
    "value": "wrong"
  }
]
$json$::jsonb,
  evaluation_config =
    jsonb_set(
      jsonb_set(
        s.evaluation_config,
        '{feedbackCorrect}',
        to_jsonb(
          'Правильно. Ви обрали практичний варіант і пояснили рішення з урахуванням часу та вартості.'
          ::text
        ),
        true
      ),
      '{feedbackIncorrect}',
      to_jsonb(
        'Оберіть поїзд о 19:20, на який діє ваш поточний квиток, і поясніть, чому цей варіант вам підходить.'
        ::text
      ),
      true
    )
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'evaluate-offer';


update public.quest_scenes as s
set content = $txt$Perfect. The 7:20 leaves from platform six. Your existing ticket is valid for that service, so there's nothing extra to pay. Keep it with you in case you're asked about the missed connection.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'aisha-details';


update public.quest_scenes as s
set
  content = $txt$Confirm the important details before leaving.$txt$,
  prompt = $txt$Підтвердьте час відправлення, платформу та що ваш поточний квиток дійсний без доплати.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'confirm-details';


update public.quest_scenes as s
set content = $txt$Поїздку врятовано! Ви пояснили пропущену пересадку, уточнили правила квитка Advance, порівняли доступні варіанти та підтвердили наступний дозволений рейс без зайвої доплати.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'missing-a-train'
  and s.scene_code = 'complete';


-- =========================================================
-- 9. AT THE DOCTOR
-- Examination continuity + better distractors
-- =========================================================

update public.quest_scenes as s
set options = $json$
[
  {
    "id": "good",
    "text": "No, I haven't had a high temperature or chest pain, and my breathing has been normal.",
    "value": "good"
  },
  {
    "id": "wrong",
    "text": "I haven't had a high temperature, but I have had some chest pain when I cough.",
    "value": "wrong"
  },
  {
    "id": "irrelevant",
    "text": "I haven't had a high temperature, and I can still work, but I've been very tired.",
    "value": "irrelevant"
  }
]
$json$::jsonb
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'at-the-doctor'
  and s.scene_code = 'answer-red-flags';


update public.quest_scenes as s
set content = $txt$From what you've told me and from examining you, this sounds like a viral respiratory infection. I can't hear anything worrying in your chest at the moment.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'at-the-doctor'
  and s.scene_code = 'doctor-assessment';


-- =========================================================
-- 10. TALKING TO THE LANDLORD
-- Ukrainian service-text polish
-- =========================================================

update public.quest_scenes as s
set prompt = $txt$Підтвердьте час і що цього разу майстер має знайти джерело протічки та зробити повноцінний ремонт.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'talking-to-the-landlord'
  and s.scene_code = 'confirm-arrangement';


-- =========================================================
-- 11. OFFICE MEETING
-- Ukrainian service-text polish
-- =========================================================

update public.quest_scenes as s
set prompt = $txt$Запропонуйте завершити інтеграцію до середи, провести основне тестування в четвер і перенести реліз на п’ятницю.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'office-meeting'
  and s.scene_code = 'propose-solution';


update public.quest_scenes as s
set prompt = $txt$Підсумуйте дедлайн інтеграції, день тестування, реліз і проміжне оновлення про прогрес.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'office-meeting'
  and s.scene_code = 'confirm-plan';


update public.quest_scenes as s
set evaluation_config =
  jsonb_set(
    s.evaluation_config,
    '{feedbackIncorrect}',
    to_jsonb(
      'Ввічливо не погодьтеся та поясніть, що недостатнє тестування може створити більші проблеми.'
      ::text
    ),
    true
  )
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'office-meeting'
  and s.scene_code = 'respond-criticism';


-- =========================================================
-- 12. MAKING NEW FRIENDS
-- Ukrainian service-text polish + stronger follow-up choice
-- =========================================================

update public.quest_scenes as s
set
  evaluation_config =
    jsonb_set(
      s.evaluation_config,
      '{feedbackCorrect}',
      to_jsonb(
        'Саме так. Контекстне питання — природний спосіб почати невимушену розмову.'
        ::text
      ),
      true
    )
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'making-new-friends'
  and s.scene_code = 'start-conversation';


update public.quest_scenes as s
set
  prompt = $txt$Оберіть природне уточнювальне запитання, яке продовжує поточну тему.$txt$,
  options = $json$
[
  {
    "id": "good",
    "text": "That sounds great. Do you have a favourite area for street photography?",
    "value": "good"
  },
  {
    "id": "change",
    "text": "That sounds interesting. How long have you lived in London?",
    "value": "change"
  },
  {
    "id": "dead-end",
    "text": "Nice. I usually take photos on my phone.",
    "value": "dead-end"
  }
]
$json$::jsonb,
  evaluation_config =
    jsonb_set(
      jsonb_set(
        s.evaluation_config,
        '{feedbackCorrect}',
        to_jsonb(
          'Правильно. Уточнювальне запитання розвиває саме ту тему, яку щойно підняв співрозмовник.'
          ::text
        ),
        true
      ),
      '{feedbackIncorrect}',
      to_jsonb(
        'Не змінюйте тему. Поставте уточнювальне запитання про його захоплення вуличною фотографією.'
        ::text
      ),
      true
    )
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'making-new-friends'
  and s.scene_code = 'follow-up-question';


update public.quest_scenes as s
set content = $txt$Нове знайомство! Ви самостійно почали розмову, представилися, розповіли про життя в Лондоні, знайшли спільний інтерес, ставили доречні уточнювальні запитання й домовилися про наступну зустріч.$txt$
from public.quests q
join public.quest_episodes e
  on e.id = q.episode_id
join public.quest_campaigns c
  on c.id = e.campaign_id
where s.quest_id = q.id
  and c.slug = 'london-independence'
  and q.slug = 'making-new-friends'
  and s.scene_code = 'complete';
