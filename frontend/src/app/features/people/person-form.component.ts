import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/api.service';
import { CreatePersonPayload, Person } from '../../core/models/morabbi.models';

@Component({
  selector: 'app-person-form',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ isEdit() ? 'ویرایش فرد' : 'افزودن فرد' }}</h1>
      <button class="btn btn-secondary" (click)="back()">بازگشت</button>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
    <div class="alert alert-success" *ngIf="info()">{{ info() }}</div>

    <div class="card">
      <div class="grid-2">
        <div class="field">
          <label>نام و نام خانوادگی *</label>
          <input [(ngModel)]="form.name" />
        </div>
        <div class="field">
          <label>کد ملی</label>
          <input [(ngModel)]="form.code" dir="ltr" />
        </div>
        <div class="field">
          <label>سن</label>
          <input type="number" [(ngModel)]="form.age" dir="ltr" />
        </div>
        <div class="field">
          <label>تلفن</label>
          <input [(ngModel)]="form.phone" dir="ltr" />
        </div>
        <div class="field">
          <label>پایه</label>
          <input [(ngModel)]="form.grade" placeholder="مثلا: دهم" />
        </div>
        <div class="field">
          <label>گروه</label>
          <select [(ngModel)]="form.group">
            <option value="">بدون گروه</option>
            <option value="ESTEGHLATI">استقامتی</option>
            <option value="NIMESORAT">نیمه‌سرعتی</option>
            <option value="SORATI">سرعتی</option>
          </select>
        </div>
        <div class="field">
          <label>تاریخ پیوست</label>
          <input type="date" [(ngModel)]="form.joinDate" dir="ltr" />
        </div>
      </div>
      <div class="field">
        <label>توضیحات</label>
        <textarea [(ngModel)]="form.note"></textarea>
      </div>
      <button class="btn" [disabled]="busy()" (click)="save()">{{ isEdit() ? 'ذخیره' : 'افزودن' }}</button>
    </div>
  `
})
export class PersonFormComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEdit = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  editId: number | null = null;
  form: CreatePersonPayload = { name: '', code: '', age: null, phone: '', grade: '', group: '', joinDate: '', note: '' };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.isEdit.set(true);
      this.auth.getPeople().subscribe({
        next: (list) => {
          const p = list.find((x) => x.id === this.editId);
          if (!p) {
            this.error.set('فرد یافت نشد.');
            return;
          }
          this.form = {
            name: p.name,
            code: p.code ?? '',
            age: p.age ?? null,
            phone: p.phone ?? '',
            grade: p.grade ?? '',
            group: p.group ?? '',
            joinDate: p.joinDate ?? '',
            note: p.note ?? ''
          };
        },
        error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت فرد')
      });
    }
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.error.set('نام الزامی است.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const payload: CreatePersonPayload = {
      name: this.form.name.trim(),
      code: this.form.code?.trim() || null,
      age: this.form.age ?? null,
      phone: this.form.phone?.trim() || null,
      grade: this.form.grade?.trim() || null,
      group: this.form.group || '',
      joinDate: this.form.joinDate || null,
      note: this.form.note?.trim() || null
    };
    const req = this.isEdit() && this.editId ? this.auth.updatePerson(this.editId, payload) : this.auth.createPerson(payload);
    req.subscribe({
      next: () => {
        this.busy.set(false);
        this.router.navigate(['/people']);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message ?? 'خطا در ذخیره فرد');
      }
    });
  }

  back(): void {
    this.router.navigate(['/people']);
  }
}
