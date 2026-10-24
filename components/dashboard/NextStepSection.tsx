import Link from "next/link";
import {
  ArrowRight,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type NextStep = {
  label: string;
  title: string;
  description: string;
  href: string;
  action: string;
  context: string;
};

type NextStepSectionProps = {
  step: NextStep;
};

export function NextStepSection({
  step,
}: NextStepSectionProps) {
  return (
    <section aria-labelledby="next-step-heading">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-white via-white to-primary-soft">
        <CardHeader className="pb-3">
          <Badge className="mb-2 w-fit">
            <Target aria-hidden="true" />
            {step.label}
          </Badge>

          <CardTitle
            id="next-step-heading"
            className="text-3xl sm:text-4xl"
          >
            {step.title}
          </CardTitle>

          <CardDescription className="max-w-3xl text-base leading-7">
            {step.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4 rounded-xl border border-primary/10 bg-white/80 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {step.context}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Продовжуйте з того місця, де зупинилися.
              </p>
            </div>

            <Link
              href={step.href}
              className={buttonVariants()}
            >
              {step.action}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}