"use client";

import {
  Loader2,
  MessageSquarePlus,
  PanelLeftClose,
  Trash2,
} from "lucide-react";

export type ConversationItem = {
  id: string;
  title: string;
  created_at: string;
};

type ConversationSidebarProps = {
  open: boolean;
  conversations: ConversationItem[];
  activeConversationId: string | null;
  deletingConversationId: string | null;
  disabled: boolean;
  onClose: () => void;
  onNewConversation: () => void;
  onOpenConversation: (id: string) => void;
  onDeleteConversation: (
    id: string,
    title: string,
  ) => void;
};

export function ConversationSidebar({
  open,
  conversations,
  activeConversationId,
  deletingConversationId,
  disabled,
  onClose,
  onNewConversation,
  onOpenConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
  return (
    <>
      <aside
        className={`absolute inset-y-0 left-0 z-20 flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:relative lg:translate-x-0 ${
          open
            ? "translate-x-0"
            : "-translate-x-full lg:hidden"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 p-4">
          <button
            type="button"
            onClick={onNewConversation}
            disabled={disabled}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New conversation
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Close conversations"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Conversations
          </p>

          {conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-600">
                No conversations yet
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Start a new chat with Emma.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isActive =
                  conversation.id === activeConversationId;

                const isDeleting =
                  deletingConversationId === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    className={`group flex items-center gap-1 rounded-xl transition ${
                      isActive
                        ? "bg-indigo-50"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onOpenConversation(conversation.id)
                      }
                      disabled={disabled}
                      title={conversation.title}
                      className={`min-w-0 flex-1 truncate rounded-xl px-3 py-3 text-left text-sm transition ${
                        isActive
                          ? "font-semibold text-indigo-700"
                          : "text-slate-700"
                      }`}
                    >
                      {conversation.title}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDeleteConversation(
                          conversation.id,
                          conversation.title,
                        )
                      }
                      disabled={disabled}
                      title="Delete conversation"
                      aria-label={`Delete ${conversation.title}`}
                      className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 lg:opacity-0 lg:group-hover:opacity-100"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="absolute inset-0 z-10 bg-slate-950/30 lg:hidden"
          onClick={onClose}
          aria-label="Close conversations"
        />
      )}
    </>
  );
}
