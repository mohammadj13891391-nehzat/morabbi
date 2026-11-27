import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/api.service';
import { MorabbiHadith } from '../../core/models/morabbi.models';

@Component({
  selector: 'app-hadiths',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">احادیث و روایات</h1>
      <div class="toolbar">
        <input type="search" placeholder="جستجو در کتاب، راوی یا فصل..." [(ngModel)]="search" (ngModelChange)="onSearch()" />
        <label class="deep-toggle">
          <input type="checkbox" [(ngModel)]="deep" (ngModelChange)="onSearch()" />
          جستجوی عمیق در متن
        </label>
        <button routerLink="/hadiths/new" class="btn" *ngIf="auth.isAdminManager()">افزودن حدیث</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
    <div class="hint" *ngIf="searching()">در حال جستجو{{ deep ? ' (عمیق — ممکن است تا ۱ دقیقه طول بکشد)' : '' }}...</div>
    <div class="hint" *ngIf="!search.trim()">نمایش: {{ results().length }} رکورد (هر رکورد یک جلد/بخش از یک کتاب است)</div>

    <div class="card" *ngFor="let h of results()">
      <div class="h-head">
        <span class="badge">{{ h.source }}</span>
        <span class="badge" *ngIf="h.narrator">روایت: {{ h.narrator }}</span>
        <span class="badge" *ngIf="h.topic">{{ h.topic }}</span>
        <div class="actions">
          <a [routerLink]="'/hadiths/' + h.id" class="btn btn-secondary btn-sm" *ngIf="auth.isAdminManager()">ویرایش</a>
          <button class="btn btn-danger btn-sm" (click)="remove(h)" *ngIf="auth.isAdminManager()">حذف</button>
        </div>
      </div>
      <p class="text">{{ h.textFa || h.textAr }}</p>
      <details *ngIf="h.textFa && h.textAr">
        <summary>متن عربی</summary>
        <p class="text arabic" dir="rtl">{{ h.textAr }}</p>
      </details>
    </div>
    <div class="empty" *ngIf="!searching() && results().length === 0">حدیثی یافت نشد.</div>
  `,
  styles: `
    .h-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .actions {
      margin-right: auto;
      display: flex;
      gap: 6px;
    }
    .text {
      font-size: 15px;
      line-height: 2;
      margin: 0;
      white-space: pre-wrap;
      max-height: 300px;
      overflow-y: auto;
    }
    .text.arabic {
      font-family: 'Traditional Arabic', 'Amiri', var(--lp-font);
      font-size: 17px;
    }
    .deep-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--lp-text, #222);
      cursor: pointer;
      white-space: nowrap;
    }
    .hint {
      color: var(--lp-muted, #666);
      font-size: 13px;
      margin: 8px 0;
    }
    details { margin-top: 8px; }
    summary { cursor: pointer; font-size: 13px; color: var(--lp-muted, #666); }
  `
})
export class HadithsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly results = signal<MorabbiHadith[]>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  readonly searching = signal(false);
  search = '';
  deep = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.auth.getHadiths().subscribe({
      next: (list) => this.results.set(list),
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت احادیث')
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
      this.auth.searchHadiths(q, this.deep).subscribe({
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

  remove(h: MorabbiHadith): void {
    if (!window.confirm('این حدیث حذف شود؟')) return;
    this.auth.deleteHadith(h.id).subscribe({
      next: () => {
        this.info.set('حدیث حذف شد.');
        this.load();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در حذف حدیث')
    });
  }
}
