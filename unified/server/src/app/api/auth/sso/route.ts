import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

// POST /api/auth/sso - Single Sign-On with external system
// The external management system sends a JWT token, we validate it and create a session
//
// Expected request:
// {
//   "token": "<JWT from central system>",
//   "userInfo": {  // Optional: central system can include user info
//     "phone": "3001",
//     "name": "...",
//     "role": "INSTRUCTOR",
//     "branchCode": "GIRLS-HADADIAN"
//   }
// }
//
// In production, you should:
// 1. Verify the JWT signature using the shared secret/public key
// 2. Check token expiration
// 3. Optionally sync user data from central system
//
// This is a TEMPLATE implementation. Replace JWT verification with your actual implementation.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, userInfo } = body;

    if (!token) {
      return NextResponse.json({ error: "توکن الزامی است" }, { status: 400 });
    }

    // === STEP 1: Verify JWT ===
    // In production, use jsonwebtoken library:
    // import jwt from "jsonwebtoken";
    // const decoded = jwt.verify(token, process.env.JWT_SHARED_SECRET!);

    // For now, we accept any token that includes userInfo (template mode)
    if (!userInfo || !userInfo.phone) {
      return NextResponse.json(
        { error: "اطلاعات کاربر در توکن یافت نشد" },
        { status: 400 }
      );
    }

    // === STEP 2: Find or create user ===
    let user = await db.user.findUnique({
      where: { phone: userInfo.phone },
    });

    if (!user) {
      // Auto-create user from SSO info (in production, you might want to restrict this)
      // Find branch by code
      let branchId: string | null = null;
      if (userInfo.branchCode) {
        const branch = await db.branch.findUnique({
          where: { code: userInfo.branchCode },
        });
        if (branch) branchId = branch.id;
      }

      // Hash a random initial password (user should reset)
      const bcrypt = await import("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(Math.random().toString(36), salt);

      user = await db.user.create({
        data: {
          name: userInfo.name || `کاربر ${userInfo.phone}`,
          phone: userInfo.phone,
          passwordHash,
          role: (userInfo.role as any) || "INSTRUCTOR",
          branchId,
          active: true,
        },
      });
    } else {
      // Update user info from SSO (keep passwordHash unchanged)
      const updateData: any = {
        name: userInfo.name || user.name,
        role: (userInfo.role as any) || user.role,
        active: true,
      };

      if (userInfo.branchCode) {
        const branch = await db.branch.findUnique({
          where: { code: userInfo.branchCode },
        });
        if (branch) updateData.branchId = branch.id;
      }

      user = await db.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    // === STEP 3: Create session ===
    const sessionToken = await createSession(user.id);

    // Return user info and session token (without passwordHash)
    const { passwordHash, ...userWithoutPassword } = user as any;

    return NextResponse.json({
      user: userWithoutPassword,
      token: sessionToken,
      sso: true,
    });
  } catch (error) {
    console.error("SSO error:", error);
    return NextResponse.json({ error: "خطا در احراز هویت یکپارچه" }, { status: 500 });
  }
}
