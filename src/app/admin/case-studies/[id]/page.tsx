import { notFound } from "next/navigation";

import { CaseStudyEditor } from "@/components/case-studies/case-study-editor";
import { getCaseStudyAdminEditorData } from "@/features/case-studies/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EditCaseStudyPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getCaseStudyAdminEditorData(id);
  if (!data.caseStudy) notFound();

  const message = query.error
    ? { kind: "error" as const, text: query.error }
    : query.saved
      ? { kind: "success" as const, text: "Case study saved." }
      : null;

  return <CaseStudyEditor {...data} message={message} />;
}
