import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { OutboxService, OutboxItem } from '../services/outbox.service';

@Component({
  selector: 'app-outbox-panel',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="outbox-card">
      <div class="outbox-header">
        <div>
          <div class="outbox-title">Cola de sincronización</div>
          <div class="outbox-sub">Elementos pendientes: {{pending}}</div>
        </div>
        <div class="outbox-actions">
          <button class="clear-btn" (click)="clear()" [disabled]="pending===0">Limpiar</button>
          <button class="refresh-btn" (click)="refresh()">Refrescar</button>
        </div>
      </div>

      <div *ngIf="items.length===0" class="outbox-empty">Sin elementos en la cola</div>
      <ion-list *ngIf="items.length>0">
        <ion-item *ngFor="let it of items">
          <ion-label>
            <h3>{{it.type}} • {{it.createdAt | date:'short'}}</h3>
            <p>Intentos: {{it.attempts}} • Estado: {{it.status}}</p>
          </ion-label>
          <ion-button slot="end" size="small" fill="outline" (click)="remove(it.id)">Eliminar</ion-button>
        </ion-item>
      </ion-list>
    </div>
  `,
  styles: [`.outbox-card{background:var(--app-surface);border:1px solid var(--app-border);border-radius:12px;padding:12px;margin-bottom:12px}.outbox-header{display:flex;justify-content:space-between;align-items:center}.outbox-title{font-weight:700}.outbox-sub{font-size:12px;color:var(--app-muted)}.outbox-empty{padding:12px;color:var(--app-muted)}`]
})
export class OutboxPanelComponent {
  items: OutboxItem[] = [];
  pending = 0;

  constructor(private outbox: OutboxService) {
    this.refresh();
    outbox.pending$.subscribe(n => { this.pending = n; this.refresh(); });
  }

  refresh() {
    this.items = this.outbox.list();
  }

  clear() {
    if (!confirm('Limpiar la cola de sincronización?')) return;
    this.outbox.clear();
    this.refresh();
  }

  remove(id: string) {
    if (!confirm('Eliminar este elemento de la cola?')) return;
    // remove by clearing and re-adding all except id
    const keep = this.outbox.list().filter(i => i.id !== id);
    // replace storage directly
    try { localStorage.setItem('outbox_v1', JSON.stringify(keep)); } catch (e) { console.error(e); }
    this.refresh();
  }
}
