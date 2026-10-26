import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLink, DemoBanner } from "@/components/layout/shell";
import { ContentContainer } from "@/components/layout/page";
import { Notice } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";

const steps = [
  [
    "Choose a synthetic case",
    "Alex has no previous colorectal screening reported; Jordan reports an earlier normal colonoscopy.",
  ],
  [
    "Complete the health intake",
    "Answer as the fictional patient. I don't know is always an option, and unknown stays unknown.",
  ],
  [
    "Physician review comes first",
    "Preliminary proposals, including possible redundant exams, reach the patient only after a physician reviews them.",
  ],
] as const;

export default function Entry() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <DemoBanner />
      <header className="border-b bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-workspace items-center px-4 py-4 md:px-8">
          <BrandLink href="/" />
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <ContentContainer>
          <header className="max-w-form">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Health360 · Preventive follow-up prototype
            </p>
            <h1>Better decisions, not more tests</h1>
            <p className="mt-3 text-muted-foreground">
              Health360 organizes a patient&apos;s health history before a
              preventive evaluation, points out possible redundant exams, and
              keeps a physician responsible for every plan.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild>
                <Link href="/patient">
                  Start the patient demo
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Link
                href="/doctor"
                className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
              >
                Or open the physician view
              </Link>
            </div>
          </header>
          <section aria-labelledby="next-steps-title">
            <h2 id="next-steps-title">What happens next</h2>
            <ol className="mt-6 grid gap-6 md:grid-cols-3">
              {steps.map(([title, description], index) => (
                <li key={title} className="border-t-2 pt-4">
                  <span className="text-xs font-medium text-muted-foreground">
                    Step {index + 1}
                  </span>
                  <h3 className="mt-3">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {description}
                  </p>
                </li>
              ))}
            </ol>
          </section>
          <Notice title="DEMONSTRATIVE — NOT CLINICALLY VALIDATED">
            All patients and records are synthetic. Rules and outcomes are
            demonstrative, and the in-app physician review is a demo step, not
            medical validation. Do not use for real care.
          </Notice>
        </ContentContainer>
      </main>
    </>
  );
}
