import { redirect } from "next/navigation";

export default async function QuoteAliasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  redirect(`/start-a-project${query.size ? `?${query.toString()}` : ""}`);
}
