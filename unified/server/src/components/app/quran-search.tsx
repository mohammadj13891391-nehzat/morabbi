"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/app-constants";
import { BookOpen, Search, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface QuranSearchProps {
  user: any;
}

export function QuranSearch({ user }: QuranSearchProps) {
  const [query, setQuery] = useState("");
  const [surah, setSurah] = useState("");
  const [ayah, setAyah] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      let url = "/api/quran/search?";
      const params = [];
      if (surah) {
        params.push(`surah=${surah}`);
        if (ayah) params.push(`ayah=${ayah}`);
      } else if (query) {
        params.push(`q=${encodeURIComponent(query)}`);
      }
      url += params.join("&");

      const result = await apiFetch(url, {}, user.id);
      setResults(result.verses);
    } catch (err: any) {
      toast.error("خطا در جستجو: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-l from-emerald-50 to-background dark:from-emerald-950/20">
        <CardContent className="p-6 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
          <h2 className="text-xl font-bold">جستجوی قرآن کریم</h2>
          <p className="text-sm text-muted-foreground mt-1">
            جستجو در متن آیات برای ارجاع در گزارش‌ها و طرح‌درس‌ها
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">جستجوی متنی</label>
            <div className="flex gap-2">
              <Input
                placeholder="کلمه یا عبارت (مثلاً: السابقون)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !surah && search()}
                disabled={!!surah}
              />
              <Button onClick={search} disabled={loading || (!query && !surah)}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground">یا</div>

          <div className="space-y-2">
            <label className="text-sm font-medium">جستجو با شماره سوره و آیه</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="سوره (۱-۱۱۴)"
                value={surah}
                onChange={(e) => setSurah(e.target.value)}
                dir="ltr"
                disabled={!!query}
              />
              <Input
                type="number"
                placeholder="آیه (اختیاری)"
                value={ayah}
                onChange={(e) => setAyah(e.target.value)}
                dir="ltr"
                disabled={!!query}
              />
              <Button onClick={search} disabled={loading || !surah}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            📌 در حال حاضر چند آیه نمونه (از سوره‌های فاتحه، بقره، نحل، واقعه) در پایگاه‌داده موجود است.
            پایگاه‌داده کامل قرآن (Tanzil) در فاز بعدی فعال خواهد شد.
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              نتایج ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-6">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">نتیجه‌ای یافت نشد</p>
            ) : (
              <div className="space-y-2">
                {results.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-muted-foreground">
                        سوره {v.surahNameFa} ({v.surahName}) • آیه {v.ayah} • جزء {v.juz}
                      </div>
                      <Badge variant="outline" className="text-emerald-700">
                        {v.surah}:{v.ayah}
                      </Badge>
                    </div>
                    <div className="text-xl text-right font-arabic leading-loose" dir="rtl">
                      {v.textUthmani}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2" dir="rtl">
                      {v.textSimple}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
