import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  mobileNavOpen = signal(false);

  constructor() {
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
