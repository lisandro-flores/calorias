import { Injectable, computed, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';

export interface HealthDaySummary {
  steps: number;
  caloriesBurned: number;
  weight: number | null;
  syncedAt: string | null;
}

const READ_TYPES = ['steps', 'totalCalories', 'weight'] as const;

@Injectable({ providedIn: 'root' })
export class HealthConnectService {
  isAvailable = signal(false);
  isAuthorized = signal(false);
  isBusy = signal(false);
  error = signal<string | null>(null);
  todaySummary = signal<HealthDaySummary>({
    steps: 0,
    caloriesBurned: 0,
    weight: null,
    syncedAt: null,
  });

  hasData = computed(() => {
    const s = this.todaySummary();
    return s.steps > 0 || s.caloriesBurned > 0 || s.weight !== null;
  });

  stepsProgress = computed(() => Math.min(this.todaySummary().steps / 10_000, 1));

  statusLabel = computed(() => {
    if (!this.isAvailable()) return 'Solo disponible en Android';
    if (!this.isAuthorized()) return 'Sin permisos';
    if (this.isBusy()) return 'Actualizando Health Connect';
    if (this.hasData()) return 'Conectado y actualizado';
    return 'Conectado';
  });

  weightLabel = computed(() => {
    const weight = this.todaySummary().weight;
    return weight === null ? '—' : `${weight.toFixed(1)} kg`;
  });

  async init(): Promise<void> {
    await this.checkAvailability();
    if (!this.isAvailable()) return;
    await this.checkAuthorization();
    if (this.isAuthorized()) {
      await this.refreshToday();
    }
  }

  async checkAvailability(): Promise<boolean> {
    if (Capacitor.getPlatform() !== 'android') {
      this.isAvailable.set(false);
      return false;
    }

    try {
      const result = await Health.isAvailable();
      this.isAvailable.set(Boolean(result.available));
      return Boolean(result.available);
    } catch (err) {
      this.isAvailable.set(false);
      this.error.set('No se pudo verificar Health Connect');
      return false;
    }
  }

  async checkAuthorization(): Promise<boolean> {
    try {
      const status = await Health.checkAuthorization({ read: [...READ_TYPES] as any });
      const granted = status.readDenied.length === 0;
      this.isAuthorized.set(granted);
      return granted;
    } catch (err) {
      this.isAuthorized.set(false);
      return false;
    }
  }

  async connect(): Promise<boolean> {
    if (!(await this.checkAvailability())) return false;

    try {
      this.isBusy.set(true);
      await Health.requestAuthorization({ read: [...READ_TYPES] as any });
      const granted = await this.checkAuthorization();
      if (granted) {
        await this.refreshToday();
      }
      return granted;
    } catch (err) {
      this.error.set('No se pudieron solicitar permisos de Health Connect');
      this.isAuthorized.set(false);
      return false;
    } finally {
      this.isBusy.set(false);
    }
  }

  async refreshToday(): Promise<void> {
    if (!this.isAvailable() || !this.isAuthorized()) return;

    this.isBusy.set(true);
    this.error.set(null);

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const now = new Date();

      const [steps, caloriesBurned, weight] = await Promise.all([
        this.readSteps(startOfDay, now),
        this.readCaloriesBurned(startOfDay, now),
        this.readLatestWeight(),
      ]);

      this.todaySummary.set({
        steps,
        caloriesBurned,
        weight,
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      this.error.set('No se pudo leer Health Connect');
    } finally {
      this.isBusy.set(false);
    }
  }

  async openPrivacyPolicy(): Promise<void> {
    try {
      await Health.showPrivacyPolicy();
    } catch {
      // No-op
    }
  }

  async openSettings(): Promise<void> {
    try {
      await Health.openHealthConnectSettings();
    } catch {
      // No-op
    }
  }

  async readLatestWeight(): Promise<number | null> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Health.readSamples({
        dataType: 'weight',
        startDate: thirtyDaysAgo.toISOString(),
        endDate: new Date().toISOString(),
        limit: 20,
      } as any);

      const samples = result.samples ?? [];
      if (samples.length === 0) return null;

      const last = samples[samples.length - 1];
      const value = Number(last?.value);
      return Number.isFinite(value) ? value : null;
    } catch {
      return null;
    }
  }

  private async readSteps(start: Date, end: Date): Promise<number> {
    try {
      const result = await Health.readSamples({
        dataType: 'steps',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 1000,
      } as any);

      return Math.round(
        (result.samples ?? []).reduce((sum: number, sample: any) => sum + Number(sample?.value || 0), 0)
      );
    } catch {
      return 0;
    }
  }

  private async readCaloriesBurned(start: Date, end: Date): Promise<number> {
    try {
      const result = await Health.readSamples({
        dataType: 'totalCalories',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 100,
      } as any);

      return Math.round(
        (result.samples ?? []).reduce((sum: number, sample: any) => sum + Number(sample?.value || 0), 0)
      );
    } catch {
      return 0;
    }
  }
}
