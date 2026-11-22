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
        <input type="search" placeholder="جستجو در متن، سوره یا موضوع..." [(ngModel)]="search" (ngModelChange)="applyFilter()" />
        <button routerLink="/quran-verses/new" class="btn" *ngIf="auth.isAdminManager()">افزودن آیه</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>

    <div class="card" *ngFor="let v of filtered()">
      <div class="v-head">
        <span class="badge">{{ v.surah }} — آیه {{ v.verseNo }}</span>
        <span class="badge" *ngIf="v.topic">{{ v.topic }}</span>
        <div class="actions">
          <a [routerLink]="'/quran-verses/' + v.id" class="btn btn-secondary btn-sm" *ngIf="auth.isAdminManager()">ویرایش</a>
          <button class="btn btn-danger btn-sm" (click)="remove(v)" *ngIf="auth.isAdminManager()">حذف</button>
        </div>
      </div>
      <p class="verse" dir="rtl">{{ v.text }}</p>
    </div>
    <div class="empty" *ngIf="filtered().length === 0">آیه‌ای یافت نشد.</div>
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
  `
})
export class QuranVersesComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly list = signal<QuranVerse[]>([]);
  readonly filtered = signal<QuranVerse[]>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  search = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.auth.getQuranVerses().subscribe({
      next: (list) => {
        this.list.set(list);
        this.applyFilter();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت آیات')
    });
  }

  applyFilter(): void {
    const q = this.search.trim();
    this.filtered.set(
      q ? this.list().filter((v) => v.text.includes(q) || v.surah.includes(q) || (v.topic ?? '').includes(q)) : this.list()
    );
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
