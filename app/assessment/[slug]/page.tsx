import { AssessmentRunner } from "@/components/assessment/AssessmentRunner";

type AssessmentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AssessmentPage({
  params,
}: AssessmentPageProps) {
  const { slug } = await params;

  return <AssessmentRunner slug={slug} />;
}
