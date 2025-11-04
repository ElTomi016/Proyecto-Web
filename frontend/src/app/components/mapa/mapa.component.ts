import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { GameService } from '../../services/game.service';
import { Barco, BarcoService } from '../../services/barco.service';
import { CellType, MapLayout, MapRenderer } from './map-renderer';

type GameViewStep = 'menu' | 'load' | 'create' | 'playing';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="game-page">
      <section class="game-launcher" *ngIf="viewStep !== 'playing'">
        <div class="launcher-head">
          <h1>Selecciona cómo quieres empezar</h1>
          <p>
            Antes de abrir el mapa puedes cargar una partida existente o crear una nueva eligiendo los barcos
            que participarán.
          </p>
        </div>

        <div *ngIf="viewStep === 'menu'" class="launcher-grid">
          <button class="launcher-card" (click)="enterLoadMode()">
            <h3>Cargar partida</h3>
            <p>Consulta la lista de partidas creadas y continúa justo donde las dejaste.</p>
          </button>

          <button class="launcher-card" (click)="enterCreateMode()">
            <h3>Crear nueva</h3>
            <p>Asigna un nombre, elige los barcos que jugarán y luego abre el mapa con todo listo.</p>
          </button>
        </div>

        <div *ngIf="viewStep === 'load'" class="launcher-panel">
          <div class="panel-toolbar">
            <button class="ghost-btn" (click)="backToMenu()">← Menú</button>
            <div class="panel-actions">
              <button class="ghost-btn" (click)="reloadPartidas(true)">Actualizar lista</button>
            </div>
          </div>

          <h2>Cargar una partida existente</h2>
          <div class="partida-list">
            <div *ngIf="loadingPartidas" class="empty-state">Cargando partidas…</div>
            <div *ngIf="!loadingPartidas && !partidas.length" class="empty-state">
              No hay partidas activas todavía. Crea una nueva para comenzar a jugar.
            </div>

            <article
              *ngFor="let p of partidas"
              class="partida-card"
              [class.selected]="p.id === selectedLoadPartidaId"
              (click)="selectExistingPartida(p.id)">
              <div>
                <strong>{{ p.nombre || ('Partida #' + p.id) }}</strong>
                <small>ID {{ p.id }}</small>
              </div>
              <span class="pill" [class.inactive]="!p.activa">{{ p.activa ? 'Activa' : 'Inactiva' }}</span>
            </article>
          </div>

          <button class="primary-btn" [disabled]="!selectedLoadPartidaId" (click)="startExistingGame()">
            Entrar al mapa
          </button>
        </div>

        <div *ngIf="viewStep === 'create'" class="launcher-panel">
          <div class="panel-toolbar">
            <button class="ghost-btn" (click)="backToMenu()">← Menú</button>
            <div class="panel-actions">
              <button class="ghost-btn" (click)="reloadBarcos(true)">Recargar barcos</button>
            </div>
          </div>

          <h2>Crear una nueva partida</h2>
          <label class="field-label">Nombre de la partida (opcional)</label>
          <input type="text" class="field-input" placeholder="Regata del Pacífico" [(ngModel)]="creatingName" />

          <div class="ships-container">
            <div class="ships-header">
              <h4>Selecciona los barcos que participarán</h4>
              <span class="chip muted" *ngIf="selectedBoatIds.length">{{ selectedBoatIds.length }} seleccionados</span>
            </div>

            <div *ngIf="loadingBarcos" class="empty-state">Cargando barcos…</div>
            <div *ngIf="!loadingBarcos && !barcos.length" class="empty-state">
              Aún no hay barcos registrados. Puedes crearlos desde el panel de administración.
            </div>

            <div class="ship-grid">
              <label *ngFor="let barco of barcos" class="ship-card">
                <input
                  type="checkbox"
                  [checked]="selectedBoatSet.has(barco.id)"
                  (change)="toggleBoat(barco.id, $event.target.checked)"
                />
                <div>
                  <strong>#{{ barco.id }} {{ barco.modelo?.nombreModelo || 'Sin modelo' }}</strong>
                  <small>Jugador: {{ barco.jugador?.nombre || barco.jugador?.email || 'Sin asignar' }}</small>
                </div>
              </label>
            </div>
          </div>

          <button class="primary-btn" [disabled]="creatingMatch || !selectedBoatIds.length" (click)="createMatch()">
            {{ creatingMatch ? 'Creando…' : 'Crear e iniciar partida' }}
          </button>
        </div>
      </section>

      <section class="map-shell" [class.hidden]="viewStep !== 'playing'">
        <div class="map-shell__top">
          <button class="ghost-btn" (click)="backToMenu()">← Menú</button>
          <div class="chip" *ngIf="currentPartidaId">Partida #{{ currentPartidaId }}</div>
          <div class="chip muted" *ngIf="selectedBoatIds.length">Barcos {{ selectedBoatIds.join(', ') }}</div>
        </div>

        <div class="map-loader" *ngIf="viewStep === 'playing' && !mapReady">
          Preparando mapa y sincronizando barcos…
        </div>

        <div class="map-screen">
          <div class="map-area">
            <div class="map-area__header">
              <h3 class="map-title">Mapa</h3>
              <span class="map-hint" *ngIf="mapReady">Haz clic en un barco para controlarlo</span>
            </div>
            <div #canvasRoot id="map-canvas-root" class="map-canvas-root">
              <canvas #mapCanvas class="map-canvas" aria-label="Tablero de la regata"></canvas>
              <div class="map-placeholder" *ngIf="!mapReady">
                Selecciona una partida para visualizar el tablero.
              </div>
            </div>
          </div>

          <aside class="control-panel">
            <div class="turn-pill">Turno Barco #{{ currentBoatId ?? '-' }}</div>

            <div class="panel-card">
              <h4 class="panel-title">Barco actual</h4>
              <div class="player-name">{{ currentPlayerName || 'Sin jugador asignado' }}</div>

              <div class="stat-line">
                <span class="icon">📍</span>
                <strong>vx={{ vx }} vy={{ vy }}</strong>
              </div>

              <div class="section">
                <h5>Estado</h5>
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

              <button class="execute-btn" (click)="executeMove()">Aplicar movimiento</button>

              <div class="next-turn">Siguiente turno<br><strong>Barco #{{ nextBoatId ?? '-' }}</strong></div>
            </div>

            <div class="small-muted">
              Tip: usa el panel del lado izquierdo para seleccionar barcos en el mapa interactivo.
            </div>
          </aside>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['./mapa.css']
})
export class MapaComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRoot', { static: true, read: ElementRef }) canvasRoot!: ElementRef<HTMLElement>;
  @ViewChild('mapCanvas', { static: true, read: ElementRef }) mapCanvas!: ElementRef<HTMLCanvasElement>;

  gs = new GameService();
  viewStep: GameViewStep = 'menu';
  partidas: any[] = [];
  barcos: Barco[] = [];
  loadingPartidas = false;
  loadingBarcos = false;
  creatingMatch = false;
  currentPartidaId: number | null = null;
  selectedLoadPartidaId: number | null = null;
  creatingName = '';

  currentBoatId: number | null = null;
  nextBoatId: number | null = null;
  currentPlayerName = '';
  vx = 0;
  vy = 0;
  positionLog: string[] = [];
  auto = false;
  mapReady = false;

  readonly selectedBoatSet = new Set<number>();

  private es: EventSource | null = null;
  private renderer: MapRenderer | null = null;
  private mapLayout: MapLayout | null = null;
  private boatsState: any[] = [];
  private assignedBoatIds: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private barcoService: BarcoService,
  ) {}

  get selectedBoatIds(): number[] {
    return Array.from(this.selectedBoatSet.values());
  }

  async ngAfterViewInit(): Promise<void> {
    const barcosParam = this.route.snapshot.queryParamMap.get('barcos');
    if (barcosParam) {
      barcosParam.split(',')
        .map(v => Number(v.trim()))
        .filter(v => !Number.isNaN(v))
        .forEach(id => this.selectedBoatSet.add(id));
    }

    const param = this.route.snapshot.queryParamMap.get('partida');
    if (param) {
      const partidaId = Number(param);
      if (!Number.isNaN(partidaId)) {
        this.currentPartidaId = partidaId;
        this.viewStep = 'playing';
        await this.ensureMapLoaded(partidaId, this.selectedBoatIds);
        return;
      }
    }

    await this.loadPartidas();
  }

  ngOnDestroy(): void {
    if (this.es) { this.es.close(); this.es = null; }
    this.renderer?.destroy();
    this.renderer = null;
    this.assignedBoatIds = [];
  }

  enterLoadMode() {
    this.viewStep = 'load';
    this.loadPartidas();
  }

  enterCreateMode() {
    this.viewStep = 'create';
    this.loadBarcos();
  }

  backToMenu() {
    if (this.es) { this.es.close(); this.es = null; }
    this.renderer?.setBoats([]);
    this.viewStep = 'menu';
    this.currentPartidaId = null;
    this.currentBoatId = null;
    this.nextBoatId = null;
    this.positionLog = [];
    this.mapReady = false;
    this.assignedBoatIds = [];
    this.updateUrlParams(null, []);
  }

  selectExistingPartida(id: number) {
    this.selectedLoadPartidaId = id;
  }

  async startExistingGame() {
    if (!this.selectedLoadPartidaId) return;
    this.viewStep = 'playing';
    this.mapReady = false;
    this.currentPartidaId = this.selectedLoadPartidaId;
    this.assignedBoatIds = [];
    await this.ensureMapLoaded(this.selectedLoadPartidaId);
    this.updateUrlParams(this.selectedLoadPartidaId, []);
  }

  toggleBoat(id: number, checked: boolean) {
    if (checked) this.selectedBoatSet.add(id);
    else this.selectedBoatSet.delete(id);
    this.refreshRendererBoats();
    this.updateTurnPointers();
  }

  async createMatch() {
    if (!this.selectedBoatIds.length) {
      alert('Selecciona al menos un barco para la partida.');
      return;
    }
    this.creatingMatch = true;
    try {
      const partida = await this.gs.createPartida(this.creatingName?.trim() || undefined, this.selectedBoatIds);
      const orderFromResponse = Array.isArray((partida as any)?.order)
        ? (partida as any).order.map((v:any) => Number(v)).filter((v:number) => !Number.isNaN(v))
        : [];
      if (orderFromResponse.length) {
        this.assignedBoatIds = orderFromResponse;
        this.selectedBoatSet.clear();
        orderFromResponse.forEach((id: number) => this.selectedBoatSet.add(id));
      }
      this.currentPartidaId = Number(partida.id);
      this.viewStep = 'playing';
      this.mapReady = false;
      await this.ensureMapLoaded(this.currentPartidaId, this.selectedBoatIds);
      this.updateUrlParams(this.currentPartidaId, this.selectedBoatIds);
    } catch (e:any) {
      alert('No se pudo crear la partida: ' + (e.message || e));
    } finally {
      this.creatingMatch = false;
    }
  }

  async reloadPartidas(force = true) {
    await this.loadPartidas(force);
  }

  async reloadBarcos(force = true) {
    await this.loadBarcos(force);
  }

  private async loadPartidas(force = false) {
    if (!force && this.partidas.length) return;
    this.loadingPartidas = true;
    try {
      this.partidas = await this.gs.listPartidas();
      if (this.partidas.length && !this.selectedLoadPartidaId) {
        this.selectedLoadPartidaId = Number(this.partidas[0].id);
      }
    } catch (e) {
      console.warn('No se pudo cargar la lista de partidas', e);
      this.partidas = [];
    } finally {
      this.loadingPartidas = false;
    }
  }

  private async loadBarcos(force = false) {
    if (!force && this.barcos.length) return;
    this.loadingBarcos = true;
    try {
      this.barcos = await firstValueFrom(this.barcoService.getAll());
    } catch (e) {
      console.warn('No se pudo obtener la lista de barcos', e);
      this.barcos = [];
    } finally {
      this.loadingBarcos = false;
    }
  }

  private async ensureMapLoaded(partidaId: number, selectedBoatIds?: number[]) {
    try {
      this.assignedBoatIds = [];
      if (Array.isArray(selectedBoatIds) && selectedBoatIds.length) {
        this.selectedBoatSet.clear();
        selectedBoatIds.forEach(id => this.selectedBoatSet.add(id));
      } else {
        this.selectedBoatSet.clear();
      }

      this.ensureRenderer();
      const layout = await this.loadMapLayout();
      if (layout) {
        this.renderer?.setLayout(layout);
      }

      await this.initPartidaAndSSE(partidaId);
      this.mapReady = true;
      await this.fetchSnapshot(partidaId);
      this.refreshRendererBoats();
      this.updateTurnPointers();
    } catch (err:any) {
      console.error('Error inicializando mapa:', err);
      this.mapReady = false;
    }
  }

  private async initPartidaAndSSE(partidaId?: number) {
    if (typeof partidaId === 'number') {
      this.currentPartidaId = partidaId;
    }
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

  private updateUrlParams(partidaId: number | null, barcos: number[]) {
    const queryParams: Record<string, any> = {
      partida: partidaId ?? null,
      barcos: barcos.length ? barcos.join(',') : null,
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });
  }

  private ensureRenderer() {
    if (this.renderer || !this.mapCanvas?.nativeElement || !this.canvasRoot?.nativeElement) return;
    this.renderer = new MapRenderer(this.mapCanvas.nativeElement, this.canvasRoot.nativeElement, {
      onBoatClick: (boatId, cellX, cellY) => this.handleBoatClick(boatId, cellX, cellY),
    });
  }

  private async fetchSnapshot(partidaId: number) {
    try {
      const res = await fetch(`/api/partidas/${partidaId}/state`);
      if (!res.ok) return;
      const data = await res.json();
      if (data) this.onState(data);
    } catch (err) {
      console.warn('No se pudo obtener snapshot inicial de partida', err);
    }
  }

  private async loadMapLayout(force = false): Promise<MapLayout> {
    if (this.mapLayout && !force) return this.mapLayout;
    try {
      const res = await fetch('/api/mapa');
      if (res.ok) {
        const payload = await res.json();
        const map = Array.isArray(payload) ? payload[0] : payload;
        if (map) {
          const columns = Math.max(6, this.pickNumber(map, ['columnas', 'cols', 'width', 'ancho'], 12));
          const rows = Math.max(6, this.pickNumber(map, ['filas', 'rows', 'height', 'alto'], 18));
          const cells = Array.isArray(map.celdas)
            ? map.celdas.map((c:any) => ({
                x: this.pickNumber(c, ['x', 'columna', 'col', 'posX'], 0),
                y: this.pickNumber(c, ['y', 'fila', 'row', 'posY'], 0),
                tipo: String(c.tipo || 'AGUA').toUpperCase() as CellType,
              }))
              .filter((c:any) => Number.isFinite(c.x) && Number.isFinite(c.y))
            : [];

          const hasStart = cells.some((c:any) => c.tipo === 'PARTIDA');
          const hasFinish = cells.some((c:any) => c.tipo === 'META');
          if (!hasStart) cells.push({ x: 1, y: rows - 2, tipo: 'PARTIDA' });
          if (!hasFinish) cells.push({ x: columns - 2, y: 1, tipo: 'META' });

          this.mapLayout = { columns, rows, cells };
          return this.mapLayout;
        }
      }
    } catch (err) {
      console.warn('No se pudo cargar layout del mapa desde la API, usando fallback', err);
    }
    this.mapLayout = this.buildFallbackLayout();
    return this.mapLayout;
  }

  private buildFallbackLayout(): MapLayout {
    const columns = 12;
    const rows = 18;
    const cellMap = new Map<string, CellType>();
    const place = (x: number, y: number, tipo: CellType) => {
      if (x < 0 || y < 0 || x >= columns || y >= rows) return;
      cellMap.set(`${x}:${y}`, tipo);
    };

    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        if (x === 0 || y === 0 || x === columns - 1 || y === rows - 1) {
          place(x, y, 'PARED');
        }
      }
    }

    const obstacleCols = [3, 6, 9];
    obstacleCols.forEach((col, idx) => {
      const gate = idx % 2 === 0 ? Math.floor(rows / 2) : rows - 5;
      for (let y = 2; y < rows - 2; y++) {
        if (Math.abs(y - gate) <= 1) continue;
        place(col, y, 'PARED');
      }
    });

    place(1, rows - 2, 'PARTIDA');
    place(columns - 2, 1, 'META');

    const cells: { x: number; y: number; tipo: CellType }[] = [];
    for (const [coord, tipo] of cellMap.entries()) {
      const [x, y] = coord.split(':').map(Number);
      cells.push({ x, y, tipo });
    }
    return { columns, rows, cells };
  }

  private pickNumber(source: any, keys: string[], fallback: number): number {
    for (const key of keys) {
      const value = Number(source?.[key]);
      if (!Number.isNaN(value) && Number.isFinite(value)) {
        return value;
      }
    }
    return fallback;
  }

  private refreshRendererBoats() {
    if (!this.renderer) return;
    const boats = (this.boatsState || []).map((b:any) => ({
      id: Number(b.id),
      posX: Number(b.posX ?? 0),
      posY: Number(b.posY ?? 0),
      label: b.playerName || b.nombre || b.jugador?.nombre || `#${b.id}`,
    }));
    const highlighted = this.assignedBoatIds.length ? this.assignedBoatIds : this.selectedBoatIds;
    this.renderer.setBoats(boats, this.currentBoatId, highlighted);
  }

  private getTurnPool(): number[] {
    if (this.assignedBoatIds.length) return [...this.assignedBoatIds];
    if (this.selectedBoatIds.length) return [...this.selectedBoatIds];
    return (this.boatsState || []).map((b:any) => Number(b.id)).filter((id:number) => !Number.isNaN(id));
  }

  private findNextBoatId(fromId: number | null = this.currentBoatId): number | null {
    const order = this.getTurnPool();
    if (!order.length) return null;
    if (order.length === 1) {
      return order[0];
    }
    const idx = fromId != null ? order.indexOf(fromId) : -1;
    const nextIdx = idx >= 0 ? (idx + 1) % order.length : 0;
    return order[nextIdx];
  }

  private updateTurnPointers() {
    const order = this.getTurnPool();
    if (!order.length) {
      this.nextBoatId = null;
      return;
    }
    if (order.length === 1) {
      this.nextBoatId = order[0];
      return;
    }
    const next = this.findNextBoatId(this.currentBoatId);
    this.nextBoatId = next === this.currentBoatId ? this.findNextBoatId(next) : next;
  }

  private handleBoatClick(boatId: number | null, _cellX?: number, _cellY?: number) {
    if (boatId == null) return;
    const sel = (this.boatsState || []).find((b:any) => b.id === boatId);
    if (sel) {
      this.applyBoatSnapshot(sel);
      this.refreshRendererBoats();
      this.updateTurnPointers();
    }
  }

  private applyBoatSnapshot(sel: any) {
    if (!sel) return;
    this.currentBoatId = sel.id;
    this.vx = Number(sel.velX ?? sel.velocidadX ?? 0);
    this.vy = Number(sel.velY ?? sel.velocidadY ?? 0);
    const name = sel.playerName || sel.nombre || sel.jugador?.nombre || sel.jugador?.email || '';
    this.currentPlayerName = name || 'Sin jugador asignado';
    this.positionLog = [
      `pos: ${sel.posX ?? 0}, ${sel.posY ?? 0}`,
      `vel: ${this.vx}, ${this.vy}`,
    ];
  }

  private onState(state: any) {
    try {
      const barcos = Array.isArray(state?.barcos) ? state.barcos : [];
      this.boatsState = barcos;
      const order = Array.isArray(state?.order)
        ? state.order.map((v:any) => Number(v)).filter((v:number) => !Number.isNaN(v))
        : [];
      if (order.length) {
        this.assignedBoatIds = order;
        const differs = order.length !== this.selectedBoatSet.size || order.some((id: number) => !this.selectedBoatSet.has(id));
        if (differs) {
          this.selectedBoatSet.clear();
          order.forEach((id: number) => this.selectedBoatSet.add(id));
        }
      }
      if (!this.currentBoatId && barcos.length) {
        this.currentBoatId = barcos[0].id;
      } else if ((this.currentBoatId == null || !barcos.some((b:any) => b.id === this.currentBoatId)) && order.length) {
        this.currentBoatId = order[0];
      }
      const sel = barcos.find((b:any) => b.id === this.currentBoatId) || barcos[0];
      if (sel) {
        this.applyBoatSnapshot(sel);
      }

      this.refreshRendererBoats();
      this.updateTurnPointers();
    } catch (e) {
      console.warn('onState parse error', e);
    }
  }

  dir(dx: number, dy: number) {
    this.vx = this.vx + dx;
    this.vy = this.vy + dy;
  }

  applyAdvance() {
    this.vx = this.vx * 1;
    this.vy = this.vy * 1;
  }

  toggleAuto() { this.auto = !this.auto; }

  async executeMove() {
    if (!this.currentPartidaId || !this.currentBoatId) {
      alert('No hay partida o barco seleccionado');
      return;
    }
    try {
      await this.gs.setBarcoVel(this.currentBoatId, Number(this.vx), Number(this.vy));
      const next = this.findNextBoatId(this.currentBoatId);
      if (next != null && next !== this.currentBoatId) {
        this.handleBoatClick(next);
      } else {
        this.updateTurnPointers();
      }
    } catch (e:any) {
      alert('Error ejecutando movimiento: ' + (e.message || e));
    }
  }
}
