import Link from "next/link";

import {
  archiveFaqAction,
  archiveTeamMemberAction,
  archiveTestimonialAction,
  saveContentSectionAction,
  saveFaqAction,
  saveTeamMemberAction,
  saveTestimonialAction,
} from "@/app/admin/content/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getContentAdminData } from "@/features/content/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

function StatusSelect({ name = "status", value = "draft" }: { name?: string; value?: string }) {
  return (
    <select name={name} defaultValue={value} className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
      <option value="draft">Draft</option>
      <option value="published">Published</option>
      <option value="archived">Archived</option>
    </select>
  );
}

function TextInput({
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  type?: string;
}) {
  return <input name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" />;
}

export default async function AdminContentPage({ searchParams }: PageProps) {
  const [query, data] = await Promise.all([searchParams, getContentAdminData()]);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">M11 · Content management</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Content</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Manage selected marketing sections, testimonials, FAQs and team profiles without editing code.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/admin/services">Services</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/case-studies">Case studies</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/media">Media</Link></Button>
        </div>
      </div>

      {query.error ? <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-700">{query.error}</div> : null}
      {query.saved ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700">Content saved.</div> : null}

      <div className="flex flex-wrap gap-2 text-sm font-semibold">
        <a className="rounded-full border border-border px-3 py-2 hover:bg-muted" href="#sections">Page sections</a>
        <a className="rounded-full border border-border px-3 py-2 hover:bg-muted" href="#testimonials">Testimonials</a>
        <a className="rounded-full border border-border px-3 py-2 hover:bg-muted" href="#faqs">FAQs</a>
        <a className="rounded-full border border-border px-3 py-2 hover:bg-muted" href="#team">Team</a>
      </div>

      <div id="sections" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-black">Selected page sections</h2>
          <p className="mt-1 text-sm text-muted-foreground">Homepage hero and About story are wired to the public site in M11.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {data.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-lg">{section.section_key}</CardTitle>
                <CardDescription>Current status: {section.status}</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={saveContentSectionAction} className="space-y-3">
                  <input type="hidden" name="id" value={section.id} />
                  <TextInput name="eyebrow" defaultValue={section.eyebrow} placeholder="Eyebrow" />
                  <TextInput name="title" defaultValue={section.title} placeholder="Title" />
                  <textarea name="body" defaultValue={section.body} rows={5} className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput name="ctaLabel" defaultValue={section.cta_label} placeholder="CTA label" />
                    <TextInput name="ctaHref" defaultValue={section.cta_href} placeholder="/start-a-project" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <StatusSelect value={section.status} />
                    <Button type="submit" size="sm">Save section</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div id="testimonials" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-black">Testimonials</h2>
          <p className="mt-1 text-sm text-muted-foreground">A testimonial is public only when it is published and public permission is explicitly confirmed.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Add testimonial</CardTitle></CardHeader>
          <CardContent>
            <form action={saveTestimonialAction} className="grid gap-3 lg:grid-cols-2">
              <TextInput name="clientName" placeholder="Client name" />
              <TextInput name="companyName" placeholder="Company" />
              <TextInput name="roleTitle" placeholder="Role / title" />
              <TextInput name="sortOrder" defaultValue="100" type="number" />
              <textarea name="quote" required rows={4} placeholder="Approved testimonial quote" className="lg:col-span-2 w-full rounded-xl border border-border bg-background p-3 text-sm" />
              <select name="mediaAssetId" defaultValue="" className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="">No portrait</option>
                {data.media.map((media) => <option key={media.id} value={media.id}>{media.display_name || media.original_name}</option>)}
              </select>
              <StatusSelect />
              <label className="lg:col-span-2 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="permissionGranted" /> Public permission confirmed</label>
              <div className="lg:col-span-2"><Button type="submit" size="sm">Create testimonial</Button></div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          {data.testimonials.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <form action={saveTestimonialAction} className="space-y-3">
                  <input type="hidden" name="id" value={item.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput name="clientName" defaultValue={item.client_name} />
                    <TextInput name="companyName" defaultValue={item.company_name} />
                    <TextInput name="roleTitle" defaultValue={item.role_title} />
                    <TextInput name="sortOrder" defaultValue={String(item.sort_order)} type="number" />
                  </div>
                  <textarea name="quote" defaultValue={item.quote} rows={4} className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select name="mediaAssetId" defaultValue={item.media_asset_id ?? ""} className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
                      <option value="">No portrait</option>
                      {data.media.map((media) => <option key={media.id} value={media.id}>{media.display_name || media.original_name}</option>)}
                    </select>
                    <StatusSelect value={item.status} />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="permissionGranted" defaultChecked={item.permission_granted} /> Public permission confirmed</label>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Save</Button>
                  </div>
                </form>
                <form action={archiveTestimonialAction} className="mt-2">
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" size="sm" variant="ghost">Archive</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div id="faqs" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-black">FAQs</h2>
          <p className="mt-1 text-sm text-muted-foreground">General published FAQs are rendered on the homepage.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Add FAQ</CardTitle></CardHeader>
          <CardContent>
            <form action={saveFaqAction} className="grid gap-3 lg:grid-cols-2">
              <TextInput name="category" defaultValue="general" />
              <TextInput name="sortOrder" defaultValue="100" type="number" />
              <TextInput name="question" placeholder="Question" />
              <StatusSelect />
              <textarea name="answer" required rows={4} placeholder="Answer" className="lg:col-span-2 w-full rounded-xl border border-border bg-background p-3 text-sm" />
              <div className="lg:col-span-2"><Button type="submit" size="sm">Create FAQ</Button></div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          {data.faqs.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <form action={saveFaqAction} className="space-y-3">
                  <input type="hidden" name="id" value={item.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput name="category" defaultValue={item.category} />
                    <TextInput name="sortOrder" defaultValue={String(item.sort_order)} type="number" />
                  </div>
                  <TextInput name="question" defaultValue={item.question} />
                  <textarea name="answer" defaultValue={item.answer} rows={4} className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
                  <div className="flex items-center justify-between gap-3">
                    <StatusSelect value={item.status} />
                    <Button type="submit" size="sm">Save</Button>
                  </div>
                </form>
                <form action={archiveFaqAction} className="mt-2">
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" size="sm" variant="ghost">Archive</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div id="team" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-black">Team</h2>
          <p className="mt-1 text-sm text-muted-foreground">Published team members appear on the About page.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Add team member</CardTitle></CardHeader>
          <CardContent>
            <form action={saveTeamMemberAction} className="grid gap-3 lg:grid-cols-2">
              <TextInput name="displayName" placeholder="Name" />
              <TextInput name="roleTitle" placeholder="Role" />
              <TextInput name="publicEmail" placeholder="Public email (optional)" type="email" />
              <TextInput name="linkedinUrl" placeholder="LinkedIn URL (optional)" type="url" />
              <select name="mediaAssetId" defaultValue="" className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="">No portrait</option>
                {data.media.map((media) => <option key={media.id} value={media.id}>{media.display_name || media.original_name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <TextInput name="sortOrder" defaultValue="100" type="number" />
                <StatusSelect />
              </div>
              <textarea name="bio" rows={4} placeholder="Short public bio" className="lg:col-span-2 w-full rounded-xl border border-border bg-background p-3 text-sm" />
              <div className="lg:col-span-2"><Button type="submit" size="sm">Create team member</Button></div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          {data.team.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-5">
                <form action={saveTeamMemberAction} className="space-y-3">
                  <input type="hidden" name="id" value={member.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput name="displayName" defaultValue={member.display_name} />
                    <TextInput name="roleTitle" defaultValue={member.role_title} />
                    <TextInput name="publicEmail" defaultValue={member.public_email} type="email" />
                    <TextInput name="linkedinUrl" defaultValue={member.linkedin_url} type="url" />
                  </div>
                  <textarea name="bio" defaultValue={member.bio} rows={4} className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <select name="mediaAssetId" defaultValue={member.media_asset_id ?? ""} className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
                      <option value="">No portrait</option>
                      {data.media.map((media) => <option key={media.id} value={media.id}>{media.display_name || media.original_name}</option>)}
                    </select>
                    <TextInput name="sortOrder" defaultValue={String(member.sort_order)} type="number" />
                    <StatusSelect value={member.status} />
                  </div>
                  <Button type="submit" size="sm">Save</Button>
                </form>
                <form action={archiveTeamMemberAction} className="mt-2">
                  <input type="hidden" name="id" value={member.id} />
                  <Button type="submit" size="sm" variant="ghost">Archive</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
