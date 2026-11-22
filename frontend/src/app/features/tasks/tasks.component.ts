import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/api.service';
import { CreateTaskPayload, MorabbiTask } from '../../core/models/morabbi.models';
import { taskPriorityLabel } from '../../core/utils/labels';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">کارهای در پیش</h1>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
    <div class="alert alert-success" *ngIf="info()">{{ info() }}</div>

    <div class="card">
      <h3 class="card-title">افزودن کار</h3>
      <div class="field">
        <label>توضیح کار *</label>
        <input [(ngModel)]="form.text" placeholder="مثلا: تهیه طرح درس هفته آینده" />
      </div>
      <div class="grid-2">
        <div class="field">
          <label>اولویت</label>
          <select [(ngModel)]="form.priority">
            <option value="MED">متوسط</option>
            <option value="HIGH">بالا</option>
            <option value="LOW">پایین</option>
          </select>
        </div>
        <div class="field">
          <label>سررسید</label>
          <input type="date" [(ngModel)]="form.due" dir="ltr" />
        </div>
      </div>
      <button class="btn" [disabled]="busy()" (click)="add()">افزودن</button>
    </div>

    <div class="card" style="margin-top: 16px">
      <h3 class="card-title">فهرست کارها</h3>
      <div class="empty" *ngIf="tasks().length === 0">کاری ثبت نشده است.</div>
      <table class="lp-table" *ngIf="tasks().length > 0">
        <thead>
          <tr>
            <th></th>
            <th>کار</th>
            <th>اولویت</th>
            <th>سررسید</th>
            <th>مربوب</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of tasks()">
            <td>
              <input
                type="checkbox"
                [checked]="t.done"
                (change)="toggle(t)"
                class="check"
              />
            </td>
            <td [class.done]="t.done">{{ t.text }}</td>
            <td><span class="badge" [class.badge-rejected]="t.priority === 'HIGH'" [class.badge-approved]="t.priority === 'LOW'">{{ taskPriorityLabel(t.priority) }}</span></td>
            <td>{{ t.due || '—' }}</td>
            <td>{{ t.instructor?.name ?? '—' }}</td>
            <td class="actions">
              <button class="btn btn-danger btn-sm" (click)="remove(t)">حذف</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .check {
      width: 18px;
      height: 18px;
    }
    .done {
      text-decoration: line-through;
      color: var(--lp-muted);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
    }
  `
})
export class TasksComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly taskPriorityLabel = taskPriorityLabel;

  readonly tasks = signal<MorabbiTask[]>([]);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  form: CreateTaskPayload = { text: '', priority: 'MED', due: '' };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.auth.getTasks().subscribe({
      next: (list) => this.tasks.set(list),
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت کارها')
    });
  }

  add(): void {
    if (!this.form.text.trim()) {
      this.error.set('توضیح کار الزامی است.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.auth
      .createTask({ text: this.form.text.trim(), priority: this.form.priority, due: this.form.due || null })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.info.set('کار اضافه شد.');
          this.form = { text: '', priority: 'MED', due: '' };
          this.load();
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(err?.error?.message ?? 'خطا در افزودن کار');
        }
      });
  }

  toggle(t: MorabbiTask): void {
    this.auth.toggleTask(t.id, !t.done).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در تغییر وضعیت کار')
    });
  }

  remove(t: MorabbiTask): void {
    if (!window.confirm('این کار حذف شود؟')) return;
    this.auth.deleteTask(t.id).subscribe({
      next: () => {
        this.info.set('کار حذف شد.');
        this.load();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در حذف کار')
    });
  }
}
