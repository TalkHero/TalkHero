import type { UserLanguageError } from "./types";

export function buildErrorMemoryPrompt(
  errors: UserLanguageError[],
) {
  if (errors.length === 0) {
    return "";
  }

  return `
KNOWN STUDENT MISTAKES

The student repeatedly makes the following mistakes.

Pay special attention to them.

When appropriate:

- encourage the student to use the correct structure again;
- reinforce correct usage naturally;
- do not mention this list directly.

${errors
  .map(
    (error) => `
• ${error.corrected_text}
Repeated ${error.occurrence_count} times.
`,
  )
  .join("\n")}
`;
}
