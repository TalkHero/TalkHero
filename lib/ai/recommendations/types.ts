export type RecommendationCategoryStats = {
  category: string;
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  percentage: number;
  averageResponseTimeMs: number | null;
};

export type RecommendationTopicStats = {
  topic: string;
  category: string | null;
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  percentage: number;
};

export type LearningRecommendation = {
  attemptId: string;

  strongestCategories: RecommendationCategoryStats[];
  weakestCategories: RecommendationCategoryStats[];

  weakestTopics: RecommendationTopicStats[];

  recommendedTopics: string[];

  averageResponseTimeMs: number | null;

  summary: string;
};
