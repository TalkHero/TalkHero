export function normalizeQuestion(question: string): string {

    return question
        .toLowerCase()
        .trim()
        .replace(/[.,!?;:]/g, "")
        .replace(/\s+/g, " ");
}
