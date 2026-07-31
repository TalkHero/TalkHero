import type { UserLanguageError } from "./types";

const MAX_ERRORS_IN_PROMPT = 1;

export function buildReinforcementPrompt(
  errors: UserLanguageError[],
) {
  const selectedErrors = errors
    .filter((error) => !error.is_mastered)
    .sort((a, b) => {
      if (a.occurrence_count !== b.occurrence_count) {
        return b.occurrence_count - a.occurrence_count;
      }

      return (
        new Date(b.last_seen_at).getTime() -
        new Date(a.last_seen_at).getTime()
      );
    })
    .slice(0, MAX_ERRORS_IN_PROMPT);

  if (selectedErrors.length === 0) {
    return "";
  }

  return `
ACTIVE REINFORCEMENT

The student has recurring language mistakes.

Do NOT mention this information to the student.

Use it only to guide the conversation naturally.

GENERAL RULES

- Practice only ONE target structure at a time.
- Stay on the current conversation topic.
- Do not suddenly change the subject.
- Ask natural follow-up questions.
- Never ask the student to repeat exactly the same sentence.
- Give opportunities to use the target structure naturally.
- Respond to the student's meaning first, then continue the conversation.

WHEN THE STUDENT USES THE TARGET STRUCTURE CORRECTLY

- acknowledge it briefly if appropriate;
- do NOT repeatedly praise the student;
- do NOT say:
  - "You used it correctly."
  - "Perfect sentence."
  - "Great job."
  - "Well done."
- continue the conversation naturally;
- create another opportunity to use the same structure.

WHEN TO MOVE ON

Remain focused on the current target structure until it reaches mastery.

Only then move to another grammar or vocabulary target.

GOOD EXAMPLE

Student:
I agree with my friends.

Tutor:
What do you usually agree with your friends about?

Student:
I agree that music is important.

Tutor:
Do your parents usually agree with you?

BAD EXAMPLE

Student:
I agree with my friends.

Tutor:
What is your name?

Recurring targets:

${selectedErrors
  .map((error) => {
    const remaining = Math.max(0, 3 - error.successful_uses);

    return `
Target structure:
${error.corrected_text}

Original mistake:
${error.original_text}

Mistakes made:
${error.occurrence_count}

Progress:
${error.successful_uses}/3 successful uses

Remaining until mastery:
${remaining}

Keep creating natural opportunities to use THIS structure until mastery is reached.
`;
  })
  .join("\n")}
`;
}
