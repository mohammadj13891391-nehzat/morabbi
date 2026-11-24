import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import ZAI from "z-ai-web-dev-sdk";

// POST /api/media/transcribe - Audio to text (ASR)
// Accepts multipart/form-data with audio file
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "فایل صوتی یافت نشد" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/m4a", "audio/ogg", "audio/webm", "audio/x-m4a"];
    if (!allowedTypes.includes(audioFile.type) && !audioFile.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
      return NextResponse.json(
        { error: `فرمت فایل پشتیبانی نمی‌شود: ${audioFile.type}` },
        { status: 400 }
      );
    }

    // Validate size (max 25MB)
    const maxSize = 25 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: "حداکثر اندازه فایل ۲۵ مگابایت است" },
        { status: 400 }
      );
    }

    // Ensure uploads dir exists (portable: <cwd>/uploads, falls back to OS temp)
    let uploadsDir = path.join(process.cwd(), "uploads");
    try {
      if (!existsSync(/*turbopackIgnore: true*/ uploadsDir)) {
        await mkdir(/*turbopackIgnore: true*/ uploadsDir, { recursive: true });
      }
    } catch {
      const os = await import("os");
      uploadsDir = os.tmpdir();
    }

    // Save file temporarily
    const fileName = `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${path.extname(audioFile.name) || ".webm"}`;
    const filePath = path.join(uploadsDir, fileName);
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Create a media processing job record
    const job = await db.mediaProcessingJob.create({
      data: {
        userId: user.id,
        targetType: "report",
        mediaType: "AUDIO",
        filePath,
        status: "PROCESSING",
        autoDeleteAfter: new Date(Date.now() + 60 * 60 * 1000), // delete after 1 hour
      },
    });

    let transcribedText = "";
    let confidence: number | undefined;
    let modelUsed = "unknown";

    try {
      // Convert to base64 for the SDK
      const base64Audio = buffer.toString("base64");
      const mimeType = audioFile.type || "audio/webm";

      const zai = await ZAI.create();

      const asrResult = await zai.audio.transcriptions.create({
        audio: `data:${mimeType};base64,${base64Audio}`,
        model: "glm-asr",
      });

      transcribedText = asrResult.text || "";
      modelUsed = "glm-asr";

      // Update job as done
      await db.mediaProcessingJob.update({
        where: { id: job.id },
        data: {
          status: "DONE",
          resultText: transcribedText,
          completedAt: new Date(),
        },
      });
    } catch (aiError) {
      console.error("ASR error:", aiError);
      // ASR unavailable (no API key / network) — report 503 so the client can fall back
      await db.mediaProcessingJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: String(aiError),
          completedAt: new Date(),
        },
      });
      try {
        await unlink(filePath);
      } catch {
        /* ignore */
      }
      return NextResponse.json(
        { error: "سرور تبدیل صوت به متن در دسترس نیست" },
        { status: 503 }
      );
    }

    // Auto-delete the audio file (privacy-preserving)
    try {
      await unlink(filePath);
    } catch (e) {
      console.error("Could not delete audio file:", e);
    }

    return NextResponse.json({
      text: transcribedText,
      confidence,
      modelUsed,
      jobId: job.id,
      note: "فایل صوتی شما پس از پردازش به‌صورت خودکار حذف شد (حفظ حریم خصوصی).",
    });
  } catch (error) {
    console.error("Transcribe error:", error);
    return NextResponse.json({ error: "خطا در تبدیل صوت به متن" }, { status: 500 });
  }
}
