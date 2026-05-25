import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-goal-progress',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-card color="dark">
      <ion-card-content>
        <div class="goal-header">
          <h2>Disciplina y Meta de Peso</h2>
        </div>
        
        <div class="weight-labels">
          <span>Inicio: {{ startWeight }} kg</span>
          <span class="highlight">Actual: {{ currentWeight }} kg</span>
          <span>Meta: {{ goalWeight }} kg</span>
        </div>
        
        <ion-progress-bar 
          color="success" 
          [value]="progress()">
        </ion-progress-bar>
        
        <p class="goal-footer">¡Sigue así! Estás a {{ startWeight - currentWeight | number:'1.1-1' }} kg menos desde tu inicio.</p>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .goal-header h2 { margin: 0 0 15px 0; font-size: 16px; font-weight: bold; }
    .weight-labels { display: flex; justify-content: space-between; font-size: 13px; color: #aaa; margin-bottom: 10px; }
    .highlight { color: #fff; font-weight: bold; }
    .goal-footer { font-size: 12px; color: #888; text-align: center; margin-top: 15px; margin-bottom: 0; }
  `]
})
export class GoalProgressComponent {
  readonly startWeight = 79.2;
  readonly goalWeight = 70.0;
  
  // Simulated current weight (could come from a signal/service)
  currentWeight = 76.5;

  progress() {
    const totalToLose = this.startWeight - this.goalWeight;
    const lostSoFar = this.startWeight - this.currentWeight;
    return Math.max(0, Math.min(lostSoFar / totalToLose, 1));
  }
}