export const API_ERRORS = {
  // Authentication
  unauthorized: "Необхідно увійти в акаунт.",
  internalServerError:
  "Сталася внутрішня помилка сервера.",

  // General request validation
  invalidRequestData: "Некоректні дані запиту.",
  userIdRequired: "Ідентифікатор користувача є обов'язковим.",

  // Chat
  messageRequired: "Введіть повідомлення.",
  conversationIdRequired:
    "Ідентифікатор розмови є обов'язковим.",
  conversationNotFound: "Розмову не знайдено.",
  failedToLoadConversations:
    "Не вдалося завантажити розмови.",
  failedToLoadConversation:
    "Не вдалося завантажити розмову.",
  failedToLoadChatHistory:
    "Не вдалося завантажити історію чату.",
  failedToDeleteConversation:
    "Не вдалося видалити розмову.",
    placementTestIncomplete:
  "Тест ще не завершено. Спочатку дайте відповіді на всі питання.",

placementTestAlreadyCompleted:
  "Цей тест уже завершено.",

failedToFinishPlacementTest:
  "Не вдалося завершити тестування.",
  failedToGenerateResponse:
    "Не вдалося сформувати відповідь.",
  failedToStartChatRequest:
    "Не вдалося надіслати повідомлення.",

  // English level
  invalidEnglishLevel:
    "Некоректний рівень англійської. Оберіть A1, A2, B1, B2, C1 або C2.",
  failedToUpdateEnglishLevel:
    "Не вдалося оновити рівень англійської.",

  // Profile
  invalidProfileData:
    "Некоректні дані профілю.",
  fullNameRequired:
    "Ім'я є обов'язковим.",
  fullNameTooLong:
    "Ім'я не може містити більше 100 символів.",
  failedToLoadProfile:
    "Не вдалося завантажити профіль.",
  failedToUpdateProfile:
    "Не вдалося оновити профіль.",

  // Vocabulary
  wordRequired:
    "Вкажіть слово.",
  invalidVocabularyData:
    "Некоректні дані словника.",
  invalidVocabularyStatus:
    "Некоректний статус слова.",
  vocabularyItemNotFound:
    "Слово у словнику не знайдено.",
  failedToLoadVocabulary:
    "Не вдалося завантажити словник.",
  failedToAddWord:
    "Не вдалося додати слово.",
  failedToSaveWord:
    "Не вдалося зберегти слово.",
    failedToStartPlacementTest:
  "Не вдалося розпочати тест на визначення рівня.",
  failedToUpdateVocabularyItem:
    "Не вдалося оновити слово.",
  failedToDeleteVocabularyItem:
    "Не вдалося видалити слово.",
  invalidVocabularyCard:
    "Штучний інтелект повернув некоректну картку слова.",
  aiDidNotReturnVocabularyCard:
    "Штучний інтелект не повернув картку слова.",
  incompleteVocabularyCard:
    "Згенерована картка слова неповна.",
  failedToGenerateVocabularyCard:
    "Не вдалося створити та зберегти картку слова.",

  // Review
  invalidReviewGrade:
    "Некоректна оцінка картки.",
  reviewCardNotFound:
    "Картку для повторення не знайдено.",
    placementSessionNotFound:
  "Активну сесію тестування не знайдено.",

placementQuestionNotFound:
  "Питання тестування не знайдено.",

placementQuestionAlreadyAnswered:
  "На це питання вже було надано відповідь.",

placementQuestionOutOfOrder:
  "Це питання вже не є поточним питанням тесту.",

failedToSubmitPlacementAnswer:
  "Не вдалося зберегти відповідь тестування.",
  failedToLoadReviewCards:
    "Не вдалося завантажити картки для повторення.",
  failedToUpdateReviewCard:
    "Не вдалося оновити картку повторення.",

  // Speaking
  transcriptRequired:
    "Текст відповіді є обов'язковим.",
  invalidSpeakingSessionData:
    "Некоректні дані сесії розмовної практики.",
  invalidSessionStartTime:
    "Некоректний час початку сесії.",
  invalidSessionDuration:
    "Некоректна тривалість сесії.",
  speakingSessionNotCompleted:
    "Не вдалося завершити сесію розмовної практики.",
  failedToCompleteSpeakingSession:
    "Не вдалося завершити сесію розмовної практики.",
  failedToLoadSpeakingHistory:
    "Не вдалося завантажити історію розмовних сесій.",
  failedToCreateOpeningMessage:
    "Не вдалося створити початкове повідомлення.",
  failedToStartSpeakingSession:
    "Не вдалося розпочати розмовну практику.",

  // Speaking evaluation
  invalidEvaluationData:
    "Некоректні дані для оцінювання.",
  invalidEvaluatorResponse:
    "Сервіс оцінювання повернув некоректні дані.",
  emptyEvaluationResponse:
    "Штучний інтелект не повернув результат оцінювання.",
  invalidEvaluationResponse:
    "Штучний інтелект повернув некоректний результат оцінювання.",
  incompleteSpeakingEvaluation:
    "Результат оцінювання неповний.",
  failedToEvaluateSpeaking:
    "Не вдалося оцінити усну відповідь.",

  // XP and progress
  invalidXpAmount:
    "Кількість XP має бути додатним цілим числом.",
  failedToAwardXp:
    "Не вдалося нарахувати XP.",
  missingUpdatedProgress:
    "Після нарахування XP не вдалося отримати оновлений прогрес.",

  // Dashboard
  failedToLoadDashboardStats:
    "Не вдалося завантажити статистику.",
  failedToLoadDashboardStatistics:
    "Не вдалося завантажити статистику головної панелі.",

  // Browser capabilities
  voiceModeNotSupported:
    "Голосовий режим не підтримується в цьому браузері. Використовуйте останню версію Chrome або Edge.",
} as const;

export const UI_ERRORS = {
  // General
  generic:
    "Сталася помилка. Спробуйте ще раз.",
  network:
    "Помилка мережі. Перевірте підключення до інтернету.",

  // Chat and streaming
  invalidStreamingResponse:
    "Сервер повернув некоректну відповідь.",
  emptyAssistantResponse:
    "Вибачте, я не змогла відповісти. Спробуйте ще раз.",

  // Profile
  fullNameRequired:
    "Ім'я є обов'язковим.",
  fullNameTooLong:
    "Ім'я не може містити більше 100 символів.",

  // Speaking
  voiceModeNotSupported:
    "Голосовий режим не підтримується в цьому браузері. Використовуйте останню версію Chrome або Edge.",
} as const;
