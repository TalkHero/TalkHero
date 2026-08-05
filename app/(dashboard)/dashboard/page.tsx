import { HomeScreen } from "@/components/dashboard/HomeScreen";

export default function DashboardPage() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <HomeScreen />
      </div>
    </main>
  );
}
