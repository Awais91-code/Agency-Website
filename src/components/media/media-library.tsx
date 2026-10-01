"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type MediaLibraryItem = {
  id: string;
  display_name: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  visibility: "public" | "private";
  publicUrl: string | null;
  created_at: string;
};

type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: { message: string } };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibrary({ initialAssets }: { initialAssets: MediaLibraryItem[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [selectedId, setSelectedId] = useState(initialAssets[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(() => assets.find((asset) => asset.id === selectedId) ?? null, [assets, selectedId]);

  async function upload(formData: FormData) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: formData });
      const body = (await response.json()) as ApiEnvelope<MediaLibraryItem>;
      if (!body.ok) throw new Error(body.error.message);
      setAssets((current) => [body.data, ...current]);
      setSelectedId(body.data.id);
      setMessage("Upload complete.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveMetadata(formData: FormData) {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        displayName: String(formData.get("displayName") ?? ""),
        altText: String(formData.get("altText") ?? ""),
        caption: String(formData.get("caption") ?? ""),
      };
      const response = await fetch(`/api/admin/media/${selected.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as ApiEnvelope<MediaLibraryItem>;
      if (!body.ok) throw new Error(body.error.message);
      setAssets((current) => current.map((asset) => (asset.id === body.data.id ? body.data : asset)));
      setMessage("Metadata saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save metadata.");
    } finally {
      setBusy(false);
    }
  }

  async function archiveSelected() {
    if (!selected || !window.confirm(`Archive ${selected.display_name}?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/media/${selected.id}`, { method: "DELETE" });
      const body = (await response.json()) as ApiEnvelope<{ id: string }>;
      if (!body.ok) throw new Error(body.error.message);
      setAssets((current) => current.filter((asset) => asset.id !== selected.id));
      setSelectedId("");
      setMessage("Asset archived. The stored object is retained for safe reference cleanup.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not archive asset.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload public media</CardTitle>
            <CardDescription>JPEG, PNG or WebP only. Maximum 8 MB. File type and image dimensions are validated on the server.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              action={upload}
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="media-file">Image</Label>
                <Input id="media-file" name="file" type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} />
              </div>
              <Button type="submit" disabled={busy}>{busy ? "Working..." : "Upload"}</Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.length === 0 ? (
            <Card className="sm:col-span-2 lg:col-span-3"><CardContent className="pt-6 text-sm text-muted-foreground">No active media assets yet.</CardContent></Card>
          ) : assets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => setSelectedId(asset.id)}
              className={`overflow-hidden rounded-2xl border bg-card text-left transition ${selectedId === asset.id ? "ring-2 ring-ring" : "hover:border-foreground/30"}`}
            >
              <div className="aspect-[4/3] bg-muted">
                {asset.publicUrl && asset.mime_type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.publicUrl} alt={asset.alt_text ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">Private file</div>
                )}
              </div>
              <div className="space-y-1 p-4">
                <p className="truncate font-semibold">{asset.display_name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(asset.size_bytes)}{asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Card className="h-fit xl:sticky xl:top-6">
        <CardHeader>
          <CardTitle>Asset details</CardTitle>
          <CardDescription>Select an asset to edit reusable CMS metadata.</CardDescription>
        </CardHeader>
        <CardContent>
          {!selected ? <p className="text-sm text-muted-foreground">No asset selected.</p> : (
            <form key={selected.id} className="space-y-4" action={saveMetadata}>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input id="displayName" name="displayName" defaultValue={selected.display_name} required maxLength={160} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altText">Alt text</Label>
                <Input id="altText" name="altText" defaultValue={selected.alt_text ?? ""} maxLength={300} placeholder="Describe meaningful imagery" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <textarea id="caption" name="caption" defaultValue={selected.caption ?? ""} maxLength={800} rows={4} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>Save metadata</Button>
                {selected.publicUrl ? <Button asChild variant="outline"><a href={selected.publicUrl} target="_blank" rel="noreferrer">Open file</a></Button> : null}
                <Button type="button" variant="ghost" disabled={busy} onClick={() => void archiveSelected()}>Archive</Button>
              </div>
            </form>
          )}
          {message ? <p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
