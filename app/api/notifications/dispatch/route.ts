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
        html: `<p>${message || ""}</p><p><a href="${linkUrl}">View in dashboard</a></p>`,
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
