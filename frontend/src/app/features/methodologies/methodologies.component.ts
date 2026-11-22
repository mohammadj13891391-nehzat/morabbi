import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/api.service';
import { Methodology } from '../../core/models/morabbi.models';

@Component({
  selector: 'app-methodologies',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">روش‌های تربیتی</h1>
      <div class="toolbar">
        <input type="search" placeholder="جستجو..." [(ngModel)]="search" (ngModelChange)="applyFilter()" />
        <button routerLink="/methodologies/new" class="btn" *ngIf="auth.isAdminManager()">افزودن روش</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>

    <div class="card" *ngFor="let m of filtered()">
      <div class="m-head">
        <h3 class="card-title" style="margin: 0">{{ m.name }}</h3>
        <div class="actions">
          <a [routerLink]="'/methodologies/' + m.id" class="btn btn-secondary btn-sm" *ngIf="auth.isAdminManager()">ویرایش</a>
          <button class="btn btn-danger btn-sm" (click)="remove(m)" *ngIf="auth.isAdminManager()">حذف</button>
        </div>
      </div>
      <p class="desc" *ngIf="m.desc">{{ m.desc }}</p>
      <div class="steps" *ngIf="m.steps">{{ m.steps }}</div>
    </div>
    <div class="empty" *ngIf="filtered().length === 0">روشی یافت نشد.</div>
  `,
  styles: `
    .m-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .desc {
      color: var(--lp-muted);
      margin: 8px 0;
      line-height: 1.8;
    }
    .steps {
      white-space: pre-wrap;
      background: var(--lp-bg);
      border-radius: 8px;
      padding: 12px 14px;
      line-height: 1.9;
      font-size: 13px;
    }
    .actions {
      display: flex;
      gap: 6px;
    }
  `
})
export class MethodologiesComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly list = signal<Methodology[]>([]);
  readonly filtered = signal<Methodology[]>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  search = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.auth.getMethodologies().subscribe({
      next: (list) => {
        this.list.set(list);
        this.applyFilter();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت روش‌ها')
    });
  }

  applyFilter(): void {
    const q = this.search.trim();
    this.filtered.set(q ? this.list().filter((m) => m.name.includes(q) || (m.desc ?? '').includes(q)) : this.list());
  }

  remove(m: Methodology): void {
    if (!window.confirm(`روش «${m.name}» حذف شود؟`)) return;
    this.auth.deleteMethodology(m.id).subscribe({
      next: () => {
        this.info.set('روش حذف شد.');
        this.load();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در حذف روش')
    });
  }
}
