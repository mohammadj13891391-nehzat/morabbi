"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch, ROLE_LABELS, REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from "@/lib/app-constants";
import { toPersianDateTime } from "@/lib/session";
import { FileText, Loader2, Sparkles, Check, X, MessageSquare, BookOpen, ListChecks, Download } from "lucide-react";
import { toast } from "sonner";

interface LessonPlansListProps {
  user: any;
}

export function LessonPlansList({ user }: LessonPlansListProps) {
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const loadLessonPlans = async () => {
    try {
      setLoading(true);
      const result = await apiFetch("/api/lesson-plans");
      setLessonPlans(result.lessonPlans);
    } catch (err: any) {
      toast.error("خطا در دریافت طرح‌درس‌ها: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessonPlans();
  }, []);

  const openPlan = (plan: any) => {
    setSelectedPlan(plan);
    setOpenDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (lessonPlans.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>هنوز طرح درسی ثبت نشده است</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">طرح‌درس‌ها</h2>
      <div className="space-y-2">
        {lessonPlans.map((p) => (
          <Card key={p.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => openPlan(p)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {user.role !== "INSTRUCTOR" && p.instructor?.name && (
                      <span>{p.instructor.name} • </span>
                    )}
                    {p.branch?.name} • {toPersianDateTime(new Date(p.createdAt))}
                  </div>
                  {p.evaluations?.length > 0 && (
                    <Badge variant="outline" className="mt-1 text-emerald-700">
                      <Check className="w-3 h-3 ml-1" />
                      ارزیابی شده
                    </Badge>
                  )}
                </div>
                <Badge className={REPORT_STATUS_COLORS[p.status] || ""} variant="secondary">
                  {REPORT_STATUS_LABELS[p.status] || p.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lesson Plan Detail Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedPlan?.title}</span>
              {selectedPlan && (
                <a
                  href={`/api/lesson-plans/pdf?id=${selectedPlan.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  خروجی PDF
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 pb-4">
                {/* Basic info */}
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline">
                    {REPORT_STATUS_LABELS[selectedPlan.status]}
                  </Badge>
                  <Badge variant="outline">{selectedPlan.subject}</Badge>
                  {selectedPlan.grade && (
                    <Badge variant="outline">{selectedPlan.grade}</Badge>
                  )}
                  {selectedPlan.sessionCount > 0 && (
                    <Badge variant="outline">{selectedPlan.sessionCount} جلسه</Badge>
                  )}
                  <span className="text-muted-foreground">
                    {toPersianDateTime(new Date(selectedPlan.createdAt))}
                  </span>
                </div>

                {/* Objectives */}
                {selectedPlan.objectives && JSON.parse(selectedPlan.objectives || "[]").length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <ListChecks className="w-4 h-4" />
                      اهداف آموزشی
                    </h4>
                    <ul className="list-disc list-inside text-sm space-y-1 bg-muted/30 p-3 rounded-lg">
                      {JSON.parse(selectedPlan.objectives).map((obj: string, i: number) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prerequisites */}
                {selectedPlan.prerequisites && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">پیش‌نیازها</h4>
                    <div className="text-sm p-2 rounded bg-orange-50 dark:bg-orange-950/20">{selectedPlan.prerequisites}</div>
                  </div>
                )}

                {/* Content Outline */}
                {selectedPlan.contentOutline && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">ساختار محتوا</h4>
                    <div className="text-sm p-2 rounded bg-muted/30 whitespace-pre-wrap">{selectedPlan.contentOutline}</div>
                  </div>
                )}

                {/* Teaching Method */}
                {selectedPlan.teachingMethod && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">روش تدریس</h4>
                    <div className="text-sm p-2 rounded bg-blue-50 dark:bg-blue-950/20">{selectedPlan.teachingMethod}</div>
                  </div>
                )}

                {/* Evaluation Method */}
                {selectedPlan.evaluationMethod && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">روش ارزیابی یادگیرنده</h4>
                    <div className="text-sm p-2 rounded bg-purple-50 dark:bg-purple-950/20">{selectedPlan.evaluationMethod}</div>
                  </div>
                )}

                {/* Quran Refs */}
                {selectedPlan.quranRefs && JSON.parse(selectedPlan.quranRefs || "[]").length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      آیات مرتبط
                    </h4>
                    <div className="space-y-1">
                      {JSON.parse(selectedPlan.quranRefs).map((ref: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 text-sm">
                          <div className="text-xs text-muted-foreground">{ref.surahName || `سوره ${ref.surah}`} {ref.surah}:{ref.ayah}</div>
                          <div className="text-right font-arabic mt-1" dir="rtl">{ref.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hadith Refs */}
                {selectedPlan.hadithRefs && JSON.parse(selectedPlan.hadithRefs || "[]").length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">روایات مرتبط</h4>
                    <div className="space-y-1">
                      {JSON.parse(selectedPlan.hadithRefs).map((ref: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-amber-50 dark:bg-amber-950/20 text-sm">
                          {ref.source && <div className="text-xs text-muted-foreground">{ref.source} {ref.reference}</div>}
                          <div className="mt-1">{ref.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources */}
                {selectedPlan.sources && JSON.parse(selectedPlan.sources || "[]").length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">منابع</h4>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(selectedPlan.sources).map((src: string, i: number) => (
                        <Badge key={i} variant="secondary">{src}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evaluation Section - only for managers */}
                {(user.role === "BRANCH_MANAGER" || user.role === "CENTRAL_SUPERVISOR" || user.role === "ADMIN") && (
                  <LessonPlanEvaluationSection plan={selectedPlan} user={user} />
                )}

                {/* Comments Section */}
                <CommentsSection targetType="lesson_plan" targetId={selectedPlan.id} user={user} />
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Evaluation for lesson plans
function LessonPlanEvaluationSection({ plan, user }: { plan: any; user: any }) {
  const [criteria, setCriteria] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { score: number; comment: string }>>({});
  const [overallComment, setOverallComment] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCriteria();
  }, [plan.id]);

  const loadCriteria = async () => {
    try {
      const result = await apiFetch(`/api/evaluations?targetType=lesson_plan&targetId=${plan.id}`);
      setCriteria(result.criteria);
    } catch (err) {
      console.error(err);
    }
  };

  const generateAISuggestion = async () => {
    setLoadingAI(true);
    try {
      const result = await apiFetch("/api/ai/evaluate", {
        method: "POST",
        body: JSON.stringify({ targetType: "lesson_plan", targetId: plan.id }),
      });

      setAiSuggestion(result.output);

      if (result.output.scores) {
        const newScores: Record<string, { score: number; comment: string }> = {};
        for (const [criterionId, data] of Object.entries(result.output.scores) as [string, any][]) {
          newScores[criterionId] = {
            score: data.score,
            comment: data.reasoning || "",
          };
        }
        setScores(newScores);
      }

      toast.success(result.modelVersion === "fallback-heuristic"
        ? "ارزیابی جایگزین تولید شد"
        : "پیشنهاد هوشمند آماده شد"
      );
    } catch (err: any) {
      toast.error("خطا در ارزیابی هوشمند: " + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const updateScore = (criterionId: string, score: number) => {
    setScores({
      ...scores,
      [criterionId]: {
        score,
        comment: scores[criterionId]?.comment || "",
      },
    });
  };

  const updateComment = (criterionId: string, comment: string) => {
    setScores({
      ...scores,
      [criterionId]: {
        score: scores[criterionId]?.score || 0,
        comment,
      },
    });
  };

  const saveEvaluation = async () => {
    if (Object.keys(scores).length === 0) {
      toast.error("حداقل یک معیار را امتیاز دهید");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/evaluations", {
        method: "POST",
        body: JSON.stringify({
          targetType: "lesson_plan",
          targetId: plan.id,
          scores,
          overallComment,
          status: "FINAL",
        }),
      });
      toast.success("ارزیابی طرح درس ثبت شد");
    } catch (err: any) {
      toast.error("خطا در ثبت ارزیابی: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t pt-4 mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">ارزیابی طرح درس</h4>
        <Button size="sm" variant="secondary" onClick={generateAISuggestion} disabled={loadingAI}>
          {loadingAI ? (
            <><Loader2 className="w-4 h-4 ml-1 animate-spin" />در حال تولید...</>
          ) : (
            <><Sparkles className="w-4 h-4 ml-1" />پیشنهاد هوشمند</>
          )}
        </Button>
      </div>

      {aiSuggestion && (
        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            پیشنهاد هوشمند
          </div>
          {aiSuggestion.overallScore && (
            <div className="text-sm mb-2">
              امتیاز کلی پیشنهادی: <span className="font-bold text-purple-700">{aiSuggestion.overallScore.toFixed(1)}/۱۰</span>
            </div>
          )}
          {aiSuggestion.strengths?.length > 0 && (
            <div className="text-xs mb-1">
              <span className="font-medium text-emerald-700">نقاط قوت:</span>
              <ul className="list-disc list-inside mr-3 mt-0.5">
                {aiSuggestion.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {aiSuggestion.weaknesses?.length > 0 && (
            <div className="text-xs mb-1">
              <span className="font-medium text-orange-700">نقاط ضعف:</span>
              <ul className="list-disc list-inside mr-3 mt-0.5">
                {aiSuggestion.weaknesses.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {aiSuggestion.improvementSuggestions?.length > 0 && (
            <div className="text-xs">
              <span className="font-medium text-blue-700">پیشنهاد بهبود:</span>
              <ul className="list-disc list-inside mr-3 mt-0.5">
                {aiSuggestion.improvementSuggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {criteria.map((c) => (
          <div key={c.id} className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium">{c.title}</div>
                {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
              </div>
              <Badge variant="outline">وزن: {c.weight}</Badge>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={scores[c.id]?.score || 0}
                onChange={(e) => updateScore(c.id, parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="font-bold w-12 text-center">
                {scores[c.id]?.score?.toFixed(1) || "۰"}
              </span>
            </div>
            <Textarea
              placeholder="توضیح (اختیاری)"
              value={scores[c.id]?.comment || ""}
              onChange={(e) => updateComment(c.id, e.target.value)}
              className="min-h-[40px] text-sm"
            />
          </div>
        ))}
      </div>

      <div>
        <Label className="text-sm">توضیح کلی ارزیابی</Label>
        <Textarea
          placeholder="توضیح نهایی شما درباره این طرح درس"
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          className="mt-1"
        />
      </div>

      <Button onClick={saveEvaluation} disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Check className="w-4 h-4 ml-1" />}
        ثبت ارزیابی نهایی
      </Button>
    </div>
  );
}

// Re-use Comments Section (inline here for simplicity)
function CommentsSection({ targetType, targetId, user }: { targetType: string; targetId: string; user: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    try {
      const result = await apiFetch(`/api/comments?targetType=${targetType}&targetId=${targetId}`);
      setComments(result.comments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [targetId]);

  const submitComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const result = await apiFetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({ targetType, targetId, body: newComment }),
      });
      setComments([...comments, result.comment]);
      setNewComment("");
      toast.success("پیام ثبت شد");
    } catch (err: any) {
      toast.error("خطا در ثبت پیام: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resolveComment = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  };

  return (
    <div className="border-t pt-4">
      <h4 className="font-semibold flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4" />
        رفع اشکال و گفتگو ({comments.length})
      </h4>

      {loading ? (
        <div className="text-sm text-muted-foreground">در حال بارگذاری...</div>
      ) : (
        <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">هنوز پیامی ثبت نشده است</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className={`p-2 rounded-lg text-sm ${c.resolved ? "bg-muted/20 opacity-60" : "bg-muted/40"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs">
                    <span className="font-medium">{c.author?.name}</span>
                    <span className="text-muted-foreground mr-2">{ROLE_LABELS[c.author?.role] || ""}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => resolveComment(c.id)}>
                    {c.resolved ? <><X className="w-3 h-3 ml-1" />بازکردن</> : <><Check className="w-3 h-3 ml-1" />حل‌شده</>}
                  </Button>
                </div>
                <div className="whitespace-pre-wrap">{c.body}</div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          placeholder="پیام خود را بنویسید..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[60px]"
        />
        <Button onClick={submitComment} disabled={submitting || !newComment.trim()}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "ارسال"}
        </Button>
      </div>
    </div>
  );
}
