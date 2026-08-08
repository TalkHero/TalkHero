export type AdventureMission = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  cefrLevel: string;
  durationMinutes: string;
  xpReward: number;
  coinReward: number;
  questHref: string;
  objectives: string[];
};

export type AdventureCampaign = {
  slug: string;
  progressCampaignSlug: string;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  missions: AdventureMission[];
};

export const LONDON_CAMPAIGN: AdventureCampaign = {
  slug: "english-basics",
  progressCampaignSlug: "english-basics",
  title: "Перший день у Лондоні",
  subtitle: "Побутове спілкування",
  description:
    "Пройдіть London Campaign і потренуйте англійську в найпоширеніших ситуаціях першого дня в Лондоні.",
  location: "Лондон, Велика Британія",
  missions: [
    {
      slug: "coffee-shop",
      title: "Coffee Shop Mission",
      subtitle: "Повне замовлення в кав’ярні",
      description:
        "Привітайтеся, замовте напій, оберіть розмір і молоко та оплатіть.",
      cefrLevel: "A1",
      durationMinutes: "10–12",
      xpReward: 60,
      coinReward: 20,
      questHref: "/quests/english-basics/first-contact/coffee-shop",
      objectives: [
        "привітатися;",
        "замовити напій;",
        "відповісти на уточнення баристи.",
      ],
    },
    {
      slug: "underground",
      title: "London Underground",
      subtitle: "Квиток і маршрут у метро",
      description: "Купіть квиток, уточніть лінію, пересадку та платформу.",
      cefrLevel: "A1",
      durationMinutes: "8–10",
      xpReward: 55,
      coinReward: 18,
      questHref: "/quests/english-basics/first-contact/underground",
      objectives: [
        "назвати пункт призначення;",
        "купити квиток;",
        "уточнити платформу.",
      ],
    },
    {
      slug: "hotel",
      title: "Hotel Check-in",
      subtitle: "Заселення в готель",
      description:
        "Підтвердьте бронювання та уточніть важливі деталі проживання.",
      cefrLevel: "A1",
      durationMinutes: "9–11",
      xpReward: 60,
      coinReward: 20,
      questHref: "/quests/english-basics/first-contact/hotel",
      objectives: [
        "підтвердити бронювання;",
        "надати документи;",
        "уточнити Wi-Fi та check-out.",
      ],
    },
    {
      slug: "airport",
      title: "At the Airport",
      subtitle: "Реєстрація на рейс",
      description: "Зареєструйтеся, здайте багаж і знайдіть вихід на посадку.",
      cefrLevel: "A2",
      durationMinutes: "10–12",
      xpReward: 70,
      coinReward: 24,
      questHref: "/quests/english-basics/first-contact/airport",
      objectives: ["передати документи;", "здати багаж;", "знайти gate."],
    },
    {
      slug: "restaurant",
      title: "At the Restaurant",
      subtitle: "Вечеря в ресторані",
      description: "Отримайте столик, замовте страви та попросіть рахунок.",
      cefrLevel: "A2",
      durationMinutes: "10–12",
      xpReward: 75,
      coinReward: 25,
      questHref: "/quests/english-basics/first-contact/restaurant",
      objectives: [
        "попросити столик;",
        "замовити страви;",
        "попросити рахунок.",
      ],
    },
    {
      slug: "supermarket",
      title: "At the Supermarket",
      subtitle: "Покупки в супермаркеті",
      description: "Знайдіть товари, уточніть ціну та оплатіть покупки.",
      cefrLevel: "A1",
      durationMinutes: "8–10",
      xpReward: 65,
      coinReward: 22,
      questHref: "/quests/english-basics/first-contact/supermarket",
      objectives: ["знайти товар;", "уточнити ціну;", "оплатити покупки."],
    },
    {
      slug: "bank",
      title: "At the Bank",
      subtitle: "Обмін валюти в банку",
      description:
        "Обміняйте гроші, уточніть комісію, передайте документ і підтвердьте операцію.",
      cefrLevel: "A2",
      durationMinutes: "10–12",
      xpReward: 75,
      coinReward: 25,
      questHref: "/quests/english-basics/first-contact/bank",
      objectives: [
        "ввічливо попросити обміняти гроші;",
        "назвати валюту для обміну;",
        "запитати про курс і комісію;",
        "передати документ для ідентифікації;",
        "підтвердити операцію.",
      ],
    },
    {
      slug: "pharmacy",
      title: "At the Pharmacy",
      subtitle: "Покупка ліків",
      description: "Поясніть симптоми, оберіть ліки та уточніть інструкцію.",
      cefrLevel: "A1",
      durationMinutes: "10–12",
      xpReward: 75,
      coinReward: 25,
      questHref: "/quests/english-basics/first-contact/pharmacy",
      objectives: [
        "описати симптоми;",
        "попросити ліки;",
        "уточнити дозування.",
      ],
    },
    {
      slug: "taxi",
      title: "Taxi Ride",
      subtitle: "Поїздка містом",
      description: "Назвіть адресу, уточніть тривалість і оплатіть поїздку.",
      cefrLevel: "A1",
      durationMinutes: "8–10",
      xpReward: 65,
      coinReward: 22,
      questHref: "/quests/english-basics/first-contact/taxi",
      objectives: ["назвати адресу;", "уточнити час поїздки;", "оплатити."],
    },
    {
      slug: "post-office",
      title: "At the Post Office",
      subtitle: "Відправлення посилки",
      description: "Відправте посилку, оберіть доставку та оплатіть послугу.",
      cefrLevel: "A2",
      durationMinutes: "10–12",
      xpReward: 75,
      coinReward: 25,
      questHref: "/quests/english-basics/first-contact/post-office",
      objectives: [
        "пояснити, що відправляєте;",
        "обрати доставку;",
        "уточнити ціну.",
      ],
    },
    {
      slug: "clothes-shop",
      title: "At the Clothes Shop",
      subtitle: "Покупка одягу",
      description:
        "Знайдіть футболку, оберіть колір і розмір, приміряйте та оплатіть.",
      cefrLevel: "A1",
      durationMinutes: "8–10",
      xpReward: 70,
      coinReward: 24,
      questHref: "/quests/english-basics/first-contact/clothes-shop",
      objectives: [
        "пояснити, який одяг ви шукаєте;",
        "попросити потрібний колір і розмір;",
        "приміряти та оплатити товар.",
      ],
    },
  ],
};

export function getMissionBySlug(slug: string): AdventureMission | null {
  return (
    LONDON_CAMPAIGN.missions.find((mission) => mission.slug === slug) ?? null
  );
}
