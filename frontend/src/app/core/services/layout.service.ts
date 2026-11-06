import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  /** Igaz, ha a mobil oldalsáv (off-canvas menü) nyitva van */
  mobileNavOpen = signal(false);

  constructor() {
    // Amíg a mobil menü nyitva van, ne lehessen a háttérben görgetni
    effect(() => {
      if (typeof document === 'undefined') return;
      document.body.style.overflow = this.mobileNavOpen() ? 'hidden' : '';
    });
  }

  toggle(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  open(): void {
    this.mobileNavOpen.set(true);
  }

  close(): void {
    this.mobileNavOpen.set(false);
  }
}
