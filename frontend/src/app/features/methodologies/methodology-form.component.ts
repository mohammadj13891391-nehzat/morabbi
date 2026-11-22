import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/api.service';
import { CreateMethodologyPayload } from '../../core/models/morabbi.models';

@Component({
  selector: 'app-methodology-form',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ isEdit() ? 'ویرایش روش' : 'افزودن روش' }}</h1>
      <button class="btn btn-secondary" (click)="back()">بازگشت</button>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
    <div class="alert alert-success" *ngIf="info()">{{ info() }}</div>

    <div class="card">
      <div class="field">
        <label>نام روش *</label>
        <input [(ngModel)]="form.name" placeholder="مثلا: روش گفتگو" />
      </div>
      <div class="field">
        <label>توضیح</label>
        <textarea [(ngModel)]="form.desc"></textarea>
      </div>
      <div class="field">
        <label>مراحل (هر مرحله در یک خط)</label>
        <textarea [(ngModel)]="form.steps" style="min-height: 140px"></textarea>
      </div>
      <button class="btn" [disabled]="busy()" (click)="save()">{{ isEdit() ? 'ذخیره' : 'افزودن' }}</button>
    </div>
  `
})
export class MethodologyFormComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEdit = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  editId: number | null = null;
  form: CreateMethodologyPayload = { name: '', desc: '', steps: '' };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.isEdit.set(true);
      this.auth.getMethodologies().subscribe({
        next: (list) => {
          const m = list.find((x) => x.id === this.editId);
          if (!m) {
            this.error.set('روش یافت نشد.');
            return;
          }
          this.form = { name: m.name, desc: m.desc ?? '', steps: m.steps ?? '' };
        },
        error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت روش')
      });
    }
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.error.set('نام روش الزامی است.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const payload: CreateMethodologyPayload = {
      name: this.form.name.trim(),
      desc: this.form.desc?.trim() || null,
      steps: this.form.steps?.trim() || null
    };
    const req =
      this.isEdit() && this.editId ? this.auth.updateMethodology(this.editId, payload) : this.auth.createMethodology(payload);
    req.subscribe({
      next: () => {
        this.busy.set(false);
        this.router.navigate(['/methodologies']);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message ?? 'خطا در ذخیره روش');
      }
    });
  }

  back(): void {
    this.router.navigate(['/methodologies']);
  }
}
