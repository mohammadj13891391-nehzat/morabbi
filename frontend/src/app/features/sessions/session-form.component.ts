import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/api.service';
import { CreateSessionPayload } from '../../core/models/morabbi.models';

@Component({
  selector: 'app-session-form',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ isEdit() ? 'ویرایش جلسه' : 'ثبت جلسه' }}</h1>
      <button class="btn btn-secondary" (click)="back()">بازگشت</button>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
    <div class="alert alert-success" *ngIf="info()">{{ info() }}</div>

    <div class="card">
      <div class="grid-2">
        <div class="field">
          <label>عنوان *</label>
          <input [(ngModel)]="form.title" placeholder="مثلا: جلسه برنامه‌ریزی هفتگی" />
        </div>
        <div class="field">
          <label>تاریخ</label>
          <input type="date" [(ngModel)]="form.date" dir="ltr" />
        </div>
        <div class="field">
          <label>مکان</label>
          <input [(ngModel)]="form.place" />
        </div>
        <div class="field">
          <label>حاضرین</label>
          <input [(ngModel)]="form.attendees" placeholder="نام افراد حاضر" />
        </div>
      </div>
      <div class="field">
        <label>روزنامه / دستور جلسه</label>
        <textarea [(ngModel)]="form.agenda"></textarea>
      </div>
      <div class="field">
        <label>مصوبات</label>
        <textarea [(ngModel)]="form.decisions"></textarea>
      </div>
      <div class="field">
        <label>پیگیری‌ها</label>
        <textarea [(ngModel)]="form.followup"></textarea>
      </div>
      <div class="field">
        <label>یادداشت</label>
        <textarea [(ngModel)]="form.note"></textarea>
      </div>
      <button class="btn" [disabled]="busy()" (click)="save()">{{ isEdit() ? 'ذخیره' : 'ثبت جلسه' }}</button>
    </div>
  `
})
export class SessionFormComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEdit = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  editId: number | null = null;
  form: CreateSessionPayload = {
    title: '',
    date: new Date().toISOString().slice(0, 10),
    attendees: '',
    place: '',
    agenda: '',
    decisions: '',
    followup: '',
    note: ''
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.isEdit.set(true);
      this.auth.getSessions().subscribe({
        next: (list) => {
          const s = list.find((x) => x.id === this.editId);
          if (!s) {
            this.error.set('جلسه یافت نشد.');
            return;
          }
          this.form = {
            title: s.title,
            date: s.date ?? '',
            attendees: s.attendees ?? '',
            place: s.place ?? '',
            agenda: s.agenda ?? '',
            decisions: s.decisions ?? '',
            followup: s.followup ?? '',
            note: s.note ?? ''
          };
        },
        error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت جلسه')
      });
    }
  }

  save(): void {
    if (!this.form.title.trim()) {
      this.error.set('عنوان جلسه الزامی است.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const payload: CreateSessionPayload = {
      title: this.form.title.trim(),
      date: this.form.date || null,
      attendees: this.form.attendees?.trim() || null,
      place: this.form.place?.trim() || null,
      agenda: this.form.agenda?.trim() || null,
      decisions: this.form.decisions?.trim() || null,
      followup: this.form.followup?.trim() || null,
      note: this.form.note?.trim() || null
    };
    const req = this.isEdit() && this.editId ? this.auth.updateSession(this.editId, payload) : this.auth.createSession(payload);
    req.subscribe({
      next: () => {
        this.busy.set(false);
        this.router.navigate(['/sessions']);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message ?? 'خطا در ذخیره جلسه');
      }
    });
  }

  back(): void {
    this.router.navigate(['/sessions']);
  }
}
