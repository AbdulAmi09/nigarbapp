import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

const vapidPublic = process.env.VAPID_PUBLIC_KEY
const vapidPrivate = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT

if (vapidPublic && vapidPrivate && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
}

interface PushSub {
  endpoint: string
  p256dh: string
  auth_key: string
}

const LOGO_URL =
  "https://bkrmltqwwonzkmlbarva.supabase.co/storage/v1/object/public/downloads/rules/ncaa%20logo.jpg"

function renderNotificationEmail({
  title,
  message,
  linkUrl,
}: { title?: string; message?: string; linkUrl: string }) {
  const safeTitle = escapeHtml(title || "New notification")
  const safeMessage = escapeHtml(message || "").replace(/\n/g, "<br/>")

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background-color:#4c3fce;padding:24px 32px;text-align:center;">
                <img src="${LOGO_URL}" alt="NCAA" width="56" height="56" style="border-radius:8px;display:inline-block;" />
                <div style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:0.5px;margin-top:10px;">
                  NIGERIA CHESS ARBITERS ASSOCIATION
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">${safeTitle}</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">${safeMessage}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px;background-color:#4c3fce;">
                      <a href="${linkUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                        View in Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">
                  You're receiving this because you have an active NCAA arbiter account. Manage your notification
                  preferences in
                  <a href="https://app.ncaaweb.com.ng/dashboard/settings" style="color:#4c3fce;">Settings</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret")
  if (!process.env.NOTIFICATIONS_WEBHOOK_SECRET || secret !== process.env.NOTIFICATIONS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { email, title, message, action_url, push_subscriptions } = await request.json()

  const tasks: Promise<any>[] = []

  if (email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const linkUrl = action_url ? `https://app.ncaaweb.com.ng${action_url}` : "https://app.ncaaweb.com.ng/dashboard"
    tasks.push(
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "NCAA <noreply@ncaaweb.com.ng>",
        to: email,
        subject: title || "New notification from NCAA",
        html: renderNotificationEmail({ title, message, linkUrl }),
      }),
    )
  }

  if (Array.isArray(push_subscriptions) && push_subscriptions.length > 0 && vapidPublic && vapidPrivate) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const payload = JSON.stringify({
      title: title || "New notification",
      body: message || "",
      url: action_url || "/dashboard/notifications",
    })

    for (const sub of push_subscriptions as PushSub[]) {
      tasks.push(
        webpush
          .sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } }, payload)
          .catch(async (err: any) => {
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              await supabase.rpc("delete_push_subscription_by_endpoint", { p_endpoint: sub.endpoint })
            }
          }),
      )
    }
  }

  await Promise.allSettled(tasks)
  return NextResponse.json({ ok: true, dispatched: tasks.length })
}
