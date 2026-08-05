import type { ReactNode } from "react";

type SpeakerCardProps = {
  name: string;
  role?: string | null;
  avatar?: string | null;
  children: ReactNode;
};

export function SpeakerCard({ name, role, avatar, children }: SpeakerCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-4">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
            {name.trim().charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{name}</h2>
          {role && <p className="text-sm text-slate-500">{role}</p>}
        </div>
      </div>
      <div className="relative mt-5 rounded-2xl bg-slate-50 p-5 text-lg leading-8 text-slate-800 before:absolute before:-top-2 before:left-6 before:h-4 before:w-4 before:rotate-45 before:bg-slate-50">
        {children}
      </div>
    </section>
  );
}
