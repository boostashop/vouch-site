// Branded magic-link email for Vouched.to.
//
// Built to the standard of a real product transactional email: hidden preheader,
// glow header, bulletproof (Outlook/VML) CTA button, monospace fallback link,
// security note, and a legitimacy footer showing the recipient. Table layout +
// inline styles only so it renders consistently across Gmail, Apple Mail, and
// Outlook.

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

const ACCENT = "#6366f1"
const ACCENT_BTN = "#4f46e5"

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  )
}

export function magicLinkEmail(
  url: string,
  recipient?: string,
): { subject: string; html: string; text: string } {
  const subject = "Your Vouched.to sign-in link"
  const safeEmail = recipient ? escapeHtml(recipient) : null

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<!--[if mso]><style>* {font-family:Helvetica,Arial,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#070708;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#070708;">Your secure sign-in link for Vouched.to — expires in 24 hours.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#070708;">
    <tr><td align="center" style="padding:48px 16px;">

      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;">

        <!-- Brand -->
        <tr><td align="center" style="padding-bottom:28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="width:34px;height:34px;vertical-align:middle;"><img src="https://vouched.to/logo.png" width="34" height="34" alt="Vouched.to" style="display:block;border-radius:9px;"></td>
            <td style="padding-left:10px;color:#ffffff;font:700 18px ${FONT};letter-spacing:-0.01em;vertical-align:middle;">Vouched.to</td>
          </tr></table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#141416;border:1px solid rgba(255,255,255,0.08);border-radius:20px;">

          <!-- glow strip -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td height="3" style="font-size:0;line-height:0;background:${ACCENT_BTN};background-image:linear-gradient(90deg,${ACCENT_BTN},#a855f7,#070708);border-radius:20px 20px 0 0;">&nbsp;</td>
          </tr></table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:44px 48px;">

            <h1 style="margin:0;color:#fafafa;font:800 26px ${FONT};letter-spacing:-0.02em;">Sign in to Vouched.to</h1>
            <p style="margin:14px 0 0;color:#a1a1aa;font:400 15px/1.65 ${FONT};">Use the button below to securely sign in. For your protection, this link expires in <strong style="color:#d4d4d8;">24 hours</strong> and can only be used once.</p>

            <!-- Bulletproof button -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 8px;"><tr><td>
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="28%" stroke="f" fillcolor="${ACCENT_BTN}">
              <w:anchorlock/><center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">Sign in &#8594;</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="${url}" style="display:inline-block;background:${ACCENT_BTN};color:#ffffff;text-decoration:none;font:700 15px ${FONT};line-height:50px;height:50px;padding:0 34px;border-radius:14px;">Sign in &rarr;</a>
              <!--<![endif]-->
            </td></tr></table>

            <p style="margin:24px 0 8px;color:#71717a;font:400 13px/1.6 ${FONT};">Or paste this link into your browser:</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="background:#0b0b0d;border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px 14px;">
                <a href="${url}" style="color:#a5b4fc;font:400 12px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;word-break:break-all;text-decoration:none;">${url}</a>
              </td>
            </tr></table>

            <div style="margin-top:28px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.07);">
              <p style="margin:0;color:#71717a;font:400 13px/1.6 ${FONT};">
                <span style="color:${ACCENT};">&#128274;</span>&nbsp; For your security, never share this link. Vouched.to will never ask you for it.
              </p>
            </div>

          </td></tr></table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:28px 48px 0;">
          ${safeEmail ? `<p style="margin:0 0 8px;color:#52525b;font:400 12px/1.6 ${FONT};">This link was requested for <span style="color:#a1a1aa;">${safeEmail}</span>. If that wasn&rsquo;t you, you can safely ignore this email — no action is needed.</p>` : `<p style="margin:0 0 8px;color:#52525b;font:400 12px/1.6 ${FONT};">If you didn&rsquo;t request this, you can safely ignore this email — no action is needed.</p>`}
          <p style="margin:14px 0 0;color:#3f3f46;font:600 11px ${FONT};letter-spacing:0.08em;text-transform:uppercase;">&copy; Vouched.to &middot; Reputation, secured</p>
        </td></tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`

  const text = `Sign in to Vouched.to

Use the link below to securely sign in. It expires in 24 hours and can only be used once.

${url}

For your security, never share this link.${recipient ? `\n\nThis link was requested for ${recipient}. If that wasn't you, ignore this email.` : `\n\nIf you didn't request this, you can ignore this email.`}

© Vouched.to`

  return { subject, html, text }
}

// ---------------------------------------------------------------------------
// Support-ticket notifications.
//
// Same visual language as the magic-link email (preheader, glow header,
// bulletproof CTA), reduced to a small branded shell so the user-facing and
// admin-facing variants stay consistent. Message bodies are escaped and
// rendered in a quoted block — these are notifications, the full thread lives
// on the site behind auth.
// ---------------------------------------------------------------------------

const APP_URL = (process.env.AUTH_URL || "https://vouched.to").replace(/\/$/, "")

// Trim a message to a notification-sized preview without breaking mid-escape.
function preview(body: string, max = 600): string {
  const t = body.trim()
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t
}

function ticketShell(opts: {
  preheader: string
  heading: string
  intro: string
  ticketSubject: string
  metaLine?: string
  body: string
  ctaLabel: string
  ctaUrl: string
  footer: string
}): string {
  const bodyHtml = escapeHtml(preview(opts.body)).replace(/\n/g, "<br>")
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<!--[if mso]><style>* {font-family:Helvetica,Arial,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#070708;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#070708;">${escapeHtml(opts.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#070708;">
    <tr><td align="center" style="padding:48px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;">

        <tr><td align="center" style="padding-bottom:28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="width:34px;height:34px;vertical-align:middle;"><img src="https://vouched.to/logo.png" width="34" height="34" alt="Vouched.to" style="display:block;border-radius:9px;"></td>
            <td style="padding-left:10px;color:#ffffff;font:700 18px ${FONT};letter-spacing:-0.01em;vertical-align:middle;">Vouched.to</td>
          </tr></table>
        </td></tr>

        <tr><td style="background:#141416;border:1px solid rgba(255,255,255,0.08);border-radius:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td height="3" style="font-size:0;line-height:0;background:${ACCENT_BTN};background-image:linear-gradient(90deg,${ACCENT_BTN},#a855f7,#070708);border-radius:20px 20px 0 0;">&nbsp;</td>
          </tr></table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:44px 48px;">

            <h1 style="margin:0;color:#fafafa;font:800 24px ${FONT};letter-spacing:-0.02em;">${escapeHtml(opts.heading)}</h1>
            <p style="margin:14px 0 0;color:#a1a1aa;font:400 15px/1.65 ${FONT};">${escapeHtml(opts.intro)}</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;"><tr>
              <td style="background:#0b0b0d;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px 20px;">
                <p style="margin:0;color:#fafafa;font:700 15px ${FONT};">${escapeHtml(opts.ticketSubject)}</p>
                ${opts.metaLine ? `<p style="margin:6px 0 0;color:#71717a;font:600 11px ${FONT};letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(opts.metaLine)}</p>` : ""}
                <p style="margin:14px 0 0;color:#d4d4d8;font:400 14px/1.7 ${FONT};">${bodyHtml}</p>
              </td>
            </tr></table>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 4px;"><tr><td>
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${opts.ctaUrl}" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="28%" stroke="f" fillcolor="${ACCENT_BTN}">
              <w:anchorlock/><center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${escapeHtml(opts.ctaLabel)} &#8594;</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="${opts.ctaUrl}" style="display:inline-block;background:${ACCENT_BTN};color:#ffffff;text-decoration:none;font:700 15px ${FONT};line-height:50px;height:50px;padding:0 34px;border-radius:14px;">${escapeHtml(opts.ctaLabel)} &rarr;</a>
              <!--<![endif]-->
            </td></tr></table>

          </td></tr></table>
        </td></tr>

        <tr><td style="padding:28px 48px 0;">
          <p style="margin:0;color:#52525b;font:400 12px/1.6 ${FONT};">${escapeHtml(opts.footer)}</p>
          <p style="margin:14px 0 0;color:#3f3f46;font:600 11px ${FONT};letter-spacing:0.08em;text-transform:uppercase;">&copy; Vouched.to &middot; Reputation, secured</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

const CATEGORY_LABELS: Record<string, string> = {
  ISSUE: "Issue",
  SUGGESTION: "Suggestion",
  BILLING: "Billing",
  ACCOUNT: "Account",
  OTHER: "Other",
}

// Sent to the ticket owner when a staff member replies.
export function ticketUserReplyEmail(opts: {
  recipient?: string
  ticketSubject: string
  body: string
  ticketId: string
}): { subject: string; html: string; text: string } {
  const url = `${APP_URL}/dashboard/support/${opts.ticketId}`
  const subject = `Re: ${opts.ticketSubject}`
  const html = ticketShell({
    preheader: "Our support team replied to your ticket.",
    heading: "We replied to your ticket",
    intro: "Our support team has responded. Open the ticket to read the full reply and continue the conversation.",
    ticketSubject: opts.ticketSubject,
    body: opts.body,
    ctaLabel: "View ticket",
    ctaUrl: url,
    footer:
      "You're receiving this because you opened a support ticket on Vouched.to. Reply to it from your dashboard — don't reply to this email.",
  })
  const text = `We replied to your ticket — "${opts.ticketSubject}"

${preview(opts.body)}

View and reply: ${url}

© Vouched.to`
  return { subject, html, text }
}

// Sent to staff when a user opens a ticket or replies to an existing one.
export function ticketStaffNotifyEmail(opts: {
  kind: "new" | "reply"
  fromName: string
  ticketSubject: string
  category: string
  body: string
  ticketId: string
}): { subject: string; html: string; text: string } {
  const url = `${APP_URL}/admin/support/${opts.ticketId}`
  const cat = CATEGORY_LABELS[opts.category] ?? opts.category
  const isNew = opts.kind === "new"
  const subject = isNew
    ? `[Support · ${cat}] ${opts.ticketSubject}`
    : `[Support · Reply] ${opts.ticketSubject}`
  const html = ticketShell({
    preheader: isNew ? `New ${cat.toLowerCase()} ticket from ${opts.fromName}.` : `${opts.fromName} replied to a ticket.`,
    heading: isNew ? "New support ticket" : "New reply on a ticket",
    intro: isNew
      ? `${opts.fromName} opened a new ${cat.toLowerCase()} ticket.`
      : `${opts.fromName} replied to an open ticket and it's waiting on staff.`,
    ticketSubject: opts.ticketSubject,
    metaLine: `${cat} · from ${opts.fromName}`,
    body: opts.body,
    ctaLabel: "Open in admin",
    ctaUrl: url,
    footer: "You're receiving this as a Vouched.to staff member. Manage tickets from the admin support queue.",
  })
  const text = `${isNew ? "New support ticket" : "New reply on a ticket"} — "${opts.ticketSubject}" (${cat}) from ${opts.fromName}

${preview(opts.body)}

Open in admin: ${url}

© Vouched.to`
  return { subject, html, text }
}

// Best-effort transactional send via Resend, factored out of auth.ts's inline
// magic-link send. Never throws: a mail failure must not roll back the DB write
// that triggered it. Returns whether the send succeeded.
export async function sendEmail(opts: {
  to: string | string[]
  subject: string
  html: string
  text: string
}): Promise<boolean> {
  const apiKey = process.env.AUTH_RESEND_KEY
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev"
  if (!apiKey) {
    console.error("[email] AUTH_RESEND_KEY not set — skipping send:", opts.subject)
    return false
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text }),
    })
    if (!res.ok) {
      console.error("[email] Resend error", res.status, await res.text().catch(() => ""))
      return false
    }
    return true
  } catch (err) {
    console.error("[email] send failed", err)
    return false
  }
}
