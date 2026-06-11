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
