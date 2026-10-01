"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireStaff } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";

const schema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600),
  durationMinutes: z.coerce.number().int().min(10).max(240),
  providerUrl: z.union([z.literal(""), z.url()]),
  isActive: z.boolean(),
});

export async function updateBookingTypeAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = schema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    description: formData.get("description"),
    durationMinutes: formData.get("durationMinutes"),
    providerUrl: String(formData.get("providerUrl") ?? "").trim(),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    redirect(`/admin/bookings?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid booking type.")}`);
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("booking_types")
    .update({
      label: parsed.data.label,
      description: parsed.data.description,
      duration_minutes: parsed.data.durationMinutes,
      provider_url: parsed.data.providerUrl || null,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.id);

  if (error) redirect(`/admin/bookings?error=${encodeURIComponent(error.message)}`);

  await admin.from("activity_events").insert({
    entity_type: "booking_type",
    entity_id: parsed.data.id,
    event_type: "booking_type.updated",
    actor_user_id: auth.userId,
    source: "admin",
    metadata: { active: parsed.data.isActive },
  });

  revalidatePath("/book");
  revalidatePath("/admin/bookings");
  redirect("/admin/bookings?saved=booking-type");
}
