import type {
  AssessmentBlueprint,
  AssessmentBlueprintSlot,
} from "@/lib/testing/blueprints";
import type {
  AssessmentQuestionRecord,
  CefrLevel,
} from "@/lib/testing/types";

export type SelectedAssessmentQuestion = {
  question: AssessmentQuestionRecord;
  weight: number;
};

export type QuestionSelectionResult = {
  questions: SelectedAssessmentQuestion[];
  missingSlots: Array<{
    cefrLevel: CefrLevel;
    category: AssessmentBlueprintSlot["category"];
    requested: number;
    available: number;
  }>;
};

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

function questionMatchesSlot(
  question: AssessmentQuestionRecord,
  slot: AssessmentBlueprintSlot,
): boolean {
  if (question.status !== "published") {
    return false;
  }

  if (question.cefr_level !== slot.cefrLevel) {
    return false;
  }

  if (question.category !== slot.category) {
    return false;
  }

  if (!slot.questionTypes.includes(question.question_type)) {
    return false;
  }

  if (
    slot.difficulty &&
    !slot.difficulty.includes(question.difficulty)
  ) {
    return false;
  }

  return true;
}

export function selectQuestionsForBlueprint(
  pool: readonly AssessmentQuestionRecord[],
  blueprint: AssessmentBlueprint,
): QuestionSelectionResult {
  const selected: SelectedAssessmentQuestion[] = [];
  const selectedIds = new Set<string>();
  const missingSlots: QuestionSelectionResult["missingSlots"] = [];

  for (const slot of blueprint.slots) {
    const candidates = shuffle(
      pool.filter(
        (question) =>
          !selectedIds.has(question.id) &&
          questionMatchesSlot(question, slot),
      ),
    );

    const slotSelection = candidates.slice(0, slot.count);

    for (const question of slotSelection) {
      selectedIds.add(question.id);

      selected.push({
        question,
        weight: slot.weight ?? 1,
      });
    }

    if (slotSelection.length < slot.count) {
      missingSlots.push({
        cefrLevel: slot.cefrLevel,
        category: slot.category,
        requested: slot.count,
        available: slotSelection.length,
      });
    }
  }

  return {
    questions: selected,
    missingSlots,
  };
}
