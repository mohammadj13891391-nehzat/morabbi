import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/api.service';
import { CreateQuranVersePayload } from '../../core/models/morabbi.models';

@Component({
  selector: 'app-verse-form',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ isEdit() ? 'ویرایش آیه' : 'افزودن آیه' }}</h1>
      <button class="btn btn-secondary" (click)="back()">بازگشت</button>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
    <div class="alert alert-success" *ngIf="info()">{{ info() }}</div>

    <div class="card">
      <div class="grid-2">
        <div class="field">
          <label>سوره *</label>
          <input [(ngModel)]="form.surah" placeholder="مثلا: نوح" />
        </div>
        <div class="field">
          <label>شماره آیه *</label>
          <input type="number" [(ngModel)]="form.verseNo" dir="ltr" />
        </div>
      </div>
      <div class="field">
        <label>متن عربی (عثمانی) *</label>
        <textarea [(ngModel)]="form.textAr" style="min-height: 100px" dir="rtl"></textarea>
      </div>
      <div class="field">
        <label>متن ساده‌شده (اختیاری)</label>
        <textarea [(ngModel)]="form.textFa" style="min-height: 80px" dir="rtl"></textarea>
      </div>
      <div class="field">
        <label>موضوع</label>
        <input [(ngModel)]="form.topic" placeholder="مثلا: صبر، امید، قرآن" />
      </div>
      <button class="btn" [disabled]="busy()" (click)="save()">{{ isEdit() ? 'ذخیره' : 'افزودن' }}</button>
    </div>
  `
})
export class VerseFormComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEdit = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  editId: number | null = null;
  form: CreateQuranVersePayload = { surah: '', verseNo: 0, textAr: '', textFa: null, topic: null };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.isEdit.set(true);
      this.auth.getQuranVerse(this.editId).subscribe({
        next: (v) => {
          if (!v) {
            this.error.set('آیه یافت نشد.');
            return;
          }
          this.form = { surah: v.surah, verseNo: v.verseNo, textAr: v.textAr, textFa: v.textFa ?? null, topic: v.topic ?? null };
        },
        error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت آیه')
      });
    }
  }

  save(): void {
    if (!this.form.surah.trim() || !this.form.textAr.trim() || !this.form.verseNo) {
      this.error.set('سوره، شماره آیه و متن عربی الزامی است.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const payload: CreateQuranVersePayload = {
      surah: this.form.surah.trim(),
      verseNo: this.form.verseNo,
      textAr: this.form.textAr.trim(),
      textFa: this.form.textFa?.trim() || null,
      topic: this.form.topic?.trim() || null
    };
    const req = this.isEdit() && this.editId ? this.auth.updateQuranVerse(this.editId, payload) : this.auth.createQuranVerse(payload);
    req.subscribe({
      next: () => {
        this.busy.set(false);
        this.router.navigate(['/quran-verses']);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message ?? 'خطا در ذخیره آیه');
      }
    });
  }

  back(): void {
    this.router.navigate(['/quran-verses']);
  }
}
