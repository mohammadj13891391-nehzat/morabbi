import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/auth/verify-code - Step 2: Verify code and create user
// Body: { phone, code }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json({ error: "شماره تلفن و کد الزامی است" }, { status: 400 });
    }

    // Find the verification record
    const record = await db.verificationCode.findUnique({
      where: { phone },
    });

    if (!record) {
      return NextResponse.json({ error: "کد تأیید یافت نشد. لطفاً دوباره ثبت‌نام کنید." }, { status: 404 });
    }

    // Check expiration
    if (record.expiresAt < new Date()) {
      await db.verificationCode.delete({ where: { phone } });
      return NextResponse.json({ error: "کد تأیید منقضی شده است. لطفاً دوباره ثبت‌نام کنید." }, { status: 410 });
    }

    // Check attempts (max 5)
    if (record.attempts >= 5) {
      await db.verificationCode.delete({ where: { phone } });
      return NextResponse.json({ error: "تعداد تلاش‌های ناموفق بیش از حد مجاز است" }, { status: 429 });
    }

    // Verify code
    if (record.code !== code) {
      await db.verificationCode.update({
        where: { phone },
        data: { attempts: { increment: 1 } },
      });
      const remaining = 5 - (record.attempts + 1);
      return NextResponse.json(
        { error: `کد نادرست است. ${remaining} تلاش باقی مانده.` },
        { status: 401 }
      );
    }

    // Code verified - create user with PENDING status
    const user = await db.user.create({
      data: {
        name: record.name || "کاربر",
        nationalId: record.nationalId || null,
        phone: record.phone,
        passwordHash: record.passwordHash || null,
        role: "OTHER", // Default until approved
        requestedRole: (record.requestedRole as any) || "OTHER",
        branchId: record.branchId || null,
        approvalStatus: "PENDING",
        active: false, // Inactive until approved
      },
    });

    // Clean up verification record
    await db.verificationCode.delete({ where: { phone } });

    return NextResponse.json({
      success: true,
      message: "ثبت‌نام شما با موفقیت انجام شد. پس از تأیید مسئول، می‌توانید وارد شوید.",
      userId: user.id,
      status: "PENDING",
    });
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json({ error: "خطا در تأیید کد" }, { status: 500 });
  }
}
