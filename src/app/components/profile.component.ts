import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NutritionStateService, ActivityLevel } from '../services/nutrition-state.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="page-title">Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

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

      <!-- ── Datos Personales ── -->
      <div class="section-label">Datos personales</div>

      <div class="form-card">
        <div class="form-row">
          <label class="form-label">Nombre</label>
          <input class="form-input" [(ngModel)]="draft.displayName" placeholder="Tu nombre" (change)="save()"/>
        </div>

        <div class="form-row">
          <label class="form-label">Edad</label>
          <div class="form-input-row">
            <input class="form-input small" type="number" [(ngModel)]="draft.age" min="10" max="100" (change)="save()"/>
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
            <input class="form-input small" type="number" [(ngModel)]="draft.heightCm" min="100" max="250" (change)="save()"/>
            <span class="form-unit">cm</span>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">Actividad</label>
          <select class="form-select" [(ngModel)]="draft.activityLevel" (change)="save()">
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
            <input class="form-input small" type="number" [(ngModel)]="draft.currentWeight" min="20" max="300" step="0.1" (change)="save()"/>
            <span class="form-unit">kg</span>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">Meta</label>
          <div class="form-input-row">
            <input class="form-input small" type="number" [(ngModel)]="draft.goalWeight" min="20" max="300" step="0.1" (change)="save()"/>
            <span class="form-unit">kg</span>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">Inicial</label>
          <div class="form-input-row">
            <input class="form-input small" type="number" [(ngModel)]="draft.startWeight" min="20" max="300" step="0.1" (change)="save()"/>
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
              (ngModelChange)="draft.calorieGoalOverride = $event; save()"
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
              (ngModelChange)="draft.proteinGoalOverride = $event; save()"
              min="10" max="500"/>
            <span class="form-unit">g</span>
          </div>
        </div>
        <div class="auto-hint" *ngIf="draft.proteinGoalOverride === null">
          <ion-icon name="sparkles"></ion-icon> {{ state.userProfile().currentWeight }}kg × 1.8g/kg = {{ state.proteinGoal() }}g auto
        </div>

        <div class="form-row">
          <label class="form-label">Agua</label>
          <div class="form-input-row">
            <input class="form-input small" type="number" [(ngModel)]="draft.waterGoal" min="1" max="20" (change)="save()"/>
            <span class="form-unit">vasos</span>
          </div>
        </div>
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

      <div style="height:30px"></div>
    </ion-content>
  `,
  styles: [`
    .page-title { font-size: 20px; font-weight: 700; }

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
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  // Local draft that mirrors the profile for inline editing
  draft = { ...this.state.userProfile() };

  userInitial() {
    const name = this.authService.currentUser()?.name || this.state.userProfile().displayName;
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  setGender(g: 'male' | 'female') {
    this.draft.gender = g;
    this.save();
  }

  save() {
    this.state.updateProfile({ ...this.draft });
    this.showToast();
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
    this.state.updateProfile({ calorieGoalOverride: null });
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
    this.router.navigate(['/login']);
  }
}