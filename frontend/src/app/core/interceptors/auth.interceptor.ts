import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs';
import { AuthService } from '../services/api.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;
  const isPublicPath = /\/api\/auth\/(local|register)|\/api\/health/.test(req.url);

  if (token && !isPublicPath) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    tap({
      error: (err: unknown) => {
        const status = (err as { status?: number })?.status;
        if (status === 401 && !isPublicPath) {
          auth.logout();
          router.navigate(['/login']);
        }
      }
    })
  );
};
