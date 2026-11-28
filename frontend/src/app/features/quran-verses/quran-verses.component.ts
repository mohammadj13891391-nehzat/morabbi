import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/api.service';
import { QuranVerse } from '../../core/models/morabbi.models';

@Component({
  selector: 'app-quran-verses',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">آیات قرآن</h1>
      <div class="toolbar">
        <input type="search" placeholder="جستجو در متن، سوره یا موضوع..." [(ngModel)]="search" (ngModelChange)="onSearch()" />
        <select [(ngModel)]="surahFilter" (ngModelChange)="onSurahFilter()">
          <option value="">همهٔ سوره‌ها</option>
          <option *ngFor="let s of surahs()">{{ s }}</option>
        </select>
        <button routerLink="/quran-verses/new" class="btn" *ngIf="auth.isAdminManager()">افزودن آیه</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
    <div class="hint" *ngIf="searching()">در حال جستجو...</div>

    <div class="hint" *ngIf="!search.trim()">نمایش: {{ shown() }} از {{ displayed().length }} آیه{{ surahFilter ? ' (سورهٔ ' + surahFilter + ')' : '' }}</div>

    <div class="card" *ngFor="let v of displayed().slice(0, shown())">
      <div class="v-head">
        <span class="badge">{{ v.surah }} — آیه {{ v.verseNo }}</span>
        <span class="badge" *ngIf="v.topic">{{ v.topic }}</span>
        <div class="actions">
          <a [routerLink]="'/quran-verses/' + v.id" class="btn btn-secondary btn-sm" *ngIf="auth.isAdminManager()">ویرایش</a>
          <button class="btn btn-danger btn-sm" (click)="remove(v)" *ngIf="auth.isAdminManager()">حذف</button>
        </div>
      </div>
      <p class="verse" dir="rtl">{{ v.textAr }}</p>
      <p class="verse-fa" *ngIf="v.textFa">{{ v.textFa }}</p>
    </div>
    <div class="empty" *ngIf="!searching() && displayed().length === 0">آیه‌ای یافت نشد.</div>
    <button class="btn btn-sm" (click)="showMore()" *ngIf="displayed().length > shown()">نمایش ۲۰۰ آیهٔ بعدی</button>
  `,
  styles: `
    .v-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .actions {
      margin-right: auto;
      display: flex;
      gap: 6px;
    }
    .verse {
      font-size: 18px;
      line-height: 2;
      color: var(--lp-text);
      margin: 0;
      font-family: 'Traditional Arabic', 'Amiri', var(--lp-font);
    }
    .verse-fa {
      font-size: 14px;
      line-height: 1.9;
      color: var(--lp-muted, #555);
      margin: 6px 0 0;
    }
    .hint {
      color: var(--lp-muted, #666);
      font-size: 13px;
      margin: 8px 0;
    }
  `
})
export class QuranVersesComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly results = signal<QuranVerse[]>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  readonly searching = signal(false);
  readonly shown = signal(200);
  private readonly step = 200;
  search = '';
  surahFilter = '';

  surahs(): string[] {
    return Array.from(new Set(this.results().map((v) => v.surah).filter((s) => s.length > 0))).sort((a, b) => a.localeCompare(b, 'fa'));
  }

  displayed(): QuranVerse[] {
    if (!this.surahFilter) return this.results();
    return this.results().filter((v) => v.surah === this.surahFilter);
  }

  onSurahFilter(): void {
    this.shown.set(this.step);
  }

  showMore(): void {
    this.shown.set(this.shown() + this.step);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.shown.set(this.step);
    this.auth.getQuranVerses().subscribe({
      next: (list) => this.results.set(list),
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت آیات')
    });
  }

  onSearch(): void {
    if (this.timer) clearTimeout(this.timer);
    const q = this.search.trim();
    if (!q) {
      this.searching.set(false);
      this.load();
      return;
    }
    this.timer = setTimeout(() => {
      this.searching.set(true);
      this.shown.set(this.step);
      this.auth.searchQuranVerses(q).subscribe({
        next: (res) => {
          this.results.set(res.results);
          this.searching.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'خطا در جستجو');
          this.searching.set(false);
        }
      });
    }, 300);
  }

  remove(v: QuranVerse): void {
    if (!window.confirm(`آیه «${v.surah}:${v.verseNo}» حذف شود؟`)) return;
    this.auth.deleteQuranVerse(v.id).subscribe({
      next: () => {
        this.info.set('آیه حذف شد.');
        this.load();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در حذف آیه')
    });
  }
}
