import { notFound } from "next/navigation";

import {
  executeSeoRedirect,
  resolveSeoRedirect,
} from "@/features/blog/redirects";

export const dynamic = "force-dynamic";

export default async function RedirectFallbackPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const sourcePath = `/${path.join("/")}`;
  const record = await resolveSeoRedirect(sourcePath);

  if (record) executeSeoRedirect(record);
  notFound();
}
