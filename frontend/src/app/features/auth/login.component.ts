import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/api.service';
import { RegisterPayload } from '../../core/models/morabbi.models';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-brand">مربی</div>
        <div class="login-sub" *ngIf="mode() === 'login'">سامانه تربیت مربیان</div>
        <div class="login-sub" *ngIf="mode() === 'register'">ثبت‌نام در سامانه</div>

        <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
        <div class="alert alert-success" *ngIf="info()">{{ info() }}</div>

        <form (ngSubmit)="submit()" *ngIf="mode() === 'login'">
          <div class="field">
            <label>شماره تلفن</label>
            <input name="phone" [(ngModel)]="phone" dir="ltr" placeholder="0912..." required />
          </div>
          <div class="field">
            <label>رمز عبور</label>
            <input name="password" type="password" [(ngModel)]="password" required />
          </div>
          <button class="btn" style="width: 100%" [disabled]="busy()">ورود</button>
          <div class="login-switch">
            هنوز ثبت‌نام نکرده‌اید؟
            <a (click)="mode.set('register')">ثبت‌نام کنید</a>
          </div>
        </form>

        <form (ngSubmit)="submit()" *ngIf="mode() === 'register'">
          <div class="field">
            <label>نام و نام خانوادگی</label>
            <input name="name" [(ngModel)]="reg.name" required />
          </div>
          <div class="field">
            <label>شماره تلفن</label>
            <input name="phone" [(ngModel)]="reg.phone" dir="ltr" placeholder="0912..." required />
          </div>
          <div class="field">
            <label>کد ملی (اختیاری)</label>
            <input name="nationalId" [(ngModel)]="reg.nationalId" dir="ltr" />
          </div>
          <div class="field">
            <label>رمز عبور</label>
            <input name="password" type="password" [(ngModel)]="reg.password" required />
          </div>
          <div class="field">
            <label>نقش مورد درخواست</label>
            <select name="role" [(ngModel)]="reg.requestedRole">
              <option value="coach">مربی</option>
              <option value="instructor_assistant">دستیار مربی</option>
              <option value="evaluator">ارزیاب</option>
              <option value="branch_manager">مسئول شعبه</option>
            </select>
          </div>
          <button class="btn" style="width: 100%" [disabled]="busy()">ثبت‌نام</button>
          <div class="login-switch">
            قبلاً ثبت‌نام کرده‌اید؟
            <a (click)="mode.set('login')">وارد شوید</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: `
    .login-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(160deg, #10201a 0%, #1d3a2f 100%);
      padding: 20px;
    }
    .login-card {
      background: var(--lp-surface);
      border-radius: 14px;
      box-shadow: var(--lp-shadow);
      padding: 30px;
      width: 100%;
      max-width: 400px;
    }
    .login-brand {
      font-size: 28px;
      font-weight: 700;
      color: var(--lp-primary);
      text-align: center;
    }
    .login-sub {
      text-align: center;
      color: var(--lp-muted);
      font-size: 13px;
      margin-bottom: 22px;
    }
    .login-switch {
      margin-top: 16px;
      text-align: center;
      font-size: 13px;
      color: var(--lp-muted);
    }
  `
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  phone = '';
  password = '';
  reg: RegisterPayload = { phone: '', name: '', password: '', requestedRole: 'coach' };

  submit(): void {
    this.error.set(null);
    this.info.set(null);
    if (this.mode() === 'login') {
      this.busy.set(true);
      this.auth.login(this.phone.trim(), this.password).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          this.busy.set(false);
          this.error.set(this.message(err) ?? 'ورود ناموفق بود.');
        }
      });
    } else {
      this.busy.set(true);
      this.auth.register(this.reg).subscribe({
        next: () => {
          this.busy.set(false);
          this.mode.set('login');
          this.phone = this.reg.phone;
          this.error.set(null);
          this.info.set('ثبت‌نام شما با موفقیت انجام شد و در انتظار تأیید مسئول است.');
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(this.message(err) ?? 'ثبت‌نام ناموفق بود.');
        }
      });
    }
  }

  private message(err: unknown): string | null {
    const body = (err as { error?: { message?: string } })?.error;
    return body?.message ?? null;
  }
}
