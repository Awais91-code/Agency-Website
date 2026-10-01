import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import {
  AdminBlogArchiveForm,
  AdminBlogPostForm,
} from "@/components/blog/admin-post-form";
import { Button } from "@/components/ui/button";
import {
  getBlogAdminData,
  getBlogAdminPost,
} from "@/features/blog/admin";
import { requireStaff } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EditBlogPostPage({
  params,
  searchParams,
}: PageProps) {
  await requireStaff();
  const [{ id }, query] = await Promise.all([params, searchParams]);

  if (!z.string().uuid().safeParse(id).success) notFound();

  let postData;

  try {
    postData = await getBlogAdminPost(id);
  } catch {
    notFound();
  }

  const data = await getBlogAdminData();

  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Blog CMS</p>
          <h1 className="mt-2 text-3xl font-black">Edit article</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {postData.post.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/blog">Blog overview</Link>
          </Button>
          {postData.post.status === "published" ? (
            <Button asChild variant="ghost">
              <Link href={`/blog/${postData.post.slug}`} target="_blank">
                Public page
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {query.error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700">
          {query.error}
        </div>
      ) : null}

      {query.saved ? (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700">
          Article saved.
        </div>
      ) : null}

      <AdminBlogPostForm data={data} postData={postData} />
      <AdminBlogArchiveForm id={postData.post.id} />
    </section>
  );
}
