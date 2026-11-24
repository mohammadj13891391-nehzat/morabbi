"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch, REPORT_PATTERNS, REPORT_STYLES } from "@/lib/app-constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { savePendingReport } from "@/lib/offline-db";
import { syncNow } from "@/lib/sync";
import { TemplateSelector, SelfAssessmentChecklist } from "@/components/app/templates";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mic, Image as ImageIcon, Loader2, X, Plus, BookOpen, Save, Send, CloudOff } from "lucide-react";
import { toast } from "sonner";

interface ReportFormProps {
  user: any;
  onSubmitted: () => void;
  onCancel: () => void;
}

export function ReportForm({ user, onSubmitted, onCancel }: ReportFormProps) {
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState("");
  const [attendeesCount, setAttendeesCount] = useState("");
  const [summary, setSummary] = useState("");
  const [reportPattern, setReportPattern] = useState("");
  const [reportStyle, setReportStyle] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"DRAFT" | "SUBMITTED">("SUBMITTED");
  const [recommendations, setRecommendations] = useState(""); // توصیه‌ها (جدید)
  const [content, setContent] = useState("");
  const [challenges, setChallenges] = useState("");
  const [solutions, setSolutions] = useState("");
  const [pedagogicalNotes, setPedagogicalNotes] = useState("");
  const [quranRefs, setQuranRefs] = useState<any[]>([]);
  const [hadithRefs, setHadithRefs] = useState<any[]>([]);
  const [transcriptionSource, setTranscriptionSource] = useState("MANUAL");

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Image upload state
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quran search state
  const [showQuranSearch, setShowQuranSearch] = useState(false);
  const [quranQuery, setQuranQuery] = useState("");
  const [quranResults, setQuranResults] = useState<any[]>([]);
  const [searchingQuran, setSearchingQuran] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      toast.error("دسترسی به میکروفون ممکن نیست: " + err.message);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const result = await apiFetch("/api/media/transcribe", {
        method: "POST",
        body: formData,
      }, user.id);

      if (result.text && !result.text.startsWith("[")) {
        const prevContent = content;
        const newContent = prevContent ? prevContent + "\n\n" + result.text : result.text;
        setContent(newContent);
        setTranscriptionSource("AUDIO");
        toast.success("صوت با موفقیت به متن تبدیل شد و در گزارش قرار گرفت");
      } else {
        toast.warning(result.text || "تبدیل صوت در دسترس نیست");
      }

      // Clear the audio blob after processing
      setAudioBlob(null);
    } catch (err: any) {
      toast.error("خطا در تبدیل صوت: " + err.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Image upload and OCR
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const result = await apiFetch("/api/media/ocr", {
        method: "POST",
        body: formData,
      }, user.id);

      if (result.text && !result.text.startsWith("[")) {
        const prevContent = content;
        const newContent = prevContent ? prevContent + "\n\n" + result.text : result.text;
        setContent(newContent);
        setTranscriptionSource("IMAGE");
        toast.success("متن تصویر استخراج شد و به گزارش اضافه شد");
      } else {
        toast.warning(result.text || "تبدیل تصویر در دسترس نیست");
      }
    } catch (err: any) {
      toast.error("خطا در پردازش تصویر: " + err.message);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Quran search
  const searchQuran = async () => {
    if (!quranQuery.trim()) return;
    setSearchingQuran(true);
    try {
      const result = await apiFetch(`/api/quran/search?q=${encodeURIComponent(quranQuery)}`, {}, user.id);
      setQuranResults(result.verses);
    } catch (err: any) {
      toast.error("خطا در جستجوی قرآن: " + err.message);
    } finally {
      setSearchingQuran(false);
    }
  };

  const addQuranRef = (verse: any) => {
    if (quranRefs.some(r => r.surah === verse.surah && r.ayah === verse.ayah)) {
      toast.info("این آیه قبلاً اضافه شده است");
      return;
    }
    setQuranRefs([...quranRefs, {
      surah: verse.surah,
      ayah: verse.ayah,
      surahName: verse.surahNameFa,
      text: verse.textUthmani,
    }]);
    toast.success(`آیه ${verse.surahNameFa} ${verse.ayah} اضافه شد`);
  };

  const removeQuranRef = (idx: number) => {
    setQuranRefs(quranRefs.filter((_, i) => i !== idx));
  };

  const addHadithRef = () => {
    setHadithRefs([...hadithRefs, { source: "", reference: "", text: "" }]);
  };

  const updateHadithRef = (idx: number, field: string, value: string) => {
    const updated = [...hadithRefs];
    updated[idx] = { ...updated[idx], [field]: value };
    setHadithRefs(updated);
  };

  const removeHadithRef = (idx: number) => {
    setHadithRefs(hadithRefs.filter((_, i) => i !== idx));
  };

  const applyTemplate = (data: any) => {
    if (data.subject) setSubject(data.subject);
    if (data.summary !== undefined) setSummary(data.summary);
    if (data.reportPattern) setReportPattern(data.reportPattern);
    if (data.reportStyle) setReportStyle(data.reportStyle);
    if (data.content) setContent(data.content);
    if (data.challenges !== undefined) setChallenges(data.challenges);
    if (data.solutions !== undefined) setSolutions(data.solutions);
    if (data.pedagogicalNotes !== undefined) setPedagogicalNotes(data.pedagogicalNotes);
    if (data.recommendations !== undefined) setRecommendations(data.recommendations);
    toast.success("الگو اعمال شد. می‌توانید بخش‌ها را ویرایش کنید.");
  };

  const handleSendClick = (status: "DRAFT" | "SUBMITTED") => {
    if (!subject.trim() || !content.trim()) {
      toast.error("موضوع و متن گزارش الزامی است");
      return;
    }
    if (status === "SUBMITTED") {
      setPendingStatus(status);
      setShowChecklist(true);
    } else {
      submitReport(status);
    }
  };

  const submitReport = async (status: "DRAFT" | "SUBMITTED") => {
    setShowChecklist(false);

    const reportData = {
      subject: subject.trim(),
      audience: audience.trim() || null,
      attendeesCount: parseInt(attendeesCount) || 0,
      summary: summary.trim() || null,                    // چکیده
      reportPattern: reportPattern || null,               // الگو
      reportStyle: reportStyle || null,                   // سبک
      recommendations: recommendations.trim() || null,    // توصیه‌ها
      content: content.trim(),
      challenges: challenges.trim() || null,
      solutions: solutions.trim() || null,
      pedagogicalNotes: pedagogicalNotes.trim() || null,
      quranRefs,
      hadithRefs: hadithRefs.filter(h => h.text.trim()),
      transcriptionSource,
      status,
    };

    try {
      // Try to submit to server first
      await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify(reportData),
      }, user.id);

      toast.success(status === "DRAFT" ? "گزارش به‌عنوان پیش‌نویس ذخیره شد" : "گزارش با موفقیت ارسال شد");
      onSubmitted();
    } catch (err: any) {
      // Server unavailable - save locally for later sync
      try {
        await savePendingReport(reportData);
        toast.success(
          status === "DRAFT"
            ? "گزارش به‌صورت محلی ذخیره شد (سرور در دسترس نیست)"
            : "گزارش محلی ذخیره شد — وقتی سرور در دسترس شود، به‌صورت خودکار ارسال می‌شود",
          { duration: 6000 }
        );

        // Try immediate sync (will fail silently if server is down)
        setTimeout(() => {
          syncNow().catch(() => {});
        }, 500);

        onSubmitted();
      } catch (localErr: any) {
        toast.error("خطا در ثبت گزارش (و در ذخیره محلی): " + localErr.message);
      }
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">ثبت گزارش روزانه</h2>
          <p className="text-sm text-muted-foreground mt-1">
            گزارش فعالیت آموزشی امروز را ثبت کنید
          </p>
        </div>
        <TemplateSelector type="report" onApply={applyTemplate} />
      </div>

      {/* Self-assessment checklist dialog */}
      <Dialog open={showChecklist} onOpenChange={setShowChecklist}>
        {showChecklist && (
          <SelfAssessmentChecklist
            type="report"
            data={{ subject, summary, reportPattern, reportStyle, content, challenges, solutions, pedagogicalNotes, recommendations }}
            onProceed={() => submitReport(pendingStatus)}
            onCancel={() => setShowChecklist(false)}
          />
        )}
      </Dialog>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">اطلاعات جلسه</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">موضوع تدریس *</Label>
            <Input
              id="subject"
              placeholder="مثلاً: تفسیر سوره فاتحه - آیه ۵"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audience">گروه مخاطب / پایه</Label>
              <Input
                id="audience"
                placeholder="مثلاً: بزرگسالان - سطح متوسط"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendees">تعداد حاضران</Label>
              <Input
                id="attendees"
                type="number"
                placeholder="۰"
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Processing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ثبت با صوت یا تصویر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Audio Recording */}
            <div className="space-y-2">
              {!isRecording && !audioBlob && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={startRecording}
                  disabled={isTranscribing}
                >
                  <Mic className="w-4 h-4 ml-2" />
                  شروع ضبط صوت
                </Button>
              )}
              {isRecording && (
                <div className="space-y-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-mono text-lg" dir="ltr">{formatTime(recordingTime)}</span>
                    </div>
                    <Button size="sm" variant="destructive" onClick={stopRecording}>
                      توقف
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">در حال ضبط...</p>
                </div>
              )}
              {audioBlob && !isRecording && (
                <div className="space-y-2 p-3 rounded-lg bg-muted border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">صوت ضبط شد ({Math.round(audioBlob.size / 1024)} کیلوبایت)</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAudioBlob(null)}
                      disabled={isTranscribing}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={transcribeAudio}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        در حال تبدیل به متن...
                      </>
                    ) : (
                      "تبدیل به متن"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
              >
                {isProcessingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال پردازش تصویر...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 ml-2" />
                    آپلود تصویر (یادداشت/کتاب)
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            ℹ️ فایل صوتی پس از تبدیل به متن به‌صورت خودکار حذف می‌شود (حفظ حریم خصوصی).
            تصویر به‌عنوان ضمیمه باقی می‌ماند.
          </p>
        </CardContent>
      </Card>

      {/* ساختار گزارش (طبق سند نهضت) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ساختار گزارش (طبق سند نهضت)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pattern">الگوی گزارش</Label>
              <Select value={reportPattern} onValueChange={setReportPattern}>
                <SelectTrigger id="pattern">
                  <SelectValue placeholder="انتخاب الگو..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_PATTERNS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                تقدّم زمانی: بر اساس زمان | قیاسی: ابتدا نتیجه | استقرایی: ابتدا دلایل
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="style">سبک گزارش</Label>
              <Select value={reportStyle} onValueChange={setReportStyle}>
                <SelectTrigger id="style">
                  <SelectValue placeholder="انتخاب سبک..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_STYLES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                توصیفی: وقایع | تحلیلی: چرایی | انتقادی: ارزیابی | تجویزی: پیشنهاد
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">چکیده گزارش (چشمگیرترین بخش کار)</Label>
            <Textarea
              id="summary"
              placeholder="خلاصه‌ای از نکات مهم، توصیه‌ها و نتیجه‌گیری‌ها — کوتاه و شفاف"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              طبق سند نهضت: «خلاصه‌ی گزارش، چشمگیرترین بخش کار» — کوتاه و شفاف
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">بدنه‌ی گزارش (اصلی‌ترین بخش) *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="متن گزارش فعالیت امروز را وارد کنید. می‌توانید با ضبط صوت یا آپلود تصویر، متن را به‌صورت خودکار تولید کنید."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px]"
          />
          {transcriptionSource !== "MANUAL" && (
            <Badge variant="secondary">
              {transcriptionSource === "AUDIO" ? "تولیدشده از صوت" : "استخراج‌شده از تصویر"}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Quran References */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              آیات قرآن مرتبط
            </span>
            <Button size="sm" variant="outline" onClick={() => setShowQuranSearch(!showQuranSearch)}>
              <Plus className="w-4 h-4 ml-1" />
              جستجو و افزودن
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {showQuranSearch && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              <div className="flex gap-2">
                <Input
                  placeholder="جستجو در متن آیات (مثلاً: السابقون) یا شماره سوره"
                  value={quranQuery}
                  onChange={(e) => setQuranQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchQuran()}
                />
                <Button onClick={searchQuran} disabled={searchingQuran}>
                  {searchingQuran ? <Loader2 className="w-4 h-4 animate-spin" /> : "جستجو"}
                </Button>
              </div>
              {quranResults.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {quranResults.map((v) => (
                    <div
                      key={v.id}
                      className="p-2 rounded-lg border bg-background cursor-pointer hover:bg-muted/50"
                      onClick={() => addQuranRef(v)}
                    >
                      <div className="text-xs text-muted-foreground">{v.surahNameFa} {v.surah}:{v.ayah}</div>
                      <div className="font-arabic text-right" dir="rtl">{v.textUthmani}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {quranRefs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              هنوز آیه‌ای اضافه نشده است
            </p>
          ) : (
            <div className="space-y-2">
              {quranRefs.map((ref, idx) => (
                <div key={idx} className="flex items-start justify-between p-2 rounded-lg border bg-muted/30">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">{ref.surahName} {ref.surah}:{ref.ayah}</div>
                    <div className="font-arabic text-right mt-1" dir="rtl">{ref.text}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeQuranRef(idx)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hadith References */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>روایات مرتبط</span>
            <Button size="sm" variant="outline" onClick={addHadithRef}>
              <Plus className="w-4 h-4 ml-1" />
              افزودن
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hadithRefs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              هنوز روایتی اضافه نشده است
            </p>
          ) : (
            hadithRefs.map((ref, idx) => (
              <div key={idx} className="space-y-2 p-3 rounded-lg border bg-muted/30">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="منبع (الکافی، من لا یحضره الفقیه، ...)"
                    value={ref.source}
                    onChange={(e) => updateHadithRef(idx, "source", e.target.value)}
                  />
                  <Input
                    placeholder="ارجاع (مثلاً: ج ۲، ص ۱۲۳)"
                    value={ref.reference}
                    onChange={(e) => updateHadithRef(idx, "reference", e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="متن روایت"
                    value={ref.text}
                    onChange={(e) => updateHadithRef(idx, "text", e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button size="sm" variant="ghost" onClick={() => removeHadithRef(idx)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
          <p className="text-xs text-muted-foreground">
            📌 پایگاه‌داده کامل کتب اربعه در فاز بعدی فعال خواهد شد. فعلاً روایات را به‌صورت دستی وارد کنید.
          </p>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">چالش‌ها و ملاحظات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="challenges">چالش‌های مواجهه</Label>
            <Textarea
              id="challenges"
              placeholder="چالش‌هایی که در جلسه با آن مواجه شدید"
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="solutions">راهکارهای اتخاذشده</Label>
            <Textarea
              id="solutions"
              placeholder="چگونه با چالش‌ها برخورد کردید"
              value={solutions}
              onChange={(e) => setSolutions(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات تربیتی</Label>
            <Textarea
              id="notes"
              placeholder="مشاهدات تربیتی، وضعیت یادگیرندگان"
              value={pedagogicalNotes}
              onChange={(e) => setPedagogicalNotes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recommendations">توصیه‌ها و پیشنهادات بهبود (راهی برای بهبود پروژه)</Label>
            <Textarea
              id="recommendations"
              placeholder="پیشنهادات کاربردی برای ادامه کار — راهکارهای شفاف و مستقیم"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              طبق سند نهضت: «توصیه‌ها، راهی برای بهبود پروژه»
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end sticky bottom-4 bg-background p-3 rounded-lg border shadow-lg">
        <Button variant="outline" onClick={onCancel}>
          انصراف
        </Button>
        <Button variant="secondary" onClick={() => handleSendClick("DRAFT")}>
          <Save className="w-4 h-4 ml-1" />
          ذخیره پیش‌نویس
        </Button>
        <Button onClick={() => handleSendClick("SUBMITTED")}>
          <Send className="w-4 h-4 ml-1" />
          ارسال برای ارزیابی
        </Button>
      </div>
    </div>
  );
}
