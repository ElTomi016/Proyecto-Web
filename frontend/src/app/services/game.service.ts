import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base: string = this.resolveBaseUrl();

  private resolveBaseUrl(): string {
    const globalAny = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    const root = globalAny?.API_BASE_URL;
    if (root && typeof root === 'string') {
      return root.endsWith('/partidas') ? root : `${root.replace(/\/$/, '')}/partidas`;
    }
    return '/api/partidas';
  }

  listPartidas(): Promise<any[]> {
    return firstValueFrom(this.http.get<any[]>(this.base));
  }

  createPartida(nombre?: string, barcos?: number[], mapaId?: number): Promise<any> {
    const payload: any = {};
    if (nombre) payload.nombre = nombre;
    if (Array.isArray(barcos) && barcos.length) payload.barcos = barcos;
    if (mapaId != null && Number.isFinite(mapaId)) payload.mapaId = mapaId;
    return firstValueFrom(this.http.post<any>(this.base, payload));
  }

  fetchState(partidaId: number): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.base}/${partidaId}/state`));
  }

  connectEvents(partidaId: number, onState: (s: any) => void): EventSource {
    const token = this.auth.token;
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    const url = `${this.base}/${partidaId}/events${tokenParam}`;
    const es = new EventSource(url);
    es.addEventListener('state', (ev: MessageEvent) => {
      try {
        onState(JSON.parse(ev.data));
      } catch {
        onState(ev.data);
      }
    });
    es.onerror = (e) => {
      console.warn('SSE error', e);
      es.close();
    };
    return es;
  }

  setBarcoPos(barcoId: number, x: number, y: number): Promise<any> {
    return firstValueFrom(this.http.put(`/api/partidas/barcos/${barcoId}/pos`, { x, y }));
  }

  setBarcoVel(barcoId: number, vx: number, vy: number): Promise<any> {
    return firstValueFrom(this.http.put(`/api/partidas/barcos/${barcoId}/vel`, { vx, vy }));
  }
}
