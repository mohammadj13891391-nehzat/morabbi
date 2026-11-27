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
        <button routerLink="/quran-verses/new" class="btn" *ngIf="auth.isAdminManager()">افزودن آیه</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
    <div class="hint" *ngIf="searching()">در حال جستجو...</div>

    <div class="card" *ngFor="let v of results()">
      <div class="v-head">
        <span class="badge">{{ v.surah }} — آیه {{ v.verseNo }}</span>
        <span class="badge" *ngIf="v.topic">{{ v.topic }}</span>
        <div class="actions">
          <a [routerLink]="'/quran-verses/' + v.id" class="btn btn-secondary btn-sm" *ngIf="auth.isAdminManager()">ویرایش</a>
          <button class="btn btn-danger btn-sm" (click)="remove(v)" *ngIf="auth.isAdminManager()">حذف</button>
        </div>
      </div>
      <p class="verse" dir="rtl">{{ v.textAr }}</p>
    </div>
    <div class="empty" *ngIf="!searching() && results().length === 0">آیه‌ای یافت نشد.</div>
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
  search = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
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
