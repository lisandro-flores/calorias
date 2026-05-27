import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
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
  private queue: OutboxItem[] = [];
  public pending$ = new BehaviorSubject<number>(0);
  private processing = false;

  constructor(private http: HttpClient) {
    this.load();
    // process periodically and on online
    setInterval(() => this.processQueue(), 20_000);
    window.addEventListener('online', () => this.processQueue());
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error('Outbox save failed', e);
    }
    this.pending$.next(this.queue.filter(i => i.status === 'pending' || i.status === 'in-flight').length);
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.queue = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Outbox load failed', e);
      this.queue = [];
    }
    this.pending$.next(this.queue.filter(i => i.status === 'pending' || i.status === 'in-flight').length);
  }

  enqueue(type: OutboxItemType, payload: any) {
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
            await this.http.post(`${environment.apiUrl}/auth/profile`, item.payload).toPromise();
          }
          item.status = 'done';
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
