import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/api.service';
import { Attendance, Person } from '../../core/models/morabbi.models';
import { attendanceStatusLabel } from '../../core/utils/labels';

@Component({
  selector: 'app-attendance',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">حضور و غیاب</h1>
      <div class="toolbar">
        <input type="date" [(ngModel)]="date" (ngModelChange)="load()" dir="ltr" />
        <button class="btn" [disabled]="busy()" (click)="saveAll()">ثبت همه</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
    <div class="alert alert-success" *ngIf="info()">{{ info() }}</div>

    <div class="card">
      <div class="empty" *ngIf="rows().length === 0">فردی ثبت نشده است. ابتدا از بخش «افراد» فرد اضافه کنید.</div>
      <table class="lp-table" *ngIf="rows().length > 0">
        <thead>
          <tr>
            <th>نام</th>
            <th>گروه</th>
            <th>وضعیت</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of rows()">
            <td><strong>{{ r.person?.name ?? '—' }}</strong></td>
            <td><span class="badge">{{ r.person?.group || 'بدون گروه' }}</span></td>
            <td>
              <label class="choice">
                <input type="radio" [name]="'att' + r.personId" [value]="'PRESENT'" [(ngModel)]="r.status" />
                حاضر
              </label>
              <label class="choice">
                <input type="radio" [name]="'att' + r.personId" [value]="'ABSENT'" [(ngModel)]="r.status" />
                غایب
              </label>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card" style="margin-top: 16px">
      <h3 class="card-title">تاریخچه حضور (۷ روز اخیر)</h3>
      <div class="empty" *ngIf="history().length === 0">رویدادی ثبت نشده است.</div>
      <table class="lp-table" *ngIf="history().length > 0">
        <thead>
          <tr>
            <th>تاریخ</th>
            <th>نام</th>
            <th>وضعیت</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let h of history()">
            <td>{{ h.date }}</td>
            <td>{{ h.person?.name ?? '—' }}</td>
            <td>
              <span class="badge" [class.badge-approved]="h.status === 'PRESENT'" [class.badge-rejected]="h.status === 'ABSENT'">
                {{ attendanceStatusLabel(h.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .choice {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-left: 14px;
      margin-bottom: 0;
    }
    .choice input {
      width: auto;
    }
  `
})
export class AttendanceComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly attendanceStatusLabel = attendanceStatusLabel;

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  readonly rows = signal<Array<{ personId: number; person: Person | null; status: string }>>([]);
  readonly history = signal<Attendance[]>([]);

  date = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.auth.getPeople().subscribe({
      next: (people) => {
        this.rows.set(people.map((p) => ({ personId: p.id, person: p, status: 'PRESENT' })));
        this.auth.getAttendance(this.date).subscribe({
          next: (list) => {
            for (const a of list) {
              const row = this.rows().find((r) => r.personId === a.personId);
              if (row) row.status = a.status;
            }
            this.rows.set([...this.rows()]);
          },
          error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت وضعیت حضور')
        });
      },
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت افراد')
    });
    this.auth.getAttendanceHistory(undefined, 7).subscribe({
      next: (h) => this.history.set(h),
      error: () => undefined
    });
  }

  saveAll(): void {
    this.busy.set(true);
    this.error.set(null);
    this.info.set(null);
    const rows = this.rows();
    if (rows.length === 0) {
      this.busy.set(false);
      this.error.set('فردی برای ثبت وجود ندارد.');
      return;
    }
    let done = 0;
    let failed = 0;
    for (const r of rows) {
      this.auth.setAttendance({ personId: r.personId, date: this.date, status: r.status }).subscribe({
        next: () => {
          done++;
          if (done + failed === rows.length) {
            this.busy.set(false);
            if (failed > 0) {
              this.error.set(`${failed} مورد با خطا ثبت نشد.`);
            } else {
              this.info.set('وضعیت حضور ثبت شد.');
            }
            this.load();
          }
        },
        error: () => {
          failed++;
          if (done + failed === rows.length) {
            this.busy.set(false);
            this.error.set(`${failed} مورد با خطا ثبت نشد.`);
          }
        }
      });
    }
  }
}
