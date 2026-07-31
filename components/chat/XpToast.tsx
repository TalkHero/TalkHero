type XpToastData = {
  amount: number;
  totalXp: number;
  level: number;
};

type XpToastProps = {
  xp: XpToastData | null;
};

export function XpToast({ xp }: XpToastProps) {
  if (!xp) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-lg">
          ✨
        </div>

        <div>
          <p className="text-sm font-bold text-amber-800">
            +{xp.amount} XP
          </p>

          <p className="text-xs text-amber-700">
              Всього: {xp.totalXp} XP · Рівень {xp.level}
          </p>
        </div>
      </div>
    </div>
  );
}
