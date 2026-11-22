import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/api.service';
import { MorabbiSession } from '../../core/models/morabbi.models';

@Component({
  selector: 'app-sessions',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">جلسات</h1>
      <div class="toolbar">
        <button routerLink="/sessions/new" class="btn">ثبت جلسه</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>

    <div class="card">
      <div class="empty" *ngIf="sessions().length === 0">جلسه‌ای ثبت نشده است.</div>
      <table class="lp-table" *ngIf="sessions().length > 0">
        <thead>
          <tr>
            <th>عنوان</th>
            <th>تاریخ</th>
            <th>مکان</th>
            <th>مربی</th>
            <th>حاضرین</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of sessions()">
            <td><strong>{{ s.title }}</strong><div class="note" *ngIf="s.agenda">{{ s.agenda | slice:0:80 }}</div></td>
            <td>{{ s.date || '—' }}</td>
            <td>{{ s.place || '—' }}</td>
            <td>{{ s.instructor?.name ?? '—' }}</td>
            <td>{{ s.attendees || '—' }}</td>
            <td class="actions">
              <a [routerLink]="'/sessions/' + s.id" class="btn btn-secondary btn-sm">ویرایش</a>
              <button class="btn btn-danger btn-sm" (click)="remove(s)">حذف</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .note {
      font-size: 11px;
      color: var(--lp-muted);
      margin-top: 2px;
    }
    .actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
  `
})
export class SessionsComponent implements OnInit {
  readonly auth = inject(AuthService);

  readonly sessions = signal<MorabbiSession[]>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.auth.getSessions().subscribe({
      next: (list) => this.sessions.set(list),
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت جلسات')
    });
  }

  remove(s: MorabbiSession): void {
    if (!window.confirm(`جلسه «${s.title}» حذف شود؟`)) return;
    this.auth.deleteSession(s.id).subscribe({
      next: () => {
        this.info.set('جلسه حذف شد.');
        this.load();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در حذف جلسه')
    });
  }
}
