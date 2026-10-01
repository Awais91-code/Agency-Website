import Link from "next/link";

import { AdminBlogPostForm } from "@/components/blog/admin-post-form";
import { Button } from "@/components/ui/button";
import { getBlogAdminData } from "@/features/blog/admin";
import { requireStaff } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewBlogPostPage({ searchParams }: PageProps) {
  await requireStaff();
  const [query, data] = await Promise.all([searchParams, getBlogAdminData()]);

  return (
    <section>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Blog CMS</p>
          <h1 className="mt-2 text-3xl font-black">New article</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/blog">Back to blog</Link>
        </Button>
      </div>

      {query.error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700">
          {query.error}
        </div>
      ) : null}

      <AdminBlogPostForm data={data} postData={null} />
    </section>
  );
}
