import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { NutritionStateService } from '../services/nutrition-state.service';
import { HeroSummaryComponent } from './hero-summary.component';
import { MealBlockComponent } from './meal-block.component';
import { AddFoodModalComponent } from './add-food-modal.component';
import { ActivityCardComponent } from './activity-card.component';
import { WaterTrackerComponent } from './water-tracker.component';
import { GoalProgressComponent } from './goal-progress.component';
import { HealthConnectService } from '../services/health-connect.service';
import { OutboxService } from '../services/outbox.service';
import { addIcons } from 'ionicons';
import { alertCircleOutline, cloudDoneOutline, cloudOfflineOutline, syncOutline, timeOutline, addOutline } from 'ionicons/icons';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    HeroSummaryComponent,
    MealBlockComponent,
    WaterTrackerComponent,
    GoalProgressComponent,
    ActivityCardComponent
  ],
  template: `
    <ion-content class="ion-padding" [scrollY]="true">
      <!-- Fase 1: Hydration overlay -->
      <div class="hydration-overlay" *ngIf="!state.dataReady()">
        <ion-spinner name="crescent"></ion-spinner>
        <span>Cargando datos desde la nube...</span>
      </div>

      <!-- Main content (only when dataReady) -->
      <div *ngIf="state.dataReady()">
        <div class="dashboard-hero">
          <div>
            <div class="eyebrow">Hoy</div>
            <h1>Tu registro</h1>
            <p>Un vistazo rápido a calorías, macros y comidas del día.</p>
          </div>
          <div class="sync-badge" [ngClass]="state.syncStatus()">
            <ion-icon [name]="state.syncStatusIcon()"></ion-icon>
            <span>{{ state.syncStatusLabel() }}</span>
          </div>
        </div>

        <div
          class="trust-banner"
          [ngClass]="[state.dataSource(), state.syncStatus()]"
          *ngIf="state.dataSource() !== 'cloud' || state.syncStatus() !== 'synced' || (pendingCount$ | async)"
        >
          <div class="trust-copy">
            <ion-icon [name]="trustIcon()"></ion-icon>
            <div>
              <strong>{{ trustTitle() }}</strong>
              <span>{{ trustMessage(pendingCount$ | async) }}</span>
            </div>
          </div>
          <button
            class="trust-action"
            *ngIf="state.syncStatus() === 'error' || (pendingCount$ | async)"
            (click)="retrySync()"
          >
            Reintentar
          </button>
        </div>

        <section class="section-block">
          <div class="section-label">Resumen</div>
          <app-hero-summary></app-hero-summary>
        </section>

        <section class="section-block">
          <div class="section-label">Actividad</div>
          <app-activity-card></app-activity-card>
        </section>

        <section class="section-block">
          <div class="section-label">Comidas del día</div>
          <app-meal-block
            *ngFor="let meal of state.meals(); trackBy: trackByMeal"
            [mealName]="meal.name"
            [mealIcon]="meal.icon"
            [foods]="meal.foods"
            (copyYesterday)="onCopyYesterday(meal.name)">
          </app-meal-block>
        </section>

        <section class="section-block bottom-stack">
          <div class="section-label">Progreso</div>
          <app-water-tracker></app-water-tracker>
          <app-goal-progress></app-goal-progress>
        </section>

        <div class="footer-space"></div>
      </div>

      <!-- FAB for Add Food -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed" *ngIf="state.dataReady()">
        <ion-fab-button (click)="openAddFoodModal()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .hydration-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      gap: 16px;
      color: var(--app-muted);
      font-size: 14px;
    }

    .dashboard-hero {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
      padding: 2px 2px 6px;
    }

    .eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--app-accent);
      margin-bottom: 4px;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.1;
      color: var(--app-text);
    }

    .dashboard-hero p {
      margin: 6px 0 0;
      color: var(--app-muted);
      font-size: 13px;
      line-height: 1.45;
      max-width: 220px;
    }

    .sync-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid var(--app-border);
      background: var(--app-surface-2);
      color: var(--app-muted);
    }

    .sync-badge ion-icon {
      font-size: 14px;
    }

    .sync-badge.pending,
    .sync-badge.syncing {
      color: var(--ion-color-warning);
    }

    .sync-badge.error {
      color: var(--ion-color-danger);
    }

    .sync-badge.synced {
      color: var(--ion-color-success);
    }

    .trust-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
      padding: 12px 14px;
      border: 1px solid var(--app-border);
      border-radius: 12px;
      background: var(--app-surface-2);
      color: var(--app-text);
    }

    .trust-banner.local,
    .trust-banner.pending {
      border-color: rgba(255, 193, 7, 0.28);
      background: rgba(255, 193, 7, 0.09);
    }

    .trust-banner.syncing {
      border-color: rgba(56, 189, 248, 0.28);
      background: rgba(56, 189, 248, 0.08);
    }

    .trust-banner.error {
      border-color: rgba(248, 113, 113, 0.32);
      background: rgba(248, 113, 113, 0.09);
    }

    .trust-copy {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .trust-copy ion-icon {
      flex: 0 0 auto;
      font-size: 20px;
      color: var(--app-accent);
    }

    .trust-copy div {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .trust-copy strong {
      font-size: 13px;
      line-height: 1.2;
    }

    .trust-copy span {
      color: var(--app-muted);
      font-size: 12px;
      line-height: 1.35;
    }

    .trust-action {
      flex: 0 0 auto;
      border: 1px solid rgba(255, 193, 7, 0.35);
      border-radius: 10px;
      background: rgba(255, 193, 7, 0.12);
      color: var(--app-accent);
      font-size: 12px;
      font-weight: 700;
      padding: 8px 10px;
    }

    @media (max-width: 420px) {
      .trust-banner {
        align-items: flex-start;
        flex-direction: column;
      }
    }

    .section-block {
      margin-bottom: 14px;
    }

    .section-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--app-muted);
      text-transform: uppercase;
      letter-spacing: 0.7px;
      margin: 0 0 10px 2px;
    }

    .bottom-stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .footer-space {
      height: 20px;
    }

    /* Staggered card entrance */
    app-meal-block {
      display: block;
      animation: fadeUp 350ms ease-out both;
    }
    app-meal-block:nth-of-type(2) { animation-delay: 40ms; }
    app-meal-block:nth-of-type(3) { animation-delay: 80ms; }
    app-meal-block:nth-of-type(4) { animation-delay: 120ms; }

    app-hero-summary,
    app-activity-card,
    app-water-tracker,
    app-goal-progress {
      display: block;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent {
  state = inject(NutritionStateService);
  health = inject(HealthConnectService);
  private outbox = inject(OutboxService);
  private modalCtrl = inject(ModalController);
  pendingCount$ = this.outbox.pending$;

  constructor() {
    addIcons({
      'alert-circle-outline': alertCircleOutline,
      'cloud-done-outline': cloudDoneOutline,
      'cloud-offline-outline': cloudOfflineOutline,
      'sync-outline': syncOutline,
      'time-outline': timeOutline,
      'add-outline': addOutline
    });
  }

  ionViewDidEnter() {
    this.state.checkDateChange();
    this.health.init();
  }

  onCopyYesterday(mealName: string) {
    this.state.copyFromYesterday(mealName);
  }

  trackByMeal(_index: number, meal: { name: string }) {
    return meal.name;
  }

  retrySync() {
    this.state.retrySync();
  }

  trustIcon() {
    if (this.state.dataSource() === 'local') return 'cloud-offline-outline';
    if (this.state.syncStatus() === 'pending') return 'time-outline';
    if (this.state.syncStatus() === 'syncing') return 'sync-outline';
    if (this.state.syncStatus() === 'error') return 'alert-circle-outline';
    return 'cloud-done-outline';
  }

  trustTitle() {
    if (this.state.dataSource() === 'local') return 'Datos locales';
    if (this.state.syncStatus() === 'pending') return 'Cambios pendientes';
    if (this.state.syncStatus() === 'syncing') return 'Guardando cambios';
    if (this.state.syncStatus() === 'error') return 'No se pudo sincronizar';
    return 'Datos en la nube';
  }

  trustMessage(pending: number | null) {
    const count = pending ?? 0;
    if (this.state.dataSource() === 'local') {
      return 'Estás viendo datos de este dispositivo; se sincronizarán cuando haya conexión.';
    }
    if (this.state.syncStatus() === 'pending' || count > 0) {
      return count === 1 ? 'Hay 1 cambio esperando sincronización.' : `Hay ${count} cambios esperando sincronización.`;
    }
    if (this.state.syncStatus() === 'syncing') {
      return 'Estamos guardando tus cambios en la nube.';
    }
    if (this.state.syncStatus() === 'error') {
      return 'Tus datos siguen en este dispositivo. Puedes reintentar.';
    }
    return 'Tus datos están confirmados en la nube.';
  }

  async openAddFoodModal() {
    const modal = await this.modalCtrl.create({
      component: AddFoodModalComponent,
      breakpoints: [0, 0.5, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    await modal.present();
  }
}
