export type NPCEmotion =
  | "happy"
  | "neutral"
  | "thinking"
  | "surprised"
  | "encouraging"
  | "celebrating";

export type NPCAccent =
  | "british"
  | "american"
  | "neutral";

export type NPCVoiceId =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "nova"
  | "onyx"
  | "sage"
  | "shimmer"
  | "verse"
  | "marin"
  | "cedar";

export type NPC = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  emotion: NPCEmotion;
  accent: NPCAccent;
  voiceId: NPCVoiceId | null;
  theme:
    | "violet"
    | "emerald"
    | "blue"
    | "amber"
    | "rose"
    | "slate";
};

export const NPCS: Record<string, NPC> = {
  emma: {
    id: "emma",
    name: "Емма",
    role: "Ваш наставник",
    avatar: "🙂",
    emotion: "encouraging",
    accent: "british",
    voiceId: "marin",
    theme: "violet",
  },

  mia: {
    id: "mia",
    name: "Mia",
    role: "Barista",
    avatar: "☕",
    emotion: "happy",
    accent: "british",
    voiceId: "coral",
    theme: "emerald",
  },

  oliver: {
    id: "oliver",
    name: "Oliver",
    role: "Station assistant",
    avatar: "🚇",
    emotion: "neutral",
    accent: "british",
    voiceId: "cedar",
    theme: "blue",
  },

  sophie: {
    id: "sophie",
    name: "Sophie",
    role: "Receptionist",
    avatar: "🏨",
    emotion: "happy",
    accent: "british",
    voiceId: "nova",
    theme: "amber",
  },

  daniel: {
    id: "daniel",
    name: "Daniel",
    role: "Check-in agent",
    avatar: "✈️",
    emotion: "neutral",
    accent: "british",
    voiceId: "onyx",
    theme: "blue",
  },
};

export function getNPC(
  id: string | null | undefined,
): NPC | null {
  if (!id) {
    return null;
  }

  return NPCS[id.trim().toLowerCase()] ?? null;
}

export function getNPCBySpeaker(
  speaker: string | null | undefined,
): NPC | null {
  if (!speaker) {
    return null;
  }

  const normalized = speaker
    .trim()
    .toLowerCase();

  return (
    Object.values(NPCS).find(
      (npc) =>
        npc.id === normalized ||
        npc.name.toLowerCase() === normalized,
    ) ?? null
  );
}
