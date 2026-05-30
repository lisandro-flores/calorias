import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Thin wrapper around @capacitor/haptics.
 * Fails silently on web / unsupported platforms so callers never need try/catch.
 */
@Injectable({ providedIn: 'root' })
export class HapticsService {
  /** Light tap — for small, frequent interactions (chips, +/- buttons). */
  light() {
    this.safe(() => Haptics.impact({ style: ImpactStyle.Light }));
  }

  /** Medium tap — for confirming an action (expanding, selecting). */
  medium() {
    this.safe(() => Haptics.impact({ style: ImpactStyle.Medium }));
  }

  /** Success buzz — food added, goal reached. */
  success() {
    this.safe(() => Haptics.notification({ type: NotificationType.Success }));
  }

  /** Warning buzz — over goal, validation error. */
  warning() {
    this.safe(() => Haptics.notification({ type: NotificationType.Warning }));
  }

  private safe(fn: () => Promise<void>) {
    try {
      const result = fn();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    } catch {
      /* no-op on platforms without haptics */
    }
  }
}
