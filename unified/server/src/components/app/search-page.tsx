"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/app-constants";
import { toPersianDateTime } from "@/lib/session";
import { Search as SearchIcon, FileText, ClipboardList } from "lucide-react";

export function SearchPage({ user, onNavigate }: { user: any; onNavigate?: (v: any) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
      setResults(res.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">جستجوی پیشرفته</h2>
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="جستجو در گزارش‌ها و طرح‌درس‌ها..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            <button
              onClick={search}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              <SearchIcon className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">نتایج ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-4">در حال جستجو...</p>
            ) : results.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">نتیجه‌ای یافت نشد</p>
            ) : (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer"
                    onClick={() => onNavigate?.(r.type === "report" ? "reports_list" : "lesson_plans_list")}
                  >
                    {r.type === "report" ? <FileText className="w-4 h-4 text-blue-600" /> : <ClipboardList className="w-4 h-4 text-emerald-600" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{r.subtitle}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{toPersianDateTime(new Date(r.date))}</div>
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
