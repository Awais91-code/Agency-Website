import { CaseStudyEditor } from "@/components/case-studies/case-study-editor";
import { getCaseStudyAdminEditorData } from "@/features/case-studies/admin";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ error?: string }> };

export default async function NewCaseStudyPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const data = await getCaseStudyAdminEditorData();
  return <CaseStudyEditor {...data} message={query.error ? { kind: "error", text: query.error } : null} />;
}
