import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/api.service';
import { roleLabel as roleLabelFn } from './core/utils/labels';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="sidebar" *ngIf="auth.isAuthenticated()">
        <div class="brand">
          <span class="brand-title">مربی</span>
          <span class="brand-sub">سامانه تربیت مربیان</span>
        </div>
        <nav class="nav">
          <a routerLink="/dashboard" routerLinkActive="active">
            <span class="ico">◈</span> داشبورد
          </a>
          <a routerLink="/reports" routerLinkActive="active">
            <span class="ico">✎</span> گزارش‌های روزانه
          </a>
          <a routerLink="/lesson-plans" routerLinkActive="active">
            <span class="ico">▤</span> طرح‌های درس
          </a>
          <a routerLink="/recognition" routerLinkActive="active">
            <span class="ico">★</span> تشویق‌ها و امتیازها
          </a>
          <a routerLink="/approvals" routerLinkActive="active" *ngIf="auth.canApprove()">
            <span class="ico">✓</span> تأیید کاربران
          </a>
          <a routerLink="/organization" routerLinkActive="active" *ngIf="auth.isAdminManager()">
            <span class="ico">⌂</span> مکتب‌ها و شعب
          </a>
          <div class="nav-section">نهضت تربیتی</div>
          <a routerLink="/people" routerLinkActive="active">
            <span class="ico">☷</span> افراد
          </a>
          <a routerLink="/attendance" routerLinkActive="active">
            <span class="ico">✓</span> حضور و غیاب
          </a>
          <a routerLink="/sessions" routerLinkActive="active">
            <span class="ico">◫</span> جلسات
          </a>
          <a routerLink="/tasks" routerLinkActive="active">
            <span class="ico">☑</span> کارهای در پیش
          </a>
          <a routerLink="/daily-tracker" routerLinkActive="active">
            <span class="ico">◔</span> ردیاب روزانه
          </a>
          <a routerLink="/methodologies" routerLinkActive="active">
            <span class="ico">✦</span> روش‌های تربیتی
          </a>
          <a routerLink="/quran-verses" routerLinkActive="active">
            <span class="ico">﴾﴿</span> آیات قرآن
          </a>
          <a routerLink="/hadiths" routerLinkActive="active">
            <span class="ico">❝</span> احادیث
          </a>
          <a routerLink="/profile" routerLinkActive="active">
            <span class="ico">☺</span> پروفایل
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-chip" *ngIf="auth.user()">
            <div class="user-name">{{ auth.user()!.name }}</div>
            <div class="user-role">{{ roleLabel(auth.user()!.role) }}</div>
          </div>
          <button class="btn btn-secondary btn-sm" (click)="logout()">خروج از حساب</button>
        </div>
      </aside>
      <main class="main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 240px;
      background: var(--lp-sidebar);
      color: var(--lp-sidebar-text);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .brand {
      padding: 20px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand-title {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: #fff;
    }
    .brand-sub {
      font-size: 11px;
      color: var(--lp-sidebar-text);
      opacity: 0.7;
    }
    .nav {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }
    .nav a {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--lp-sidebar-text);
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 14px;
    }
    .nav a:hover {
      background: rgba(255, 255, 255, 0.06);
      text-decoration: none;
    }
    .nav a.active {
      background: var(--lp-sidebar-active);
      color: #fff;
      font-weight: 600;
    }
    .nav-section {
      padding: 14px 12px 4px;
      font-size: 11px;
      opacity: 0.55;
      letter-spacing: 0.3px;
    }
    .ico {
      width: 18px;
      text-align: center;
      color: var(--lp-accent);
    }
    .sidebar-footer {
      padding: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .user-name {
      color: #fff;
      font-size: 13px;
      font-weight: 600;
    }
    .user-role {
      font-size: 11px;
      opacity: 0.7;
    }
    .main {
      flex: 1;
      padding: 26px;
      min-width: 0;
    }
    @media (max-width: 800px) {
      .shell {
        flex-direction: column;
      }
      .sidebar {
        width: 100%;
      }
    }
  `
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly roleLabel = roleLabelFn;
  private readonly router = inject(Router);

  constructor() {
    window.addEventListener('load', () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
