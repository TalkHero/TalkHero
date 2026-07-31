import type {
  AssessmentQuestionRecord,
  PublicAssessmentQuestion,
} from "@/lib/testing/types";

export function sanitizeAssessmentQuestion(
  question: AssessmentQuestionRecord,
): PublicAssessmentQuestion {
 return {
  id: question.id,
  cefrLevel: question.cefr_level,
  category: question.category,
  questionType: question.question_type,
  prompt: question.prompt,
  passage: question.passage,
  options: question.options,
  difficulty: question.difficulty,
  estimatedTimeSeconds: question.estimated_time_seconds,
  topic: question.topic,
};
}
