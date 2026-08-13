import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";

export function VideoDemo() {
  return (
    <section className="overflow-hidden bg-white py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl px-1 text-center sm:px-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
            <PlayCircle className="h-4 w-4" />
            Як працює TalkHero
          </div>

          <h2 className="mt-5 whitespace-normal break-words text-3xl font-black leading-tight tracking-tight text-slate-900 sm:mt-6 sm:text-5xl">
            Подивіться TalkHero в дії
          </h2>

          <p className="mx-auto mt-4 max-w-2xl whitespace-normal break-words text-base leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
            За кілька хвилин покажемо весь шлях: від реєстрації та знайомства з
            Emma до практики, словника та відстеження прогресу.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl sm:mt-14">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-200/70 sm:rounded-[32px]">
            <video
              className="aspect-video w-full bg-black object-cover"
              controls
              preload="metadata"
              playsInline
              poster="/images/talkhero-video-poster.png"
            >
              <source
                src="https://njyltfddwklkbmfehxvm.supabase.co/storage/v1/object/public/landing-media/video/TalkHero-english-teacher-online.mp4"
                type="video/mp4"
              />
              Ваш браузер не підтримує відтворення відео.
            </video>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 sm:w-auto"
          >
            Почати безкоштовно
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Без банківської картки
          </div>
        </div>
      </div>
    </section>
  );
}
