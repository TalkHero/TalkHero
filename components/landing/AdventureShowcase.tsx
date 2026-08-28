import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Coffee,
  Hotel,
  LockKeyhole,
  MapPin,
  Plane,
  Sparkles,
  TrainFront,
  Volume2,
} from "lucide-react";

const missions = [
  {
    title: "Coffee Shop",
    subtitle: "Замовте каву",
    icon: Coffee,
    progress: 100,
    completed: true,
  },
  {
    title: "Underground",
    subtitle: "Знайдіть потрібну лінію",
    icon: TrainFront,
    progress: 70,
    completed: false,
  },
  {
    title: "Hotel",
    subtitle: "Заселіться в готель",
    icon: Hotel,
    progress: 0,
    completed: false,
    locked: true,
  },
  {
    title: "Airport",
    subtitle: "Пройдіть реєстрацію",
    icon: Plane,
    progress: 0,
    completed: false,
    locked: true,
  },
];

const characters = [
 {
  name: "James",
  role: "Місцевий житель",
  image: "/images/characters/james/james.png",
  initials: "J",
  voice: "British · friendly",
},
 {
  name: "Sophie",
  role: "Бариста",
  image: "/images/characters/sophie/sophie.png",
  initials: "S",
  voice: "British · energetic",
},
  {
  name: "Daniel",
  role: "Менеджер готелю",
  image: "/images/characters/daniel/daniel.png",
  initials: "D",
  voice: "British · professional",
},
];

export function AdventureShowcase() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-56 top-20 h-[520px] w-[520px] rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="absolute -right-56 bottom-0 h-[520px] w-[520px] rounded-full bg-violet-100/70 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Пригоди TalkHero
          </div>

          <h2 className="mt-6 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl lg:text-6xl">
            Англійська стає
            <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              пригодою.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Подорожуйте, знайомтеся з персонажами та використовуйте
            англійську в ситуаціях, які могли б трапитися в реальному
            житті.
          </p>
        </div>

        {/* Adventure world */}
        <div className="relative mt-14 overflow-hidden rounded-[36px] border border-indigo-900/20 bg-slate-950 shadow-[0_35px_100px_rgba(49,46,129,0.22)]">
          {/* Cinematic background */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#11103b_45%,#312e81_100%)]" />

            <div className="absolute -right-20 top-[-80px] h-[400px] w-[400px] rounded-full bg-violet-500/25 blur-3xl" />

            <div className="absolute bottom-[-220px] left-[15%] h-[480px] w-[480px] rounded-full bg-indigo-500/20 blur-3xl" />

            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                backgroundSize: "54px 54px",
              }}
            />

            {/* Fake city skyline */}
            <div className="absolute inset-x-0 bottom-0 h-[38%] opacity-20">
              <div className="absolute bottom-0 left-[3%] h-28 w-20 bg-violet-300/30" />
              <div className="absolute bottom-0 left-[10%] h-44 w-24 bg-indigo-300/25" />
              <div className="absolute bottom-0 left-[18%] h-32 w-32 bg-violet-300/20" />
              <div className="absolute bottom-0 right-[22%] h-36 w-28 bg-indigo-300/25" />
              <div className="absolute bottom-0 right-[10%] h-52 w-20 bg-violet-300/30" />
              <div className="absolute bottom-0 right-[3%] h-32 w-24 bg-indigo-300/20" />
            </div>
          </div>

          <div className="relative grid gap-10 p-6 sm:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:p-10 xl:p-12">
            {/* Left */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-violet-200 backdrop-blur">
                  <MapPin className="h-3.5 w-3.5" />
                  Кампанія 01 · London
                </div>

                <h3 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  London
                  <span className="block text-violet-300">
                    First Day
                  </span>
                </h3>

                <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
                  Ваш перший день у Лондоні. Замовте каву, знайдіть
                  транспорт, заселіться в готель і впорайтеся з
                  розмовами англійською самостійно.
                </p>

                {/* Campaign progress */}
                <div className="mt-8 max-w-md">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-300">
                      Прогрес кампанії
                    </span>

                    <span className="font-black text-white">
                      42%
                    </span>
                  </div>

                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[42%] rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400" />
                  </div>
                </div>
              </div>

              {/* Product promises */}
              <div className="mt-10 flex flex-wrap gap-2">
                {[
                  "Реальні діалоги",
                  "Власні персонажі",
                  "Окремі голоси",
                  "XP і прогрес",
                ].map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="rounded-[30px] border border-white/10 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-xl sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
                    Маршрут
                  </p>

                  <h4 className="mt-1 text-xl font-black text-white">
                    Ваш перший день у Лондоні
                  </h4>
                </div>

                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                  4 місії
                </div>
              </div>

              {/* Missions */}
              <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
                {missions.map((mission, index) => {
                  const Icon = mission.icon;

                  return (
                    <div
                      key={mission.title}
                      className={`relative overflow-hidden rounded-2xl border p-4 transition ${
                        mission.locked
                          ? "border-white/10 bg-black/15 opacity-65"
                          : mission.completed
                            ? "border-emerald-400/20 bg-emerald-400/10"
                            : "border-violet-400/30 bg-violet-400/10 shadow-lg shadow-violet-950/20"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                            mission.completed
                              ? "bg-emerald-400/15 text-emerald-300"
                              : mission.locked
                                ? "bg-white/5 text-slate-500"
                                : "bg-violet-400/15 text-violet-300"
                          }`}
                        >
                          {mission.locked ? (
                            <LockKeyhole className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>

                        <span className="text-xs font-black text-slate-500">
                          0{index + 1}
                        </span>
                      </div>

                      <h5 className="mt-5 font-black text-white">
                        {mission.title}
                      </h5>

                      <p className="mt-1 text-sm text-slate-400">
                        {mission.subtitle}
                      </p>

                      {!mission.locked && (
                        <div className="mt-5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span
                              className={
                                mission.completed
                                  ? "text-emerald-300"
                                  : "text-violet-300"
                              }
                            >
                              {mission.completed
                                ? "Завершено"
                                : "У процесі"}
                            </span>

                            <span className="text-slate-400">
                              {mission.progress}%
                            </span>
                          </div>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full ${
                                mission.completed
                                  ? "bg-emerald-400"
                                  : "bg-violet-400"
                              }`}
                              style={{
                                width: `${mission.progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Route */}
              <div className="mt-5 hidden items-center gap-2 px-4 sm:flex">
                {missions.map((mission, index) => (
                  <div
                    key={mission.title}
                    className="flex flex-1 items-center"
                  >
                    <div
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        mission.completed
                          ? "bg-emerald-400"
                          : index === 1
                            ? "bg-violet-400"
                            : "bg-white/20"
                      }`}
                    />

                    {index < missions.length - 1 && (
                      <div
                        className={`h-px flex-1 ${
                          mission.completed
                            ? "bg-gradient-to-r from-emerald-400 to-violet-400"
                            : "bg-white/10"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Characters */}
          <div className="relative border-t border-white/10 bg-black/10 px-6 py-6 sm:px-8 lg:px-10 xl:px-12">
            <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
                  Люди, яких ви зустрінете
                </p>

                <h4 className="mt-2 text-2xl font-black text-white">
                  Кожен персонаж має свій характер і голос.
                </h4>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {characters.map((character, index) => (
                  <div
                    key={character.name}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 transition hover:border-violet-400/30 hover:bg-white/[0.09]"
                  >
                    {/* Avatar */}
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/10 shadow-lg">
                      {character.image ? (
                        <Image
                          src={character.image}
                          alt={character.name}
                          fill
                          sizes="48px"
                          className="object-cover object-top"
                        />
                      ) : (
                        <div
                          className={`flex h-full w-full items-center justify-center text-sm font-black text-white ${
                            index === 1
                              ? "bg-gradient-to-br from-fuchsia-500 to-violet-700"
                              : "bg-gradient-to-br from-emerald-500 to-teal-700"
                          }`}
                        >
                          {character.initials}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-black text-white">
                          {character.name}
                        </p>

                        <Volume2 className="h-3.5 w-3.5 shrink-0 text-violet-300" />
                      </div>

                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {character.role}
                      </p>

                      <p className="mt-1 truncate text-[10px] font-semibold text-violet-300">
                        {character.voice}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="relative flex flex-col gap-4 border-t border-white/10 bg-white/[0.04] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 xl:px-12">
            <div>
              <p className="font-black text-white">
                Готові перевірити свою англійську в реальній ситуації?
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Почніть із першої місії London First Day.
              </p>
            </div>

            <Link
              href="/register"
              className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 text-sm font-black text-white shadow-xl shadow-violet-950/40 transition hover:-translate-y-0.5 hover:from-indigo-400 hover:to-violet-400"
            >
              Почати пригоду

              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
