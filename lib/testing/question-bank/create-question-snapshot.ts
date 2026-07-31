import { sanitizeAssessmentQuestion } from "@/lib/testing/question-bank/sanitize-question";
import type {
  AssessmentQuestionRecord,
  PublicAssessmentQuestion,
} from "@/lib/testing/types";

export function createQuestionSnapshot(
  question: AssessmentQuestionRecord,
): PublicAssessmentQuestion {
  return sanitizeAssessmentQuestion(question);
}
