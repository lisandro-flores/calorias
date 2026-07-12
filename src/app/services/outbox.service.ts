import { DestroyRef, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export type OutboxItemType = 'entry-sync' | 'profile-sync';

export interface OutboxItem {
  id: string;
  type: OutboxItemType;
  payload: any;
  attempts: number;
  createdAt: string;
  lastAttemptAt?: string;
  status: 'pending' | 'in-flight' | 'failed' | 'done';
}

const STORAGE_KEY = 'outbox_v1';

@Injectable({ providedIn: 'root' })
export class OutboxService {
  private destroyRef = inject(DestroyRef);
  private queue: OutboxItem[] = [];
  public pending$ = new BehaviorSubject<number>(0);
  public syncComplete$ = new Subject<{ type: OutboxItemType; payload: any }>();
  private processing = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onlineHandler = () => this.processQueue();

  constructor(private http: HttpClient) {
    this.load();
    // process periodically and on online
    this.intervalId = setInterval(() => this.processQueue(), 20_000);
    window.addEventListener('online', this.onlineHandler);

    this.destroyRef.onDestroy(() => {
      if (this.intervalId) clearInterval(this.intervalId);
      window.removeEventListener('online', this.onlineHandler);
    });
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error('Outbox save failed', e);
    }
    this.pending$.next(this.queue.filter(i => i.status === 'pending' || i.status === 'in-flight' || i.status === 'failed').length);
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.queue = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Outbox load failed', e);
      this.queue = [];
    }
    this.pending$.next(this.queue.filter(i => i.status === 'pending' || i.status === 'in-flight' || i.status === 'failed').length);
  }

  private getDedupeKey(type: OutboxItemType, payload: any): string {
    // For entry-sync, dedupe by type + date (one entry per day)
    if (type === 'entry-sync' && payload.date) {
      return `${type}:${payload.date}`;
    }
    // For others, just use type
    return type;
  }

  enqueue(type: OutboxItemType, payload: any) {
    const dedupeKey = this.getDedupeKey(type, payload);
    
    // Check if already queued (pending or failed)
    const existing = this.queue.find(
      i => this.getDedupeKey(i.type, i.payload) === dedupeKey && 
           (i.status === 'pending' || i.status === 'failed')
    );

    if (existing) {
      // Replace payload (deduplication: newer edit replaces older)
      existing.payload = payload;
      existing.createdAt = new Date().toISOString();
      existing.attempts = 0; // Reset attempts on update
      existing.status = 'pending';
      this.save();
      this.processQueue();
      return existing.id;
    }

    // New item
    const item: OutboxItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      type,
      payload,
      attempts: 0,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    this.queue.push(item);
    this.save();
    // try immediately
    this.processQueue();
    return item.id;
  }

  list() {
    return [...this.queue];
  }

  hasPendingEntrySync(date: string) {
    return this.queue.some(i => i.type === 'entry-sync' && i.payload?.date === date && (i.status === 'pending' || i.status === 'in-flight' || i.status === 'failed'));
  }

  async processQueue() {
    if (!navigator.onLine) return;
    if (this.processing) return;
    if (!this.queue.length) return;

    this.processing = true;
    try {
      for (const item of this.queue.filter(i => i.status === 'pending' || i.status === 'failed')) {
        // mark in-flight
        item.status = 'in-flight';
        item.attempts = (item.attempts || 0) + 1;
        item.lastAttemptAt = new Date().toISOString();
        this.save();

        try {
          if (item.type === 'entry-sync') {
            await this.http.post(`${environment.apiUrl}/entries/sync`, item.payload).toPromise();
          } else if (item.type === 'profile-sync') {
            await this.http.patch(`${environment.apiUrl}/auth/profile`, item.payload).toPromise();
          }
          item.status = 'done';
          this.syncComplete$.next({ type: item.type, payload: item.payload });
        } catch (err) {
          console.error('Outbox item failed', item.id, err);
          item.status = item.attempts >= 5 ? 'failed' : 'pending';
        }
        this.save();
      }
      // cleanup done
      this.queue = this.queue.filter(i => i.status !== 'done' || (i.status === 'done' && i.type === 'profile-sync' && false));
      this.save();
    } finally {
      this.processing = false;
    }
  }

  clear() {
    this.queue = [];
    this.save();
  }
}
