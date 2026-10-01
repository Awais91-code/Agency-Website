"use client";

import type { MediaLibraryItem } from "@/components/media/media-library";

export function MediaPicker({
  assets,
  selectedId,
  onSelect,
}: {
  assets: MediaLibraryItem[];
  selectedId?: string | null;
  onSelect: (asset: MediaLibraryItem) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {assets.map((asset) => (
        <button
          key={asset.id}
          type="button"
          onClick={() => onSelect(asset)}
          aria-pressed={selectedId === asset.id}
          className={`overflow-hidden rounded-xl border bg-card text-left ${selectedId === asset.id ? "ring-2 ring-ring" : ""}`}
        >
          <div className="aspect-video bg-muted">
            {asset.publicUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.publicUrl} alt={asset.alt_text ?? ""} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <p className="truncate p-3 text-sm font-medium">{asset.display_name}</p>
        </button>
      ))}
    </div>
  );
}
