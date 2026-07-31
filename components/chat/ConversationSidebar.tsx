"use client";

import {
  type KeyboardEvent,
  useRef,
  useState,
} from "react";

import {
  Loader2,
  MessageSquarePlus,
  PanelLeftClose,
  Pencil,
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
  renamingConversationId: string | null;
  disabled: boolean;
  onClose: () => void;
  onNewConversation: () => void;
  onOpenConversation: (id: string) => void;
  onRenameConversation: (
    id: string,
    title: string,
  ) => Promise<boolean>;
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
  renamingConversationId,
  disabled,
  onClose,
  onNewConversation,
  onOpenConversation,
  onRenameConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
  const [editingConversationId, setEditingConversationId] =
    useState<string | null>(null);

  const [draftTitle, setDraftTitle] = useState("");

  const skipNextBlurRef = useRef(false);
  const submittingRef = useRef(false);

  function startEditing(conversation: ConversationItem) {
    if (
      disabled ||
      deletingConversationId ||
      renamingConversationId
    ) {
      return;
    }

    setEditingConversationId(conversation.id);
    setDraftTitle(conversation.title);
  }

  function cancelEditing() {
    skipNextBlurRef.current = true;
    setEditingConversationId(null);
    setDraftTitle("");
  }

  async function submitRename(
    conversation: ConversationItem,
  ) {
    if (submittingRef.current) {
      return;
    }

    const title = draftTitle
      .replace(/\s+/g, " ")
      .trim();

    if (!title) {
      window.alert("Назва розмови обов'язкова.");
      return;
    }

    if (title.length > 60) {
      window.alert(
        "Назва розмови не може містити більше ніж 60 символів.",
      );
      return;
    }

    if (title === conversation.title) {
      setEditingConversationId(null);
      setDraftTitle("");
      return;
    }

    submittingRef.current = true;

    try {
      const renamed = await onRenameConversation(
        conversation.id,
        title,
      );

      if (renamed) {
        setEditingConversationId(null);
        setDraftTitle("");
      }
    } finally {
      submittingRef.current = false;
    }
  }

  function handleInputKeyDown(
  event: KeyboardEvent<HTMLInputElement>,
) {
  if (event.key === "Enter") {
    event.preventDefault();
    event.currentTarget.blur();
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    cancelEditing();
    return;
  }

  if (event.key === " " || event.key.length === 1) {
    event.stopPropagation();
  }
}

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
            Нова розмова
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Закрити список розмов"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Розмови
          </p>

          {conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-600">
                У вас ще немає розмов
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Почніть нову розмову з Emma.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isActive =
                  conversation.id === activeConversationId;

                const isDeleting =
                  deletingConversationId === conversation.id;

                const isRenaming =
                  renamingConversationId === conversation.id;

                const isEditing =
                  editingConversationId === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    className={`group flex min-h-11 items-center gap-1 rounded-xl transition ${
                      isActive
                        ? "bg-indigo-50"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    {isEditing ? (
                      <input
  autoFocus
  value={draftTitle}
  maxLength={60}
  disabled={isRenaming}
  onChange={(event) =>
    setDraftTitle(event.target.value)
  }
  onFocus={(event) =>
    event.currentTarget.select()
  }
  onKeyDown={handleInputKeyDown}
  onBlur={() => {
    if (skipNextBlurRef.current) {
      skipNextBlurRef.current = false;
      return;
    }

    void submitRename(conversation);
  }}
  aria-label={`Нова назва розмови "${conversation.title}"`}
  className="ml-2 min-w-0 flex-1 rounded-lg border border-indigo-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none ring-indigo-100 transition focus:ring-4 disabled:cursor-wait disabled:opacity-70"
/>
                    ) : (
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
                    )}

                    {isEditing && isRenaming ? (
                      <div
                        className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center text-indigo-500"
                        aria-label="Збереження назви"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(conversation)
                          }
                          disabled={
                            disabled ||
                            isDeleting ||
                            isRenaming ||
                            isEditing
                          }
                          title="Перейменувати розмову"
                          aria-label={`Перейменувати розмову "${conversation.title}"`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-100 transition hover:bg-indigo-100 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 lg:opacity-0 lg:group-hover:opacity-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDeleteConversation(
                              conversation.id,
                              conversation.title,
                            )
                          }
                          disabled={
                            disabled ||
                            isDeleting ||
                            isRenaming ||
                            isEditing
                          }
                          title="Видалити розмову"
                          aria-label={`Видалити розмову "${conversation.title}"`}
                          className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 lg:opacity-0 lg:group-hover:opacity-100"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </>
                    )}
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
          aria-label="Закрити список розмов"
        />
      )}
    </>
  );
}
