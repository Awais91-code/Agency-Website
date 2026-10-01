import { ServiceEditor } from "@/components/services/service-editor";
import { getServiceAdminEditorData } from "@/features/services/admin";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ error?: string }> };

export default async function NewServicePage({ searchParams }: PageProps) {
  const query = await searchParams;
  const data = await getServiceAdminEditorData();
  return <ServiceEditor {...data} message={query.error ? { kind: "error", text: query.error } : null} />;
}
