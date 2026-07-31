update public.achievements
set
  title = 'Перші кроки',
  description = 'Надішліть своє перше повідомлення Emma.'
where slug = 'first_steps';

update public.achievements
set
  title = 'У ритмі',
  description = 'Підтримуйте серію навчання 7 днів поспіль.'
where slug = 'on_fire';

update public.achievements
set
  title = 'Наполегливий',
  description = 'Підтримуйте серію навчання 30 днів поспіль.'
where slug = 'dedicated';

update public.achievements
set
  title = 'Висхідна зірка',
  description = 'Досягніть 5 рівня.'
where slug = 'level_5';

update public.achievements
set
  title = 'Герой англійської',
  description = 'Досягніть 10 рівня.'
where slug = 'level_10';

update public.achievements
set
  title = 'Балакучий',
  description = 'Надішліть 100 повідомлень.'
where slug = 'talkative';

update public.achievements
set
  title = 'Майстер словника',
  description = 'Збережіть 100 нових слів.'
where slug = 'vocabulary_master';

update public.achievements
set
  title = 'Впевнений оратор',
  description = 'Пройдіть 25 speaking-сесій.'
where slug = 'speaker';
