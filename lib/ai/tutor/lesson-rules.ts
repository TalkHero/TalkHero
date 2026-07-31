import type { LessonContext } from "./types";

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

export function createLessonRulesPrompt(lesson: LessonContext) {
  return `
CURRENT LESSON

Lesson ID: ${lesson.id}
Level: ${lesson.level}
Unit: ${lesson.unit}
Lesson: ${lesson.lesson}
Title: ${lesson.title}
Topic: ${lesson.topic}

GRAMMAR FOCUS

${formatList(lesson.grammar)}

TARGET VOCABULARY

${formatList(lesson.vocabulary)}

LEARNING OBJECTIVES

${formatList(lesson.objectives)}

SPEAKING TASK

${lesson.speakingTask}

HOMEWORK

${lesson.homework}

LESSON BEHAVIOR

- Keep the conversation focused primarily on this lesson.
- Use the target grammar and vocabulary naturally.
- Give the student opportunities to produce their own sentences.
- Reuse target vocabulary during the conversation.
- Do not introduce several unrelated grammar topics.
- If the student asks an unrelated question, answer briefly and then return to the lesson.
- Do not announce all lesson instructions at once.
- Teach the lesson naturally through conversation.
- Do not claim that the lesson is completed unless the student has practiced its main objectives.
`;
}
