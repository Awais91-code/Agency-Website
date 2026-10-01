import { notFound } from "next/navigation";

import { ServiceEditor } from "@/components/services/service-editor";
import { getServiceAdminEditorData } from "@/features/services/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EditServicePage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getServiceAdminEditorData(id);
  if (!data.service) notFound();

  const message = query.error
    ? { kind: "error" as const, text: query.error }
    : query.saved
      ? { kind: "success" as const, text: "Service saved successfully." }
      : null;

  return <ServiceEditor {...data} message={message} />;
}
