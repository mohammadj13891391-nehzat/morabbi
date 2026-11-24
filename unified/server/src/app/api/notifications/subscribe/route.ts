import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { subscribeUser, getVapidPublicKey } from "@/lib/push";

// GET /api/notifications/subscribe - Get VAPID public key
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    return NextResponse.json({
      publicKey: getVapidPublicKey(),
    });
  } catch (error) {
    console.error("Get VAPID key error:", error);
    return NextResponse.json({ error: "خطا در دریافت کلید" }, { status: 500 });
  }
}

// POST /api/notifications/subscribe - Subscribe to push notifications
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const body = await req.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "اشتراک نامعتبر است" },
        { status: 400 }
      );
    }

    await subscribeUser(user.id, subscription);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "خطا در ثبت اشتراک" }, { status: 500 });
  }
}

// DELETE /api/notifications/subscribe - Unsubscribe
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json({ error: "endpoint الزامی است" }, { status: 400 });
    }

    const { unsubscribeUser } = await import("@/lib/push");
    await unsubscribeUser(endpoint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json({ error: "خطا در لغو اشتراک" }, { status: 500 });
  }
}
