export function TypingIndicator() {
  return (
    <div
      className="flex h-7 items-center gap-1.5"
      aria-label="Emma is typing"
      role="status"
    >
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
    </div>
  );
}
