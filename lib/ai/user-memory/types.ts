export const USER_MEMORY_CATEGORIES = [
  "personal",
  "location",
  "work",
  "education",
  "interest",
  "learning_goal",
  "preference",
] as const;

export type UserMemoryCategory = (typeof USER_MEMORY_CATEGORIES)[number];

export type DetectedUserMemory = {
  memoryKey: string;
  memoryValue: string;
  category: UserMemoryCategory;
  confidence: number;
};

export type AnalyzeUserMemoriesInput = {
  userId: string;
  conversationId: string | null;
  userMessage: string;
  assistantMessage: string;
};

export type SaveUserMemoriesInput = {
  userId: string;
  conversationId: string | null;
  memories: DetectedUserMemory[];
};
