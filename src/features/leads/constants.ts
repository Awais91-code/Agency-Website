import type { Database } from "@/types/database";

export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type LeadPriority = Database["public"]["Enums"]["lead_priority"];

export const leadStatuses: LeadStatus[] = [
  "new",
  "qualified",
  "contacted",
  "consultation_booked",
  "discovery_complete",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
  "nurture",
];

export const leadPriorities: LeadPriority[] = ["low", "normal", "high", "urgent"];

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "New",
  qualified: "Qualified",
  contacted: "Contacted",
  consultation_booked: "Consultation booked",
  discovery_complete: "Discovery complete",
  proposal_sent: "Proposal sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
  nurture: "Nurture",
};

export const leadPriorityLabels: Record<LeadPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export function statusClass(status: LeadStatus) {
  const map: Record<LeadStatus, string> = {
    new: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    qualified: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    contacted: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    consultation_booked: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    discovery_complete: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    proposal_sent: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    negotiation: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    won: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    lost: "bg-red-500/10 text-red-700 dark:text-red-300",
    nurture: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  };
  return map[status];
}

export function priorityClass(priority: LeadPriority) {
  const map: Record<LeadPriority, string> = {
    low: "bg-muted text-muted-foreground",
    normal: "bg-primary/8 text-primary",
    high: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    urgent: "bg-red-500/10 text-red-700 dark:text-red-300",
  };
  return map[priority];
}
