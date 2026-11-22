import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  readonly supported: boolean =
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    window.isSecureContext;

  readonly enabled = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  refresh(): void {
    if (!this.supported) {
      this.enabled.set(false);
      return;
    }
    navigator.serviceWorker
      .getRegistration()
      .then(async (reg) => {
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        this.enabled.set(!!sub);
      })
      .catch(() => this.enabled.set(false));
  }

  enable(): void {
    if (!this.supported) {
      this.error.set('مرورگر شما از اعلان‌های فوری پشتیبانی نمی‌کند.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    (async () => {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const key = await firstValueFrom(
        this.http.get<{ publicKey: string }>(`${this.base}/api/push/public-key`)
      );
      if (!key?.publicKey) {
        throw new Error('سرور اعلان‌های فوری را فعال نکرده است.');
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(key.publicKey)
      });
      const json = sub.toJSON();
      await firstValueFrom(
        this.http.post(`${this.base}/api/push/subscribe`, {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
          userAgent: navigator.userAgent
        })
      );
      this.enabled.set(true);
    })()
      .catch((err) => {
        this.error.set(err?.message ?? 'فعال‌سازی اعلان‌های فوری ناموفق بود.');
      })
      .finally(() => this.busy.set(false));
  }

  disable(): void {
    this.busy.set(true);
    this.error.set(null);
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await sub.unsubscribe();
        try {
          await firstValueFrom(
            this.http.delete(`${this.base}/api/push/unsubscribe`, {
              body: { endpoint: sub.endpoint }
            })
          );
        } catch {
          this.enabled.set(false);
          return;
        }
      }
      this.enabled.set(false);
    })()
      .catch((err) => {
        this.error.set(err?.message ?? 'غیرفعال‌سازی اعلان‌های فوری ناموفق بود.');
      })
      .finally(() => this.busy.set(false));
  }

  private urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
}
