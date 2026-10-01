import type {
  EmailTemplateData,
  EmailTemplateKey,
  RenderedEmail,
} from "@/features/notifications/types";

function stringValue(data: EmailTemplateData, key: string, fallback = "") {
  const value = data[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paragraph(value: string) {
  return `<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.75">${escapeHtml(value)}</p>`;
}

function brandedLayout({
  agencyName,
  preheader,
  title,
  content,
  ctaLabel,
  ctaHref,
}: {
  agencyName: string;
  preheader: string;
  title: string;
  content: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const safeAgency = escapeHtml(agencyName);
  const cta =
    ctaLabel && ctaHref
      ? `<p style="margin:28px 0 8px"><a href="${escapeHtml(ctaHref)}" style="display:inline-block;border-radius:12px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;padding:13px 18px">${escapeHtml(ctaLabel)}</a></p>`
      : "";

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #e2e8f0">
                <strong style="font-size:18px">${safeAgency}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px">
                <h1 style="margin:0 0 20px;font-size:28px;line-height:1.15;letter-spacing:-0.02em">${escapeHtml(title)}</h1>
                ${content}
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.6">
                This is a transactional message from ${safeAgency}. Please keep this email for your records.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderEmailTemplate(
  templateKey: EmailTemplateKey,
  data: EmailTemplateData,
): RenderedEmail {
  const agencyName = stringValue(data, "agencyName", "Agency");
  const appUrl = stringValue(data, "appUrl", "http://localhost:3000");
  const name = stringValue(data, "name", "there");

  switch (templateKey) {
    case "enquiry-confirmation": {
      const serviceType = stringValue(data, "serviceType", "your project");
      const bookingUrl = stringValue(data, "bookingUrl", `${appUrl}/book`);
      const subject = `We received your project brief — ${agencyName}`;
      const text = `Hi ${name}, we received your project brief for ${serviceType}. Our team will review it and follow up. You can book a consultation here: ${bookingUrl}`;
      const content =
        paragraph(`Hi ${name},`) +
        paragraph(`Thanks for sharing the context for ${serviceType}. Your project brief is now in our review queue.`) +
        paragraph("We will use the submitted scope, timing and budget context to prepare the next useful step.");
      return {
        subject,
        text,
        html: brandedLayout({
          agencyName,
          preheader: "Your project brief has been received.",
          title: "Your project brief is in the review queue.",
          content,
          ctaLabel: "Book a consultation",
          ctaHref: bookingUrl,
        }),
      };
    }

    case "booking": {
      const status = stringValue(data, "bookingStatus", "scheduled");
      const startsAt = stringValue(data, "startsAt", "the scheduled time");
      const timezone = stringValue(data, "timezone", "your selected timezone");
      const meetingUrl = stringValue(data, "meetingUrl");
      const cancelled = status === "cancelled";
      const subject = cancelled
        ? `Consultation cancelled — ${agencyName}`
        : `Consultation confirmed — ${agencyName}`;
      const text = cancelled
        ? `Hi ${name}, your consultation scheduled for ${startsAt} has been cancelled.`
        : `Hi ${name}, your consultation is confirmed for ${startsAt} (${timezone}).${meetingUrl ? ` Join: ${meetingUrl}` : ""}`;
      const content =
        paragraph(`Hi ${name},`) +
        paragraph(
          cancelled
            ? `The consultation scheduled for ${startsAt} has been cancelled. Your original project brief remains saved.`
            : `Your consultation is confirmed for ${startsAt} (${timezone}).`,
        ) +
        (!cancelled && meetingUrl ? paragraph("Use the button below when it is time to join.") : "");
      return {
        subject,
        text,
        html: brandedLayout({
          agencyName,
          preheader: cancelled ? "Your consultation was cancelled." : "Your consultation is confirmed.",
          title: cancelled ? "Consultation cancelled." : "Consultation confirmed.",
          content,
          ctaLabel: !cancelled && meetingUrl ? "Join meeting" : undefined,
          ctaHref: !cancelled && meetingUrl ? meetingUrl : undefined,
        }),
      };
    }

    case "invite": {
      const inviteUrl = stringValue(data, "inviteUrl", `${appUrl}/login`);
      const subject = `You have been invited to ${agencyName}`;
      const text = `Hi ${name}, you have been invited to ${agencyName}. Accept the invitation: ${inviteUrl}`;
      return {
        subject,
        text,
        html: brandedLayout({
          agencyName,
          preheader: "Your secure account invitation.",
          title: "You have been invited.",
          content: paragraph(`Hi ${name},`) + paragraph("Use the secure invitation link below to finish setting up your account."),
          ctaLabel: "Accept invitation",
          ctaHref: inviteUrl,
        }),
      };
    }

    case "password-reset": {
      const resetUrl = stringValue(data, "resetUrl", `${appUrl}/forgot-password`);
      const subject = `Reset your ${agencyName} password`;
      const text = `Use this secure link to reset your password: ${resetUrl}`;
      return {
        subject,
        text,
        html: brandedLayout({
          agencyName,
          preheader: "Secure password reset.",
          title: "Reset your password.",
          content: paragraph("A password reset was requested for your account. If this was not you, you can ignore this email."),
          ctaLabel: "Reset password",
          ctaHref: resetUrl,
        }),
      };
    }

    case "onboarding": {
      const portalUrl = stringValue(data, "portalUrl", `${appUrl}/portal`);
      const subject = `Welcome to your ${agencyName} project workspace`;
      const text = `Hi ${name}, your project workspace is ready: ${portalUrl}`;
      return {
        subject,
        text,
        html: brandedLayout({
          agencyName,
          preheader: "Your project workspace is ready.",
          title: "Welcome to your project workspace.",
          content: paragraph(`Hi ${name},`) + paragraph("Your secure project workspace is ready for project status, files, requests and approvals."),
          ctaLabel: "Open workspace",
          ctaHref: portalUrl,
        }),
      };
    }

    case "project-update": {
      const projectName = stringValue(data, "projectName", "Your project");
      const update = stringValue(data, "update", "A new project update is available.");
      const projectUrl = stringValue(data, "projectUrl", `${appUrl}/portal`);
      const subject = `${projectName} update — ${agencyName}`;
      const text = `${projectName}: ${update} View the project: ${projectUrl}`;
      return {
        subject,
        text,
        html: brandedLayout({
          agencyName,
          preheader: `${projectName} has a new update.`,
          title: `${projectName} update`,
          content: paragraph(update),
          ctaLabel: "View project",
          ctaHref: projectUrl,
        }),
      };
    }

    case "admin-new-lead": {
      const leadName = stringValue(data, "leadName", "New lead");
      const leadEmail = stringValue(data, "leadEmail", "No email");
      const company = stringValue(data, "company", "No company");
      const serviceType = stringValue(data, "serviceType", "General enquiry");
      const score = stringValue(data, "leadScore", "0");
      const crmUrl = stringValue(data, "crmUrl", `${appUrl}/admin/leads`);
      const subject = `New lead: ${leadName} · score ${score}`;
      const text = `New lead: ${leadName}, ${leadEmail}, ${company}, ${serviceType}, score ${score}. CRM: ${crmUrl}`;
      return {
        subject,
        text,
        html: brandedLayout({
          agencyName,
          preheader: `New lead ${leadName}.`,
          title: "A new project lead is ready for review.",
          content:
            paragraph(`Lead: ${leadName}`) +
            paragraph(`Email: ${leadEmail}`) +
            paragraph(`Company: ${company}`) +
            paragraph(`Service: ${serviceType} · Lead score: ${score}/100`),
          ctaLabel: "Open CRM lead",
          ctaHref: crmUrl,
        }),
      };
    }

    case "admin-booking": {
      const attendee = stringValue(data, "attendeeName", "Prospect");
      const attendeeEmail = stringValue(data, "attendeeEmail", "No email");
      const startsAt = stringValue(data, "startsAt", "Unknown time");
      const status = stringValue(data, "bookingStatus", "scheduled");
      const crmUrl = stringValue(data, "crmUrl", `${appUrl}/admin/leads`);
      const subject = `Booking ${status}: ${attendee}`;
      const text = `Booking ${status}: ${attendee} (${attendeeEmail}) at ${startsAt}. CRM: ${crmUrl}`;
      return {
        subject,
        text,
        html: brandedLayout({
          agencyName,
          preheader: `Booking ${status}: ${attendee}.`,
          title: `Consultation ${status}.`,
          content:
            paragraph(`Attendee: ${attendee}`) +
            paragraph(`Email: ${attendeeEmail}`) +
            paragraph(`Time: ${startsAt}`),
          ctaLabel: "Open CRM",
          ctaHref: crmUrl,
        }),
      };
    }

    case "admin-alert": {
      const alertTitle = stringValue(data, "alertTitle", "Notification alert");
      const alertBody = stringValue(data, "alertBody", "An operational notification requires review.");
      const adminUrl = stringValue(data, "adminUrl", `${appUrl}/admin/notifications`);
      return {
        subject: `${alertTitle} — ${agencyName}`,
        text: `${alertTitle}: ${alertBody} ${adminUrl}`,
        html: brandedLayout({
          agencyName,
          preheader: alertTitle,
          title: alertTitle,
          content: paragraph(alertBody),
          ctaLabel: "Open notifications",
          ctaHref: adminUrl,
        }),
      };
    }
  }
}

export function sampleTemplateData(templateKey: EmailTemplateKey): EmailTemplateData {
  const common = {
    agencyName: "Agency",
    appUrl: "http://localhost:3000",
    name: "Alex",
  };

  switch (templateKey) {
    case "enquiry-confirmation":
      return { ...common, serviceType: "Web application", bookingUrl: "http://localhost:3000/book?context=preview" };
    case "booking":
      return { ...common, bookingStatus: "scheduled", startsAt: "Tuesday, 10:30 AM", timezone: "Asia/Karachi", meetingUrl: "https://example.com/meeting" };
    case "invite":
      return { ...common, inviteUrl: "http://localhost:3000/login?preview=invite" };
    case "password-reset":
      return { ...common, resetUrl: "http://localhost:3000/reset-password?preview=1" };
    case "onboarding":
      return { ...common, portalUrl: "http://localhost:3000/portal" };
    case "project-update":
      return { ...common, projectName: "Digital Platform", update: "The design milestone is ready for review.", projectUrl: "http://localhost:3000/portal" };
    case "admin-new-lead":
      return { ...common, leadName: "Alex Morgan", leadEmail: "alex@example.com", company: "Example Co", serviceType: "Automation", leadScore: 78, crmUrl: "http://localhost:3000/admin/leads/preview" };
    case "admin-booking":
      return { ...common, attendeeName: "Alex Morgan", attendeeEmail: "alex@example.com", startsAt: "Tuesday, 10:30 AM", bookingStatus: "scheduled", crmUrl: "http://localhost:3000/admin/leads/preview" };
    case "admin-alert":
      return { ...common, alertTitle: "Delivery needs attention", alertBody: "A transactional message could not be delivered.", adminUrl: "http://localhost:3000/admin/notifications" };
  }
}

export const emailTemplateLabels: Record<EmailTemplateKey, string> = {
  "enquiry-confirmation": "Enquiry confirmation",
  booking: "Booking notification",
  invite: "Account invitation",
  "password-reset": "Password reset",
  onboarding: "Client onboarding",
  "project-update": "Project update",
  "admin-new-lead": "Admin · new lead",
  "admin-booking": "Admin · booking",
  "admin-alert": "Admin · operational alert",
};
