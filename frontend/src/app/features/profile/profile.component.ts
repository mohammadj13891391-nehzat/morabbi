import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/api.service';
import { PushService } from '../../core/services/push.service';
import { roleLabel as roleLabelFn } from '../../core/utils/labels';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">پروفایل</h1>
    </div>

    <div class="grid-2">
      <div class="card" *ngIf="auth.user()">
        <h3 class="card-title">مشخصات حساب</h3>
        <dl class="kv">
          <dt>نام</dt><dd>{{ auth.user()!.name }}</dd>
          <dt>تلفن</dt><dd dir="ltr">{{ auth.user()!.phone }}</dd>
          <dt>کد ملی</dt><dd dir="ltr">{{ auth.user()!.nationalId || '—' }}</dd>
          <dt>نقش</dt><dd>{{ roleLabel(auth.user()!.role) }}</dd>
          <dt>وضعیت تأیید</dt><dd>{{ auth.user()!.approvalStatus }}</dd>
          <dt>امتیاز کل</dt><dd>{{ auth.user()!.totalPoints }}</dd>
          <dt>تشویق‌ها</dt><dd>{{ auth.user()!.recognitionsCount }}</dd>
        </dl>
      </div>

      <div class="card">
        <h3 class="card-title">تغییر رمز عبور</h3>
        <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
        <div class="alert alert-success" *ngIf="info()">{{ info() }}</div>
        <form (ngSubmit)="change()">
          <div class="field">
            <label>رمز فعلی</label>
            <input name="old" type="password" [(ngModel)]="oldPassword" required />
          </div>
          <div class="field">
            <label>رمز جدید</label>
            <input name="new" type="password" [(ngModel)]="newPassword" required />
          </div>
          <button class="btn" [disabled]="busy()">تغییر رمز</button>
        </form>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">اعلان‌های فوری</h3>
      <div class="alert" *ngIf="!push.supported">مرورگر شما از اعلان‌های فوری پشتیبانی نمی‌کند.</div>
      <div *ngIf="push.supported">
        <div class="alert alert-success" *ngIf="push.enabled()">
          اعلان‌های فوری فعال است؛ پیام‌های سیستم مستقیم روی دستگاه شما نمایش داده می‌شوند.
        </div>
        <div class="alert" *ngIf="!push.enabled() && !push.error()">اعلان‌های فوری در حال حاضر غیرفعال است.</div>
        <div class="alert alert-error" *ngIf="push.error()">{{ push.error() }}</div>
        <button class="btn" [disabled]="push.busy()" (click)="togglePush()">
          {{ push.enabled() ? 'غیرفعال‌کردن اعلان‌های فوری' : 'فعال‌کردن اعلان‌های فوری' }}
        </button>
      </div>
    </div>
  `
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  readonly push = inject(PushService);
  readonly roleLabel = roleLabelFn;
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  oldPassword = '';
  newPassword = '';

  ngOnInit(): void {
    this.push.refresh();
  }

  togglePush(): void {
    if (this.push.enabled()) {
      this.push.disable();
    } else {
      this.push.enable();
    }
  }

  change(): void {
    this.busy.set(true);
    this.error.set(null);
    this.info.set(null);
    this.auth.changePassword({ oldPassword: this.oldPassword, newPassword: this.newPassword }).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.info.set(res.message);
        this.oldPassword = '';
        this.newPassword = '';
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message ?? 'خطا در تغییر رمز');
      }
    });
  }
}
