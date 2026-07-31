import { createConversationRulesPrompt } from "./conversation-rules";
import { createCorrectionRulesPrompt } from "./correction-rules";
import { createLessonRulesPrompt } from "./lesson-rules";
import { createLevelRulesPrompt } from "./level-rules";
import { createPersonalityPrompt } from "./personality";
import { createTeachingRulesPrompt } from "./teaching-rules";
import type { TutorPromptContext } from "./types";

export function buildTutorPrompt({
  profile,
  lesson,
}: TutorPromptContext) {
  return [
    createPersonalityPrompt(profile),
    createTeachingRulesPrompt(),
    createLevelRulesPrompt(profile.level),
    createLessonRulesPrompt(lesson),
    createCorrectionRulesPrompt(profile),
    createConversationRulesPrompt(),
  ]
    .map((section) => section.trim())
    .join("\n\n");
}
