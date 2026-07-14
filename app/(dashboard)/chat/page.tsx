import { ChatBox } from "@/components/chat/ChatBox";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function ChatPage() {
  return (
    <main className="flex h-screen flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold">🎓 TalkHero</h1>

        <LogoutButton />
      </header>

      <div className="flex-1">
        <ChatBox />
      </div>
    </main>
  );
}
