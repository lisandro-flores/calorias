import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NutritionStateService, ActivityLevel } from '../services/nutrition-state.service';
import { HealthConnectService } from '../services/health-connect.service';
import { OutboxPanelComponent } from './outbox-panel.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, OutboxPanelComponent],
  template: `
    <ion-content class="ion-padding">

      <!-- User card -->
      <div class="user-card">
        <div class="user-avatar">{{ userInitial() }}</div>
        <div class="user-info">
          <span class="user-name">{{ authService.currentUser()?.name || state.userProfile().displayName }}</span>
          <span class="user-email">{{ authService.currentUser()?.email || '' }}</span>
        </div>
      </div>

      <!-- TDEE Summary Banner -->
      <div class="tdee-banner">
        <div class="tdee-col">
          <span class="tdee-val">{{ state.bmr() | number:'1.0-0' }}</span>
          <span class="tdee-label">BMR</span>
        </div>
        <div class="tdee-divider"></div>
        <div class="tdee-col">
          <span class="tdee-val accent">{{ state.tdee() | number:'1.0-0' }}</span>
          <span class="tdee-label">TDEE (mantenimiento)</span>
        </div>
        <div class="tdee-divider"></div>
        <div class="tdee-col">
          <span class="tdee-val" [class.accent]="state.calorieGoal() < state.tdee()">
            {{ state.calorieGoal() | number:'1.0-0' }}
          </span>
          <span class="tdee-label">Tu meta</span>
        </div>
      </div>

      <!-- ── Health Connect ── -->
      <div class="section-label">Health Connect</div>
      <div class="health-card">
        <div class="health-row">
          <div>
            <div class="health-title">Sincronización</div>
            <div class="health-sub">{{ health.statusLabel() }}</div>
          </div>
          <ion-icon name="fitness-outline" class="health-icon"></ion-icon>
        </div>

        <div class="health-stats" *ngIf="health.isAvailable()">
          <div class="health-stat">
            <span class="health-stat-value">{{ health.todaySummary().steps | number:'1.0-0' }}</span>
            <span class="health-stat-label">Pasos hoy</span>
          </div>
          <div class="health-stat">
            <span class="health-stat-value">{{ health.todaySummary().caloriesBurned | number:'1.0-0' }}</span>
            <span class="health-stat-label">Kcal quemadas</span>
          </div>
          <div class="health-stat">
            <span class="health-stat-value">{{ health.weightLabel() }}</span>
            <span class="health-stat-label">Peso HC</span>
          </div>
        </div>

        <div class="health-actions">
          <button class="health-btn primary" (click)="connectHealth()">
            {{ health.isAuthorized() ? 'Actualizar' : 'Conectar' }}
          </button>
          <button class="health-btn subtle" (click)="refreshHealth()" [disabled]="!health.isAuthorized()">
            Refrescar
          </button>
        </div>

        <button class="health-import-btn" *ngIf="health.todaySummary().weight !== null" (click)="importHealthWeight()">
          Importar peso detectado
        </button>
      </div>

      <!-- ── Datos Personales ── -->
      <div class="section-label">Datos personales</div>

      <div class="form-card">
        <div class="form-row">
          <label class="form-label">Nombre</label>
          <input class="form-input" [(ngModel)]="draft.displayName" placeholder="Tu nombre" (ngModelChange)="markDirty()"/>
        </div>

        <div class="form-row">
          <label class="form-label">Edad</label>
          <div class="form-input-row">
            <input class="form-input small" type="number" [(ngModel)]="draft.age" min="10" max="100" (ngModelChange)="markDirty()"/>
            <span class="form-unit">años</span>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">Género</label>
          <div class="segmented-ctrl">
            <button class="seg-btn" [class.active]="draft.gender === 'male'" (click)="setGender('male')">♂ Hombre</button>
            <button class="seg-btn" [class.active]="draft.gender === 'female'" (click)="setGender('female')">♀ Mujer</button>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">Estatura</label>
          <div class="form-input-row">
            <input class="form-input small" type="number" [(ngModel)]="draft.heightCm" min="100" max="250" (ngModelChange)="markDirty()"/>
            <span class="form-unit">cm</span>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">Actividad</label>
          <select class="form-select" [(ngModel)]="draft.activityLevel" (ngModelChange)="markDirty()">
            <option value="sedentary">Sedentario (sin ejercicio)</option>
            <option value="light">Ligero (1-3 días/sem)</option>
            <option value="moderate">Moderado (3-5 días/sem)</option>
            <option value="active">Activo (6-7 días/sem)</option>
            <option value="very_active">Muy activo (2x al día)</option>
          </select>
        </div>
      </div>

      <!-- ── Peso ── -->
      <div class="section-label">Peso</div>
      <div class="form-card">
        <div class="form-row">
          <label class="form-label">Actual</label>
          <div class="form-input-row">
            <input class="form-input small" type="number" [(ngModel)]="draft.currentWeight" min="20" max="300" step="0.1" (ngModelChange)="markDirty()"/>
            <span class="form-unit">kg</span>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">Meta</label>
          <div class="form-input-row">
            <input class="form-input small" type="number" [(ngModel)]="draft.goalWeight" min="20" max="300" step="0.1" (ngModelChange)="markDirty()"/>
            <span class="form-unit">kg</span>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">Inicial</label>
          <div class="form-input-row">
            <input class="form-input small" type="number" [(ngModel)]="draft.startWeight" min="20" max="300" step="0.1" (ngModelChange)="markDirty()"/>
            <span class="form-unit">kg</span>
          </div>
        </div>
      </div>

      <!-- ── Metas (con opción de override o auto) ── -->
      <div class="section-label">Metas diarias</div>
      <div class="form-card">
        <div class="form-row">
          <label class="form-label">Calorías</label>
          <div class="form-input-row">
            <input class="form-input small"
              type="number"
              [ngModel]="draft.calorieGoalOverride ?? state.tdee()"
              (ngModelChange)="draft.calorieGoalOverride = $event; markDirty()"
              min="500" max="10000"/>
            <span class="form-unit">kcal</span>
          </div>
        </div>
        <div class="auto-hint" *ngIf="draft.calorieGoalOverride === null">
          <ion-icon name="sparkles"></ion-icon> Calculado automáticamente desde tu TDEE
        </div>
        <button class="reset-auto-btn" *ngIf="draft.calorieGoalOverride !== null" (click)="resetCalAuto()">
          <ion-icon name="sparkles"></ion-icon> Restablecer a automático ({{ state.calorieGoal() }} kcal)
        </button>

        <div class="form-row">
          <label class="form-label">Proteína</label>
          <div class="form-input-row">
            <input class="form-input small"
              type="number"
              [ngModel]="draft.proteinGoalOverride ?? state.proteinGoal()"
              (ngModelChange)="draft.proteinGoalOverride = $event; markDirty()"
              min="10" max="500"/>
            <span class="form-unit">g</span>
          </div>
        </div>
        <div class="auto-hint" *ngIf="draft.proteinGoalOverride === null">
          <ion-icon name="sparkles"></ion-icon> {{ state.userProfile().currentWeight }}kg × 1.8g/kg = {{ state.proteinGoal() }}g auto
        </div>

        <div class="form-row">
          <label class="form-label">Carbos</label>
          <div class="form-input-row">
            <input class="form-input small"
              type="number"
              [ngModel]="draft.carbGoalOverride ?? state.goals().carbGoal"
              (ngModelChange)="draft.carbGoalOverride = $event; markDirty()"
              min="10" max="500"/>
            <span class="form-unit">g</span>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">Grasa</label>
          <div class="form-input-row">
            <input class="form-input small"
              type="number"
              [ngModel]="draft.fatGoalOverride ?? state.goals().fatGoal"
              (ngModelChange)="draft.fatGoalOverride = $event; markDirty()"
              min="10" max="500"/>
            <span class="form-unit">g</span>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">Agua</label>
          <div class="form-input-row">
            <input class="form-input small" type="number" [(ngModel)]="draft.waterGoal" min="1" max="20" (ngModelChange)="markDirty()"/>
            <span class="form-unit">vasos</span>
          </div>
        </div>
        <div class="save-hint" *ngIf="hasDraftChanges()">
          Tienes cambios pendientes. Guarda para sincronizarlos en tus dispositivos.
        </div>
        <button class="save-btn" (click)="confirmSave()" [disabled]="!hasDraftChanges()">
          Guardar cambios de perfil
        </button>
      </div>

      <!-- ── Datos ── -->
      <div class="section-label">Datos</div>
      <div class="setting-item danger" (click)="resetToday()">
        <div class="setting-left">
          <span class="setting-icon">🗑️</span>
          <span class="setting-name">Reiniciar día de hoy</span>
        </div>
        <ion-icon name="chevron-forward" class="setting-arrow"></ion-icon>
      </div>

      <button class="logout-btn" (click)="logout()">
        <ion-icon name="log-out-outline"></ion-icon>
        Cerrar sesión
      </button>

      <div class="section-label">Sincronización</div>
      <app-outbox-panel></app-outbox-panel>

      <div style="height:30px"></div>
    </ion-content>
  `,
  styles: [`
    /* User card */
    .user-card {
      display: flex; align-items: center; gap: 14px;
      background: var(--app-surface); border: 1px solid var(--app-border);
      border-radius: 14px; padding: 16px; margin-bottom: 16px;
    }
    .user-avatar {
      width: 44px; height: 44px; border-radius: 12px;
      background: var(--app-accent); color: #111;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; flex-shrink: 0;
    }
    .user-info { display: flex; flex-direction: column; gap: 2px; }
    .user-name { font-size: 15px; font-weight: 600; color: var(--app-text); }
    .user-email { font-size: 12px; color: var(--app-muted); }

    /* TDEE Banner */
    .tdee-banner {
      display: flex; background: var(--app-surface);
      border: 1px solid var(--app-border); border-radius: 14px;
      padding: 14px 12px; margin-bottom: 20px; gap: 4px;
    }
    .tdee-col { flex: 1; text-align: center; display: flex; flex-direction: column; gap: 4px; }
    .tdee-val { font-size: 18px; font-weight: 700; color: var(--app-text); }
    .tdee-val.accent { color: var(--app-accent); }
    .tdee-label { font-size: 10px; color: var(--app-muted); text-transform: uppercase; letter-spacing: 0.3px; }
    .tdee-divider { width: 1px; background: var(--app-border); margin: 0 4px; }

    /* Section label */
    .section-label {
      font-size: 11px; font-weight: 600; color: var(--app-muted);
      text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 8px; padding-left: 4px;
    }

    .health-card {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .health-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .health-title { font-size: 14px; font-weight: 700; color: var(--app-text); }
    .health-sub { font-size: 12px; color: var(--app-muted); margin-top: 3px; }
    .health-icon { font-size: 20px; color: var(--app-accent); }
    .health-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .health-stat {
      background: var(--app-surface-2);
      border: 1px solid var(--app-border);
      border-radius: 12px;
      padding: 10px 8px;
      text-align: center;
    }
    .health-stat-value { display: block; font-size: 15px; font-weight: 700; color: var(--app-text); }
    .health-stat-label { display: block; margin-top: 3px; font-size: 10px; color: var(--app-muted); text-transform: uppercase; }
    .health-actions { display: flex; gap: 8px; }
    .health-btn {
      flex: 1;
      border: 1px solid var(--app-border);
      border-radius: 10px;
      padding: 10px 12px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      background: var(--app-surface-2);
      color: var(--app-text);
    }
    .health-btn.primary {
      background: var(--app-accent);
      border-color: var(--app-accent);
      color: #111;
    }
    .health-btn.subtle { color: var(--app-muted); }
    .health-import-btn {
      width: 100%;
      margin-top: 10px;
      border: 1px solid rgba(94, 234, 212, 0.25);
      background: rgba(94, 234, 212, 0.08);
      color: var(--app-accent-2);
      border-radius: 10px;
      padding: 10px 12px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
    }

    /* Form card */
    .form-card {
      background: var(--app-surface); border: 1px solid var(--app-border);
      border-radius: 14px; padding: 4px 0; margin-bottom: 16px; overflow: hidden;
    }
    .form-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 14px; border-bottom: 1px solid var(--app-border);
    }
    .form-row:last-of-type { border-bottom: none; }
    .form-label { font-size: 14px; color: var(--app-text); flex: 1; }
    .form-input {
      background: var(--app-bg); border: 1px solid var(--app-border);
      border-radius: 8px; color: var(--app-text); font-family: inherit;
      font-size: 14px; padding: 6px 10px; outline: none;
      transition: border-color 0.2s; width: 180px; text-align: right;
    }
    .form-input.small { width: 90px; }
    .form-input:focus { border-color: var(--app-accent); }
    .form-input-row { display: flex; align-items: center; gap: 6px; }
    .form-unit { font-size: 12px; color: var(--app-muted); width: 30px; }
    .form-select {
      background: var(--app-bg); border: 1px solid var(--app-border);
      border-radius: 8px; color: var(--app-text); font-family: inherit;
      font-size: 13px; padding: 6px 10px; outline: none; max-width: 200px;
    }

    /* Segmented control */
    .segmented-ctrl { display: flex; gap: 6px; }
    .seg-btn {
      padding: 6px 14px; border-radius: 8px; border: 1px solid var(--app-border);
      background: none; color: var(--app-muted); font-size: 13px;
      cursor: pointer; font-family: inherit; transition: all 0.15s;
    }
    .seg-btn.active { background: var(--app-accent); color: #111; border-color: var(--app-accent); font-weight: 600; }

    /* Auto hint */
    .auto-hint {
      font-size: 11px; color: var(--app-accent); padding: 4px 14px 8px;
      opacity: 0.8;
    }
    .reset-auto-btn {
      background: none; border: none; color: var(--app-accent);
      font-size: 11px; font-family: inherit; cursor: pointer;
      padding: 4px 14px 8px; text-align: left;
    }
    .save-hint {
      font-size: 11px;
      color: var(--app-muted);
      padding: 2px 14px 10px;
    }
    .save-btn {
      width: calc(100% - 28px);
      margin: 0 14px 14px;
      border: 1px solid var(--app-accent);
      border-radius: 12px;
      padding: 12px 14px;
      background: var(--app-accent);
      color: #111;
      font-family: inherit;
      font-weight: 700;
      font-size: 14px;
    }
    .save-btn:disabled {
      opacity: 0.45;
    }

    /* Setting item */
    .setting-item {
      display: flex; justify-content: space-between; align-items: center;
      background: var(--app-surface); border: 1px solid var(--app-border);
      border-radius: 12px; padding: 12px 14px; margin-bottom: 8px;
      cursor: pointer; transition: background 0.15s;
    }
    .setting-item:active { background: var(--app-surface-2); }
    .setting-item.danger .setting-name { color: #f87171; }
    .setting-left { display: flex; align-items: center; gap: 10px; }
    .setting-icon { font-size: 16px; }
    .setting-name { font-size: 14px; color: var(--app-text); }
    .setting-arrow { color: var(--app-muted); font-size: 14px; }

    /* Logout */
    .logout-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 14px; margin-top: 8px;
      background: none; border: 1px solid rgba(248,113,113,0.3);
      border-radius: 12px; color: #f87171; font-size: 14px;
      font-weight: 500; cursor: pointer; font-family: inherit;
    }
    .logout-btn ion-icon { font-size: 18px; }
  `]
})
export class ProfileComponent {
  authService = inject(AuthService);
  state = inject(NutritionStateService);
  health = inject(HealthConnectService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  // Local draft that mirrors the profile for inline editing
  draft = { ...this.state.userProfile() };
  private dirty = signal(false);

  ngOnInit() {
    this.health.init();
  }

  userInitial() {
    const name = this.authService.currentUser()?.name || this.state.userProfile().displayName;
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  setGender(g: 'male' | 'female') {
    this.draft.gender = g;
    this.markDirty();
  }

  hasDraftChanges = computed(() => this.dirty());

  markDirty() {
    this.dirty.set(true);
  }

  async confirmSave() {
    if (!this.hasDraftChanges()) return;

    const alert = await this.alertCtrl.create({
      header: '¿Guardar cambios?',
      message: 'Se actualizará tu perfil y se sincronizará en tus dispositivos.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', handler: () => this.save() }
      ]
    });

    await alert.present();
  }

  save() {
    this.state.updateProfile({ ...this.draft });
    this.dirty.set(false);
    this.showToast();
  }

  async connectHealth() {
    await this.health.connect();
  }

  async refreshHealth() {
    await this.health.refreshToday();
  }

  async importHealthWeight() {
    const weight = this.health.todaySummary().weight;
    if (weight === null) return;

    const alert = await this.alertCtrl.create({
      header: 'Importar peso',
      message: `Health Connect detectó ${weight.toFixed(1)} kg. ¿Quieres actualizar tu peso actual?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: () => {
            this.draft.currentWeight = weight;
            this.dirty.set(true);
            this.state.updateProfile({ currentWeight: weight });
            this.showToast();
          }
        }
      ]
    });

    await alert.present();
  }

  private toastTimeout: any;
  private showToast() {
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(async () => {
      const toast = await this.toastCtrl.create({
        message: 'Perfil guardado',
        duration: 1200,
        position: 'top',
        color: 'dark',
      });
      toast.present();
    }, 800);
  }

  resetCalAuto() {
    this.draft.calorieGoalOverride = null;
    this.markDirty();
  }

  async resetToday() {
    const alert = await this.alertCtrl.create({
      header: '¿Reiniciar día?',
      message: 'Se eliminarán todos los alimentos y agua de hoy.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Reiniciar', handler: () => this.state.resetToday() }
      ]
    });
    await alert.present();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login'], { state: { showReloginButton: true } });
  }
}