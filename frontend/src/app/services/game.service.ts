export class GameService {
  private base = (window as any).API_BASE_URL ? (window as any).API_BASE_URL + '/partidas' : '/api/partidas';

  async listPartidas(): Promise<any[]> {
    const res = await fetch(this.base);
    if (!res.ok) throw new Error('Error listando partidas');
    return res.json();
  }

  async createPartida(nombre?: string): Promise<any> {
    const url = nombre ? `${this.base}?nombre=${encodeURIComponent(nombre)}` : this.base;
    const res = await fetch(url, { method: 'POST' });
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
