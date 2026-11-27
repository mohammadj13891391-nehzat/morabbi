import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/api.service';
import { CreateHadithPayload } from '../../core/models/morabbi.models';

@Component({
  selector: 'app-hadith-form',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ isEdit() ? 'ویرایش حدیث' : 'افزودن حدیث' }}</h1>
      <button class="btn btn-secondary" (click)="back()">بازگشت</button>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
    <div class="alert alert-success" *ngIf="info()">{{ info() }}</div>

    <div class="card">
      <div class="grid-2">
        <div class="field">
          <label>منبع *</label>
          <input [(ngModel)]="form.source" placeholder="مثلا: کافى شیعی" />
        </div>
        <div class="field">
          <label>راوی</label>
          <input [(ngModel)]="form.narrator" />
        </div>
      </div>
      <div class="field">
        <label>متن اصلی *</label>
        <textarea [(ngModel)]="form.textAr" style="min-height: 100px" dir="rtl"></textarea>
      </div>
      <div class="field">
        <label>ترجمه / متن فارسی (اختیاری)</label>
        <textarea [(ngModel)]="form.textFa" style="min-height: 80px" dir="rtl"></textarea>
      </div>
      <div class="field">
        <label>موضوع</label>
        <input [(ngModel)]="form.topic" />
      </div>
      <button class="btn" [disabled]="busy()" (click)="save()">{{ isEdit() ? 'ذخیره' : 'افزودن' }}</button>
    </div>
  `
})
export class HadithFormComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEdit = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  editId: number | null = null;
  form: CreateHadithPayload = { source: '', narrator: '', textAr: '', textFa: null, topic: null };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.isEdit.set(true);
      this.auth.getHadith(this.editId).subscribe({
        next: (h) => {
          if (!h) {
            this.error.set('حدیث یافت نشد.');
            return;
          }
          this.form = { source: h.source, narrator: h.narrator, textAr: h.textAr, textFa: h.textFa ?? null, topic: h.topic ?? null };
        },
        error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت حدیث')
      });
    }
  }

  save(): void {
    if (!this.form.source.trim() || !this.form.textAr.trim()) {
      this.error.set('منبع و متن اصلی الزامی است.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const payload: CreateHadithPayload = {
      source: this.form.source.trim(),
      narrator: this.form.narrator?.trim() || '',
      textAr: this.form.textAr.trim(),
      textFa: this.form.textFa?.trim() || null,
      topic: this.form.topic?.trim() || null
    };
    const req = this.isEdit() && this.editId ? this.auth.updateHadith(this.editId, payload) : this.auth.createHadith(payload);
    req.subscribe({
      next: () => {
        this.busy.set(false);
        this.router.navigate(['/hadiths']);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message ?? 'خطا در ذخیره حدیث');
      }
    });
  }

  back(): void {
    this.router.navigate(['/hadiths']);
  }
}
