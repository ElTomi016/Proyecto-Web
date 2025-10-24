import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="map-screen">
      <div class="map-area">
        <h3 class="map-title">Mapa</h3>
        <div #canvasRoot id="map-canvas-root" class="map-canvas-root"></div>
      </div>

      <aside class="control-panel">
        <div class="turn-pill">Turn Boat #{{ currentBoatId ?? '-' }}</div>

        <div class="panel-card">
          <h4 class="panel-title">Player</h4>
          <div class="player-name">{{ currentPlayerName || 'Current' }}</div>

          <div class="stat-line">
            <span class="icon">📍</span>
            <strong>vx={{ vx }} vy={{ vy }}</strong>
          </div>

          <div class="section">
            <h5>Position</h5>
            <ol class="pos-list">
              <li *ngFor="let p of positionLog">{{ p }}</li>
            </ol>
          </div>

          <div class="pad-grid">
            <button class="pad-btn" (click)="dir(-1,0)">◀</button>
            <button class="pad-btn" (click)="dir(0,1)">▲</button>
            <button class="pad-btn" (click)="dir(1,0)">▶</button>

            <button class="pad-btn" (click)="dir(0,-1)">▼</button>
            <button class="pad-btn large" (click)="applyAdvance()">3</button>
            <button class="pad-btn" (click)="toggleAuto()">{{ auto ? 'Auto' : 'Man' }}</button>
          </div>

          <button class="execute-btn" (click)="executeMove()">Execute Move</button>

          <div class="next-turn">Next Turn<br><strong>Boat #{{ nextBoatId ?? '-' }}</strong></div>
        </div>

        <div class="small-muted">
          Tip: Selecciona un barco en la lista del panel lateral izquierdo (o usa el setup para elegir jugadores).
        </div>
      </aside>
    </div>
  `,
  styleUrls: ['./mapa.css']
})
export class MapaComponent implements AfterViewInit {
  @ViewChild('canvasRoot', { static: true, read: ElementRef }) canvasRoot!: ElementRef<HTMLElement>;

  gs = new GameService();
  currentPartidaId: number | null = null;
  currentBoatId: number | null = null;
  nextBoatId: number | null = null;
  currentPlayerName = '';
  vx = 0;
  vy = 0;
  positionLog: string[] = [];
  auto = false;

  private es: EventSource | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  async ngAfterViewInit(): Promise<void> {
    // render canvas via existing loader (keeps existing map logic)
    try {
      const param = this.route.snapshot.queryParamMap.get('partida');
      if (param) this.currentPartidaId = Number(param);

      // ensure DOM renderer (legacy loader) mounts inside our canvas root
      const mod = await import('./mapa');
      const anyMod = mod as any;
      if (anyMod && typeof anyMod.loadMapaView === 'function') {
        await anyMod.loadMapaView(`#${this.canvasRoot.nativeElement.id}`);
      }

      // fetch partidas and attach SSE
      await this.initPartidaAndSSE();
    } catch (err:any) {
      console.error('Error inicializando mapa:', err);
      // no crash: mostrar mensaje en DOM
      try { this.canvasRoot.nativeElement.innerHTML = `<div style="padding:16px;color:#b91c1c">Error cargando mapa: ${err?.message||err}</div>`; } catch {}
    }
  }

  private async initPartidaAndSSE() {
    // If no partida specified, pick the first available
    if (this.currentPartidaId == null) {
      try {
        const list = await this.gs.listPartidas();
        if (list && list.length) this.currentPartidaId = Number(list[0].id);
      } catch (e) {
        console.warn('No se pudo listar partidas', e);
      }
    }
    if (this.currentPartidaId == null) return;

    if (this.es) this.es.close();
    this.es = this.gs.connectEvents(this.currentPartidaId, (state: any) => this.onState(state));
  }

  private onState(state: any) {
    // state expected to contain barcos array and turn/order info
    try {
      const barcos = state?.barcos || [];
      // keep minimal: selected current boat if matches existing id
      if (!this.currentBoatId && barcos.length) {
        this.currentBoatId = barcos[0].id;
      }
      // update display fields from selected boat
      const sel = barcos.find((b:any) => b.id === this.currentBoatId) || barcos[0];
      if (sel) {
        this.currentBoatId = sel.id;
        this.vx = Number(sel.velX || 0);
        this.vy = Number(sel.velY || 0);
        this.currentPlayerName = sel.playerName || sel.nombre || '';
        // position log: format quick
        this.positionLog = [
          `pos: ${sel.posX || 0}, ${sel.posY || 0}`,
          `vel: ${sel.velX || 0}, ${sel.velY || 0}`,
        ];
      }
      // next boat heuristics (first not selected)
      const next = barcos.find((b:any) => b.id !== this.currentBoatId);
      this.nextBoatId = next ? next.id : null;
    } catch (e) { console.warn('onState parse error', e); }
  }

  dir(dx: number, dy: number) {
    // quick adjust velocity or position delta preview
    this.vx = this.vx + dx;
    this.vy = this.vy + dy;
  }

  applyAdvance() {
    // example: multiply velocity by 3 for preview
    this.vx = this.vx * 1;
    this.vy = this.vy * 1;
  }

  toggleAuto() { this.auto = !this.auto; }

  async executeMove() {
    if (!this.currentPartidaId || !this.currentBoatId) { alert('No hay partida o barco seleccionado'); return; }
    try {
      await this.gs.setBarcoVel(this.currentBoatId, Number(this.vx), Number(this.vy));
      // optionally advance turn server-side; UI will update via SSE
    } catch (e:any) {
      alert('Error ejecutando movimiento: ' + (e.message || e));
    }
  }
}
