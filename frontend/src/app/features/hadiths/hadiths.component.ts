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
      <h1 class="page-title">احادیث</h1>
      <div class="toolbar">
        <input type="search" placeholder="جستجو در متن، منبع یا موضوع..." [(ngModel)]="search" (ngModelChange)="applyFilter()" />
        <button routerLink="/hadiths/new" class="btn" *ngIf="auth.isAdminManager()">افزودن حدیث</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>

    <div class="card" *ngFor="let h of filtered()">
      <div class="h-head">
        <span class="badge">{{ h.source }}</span>
        <span class="badge" *ngIf="h.narrator">روایت: {{ h.narrator }}</span>
        <span class="badge" *ngIf="h.topic">{{ h.topic }}</span>
        <div class="actions">
          <a [routerLink]="'/hadiths/' + h.id" class="btn btn-secondary btn-sm" *ngIf="auth.isAdminManager()">ویرایش</a>
          <button class="btn btn-danger btn-sm" (click)="remove(h)" *ngIf="auth.isAdminManager()">حذف</button>
        </div>
      </div>
      <p class="text">{{ h.text }}</p>
    </div>
    <div class="empty" *ngIf="filtered().length === 0">حدیثی یافت نشد.</div>
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
    }
  `
})
export class HadithsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly list = signal<MorabbiHadith[]>([]);
  readonly filtered = signal<MorabbiHadith[]>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  search = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.auth.getHadiths().subscribe({
      next: (list) => {
        this.list.set(list);
        this.applyFilter();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت احادیث')
    });
  }

  applyFilter(): void {
    const q = this.search.trim();
    this.filtered.set(
      q ? this.list().filter((h) => h.text.includes(q) || h.source.includes(q) || (h.topic ?? '').includes(q)) : this.list()
    );
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
