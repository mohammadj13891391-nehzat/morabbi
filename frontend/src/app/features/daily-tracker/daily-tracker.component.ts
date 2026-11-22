import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/api.service';
import { DailyTracker, UpsertTrackerPayload } from '../../core/models/morabbi.models';

type BoolKey = Exclude<keyof UpsertTrackerPayload, 'date'>;

const ITEMS: Array<{ key: BoolKey; label: string }> = [
  { key: 'salat_fajr', label: 'نماز صبح' },
  { key: 'salat_zuhr', label: 'نماز ظهر' },
  { key: 'salat_asr', label: 'نماز عصر' },
  { key: 'salat_maghrib', label: 'نماز مغرب' },
  { key: 'salat_isha', label: 'نماز عشا' },
  { key: 'dhikr_morning', label: 'اذکار صبح' },
  { key: 'dhikr_evening', label: 'اذکار شب' },
  { key: 'quran', label: 'تلاوت قرآن' },
  { key: 'fasting', label: 'روزه' },
  { key: 'study', label: 'مطالعه' }
];

@Component({
  selector: 'app-daily-tracker',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">ردیاب روزانه</h1>
      <div class="toolbar">
        <input type="date" [(ngModel)]="date" (ngModelChange)="loadDay()" dir="ltr" />
      </div>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
    <div class="alert alert-success" *ngIf="info()">{{ info() }}</div>

    <div class="card">
      <h3 class="card-title">ثبت روز {{ date }}</h3>
      <div class="tracker-grid">
        <label class="tracker-item" *ngFor="let it of items()">
          <input type="checkbox" [(ngModel)]="form[it.key]" [disabled]="busy()" />
          <span>{{ it.label }}</span>
        </label>
      </div>
      <button class="btn" [disabled]="busy()" (click)="save()">ثبت</button>
      <span class="hint">هر موردی که تازه تیک بخورد، یک امتیاز به شما تعلق می‌گیرد.</span>
    </div>

    <div class="card" style="margin-top: 16px">
      <h3 class="card-title">تاریخچه (۱۴ روز اخیر)</h3>
      <div class="empty" *ngIf="history().length === 0">رویدادی ثبت نشده است.</div>
      <table class="lp-table" *ngIf="history().length > 0">
        <thead>
          <tr>
            <th>تاریخ</th>
            <th *ngFor="let it of items()">{{ it.short }}</th>
            <th>نمره</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of history()">
            <td>{{ d.date }}</td>
            <td *ngFor="let it of items()">
              <span class="dot" [class.on]="d[it.key]">✓</span>
            </td>
            <td><strong>{{ score(d) }}</strong>/۱۰</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .tracker-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 8px;
      margin-bottom: 14px;
    }
    .tracker-item {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--lp-border);
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 0;
      cursor: pointer;
      background: var(--lp-surface);
    }
    .tracker-item:has(input:checked) {
      border-color: var(--lp-primary);
      background: #f0f7f4;
    }
    .tracker-item input {
      width: auto;
    }
    .hint {
      display: block;
      margin-top: 8px;
      font-size: 12px;
      color: var(--lp-muted);
    }
    .dot {
      color: #cbd5d0;
      text-align: center;
    }
    .dot.on {
      color: var(--lp-success);
      font-weight: 700;
    }
  `
})
export class DailyTrackerComponent implements OnInit {
  readonly auth = inject(AuthService);

  readonly items = signal(ITEMS.map((it) => ({ ...it, short: it.label.slice(0, 4) })));
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  readonly history = signal<DailyTracker[]>([]);

  date = new Date().toISOString().slice(0, 10);
  form: UpsertTrackerPayload = {
    date: null,
    salat_fajr: false,
    salat_zuhr: false,
    salat_asr: false,
    salat_maghrib: false,
    salat_isha: false,
    dhikr_morning: false,
    dhikr_evening: false,
    quran: false,
    fasting: false,
    study: false
  };

  ngOnInit(): void {
    this.loadHistory();
    this.loadDay();
  }

  loadHistory(): void {
    this.auth.getTracker(14).subscribe({
      next: (list) => this.history.set(list),
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت ردیاب')
    });
  }

  loadDay(): void {
    const day = this.history().find((d) => d.date === this.date);
    if (day) {
      this.form = {
        date: day.date,
        salat_fajr: day.salat_fajr,
        salat_zuhr: day.salat_zuhr,
        salat_asr: day.salat_asr,
        salat_maghrib: day.salat_maghrib,
        salat_isha: day.salat_isha,
        dhikr_morning: day.dhikr_morning,
        dhikr_evening: day.dhikr_evening,
        quran: day.quran,
        fasting: day.fasting,
        study: day.study
      };
    } else {
      this.form = {
        date: this.date,
        salat_fajr: false,
        salat_zuhr: false,
        salat_asr: false,
        salat_maghrib: false,
        salat_isha: false,
        dhikr_morning: false,
        dhikr_evening: false,
        quran: false,
        fasting: false,
        study: false
      };
    }
  }

  save(): void {
    this.busy.set(true);
    this.error.set(null);
    this.info.set(null);
    this.auth.upsertTracker({ ...this.form, date: this.date }).subscribe({
      next: () => {
        this.busy.set(false);
        this.info.set('ثبت شد. امتیازهای جدید محاسبه شد.');
        this.loadHistory();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message ?? 'خطا در ثبت ردیاب روزانه');
      }
    });
  }

  score(d: DailyTracker): number {
    return ITEMS.reduce((sum, it) => sum + (d[it.key] ? 1 : 0), 0);
  }
}
