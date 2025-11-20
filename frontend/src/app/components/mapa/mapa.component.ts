import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { Barco, BarcoService } from '../../services/barco.service';
import { AuthService, UserRole } from '../../services/auth.service';
import { CellType, MapLayout, MapRenderer } from './map-renderer';

type GameViewStep = 'menu' | 'load' | 'create' | 'playing';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="game-page">
      <section class="game-launcher" id="game-launcher" *ngIf="viewStep !== 'playing'">
        <div class="launcher-head">
          <h1>Selecciona cómo quieres empezar</h1>
          <p>
            Antes de abrir el mapa puedes cargar una partida existente o crear una nueva eligiendo los barcos
            que participarán.
          </p>
        </div>

        <div *ngIf="viewStep === 'menu'" class="launcher-grid">
          <button id="launcher-load-button" class="launcher-card" (click)="enterLoadMode()">
            <h3>Cargar partida</h3>
            <p>Consulta la lista de partidas creadas y continúa justo donde las dejaste.</p>
          </button>

          <button id="launcher-create-button" class="launcher-card" (click)="enterCreateMode()">
            <h3>Crear nueva</h3>
            <p>Asigna un nombre, elige los barcos que jugarán y luego abre el mapa con todo listo.</p>
          </button>
        </div>

        <div *ngIf="viewStep === 'load'" class="launcher-panel" id="load-panel">
          <div class="panel-toolbar">
              <button id="load-back-button" class="ghost-btn" (click)="backToMenu()">← Menú</button>
            <div class="panel-actions">
              <button id="reload-partidas-button" class="ghost-btn" (click)="reloadPartidas(true)">Actualizar lista</button>
            </div>
          </div>

          <h2>Cargar una partida existente</h2>
          <div class="partida-list" id="partida-list">
            <div *ngIf="loadingPartidas" class="empty-state">Cargando partidas…</div>
            <div *ngIf="!loadingPartidas && !partidas.length" class="empty-state">
              No hay partidas activas todavía. Crea una nueva para comenzar a jugar.
            </div>

            <article
              *ngFor="let p of partidas"
              class="partida-card"
              [attr.id]="'partida-card-' + p.id"
              [attr.data-partida-id]="p.id"
              [class.selected]="p.id === selectedLoadPartidaId"
              (click)="selectExistingPartida(p.id)">
              <div>
                <strong>{{ p.nombre || ('Partida #' + p.id) }}</strong>
                <small>ID {{ p.id }}</small>
              </div>
              <span class="pill" [class.inactive]="!p.activa">{{ p.activa ? 'Activa' : 'Inactiva' }}</span>
            </article>
          </div>

          <button id="load-start-button" class="primary-btn" [disabled]="!selectedLoadPartidaId" (click)="startExistingGame()">
            Entrar al mapa
          </button>
        </div>

        <div *ngIf="viewStep === 'create'" class="launcher-panel" id="create-panel">
          <div class="panel-toolbar">
            <button id="create-back-button" class="ghost-btn" (click)="backToMenu()">← Menú</button>
            <div class="panel-actions">
              <button id="reload-barcos-button" class="ghost-btn" (click)="reloadBarcos(true)">Recargar barcos</button>
            </div>
          </div>

          <h2>Crear una nueva partida</h2>
          <label class="field-label">Nombre de la partida (opcional)</label>
          <input id="partida-name-input" type="text" class="field-input" placeholder="Regata del Pacífico" [(ngModel)]="creatingName" />

          <div class="maps-container">
            <div class="ships-header">
              <h4>Selecciona el mapa</h4>
              <span class="chip muted" *ngIf="maps.length">{{ maps.length }} disponibles</span>
            </div>

            <div *ngIf="loadingMaps" class="empty-state">Cargando mapas…</div>
            <div *ngIf="!loadingMaps && !maps.length" class="empty-state">
              No hay mapas disponibles. Verifica la configuración del servidor.
            </div>

            <div class="map-grid" *ngIf="!loadingMaps && maps.length">
              <label
                *ngFor="let mapa of maps"
                class="map-card"
                [attr.id]="'map-card-' + mapa.id"
                [attr.data-map-id]="mapa.id"
                [class.selected]="mapa.id === selectedMapId">
                <input
                  [attr.id]="'map-option-' + mapa.id"
                  type="radio"
                  name="mapa"
                  [value]="mapa.id"
                  [checked]="mapa.id === selectedMapId"
                  (change)="selectMap(mapa.id)" />
                <div>
                  <strong>{{ mapa.nombre || ('Mapa #' + mapa.id) }}</strong>
                  <small>
                    {{ (mapa.columnas ?? mapa.mapColumns ?? mapa.cols ?? '-') }}
                    ×
                    {{ (mapa.filas ?? mapa.mapRows ?? mapa.rows ?? '-') }}
                  </small>
                </div>
              </label>
            </div>
          </div>

          <div class="ships-container">
            <div class="ships-header">
              <h4>Selecciona los barcos que participarán</h4>
              <span class="chip muted" *ngIf="selectedBoatIds.length">{{ selectedBoatIds.length }} seleccionados</span>
            </div>

            <div *ngIf="loadingBarcos" class="empty-state">Cargando barcos…</div>
            <p class="player-hint" *ngIf="!isAdmin && barcos.length">
              Solo puedes seleccionar un barco por partida.
            </p>
            <div *ngIf="!loadingBarcos && !barcos.length" class="empty-state">
              {{ isAdmin
                ? 'Aún no hay barcos registrados. Puedes crearlos desde el panel de administración.'
                : 'No tienes barcos asignados todavía. Pide a un administrador que te asigne un barco.' }}
            </div>

            <div class="ship-grid" *ngIf="barcos.length">
              <label *ngFor="let barco of barcos" class="ship-card">
                <input
                  [attr.id]="'boat-checkbox-' + barco.id"
                  type="checkbox"
                  [attr.data-boat-id]="barco.id"
                  [checked]="selectedBoatSet.has(barco.id)"
                  (change)="toggleBoat(barco.id, $event.target.checked)"
                  [disabled]="!isAdmin && !selectedBoatSet.has(barco.id) && selectedBoatSet.size >= 1"
                />
                <div>
                  <strong>#{{ barco.id }} {{ barco.modelo?.nombreModelo || 'Sin modelo' }}</strong>
                  <small>Jugador: {{ barco.jugador?.nombre || barco.jugador?.email || 'Sin asignar' }}</small>
                </div>
              </label>
            </div>
          </div>

          <button id="create-partida-button" class="primary-btn" [disabled]="creatingMatch || !selectedBoatIds.length || !selectedMapId" (click)="createMatch()">
            {{ creatingMatch ? 'Creando…' : 'Crear e iniciar partida' }}
          </button>
        </div>
      </section>

      <section class="map-shell" id="map-shell" [class.hidden]="viewStep !== 'playing'">
        <div class="map-shell__top">
          <button id="map-back-button" class="ghost-btn" (click)="backToMenu()">← Menú</button>
          <div class="chip" id="current-partida-chip" *ngIf="currentPartidaId">Partida #{{ currentPartidaId }}</div>
          <div class="chip muted" id="selected-boats-chip" *ngIf="selectedBoatIds.length">Barcos {{ selectedBoatIds.join(', ') }}</div>
        </div>

        <div class="map-loader" id="map-loader" *ngIf="viewStep === 'playing' && !mapReady">
          Preparando mapa y sincronizando barcos…
        </div>

        <div class="map-screen" id="map-screen">
          <div class="map-area" id="map-area">
            <div class="map-area__header">
              <h3 class="map-title" id="map-title">Mapa</h3>
              <span class="map-hint" id="map-hint" *ngIf="mapReady">Haz clic en un barco para controlarlo</span>
            </div>
            <div #canvasRoot id="map-canvas-root" class="map-canvas-root">
              <canvas #mapCanvas class="map-canvas" aria-label="Tablero de la regata"></canvas>
              <div class="map-placeholder" *ngIf="!mapReady">
                Selecciona una partida para visualizar el tablero.
              </div>
            </div>
          </div>

          <aside class="control-panel" id="control-panel">
            <div class="turn-pill" id="turn-indicator">Turno Barco #{{ turnBoatId ?? '-' }}</div>

            <div class="panel-card movement-card">
              <h4 class="panel-title">Control de movimiento</h4>

              <div class="velocity-display">
                <div>
                  <small>Velocidad actual</small>
                  <strong id="current-velocity">vx={{ baseVx }} vy={{ baseVy }}</strong>
                </div>
                <div>
                  <small>Próximo turno</small>
                  <strong id="next-velocity">vx={{ targetVx }} vy={{ targetVy }}</strong>
                </div>
              </div>

              <div class="move-pad">
                <button id="move-up" class="move-btn" (click)="adjustDelta(0,-1)" [class.active]="pendingDy === -1" aria-label="Acelerar hacia arriba">▲</button>
                <div class="move-middle">
                  <button id="move-left" class="move-btn" (click)="adjustDelta(-1,0)" [class.active]="pendingDx === -1" aria-label="Acelerar hacia la izquierda">◀</button>
                  <button id="move-hold" class="move-btn reset" (click)="resetPending()" aria-label="Mantener velocidad">•</button>
                  <button id="move-right" class="move-btn" (click)="adjustDelta(1,0)" [class.active]="pendingDx === 1" aria-label="Acelerar hacia la derecha">▶</button>
                </div>
                <button id="move-down" class="move-btn" (click)="adjustDelta(0,1)" [class.active]="pendingDy === 1" aria-label="Acelerar hacia abajo">▼</button>
              </div>

              <div class="landing-info" id="landing-preview">
                Próxima celda: <strong id="landing-coordinates">{{ previewPosX }}, {{ previewPosY }}</strong>
              </div>

              <button id="confirm-move-button" class="confirm-btn" (click)="confirmMove()" [disabled]="!canConfirmMove">
                {{ submittingMove ? 'Enviando…' : 'Confirmar movimiento' }}
              </button>
            </div>

            <div class="panel-card status-card">
              <h4 class="panel-title">Estado</h4>
              <div class="player-name" id="player-name-label">{{ currentPlayerName || 'Sin jugador asignado' }}</div>
              <div class="stat-line" id="current-position">
                <span class="icon">📍</span>
                <strong id="position-values">Posición {{ posX }}, {{ posY }}</strong>
              </div>
              <div class="next-turn" id="next-turn">Siguiente turno<br><strong>Barco #{{ nextBoatId ?? '-' }}</strong></div>
              <div class="victory-note" *ngIf="partidaFinished && winnerInfo">
                Partida finalizada.
              </div>
            </div>

            <div class="small-muted">
              Ajusta la velocidad con las flechas (máx ±1 por eje) y confirma para avanzar.
            </div>
          </aside>
        </div>
        <div class="victory-overlay" id="victory-overlay" *ngIf="showVictory && winnerInfo">
          <div class="victory-card">
            <div class="trophy" aria-hidden="true">🏆</div>
            <h2>¡Victoria!</h2>
            <p>El <strong>{{ winnerInfo.label }}</strong> ganó la regata.</p>
            <button id="victory-close-button" class="victory-btn" type="button" (click)="closeVictory()">Entendido</button>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['./mapa.css']
})
export class MapaComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRoot', { static: true, read: ElementRef }) canvasRoot!: ElementRef<HTMLElement>;
  @ViewChild('mapCanvas', { static: true, read: ElementRef }) mapCanvas!: ElementRef<HTMLCanvasElement>;

  viewStep: GameViewStep = 'menu';
  partidas: any[] = [];
  barcos: Barco[] = [];
  loadingPartidas = false;
  loadingBarcos = false;
  maps: any[] = [];
  loadingMaps = false;
  creatingMatch = false;
  currentPartidaId: number | null = null;
  selectedLoadPartidaId: number | null = null;
  creatingName = '';
  selectedMapId: number | null = null;
  currentMapId: number | null = null;

  currentBoatId: number | null = null;
  nextBoatId: number | null = null;
  currentPlayerName = '';
  baseVx = 0;
  baseVy = 0;
  turnBoatId: number | null = null;
  pendingDx = 0;
  pendingDy = 0;
  posX = 0;
  posY = 0;
  previewPosX = 0;
  previewPosY = 0;
  submittingMove = false;
  partidaFinished = false;
  showVictory = false;
  winnerInfo: { id: number; label: string } | null = null;
  lastWinnerId: number | null = null;
  mapReady = false;
  playerBoatIds: number[] = [];

  readonly selectedBoatSet = new Set<number>();

  private es: EventSource | null = null;
  private renderer: MapRenderer | null = null;
  private mapLayoutCache = new Map<number, MapLayout>();
  private mapLayout: MapLayout | null = null;
  private boatsState: any[] = [];
  private assignedBoatIds: number[] = [];
  role: UserRole | null = null;
  isAdmin = false;
  private currentJugadorId: number | null = null;
  private authSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private barcoService: BarcoService,
    private auth: AuthService,
    private gs: GameService,
    private http: HttpClient,
  ) {
    this.setRole(this.auth.role);
    this.currentJugadorId = this.auth.jugadorId;
    this.authSub = this.auth.authStateChanges().subscribe(state => {
      this.currentJugadorId = state?.jugadorId ?? null;
      this.setRole(state?.role ?? null);
    });
  }

  private setRole(role: UserRole | null) {
    this.role = role;
    this.isAdmin = role === 'ADMIN';
    if (!this.isAdmin && this.selectedBoatSet.size > 1) {
      const [first] = Array.from(this.selectedBoatSet.values());
      this.selectedBoatSet.clear();
      if (typeof first === 'number') {
        this.selectedBoatSet.add(first);
      }
    }
  }

  get selectedBoatIds(): number[] {
    const ids = Array.from(this.selectedBoatSet.values());
    if (this.isAdmin) {
      return ids;
    }
    return ids.length ? [ids[0]] : [];
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
    this.authSub?.unsubscribe();
    if (this.es) { this.es.close(); this.es = null; }
    this.renderer?.setMovePreview(null);
    this.renderer?.destroy();
    this.renderer = null;
    this.assignedBoatIds = [];
    this.pendingDx = 0;
    this.pendingDy = 0;
  }

  enterLoadMode() {
    this.viewStep = 'load';
    this.loadPartidas();
  }

  enterCreateMode() {
    this.viewStep = 'create';
    this.loadBarcos();
    this.loadMaps();
  }

  backToMenu() {
    if (this.es) { this.es.close(); this.es = null; }
    this.renderer?.setBoats([]);
    this.renderer?.setMovePreview(null);
    this.viewStep = 'menu';
    this.currentPartidaId = null;
    this.currentBoatId = null;
    this.nextBoatId = null;
    this.mapReady = false;
    this.assignedBoatIds = [];
    this.pendingDx = 0;
    this.pendingDy = 0;
    this.previewPosX = 0;
    this.previewPosY = 0;
    this.submittingMove = false;
    this.partidaFinished = false;
    this.showVictory = false;
    this.winnerInfo = null;
    this.lastWinnerId = null;
    this.turnBoatId = null;
    this.playerBoatIds = [];
    this.currentMapId = null;
    this.mapLayout = null;
    this.updateUrlParams(null, []);
  }

  selectExistingPartida(id: number) {
    this.selectedLoadPartidaId = id;
    const found = this.partidas.find((p:any) => Number(p.id) === id);
    if (found && found.mapaId != null) {
      const parsed = Number(found.mapaId);
      this.currentMapId = Number.isFinite(parsed) ? parsed : this.currentMapId;
    }
  }

  async startExistingGame() {
    if (!this.selectedLoadPartidaId) return;
    this.viewStep = 'playing';
    this.mapReady = false;
    this.currentPartidaId = this.selectedLoadPartidaId;
    this.assignedBoatIds = [];
    this.partidaFinished = false;
    this.showVictory = false;
    this.winnerInfo = null;
    this.lastWinnerId = null;
    this.submittingMove = false;
    await this.ensureMapLoaded(this.selectedLoadPartidaId, undefined, this.currentMapId);
    this.updateUrlParams(this.selectedLoadPartidaId, []);
  }

  toggleBoat(id: number, checked: boolean) {
    if (checked) {
      if (!this.isAdmin) {
        this.selectedBoatSet.clear();
      }
      this.selectedBoatSet.add(id);
    } else {
      this.selectedBoatSet.delete(id);
    }
    this.refreshRendererBoats();
    this.updateTurnPointers();
  }

  selectMap(id: number) {
    if (!Number.isFinite(id)) return;
    this.selectedMapId = id;
  }

  async createMatch() {
    if (!this.selectedBoatIds.length) {
      alert('Selecciona al menos un barco para la partida.');
      return;
    }
    if (!this.selectedMapId) {
      alert('Selecciona un mapa para la partida.');
      return;
    }
    this.creatingMatch = true;
    try {
      const partida = await this.gs.createPartida(
        this.creatingName?.trim() || undefined,
        this.selectedBoatIds,
        this.selectedMapId,
      );
      const orderFromResponse = Array.isArray((partida as any)?.order)
        ? (partida as any).order.map((v:any) => Number(v)).filter((v:number) => !Number.isNaN(v))
        : [];
      if (orderFromResponse.length) {
        this.assignedBoatIds = orderFromResponse;
        this.selectedBoatSet.clear();
        orderFromResponse.forEach((id: number) => this.selectedBoatSet.add(id));
      }
      this.currentPartidaId = Number(partida.id);
      const responseMapIdRaw = (partida as any)?.mapaId ?? (partida as any)?.mapa_id;
      const responseMapId = Number(responseMapIdRaw ?? this.selectedMapId);
      if (Number.isFinite(responseMapId)) {
        this.currentMapId = responseMapId;
      }
      this.viewStep = 'playing';
      this.mapReady = false;
      await this.ensureMapLoaded(this.currentPartidaId, this.selectedBoatIds, this.currentMapId);
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
      if (this.selectedLoadPartidaId) {
        const found = this.partidas.find((p:any) => Number(p.id) === this.selectedLoadPartidaId);
        if (found && found.mapaId != null) {
          const parsed = Number(found.mapaId);
          this.currentMapId = Number.isFinite(parsed) ? parsed : this.currentMapId;
        }
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
      const [previousSelection] = this.selectedBoatIds;
      this.barcos = await firstValueFrom(this.barcoService.getAll());
      if (!this.isAdmin) {
        this.selectedBoatSet.clear();
        const preferred = this.barcos.find(b => b.id === previousSelection) ?? this.barcos[0];
        if (preferred) {
          this.selectedBoatSet.add(preferred.id);
        }
      }
    } catch (e) {
      console.warn('No se pudo obtener la lista de barcos', e);
      this.barcos = [];
    } finally {
      this.loadingBarcos = false;
      this.refreshRendererBoats();
      this.updateTurnPointers();
    }
  }

  private async loadMaps(force = false) {
    if (!force && this.maps.length) return;
    this.loadingMaps = true;
    try {
      const payload = await firstValueFrom(this.http.get<any>('/api/mapa'));
      const list = Array.isArray(payload) ? payload : (payload ? [payload] : []);
      this.maps = list.map((m:any) => ({
        id: Number(m.id),
        nombre: m.nombre,
        columnas: m.columnas ?? m.cols ?? m.columnCount,
        filas: m.filas ?? m.rows ?? m.rowCount,
        celdas: m.celdas,
      })).filter((m:any) => Number.isFinite(m.id));
      if (!this.selectedMapId && this.maps.length) {
        this.selectedMapId = this.maps[0].id;
      } else if (this.selectedMapId) {
        const exists = this.maps.some((m:any) => m.id === this.selectedMapId);
        if (!exists && this.maps.length) {
          this.selectedMapId = this.maps[0].id;
        }
      }
    } catch (err) {
      console.warn('No se pudo cargar la lista de mapas', err);
      this.maps = [];
    } finally {
      this.loadingMaps = false;
    }
  }

  private async ensureMapLoaded(partidaId: number, selectedBoatIds?: number[], mapId?: number | null) {
    try {
      this.assignedBoatIds = [];
      if (Array.isArray(selectedBoatIds) && selectedBoatIds.length) {
        this.selectedBoatSet.clear();
        selectedBoatIds.forEach(id => this.selectedBoatSet.add(id));
      } else {
        this.selectedBoatSet.clear();
      }

      this.ensureRenderer();
      this.renderer?.setMovePreview(null);
      this.partidaFinished = false;
      this.showVictory = false;
      this.winnerInfo = null;
      this.lastWinnerId = null;
      this.submittingMove = false;
      if (mapId != null) {
        this.currentMapId = mapId;
      }

      const targetMapId = this.currentMapId;
      if (targetMapId != null) {
        const layout = await this.loadMapLayout(targetMapId);
        if (layout) {
          this.renderer?.setLayout(layout);
        }
      } else if (!this.mapLayout) {
        const layout = await this.loadMapLayout(undefined);
        if (layout) {
          this.renderer?.setLayout(layout);
        }
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
    this.es = this.gs.connectEvents(this.currentPartidaId, (state: any) => {
      void this.onState(state);
    });
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
      const data = await this.gs.fetchState(partidaId);
      if (data) await this.onState(data);
    } catch (err) {
      console.warn('No se pudo obtener snapshot inicial de partida', err);
    }
  }

  private async loadMapLayout(mapId?: number | null, force = false): Promise<MapLayout> {
    const targetId = mapId ?? this.currentMapId ?? null;

    if (targetId != null && !force && this.mapLayoutCache.has(targetId)) {
      const cached = this.mapLayoutCache.get(targetId)!;
      this.mapLayout = cached;
      return cached;
    }

    if (targetId != null && !force) {
      const local = this.maps.find((m:any) => Number(m.id) === targetId);
      if (local && Array.isArray(local.celdas)) {
        const layout = this.buildLayoutFromPayload(local);
        this.mapLayoutCache.set(targetId, layout);
        this.mapLayout = layout;
        return layout;
      }
    }

    if (targetId != null) {
      try {
        const payload = await firstValueFrom(this.http.get<any>(`/api/mapa/${targetId}`));
        if (payload) {
          const layout = this.buildLayoutFromPayload(payload);
          this.mapLayoutCache.set(targetId, layout);
          this.mapLayout = layout;
          this.currentMapId = targetId;
          return layout;
        }
      } catch (err) {
        console.warn('No se pudo cargar layout para el mapa seleccionado', err);
      }
    }

    try {
      const payload = await firstValueFrom(this.http.get<any>('/api/mapa'));
      const list = Array.isArray(payload) ? payload : (payload ? [payload] : []);
      const fallback = targetId != null
        ? list.find((m:any) => Number(m.id) === targetId)
        : list[0];
      if (fallback) {
        const resolvedId = Number(fallback.id);
        const layout = this.buildLayoutFromPayload(fallback);
        if (Number.isFinite(resolvedId)) {
          this.mapLayoutCache.set(resolvedId, layout);
          if (targetId == null) {
            this.currentMapId = resolvedId;
          }
        }
        this.mapLayout = layout;
        return layout;
      }
    } catch (err) {
      console.warn('No se pudo cargar layout del mapa desde la API, usando fallback', err);
    }

    this.mapLayout = this.buildFallbackLayout();
    return this.mapLayout;
  }

  private buildLayoutFromPayload(map: any): MapLayout {
    const columns = Math.max(6, this.pickNumber(map, ['columnas', 'cols', 'width', 'ancho', 'columnCount'], 12));
    const rows = Math.max(6, this.pickNumber(map, ['filas', 'rows', 'height', 'alto', 'rowCount'], 18));
    const cells = Array.isArray(map?.celdas)
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

    return { columns, rows, cells };
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
      label: b.playerName || b.nombre || b.jugadorNombre || b.jugador?.nombre || b.jugador?.email || b.label || `#${b.id}`,
    }));
    const highlighted = this.playerBoatIds.length
      ? this.playerBoatIds
      : (this.assignedBoatIds.length ? this.assignedBoatIds : this.selectedBoatIds);
    this.renderer.setBoats(boats, this.currentBoatId, highlighted);
    this.updatePreviewLanding();
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
    const reference = this.turnBoatId ?? this.currentBoatId ?? order[0];
    const next = this.findNextBoatId(reference);
    this.nextBoatId = next === reference ? this.findNextBoatId(next) : next;
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
    this.baseVx = Number(sel.velX ?? sel.velocidadX ?? 0);
    this.baseVy = Number(sel.velY ?? sel.velocidadY ?? 0);
    this.posX = Number(sel.posX ?? 0);
    this.posY = Number(sel.posY ?? 0);
    this.pendingDx = 0;
    this.pendingDy = 0;
    const name = sel.playerName || sel.nombre || sel.jugadorNombre || sel.jugador?.nombre || sel.jugador?.email || sel.label || '';
    this.currentPlayerName = name || 'Sin jugador asignado';
    this.updatePreviewLanding();
  }

  private async onState(state: any) {
    try {
      const mapIdRaw = state?.mapaId ?? state?.mapa_id;
      const mapId = mapIdRaw != null ? Number(mapIdRaw) : null;
      if (mapId != null && Number.isFinite(mapId) && mapId !== this.currentMapId) {
        this.currentMapId = mapId;
        const layout = await this.loadMapLayout(mapId);
        if (layout) {
          this.renderer?.setLayout(layout);
        }
      }

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
      const turnRaw = state?.currentTurnBoatId ?? state?.turnBoatId ?? state?.turnoActualBarcoId;
      const maybeTurn = Number(turnRaw);
      this.turnBoatId = Number.isFinite(maybeTurn) ? maybeTurn : null;
      if (this.currentJugadorId != null) {
        this.playerBoatIds = barcos
          .filter((b:any) => Number(b.jugadorId ?? b.jugador?.id) === this.currentJugadorId)
          .map((b:any) => Number(b.id));
      } else {
        this.playerBoatIds = [];
      }
      const currentSnapshot = this.currentBoatId != null ? barcos.find((b:any) => b.id === this.currentBoatId) : null;
      const turnSnapshot = this.turnBoatId != null ? barcos.find((b:any) => b.id === this.turnBoatId) : null;
      const shouldFocusTurn = !!(turnSnapshot && this.turnBoatId != null && this.playerBoatIds.includes(this.turnBoatId));
      if (shouldFocusTurn && turnSnapshot) {
        this.applyBoatSnapshot(turnSnapshot);
      } else if (!currentSnapshot && (turnSnapshot || barcos[0])) {
        this.applyBoatSnapshot(turnSnapshot ?? barcos[0]);
      } else if (currentSnapshot) {
        this.applyBoatSnapshot(currentSnapshot);
      }

      const finished = !!state?.finished;
      this.partidaFinished = finished;
      if (finished) {
        const winnerRaw = state?.winner || {};
        const winnerId = winnerRaw && winnerRaw.id != null ? Number(winnerRaw.id) : null;
        const label = winnerRaw?.label || winnerRaw?.jugadorNombre || (winnerId != null ? `Barco #${winnerId}` : 'Barco ganador');
        this.winnerInfo = winnerId != null ? { id: winnerId, label } : null;
        if (winnerId != null && this.lastWinnerId !== winnerId) {
          this.lastWinnerId = winnerId;
          this.showVictory = true;
        }
      } else {
        this.partidaFinished = false;
        this.winnerInfo = null;
        this.showVictory = false;
        this.lastWinnerId = null;
      }

      this.refreshRendererBoats();
      this.updateTurnPointers();
    } catch (e) {
      console.warn('onState parse error', e);
    }
  }

  get targetVx(): number { return this.baseVx + this.pendingDx; }
  get targetVy(): number { return this.baseVy + this.pendingDy; }
  get canConfirmMove(): boolean {
    if (this.submittingMove || this.partidaFinished) return false;
    if (!this.currentBoatId || !this.turnBoatId) return false;
    if (this.currentBoatId !== this.turnBoatId) return false;
    if (this.isAdmin) return false;
    if (this.playerBoatIds.length && !this.playerBoatIds.includes(this.currentBoatId)) return false;
    return true;
  }

  resetPending() {
    if (this.partidaFinished) return;
    this.pendingDx = 0;
    this.pendingDy = 0;
    this.updatePreviewLanding();
  }

  adjustDelta(dx: number, dy: number) {
    if (this.partidaFinished) return;
    if (dx !== 0) {
      this.pendingDx = (this.pendingDx === dx) ? 0 : Math.max(-1, Math.min(1, dx));
    }
    if (dy !== 0) {
      this.pendingDy = (this.pendingDy === dy) ? 0 : Math.max(-1, Math.min(1, dy));
    }
    this.updatePreviewLanding();
  }

  private updatePreviewLanding() {
    if (this.partidaFinished) {
      this.previewPosX = this.posX;
      this.previewPosY = this.posY;
      this.renderer?.setMovePreview(null);
      return;
    }
    if (this.currentBoatId == null) {
      this.previewPosX = 0;
      this.previewPosY = 0;
      this.renderer?.setMovePreview(null);
      return;
    }
    const targetVx = this.targetVx;
    const targetVy = this.targetVy;
    const previewX = Math.round(this.posX + targetVx);
    const previewY = Math.round(this.posY + targetVy);
    this.previewPosX = previewX;
    this.previewPosY = previewY;
    this.renderer?.setMovePreview(this.currentBoatId, previewX, previewY);
  }

  async confirmMove() {
    if (!this.currentPartidaId || !this.currentBoatId) {
      alert('No hay partida o barco seleccionado');
      return;
    }
    if (!this.canConfirmMove) {
      alert(this.partidaFinished ? 'La partida ya finalizó.' : 'Espera tu turno para mover este barco.');
      return;
    }
    const targetVx = this.targetVx;
    const targetVy = this.targetVy;
    if (Math.abs(targetVx - this.baseVx) > 1 || Math.abs(targetVy - this.baseVy) > 1) {
      alert('Movimiento inválido: sólo puedes modificar la velocidad en ±1 por eje.');
      return;
    }
    this.submittingMove = true;
    try {
      await this.gs.setBarcoVel(this.currentBoatId, targetVx, targetVy);
      this.resetPending();
    } catch (e:any) {
      const serverMsg = e?.error?.error ?? e?.error?.message ?? e?.message ?? e;
      alert('Error ejecutando movimiento: ' + serverMsg);
    } finally {
      this.submittingMove = false;
    }
  }

  closeVictory() {
    this.showVictory = false;
  }
}
