export class GameService {
  private readonly base: string = this.resolveBaseUrl();

  private resolveBaseUrl(): string {
    const globalAny = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    const root = globalAny?.API_BASE_URL;
    if (root && typeof root === 'string') {
      return root.endsWith('/partidas') ? root : `${root.replace(/\/$/, '')}/partidas`;
    }
    return '/api/partidas';
  }

  async listPartidas(): Promise<any[]> {
    const res = await fetch(this.base);
    if (!res.ok) throw new Error('Error listando partidas');
    return res.json();
  }

  async createPartida(nombre?: string, barcos?: number[], mapaId?: number): Promise<any> {
    const payload: any = {};
    if (nombre) payload.nombre = nombre;
    if (Array.isArray(barcos) && barcos.length) payload.barcos = barcos;
    if (mapaId != null && Number.isFinite(mapaId)) payload.mapaId = mapaId;
    const res = await fetch(this.base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error creando partida');
    return res.json();
  }

  connectEvents(partidaId: number, onState: (s: any) => void): EventSource {
    const url = `${this.base}/${partidaId}/events`;
    const es = new EventSource(url);
    es.addEventListener('state', (ev: MessageEvent) => {
      try { onState(JSON.parse(ev.data)); } catch { onState(ev.data); }
    });
    es.onerror = (e) => { console.warn('SSE error', e); es.close(); };
    return es;
  }

  async setBarcoPos(barcoId: number, x: number, y: number) {
    const res = await fetch(`/api/partidas/barcos/${barcoId}/pos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async setBarcoVel(barcoId: number, vx: number, vy: number) {
    const res = await fetch(`/api/partidas/barcos/${barcoId}/vel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vx, vy })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}
