import { NextResponse } from "next/server";

import { API_ERRORS } from "@/lib/i18n/errors";
import { createClient } from "@/lib/supabase/server";
import type {
  AssessmentTestRecord,
  PublicAssessmentTest,
} from "@/lib/testing/types";

function mapAssessmentTest(
  test: AssessmentTestRecord,
): PublicAssessmentTest {
  return {
    id: test.id,
    slug: test.slug,
    name: test.name_uk,
    description: test.description_uk,
    testType: test.test_type,
    cefrLevel: test.cefr_level,
    questionCount: test.question_count,
    passingScore: test.passing_score,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: API_ERRORS.unauthorized },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("assessment_tests")
      .select(
        `
          id,
          slug,
          name_uk,
          description_uk,
          test_type,
          cefr_level,
          question_count,
          passing_score,
          is_active,
          config,
          created_at,
          updated_at
        `,
      )
      .eq("is_active", true)
      .order("test_type", { ascending: true })
      .order("cefr_level", { ascending: true });

    if (error) {
  console.error("Failed to load assessment tests:", error);

  return NextResponse.json(
    { error: API_ERRORS.internalServerError },
    { status: 500 },
  );
}

    const tests = ((data ?? []) as AssessmentTestRecord[]).map(
      mapAssessmentTest,
    );

    return NextResponse.json({ tests });
  } catch (error) {
  console.error("Unexpected assessment tests error:", error);

  return NextResponse.json(
    { error: API_ERRORS.internalServerError },
    { status: 500 },
  );
}
}
