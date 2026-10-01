import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "supabase/migrations/20260922052000_m10_consultation_booking.sql",
  "src/app/book/page.tsx",
  "src/app/admin/bookings/page.tsx",
  "src/app/api/webhooks/booking/route.ts",
  "src/features/booking/server.ts",
  "src/features/booking/webhook.ts",
  "docs/BOOKING.md",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("M10 missing required files:");
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

const migration = fs.readFileSync(path.join(root, required[0]), "utf8");
for (const token of ["booking_types", "booking_handoffs", "meetings", "booking_webhook_events"]) {
  if (!migration.includes(token)) {
    console.error(`M10 migration missing expected token: ${token}`);
    process.exit(1);
  }
}

const webhook = fs.readFileSync(path.join(root, "src/app/api/webhooks/booking/route.ts"), "utf8");
for (const token of ["CALCOM_WEBHOOK_SECRET", "booking_webhook_events", "consultation_booked", "lead_stage_history"]) {
  if (!webhook.includes(token)) {
    console.error(`M10 webhook missing expected behavior: ${token}`);
    process.exit(1);
  }
}

console.log("M10 Consultation Booking structural checks passed.");
