import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports-list.component').then((m) => m.ReportsListComponent)
      },
      {
        path: 'reports/new',
        loadComponent: () => import('./features/reports/report-form.component').then((m) => m.ReportFormComponent)
      },
      {
        path: 'reports/:id',
        loadComponent: () => import('./features/reports/report-detail.component').then((m) => m.ReportDetailComponent)
      },
      {
        path: 'reports/:id/edit',
        loadComponent: () => import('./features/reports/report-form.component').then((m) => m.ReportFormComponent)
      },
      {
        path: 'lesson-plans',
        loadComponent: () => import('./features/lesson-plans/lesson-plans-list.component').then((m) => m.LessonPlansListComponent)
      },
      {
        path: 'lesson-plans/new',
        loadComponent: () => import('./features/lesson-plans/lesson-plan-form.component').then((m) => m.LessonPlanFormComponent)
      },
      {
        path: 'lesson-plans/:id',
        loadComponent: () => import('./features/lesson-plans/lesson-plan-detail.component').then((m) => m.LessonPlanDetailComponent)
      },
      {
        path: 'lesson-plans/:id/edit',
        loadComponent: () => import('./features/lesson-plans/lesson-plan-form.component').then((m) => m.LessonPlanFormComponent)
      },
      {
        path: 'recognition',
        loadComponent: () => import('./features/recognition/recognition.component').then((m) => m.RecognitionComponent)
      },
      {
        path: 'approvals',
        canActivate: [roleGuard('admin', 'manager', 'branch_manager')],
        loadComponent: () => import('./features/approvals/approvals.component').then((m) => m.ApprovalsComponent)
      },
      {
        path: 'organization',
        canActivate: [roleGuard('admin', 'manager')],
        loadComponent: () => import('./features/organization/organization.component').then((m) => m.OrganizationComponent)
      },
      {
        path: 'people',
        loadComponent: () => import('./features/people/people.component').then((m) => m.PeopleComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/attendance.component').then((m) => m.AttendanceComponent)
      },
      {
        path: 'people/new',
        loadComponent: () => import('./features/people/person-form.component').then((m) => m.PersonFormComponent)
      },
      {
        path: 'people/:id',
        loadComponent: () => import('./features/people/person-form.component').then((m) => m.PersonFormComponent)
      },
      {
        path: 'sessions',
        loadComponent: () => import('./features/sessions/sessions.component').then((m) => m.SessionsComponent)
      },
      {
        path: 'sessions/new',
        loadComponent: () => import('./features/sessions/session-form.component').then((m) => m.SessionFormComponent)
      },
      {
        path: 'sessions/:id',
        loadComponent: () => import('./features/sessions/session-form.component').then((m) => m.SessionFormComponent)
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/tasks.component').then((m) => m.TasksComponent)
      },
      {
        path: 'daily-tracker',
        loadComponent: () => import('./features/daily-tracker/daily-tracker.component').then((m) => m.DailyTrackerComponent)
      },
      {
        path: 'methodologies',
        loadComponent: () => import('./features/methodologies/methodologies.component').then((m) => m.MethodologiesComponent)
      },
      {
        path: 'methodologies/new',
        loadComponent: () => import('./features/methodologies/methodology-form.component').then((m) => m.MethodologyFormComponent)
      },
      {
        path: 'methodologies/:id',
        loadComponent: () => import('./features/methodologies/methodology-form.component').then((m) => m.MethodologyFormComponent)
      },
      {
        path: 'quran-verses',
        loadComponent: () => import('./features/quran-verses/quran-verses.component').then((m) => m.QuranVersesComponent)
      },
      {
        path: 'quran-verses/new',
        loadComponent: () => import('./features/quran-verses/verse-form.component').then((m) => m.VerseFormComponent)
      },
      {
        path: 'quran-verses/:id',
        loadComponent: () => import('./features/quran-verses/verse-form.component').then((m) => m.VerseFormComponent)
      },
      {
        path: 'hadiths',
        loadComponent: () => import('./features/hadiths/hadiths.component').then((m) => m.HadithsComponent)
      },
      {
        path: 'hadiths/new',
        loadComponent: () => import('./features/hadiths/hadith-form.component').then((m) => m.HadithFormComponent)
      },
      {
        path: 'hadiths/:id',
        loadComponent: () => import('./features/hadiths/hadith-form.component').then((m) => m.HadithFormComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent)
      },
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];
