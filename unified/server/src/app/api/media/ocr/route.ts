import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import ZAI from "z-ai-web-dev-sdk";

// POST /api/media/ocr - Image to text (VLM)
// Accepts multipart/form-data with image file
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "فایل تصویری یافت نشد" },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(imageFile.type) && !imageFile.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return NextResponse.json(
        { error: `فرمت تصویر پشتیبانی نمی‌شود: ${imageFile.type}` },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: "حداکثر اندازه تصویر ۱۰ مگابایت است" },
        { status: 400 }
      );
    }

    const uploadsDir = "/home/z/my-project/uploads";
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const fileName = `image_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${path.extname(imageFile.name) || ".jpg"}`;
    const filePath = path.join(uploadsDir, fileName);
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    const job = await db.mediaProcessingJob.create({
      data: {
        userId: user.id,
        targetType: "report",
        mediaType: "IMAGE",
        filePath,
        status: "PROCESSING",
      },
    });

    let extractedText = "";
    let modelUsed = "unknown";

    try {
      const base64Image = buffer.toString("base64");
      const mimeType = imageFile.type || "image/jpeg";

      const zai = await ZAI.create();

      const vlmResult = await zai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "لطفاً تمام متن قابل‌مشاهده در این تصویر را به‌دقت استخراج کنید و فقط متن را برگردانید (بدون توضیح اضافه). اگر متن فارسی یا عربی است، آن را به همان شکل استخراج کنید. اگر تصویر شامل متن دست‌نویس است، سعی کنید آن را به‌خوبی بخوانید.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
      });

      extractedText = vlmResult.choices[0]?.message?.content || "";
      modelUsed = "glm-vlm";

      await db.mediaProcessingJob.update({
        where: { id: job.id },
        data: {
          status: "DONE",
          resultText: extractedText,
          completedAt: new Date(),
        },
      });
    } catch (aiError) {
      console.error("OCR error:", aiError);
      extractedText = "[تبدیل تصویر به متن در حال حاضر در دسترس نیست. لطفاً متن را به‌صورت دستی وارد کنید.]";
      modelUsed = "unavailable";

      await db.mediaProcessingJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: String(aiError),
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      text: extractedText,
      modelUsed,
      jobId: job.id,
      imageUrl: `/uploads/${fileName}`,
      note: "تصویر به‌عنوان ضمیمه ذخیره شد. در صورت عدم نیاز، می‌توانید آن را حذف کنید.",
    });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json({ error: "خطا در تبدیل تصویر به متن" }, { status: 500 });
  }
}
