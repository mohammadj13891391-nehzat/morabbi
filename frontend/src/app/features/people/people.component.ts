import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/api.service';
import { Person } from '../../core/models/morabbi.models';
import { groupLabel } from '../../core/utils/labels';

@Component({
  selector: 'app-people',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">افراد</h1>
      <div class="toolbar">
        <input type="search" placeholder="جستجو..." [(ngModel)]="search" (ngModelChange)="applyFilter()" />
        <button routerLink="/people/new" class="btn">افزودن فرد</button>
      </div>
    </div>

    <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>

    <div class="card">
      <div class="empty" *ngIf="filtered().length === 0">فردی یافت نشد.</div>
      <table class="lp-table" *ngIf="filtered().length > 0">
        <thead>
          <tr>
            <th>نام</th>
            <th>کد ملی</th>
            <th>سن</th>
            <th>تلفن</th>
            <th>پایه</th>
            <th>گروه</th>
            <th>تاریخ پیوست</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of filtered()">
            <td><strong>{{ p.name }}</strong><div class="note" *ngIf="p.note">{{ p.note }}</div></td>
            <td dir="ltr">{{ p.code || '—' }}</td>
            <td>{{ p.age ?? '—' }}</td>
            <td dir="ltr">{{ p.phone || '—' }}</td>
            <td>{{ p.grade || '—' }}</td>
            <td><span class="badge">{{ groupLabel(p.group) }}</span></td>
            <td>{{ p.joinDate || '—' }}</td>
            <td class="actions">
              <a [routerLink]="'/people/' + p.id" class="btn btn-secondary btn-sm">ویرایش</a>
              <button class="btn btn-danger btn-sm" (click)="remove(p)">حذف</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .note {
      font-size: 11px;
      color: var(--lp-muted);
      margin-top: 2px;
    }
    .actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
  `
})
export class PeopleComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly groupLabel = groupLabel;
  private readonly router = inject(Router);

  readonly people = signal<Person[]>([]);
  readonly filtered = signal<Person[]>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  search = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.auth.getPeople().subscribe({
      next: (list) => {
        this.people.set(list);
        this.applyFilter();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در دریافت افراد')
    });
  }

  applyFilter(): void {
    const q = this.search.trim();
    this.filtered.set(
      q ? this.people().filter((p) => p.name.includes(q) || (p.phone ?? '').includes(q) || (p.code ?? '').includes(q)) : this.people()
    );
  }

  remove(p: Person): void {
    if (!window.confirm(`فرد «${p.name}» حذف شود؟`)) return;
    this.auth.deletePerson(p.id).subscribe({
      next: () => {
        this.info.set('فرد حذف شد.');
        this.load();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'خطا در حذف فرد')
    });
  }
}
