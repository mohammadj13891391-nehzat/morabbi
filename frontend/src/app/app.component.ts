import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/api.service';
import { GlobalSearchResult, SearchHit } from './core/models/morabbi.models';
import { roleLabel as roleLabelFn } from './core/utils/labels';

interface GsGroup {
  label: string;
  hits: SearchHit[];
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="sidebar" *ngIf="auth.isAuthenticated()">
        <div class="brand">
          <span class="brand-title">مربی</span>
          <span class="brand-sub">سامانه تربیت مربیان</span>
        </div>

        <div class="global-search">
          <input
            type="search"
            placeholder="جستجو در گزارش، طرح، آیه، حدیث..."
            [(ngModel)]="gq"
            (ngModelChange)="onGlobalSearch()"
            (focus)="gsFocus.set(true)"
            (blur)="onGlobalBlur()"
          />
          <div class="gs-panel" *ngIf="gsFocus() && gq.trim().length >= 2" (mouseenter)="gsFocus.set(true)" (mouseleave)="gsFocus.set(false)">
            <div class="gs-msg" *ngIf="gsBusy()">در حال جستجو...</div>
            <div class="gs-msg" *ngIf="!gsBusy() && !gsHasResults()">چیزی یافت نشد.</div>
            <ng-container *ngIf="!gsBusy()">
              <div *ngFor="let g of gsGroups()" class="gs-group">
                <div class="gs-group-title">{{ g.label }}</div>
                <a *ngFor="let h of g.hits" class="gs-hit" [href]="hitRoute(h)" (click)="gsFocus.set(false)">
                  <div class="gs-hit-title">{{ h.title }}</div>
                  <div class="gs-hit-sub" *ngIf="h.subtitle">{{ h.subtitle }}</div>
                </a>
              </div>
            </ng-container>
          </div>
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
    .global-search {
      position: relative;
      padding: 10px 12px;
    }
    .global-search input {
      width: 100%;
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #fff;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 13px;
    }
    .global-search input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
    .gs-panel {
      position: absolute;
      top: calc(100% + 4px);
      right: 12px;
      left: 12px;
      z-index: 50;
      max-height: 60vh;
      overflow-y: auto;
      background: #fff;
      color: var(--lp-text, #222);
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      padding: 8px;
    }
    .gs-msg {
      padding: 12px;
      text-align: center;
      font-size: 13px;
      color: var(--lp-muted, #666);
    }
    .gs-group {
      margin-bottom: 6px;
    }
    .gs-group-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--lp-muted, #888);
      padding: 6px 8px 2px;
    }
    .gs-hit {
      display: block;
      padding: 8px;
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
    }
    .gs-hit:hover {
      background: var(--lp-sidebar-active, #eef2ff);
    }
    .gs-hit-title {
      font-size: 13px;
      font-weight: 600;
    }
    .gs-hit-sub {
      font-size: 11px;
      color: var(--lp-muted, #666);
      margin-top: 2px;
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

  gq = '';
  readonly gsFocus = signal(false);
  readonly gsBusy = signal(false);
  readonly gsResult = signal<GlobalSearchResult | null>(null);
  private gsTimer: ReturnType<typeof setTimeout> | null = null;
  private gsBlurTimer: ReturnType<typeof setTimeout> | null = null;

  onGlobalSearch(): void {
    if (this.gsTimer) clearTimeout(this.gsTimer);
    const q = this.gq.trim();
    if (q.length < 2) {
      this.gsResult.set(null);
      this.gsBusy.set(false);
      return;
    }
    this.gsTimer = setTimeout(() => {
      this.gsBusy.set(true);
      this.auth.globalSearch(q, 5).subscribe({
        next: (r) => {
          this.gsResult.set(r);
          this.gsBusy.set(false);
        },
        error: () => {
          this.gsResult.set(null);
          this.gsBusy.set(false);
        }
      });
    }, 350);
  }

  onGlobalBlur(): void {
    if (this.gsBlurTimer) clearTimeout(this.gsBlurTimer);
    this.gsBlurTimer = setTimeout(() => this.gsFocus.set(false), 150);
  }

  gsGroups(): GsGroup[] {
    const r = this.gsResult();
    if (!r) return [];
    return [
      { label: 'گزارش‌ها', hits: r.reports },
      { label: 'طرح‌های درس', hits: r.lessonPlans },
      { label: 'افراد', hits: r.people },
      { label: 'آیات قرآن', hits: r.quranVerses },
      { label: 'احادیث', hits: r.hadiths },
      { label: 'کارها', hits: r.tasks }
    ].filter((g) => g.hits.length > 0);
  }

  gsHasResults(): boolean {
    return this.gsGroups().some((g) => g.hits.length > 0);
  }

  hitRoute(h: SearchHit): string {
    switch (h.type) {
      case 'report':
        return `/reports/${h.id}`;
      case 'lesson_plan':
        return `/lesson-plans/${h.id}`;
      case 'person':
        return `/people/${h.id}`;
      case 'quran':
        return '/quran-verses';
      case 'hadith':
        return '/hadiths';
      case 'task':
        return '/tasks';
      default:
        return '/dashboard';
    }
  }

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
