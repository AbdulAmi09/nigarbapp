import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"

const vapidPublic = process.env.VAPID_PUBLIC_KEY
const vapidPrivate = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT

if (vapidPublic && vapidPrivate && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
}

export async function POST(request: NextRequest) {
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return NextResponse.json({ skipped: true }, { status: 200 })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId, preview } = await request.json()
    if (!roomId) {
      return NextResponse.json({ error: "roomId required" }, { status: 400 })
    }

    const { data: recipients, error: rpcError } = await supabase.rpc("get_push_recipients", {
      p_room_id: roomId,
      p_sender_id: user.id,
    })

    if (rpcError || !recipients || recipients.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single()
    const title = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "New message"
    const body = typeof preview === "string" ? preview.slice(0, 140) : "Sent a message"

    const payload = JSON.stringify({ title, body, roomId, url: "/dashboard/chat" })

    let sent = 0
    await Promise.all(
      recipients.map(async (r: { endpoint: string; p256dh: string; auth_key: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth_key } },
            payload,
          )
          sent++
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await supabase.rpc("delete_push_subscription_by_endpoint", { p_endpoint: r.endpoint })
          }
        }
      }),
    )

    return NextResponse.json({ sent })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
