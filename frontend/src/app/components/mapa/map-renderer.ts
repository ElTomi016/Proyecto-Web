export type CellType = 'AGUA' | 'PARED' | 'PARTIDA' | 'META';

export interface MapCell {
  x: number;
  y: number;
  tipo: CellType;
}

export interface MapLayout {
  columns: number;
  rows: number;
  cells: MapCell[];
}

export interface BoatRenderState {
  id: number;
  posX: number;
  posY: number;
  label?: string;
}

export interface RendererOptions {
  onBoatClick?: (boatId: number | null, cellX: number, cellY: number) => void;
}

const CELL_TYPE_COLORS: Record<CellType, string> = {
  AGUA: 'rgba(255,255,255,0)',
  PARED: '#24313f',
  PARTIDA: '#16a34a',
  META: '#dc2626',
};

function key(x: number, y: number): string {
  return `${x}:${y}`;
}

export class MapRenderer {
  private ctx: CanvasRenderingContext2D;
  private layout: MapLayout = { columns: 10, rows: 10, cells: [] };
  private boats: BoatRenderState[] = [];
  private focusBoatId: number | null = null;
  private highlighted = new Set<number>();
  private cellLookup = new Map<string, CellType>();
  private resizeObserver: ResizeObserver | null = null;
  private rafRequested = false;
  private cellSize = 48;
  private movePreview: { boatId: number; x: number; y: number } | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private container: HTMLElement,
    private opts: RendererOptions = {},
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener contexto 2d para el canvas del mapa.');
    this.ctx = ctx;
    this.handleResize = this.handleResize.bind(this);
    this.onClick = this.onClick.bind(this);
    window.addEventListener('resize', this.handleResize);
    canvas.addEventListener('click', this.onClick);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }
    this.handleResize();
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
    this.canvas.removeEventListener('click', this.onClick);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  setLayout(layout: MapLayout) {
    this.layout = layout;
    this.cellLookup.clear();
    for (const cell of layout.cells) {
      const tipo = (cell.tipo || 'AGUA').toUpperCase() as CellType;
      this.cellLookup.set(key(cell.x, cell.y), tipo);
    }
    this.handleResize();
  }

  setBoats(boats: BoatRenderState[], focusId?: number | null, highlightedIds?: number[]) {
    this.boats = boats;
    this.focusBoatId = typeof focusId === 'number' ? focusId : null;
    this.highlighted = new Set(highlightedIds || []);
    this.requestRender();
  }

  private handleResize() {
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 800;
    const cols = Math.max(1, this.layout.columns);
    const rows = Math.max(1, this.layout.rows);
    const wCell = Math.max(28, Math.min(64, Math.floor((width - 32) / cols)));
    const hCell = Math.max(28, Math.min(64, Math.floor((height - 32) / rows)));
    this.cellSize = Math.min(wCell, hCell);
    const canvasWidth = this.cellSize * cols;
    const canvasHeight = this.cellSize * rows;
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.floor(canvasWidth * ratio));
    this.canvas.height = Math.max(1, Math.floor(canvasHeight * ratio));
    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(ratio, ratio);
    this.requestRender();
  }

  private requestRender() {
    if (this.rafRequested) return;
    this.rafRequested = true;
    requestAnimationFrame(() => {
      this.rafRequested = false;
      this.render();
    });
  }

  private render() {
    const cols = this.layout.columns;
    const rows = this.layout.rows;
    const width = this.cellSize * cols;
    const height = this.cellSize * rows;

    this.ctx.clearRect(0, 0, width, height);

    // fondo agua
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#dff6ff');
    gradient.addColorStop(0.5, '#bde5ff');
    gradient.addColorStop(1, '#9dd7ff');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    // dibujo celdas especiales (paredes, partida, meta)
    for (const [cellKey, tipo] of this.cellLookup.entries()) {
      const [sx, sy] = cellKey.split(':').map(Number);
      this.drawCell(sx, sy, tipo);
    }

    this.drawGrid();
    this.drawMovePreview();
    this.drawBoats();
  }

  private drawCell(x: number, y: number, tipo: CellType) {
    const px = x * this.cellSize;
    const py = y * this.cellSize;
    const pad = Math.max(0, Math.floor(this.cellSize * 0.08));
    const size = this.cellSize - pad * 2;

    switch (tipo) {
      case 'PARED': {
        this.ctx.fillStyle = CELL_TYPE_COLORS.PARED;
        this.ctx.fillRect(px + pad, py + pad, size, size);
        this.ctx.strokeStyle = '#101827';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(px + pad, py + pad, size, size);
        break;
      }
      case 'PARTIDA': {
        this.ctx.fillStyle = 'rgba(34,197,94,0.4)';
        this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
        this.drawFlag(px, py, '#16a34a');
        break;
      }
      case 'META': {
        this.ctx.fillStyle = 'rgba(248,113,113,0.35)';
        this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
        this.drawStar(px + this.cellSize / 2, py + this.cellSize / 2, this.cellSize * 0.35, '#dc2626');
        break;
      }
      default:
        break;
    }
  }

  private drawFlag(px: number, py: number, color: string) {
    const poleHeight = this.cellSize * 0.7;
    const poleX = px + this.cellSize * 0.25;
    const poleY = py + this.cellSize * 0.2;
    this.ctx.strokeStyle = '#0f172a';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(poleX, poleY);
    this.ctx.lineTo(poleX, poleY + poleHeight);
    this.ctx.stroke();
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(poleX, poleY);
    this.ctx.lineTo(poleX + this.cellSize * 0.4, poleY + this.cellSize * 0.15);
    this.ctx.lineTo(poleX, poleY + this.cellSize * 0.3);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawStar(cx: number, cy: number, radius: number, color: string) {
    const spikes = 5;
    const step = Math.PI / spikes;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? radius : radius * 0.45;
      const angle = i * step - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawGrid() {
    this.ctx.strokeStyle = 'rgba(15,23,42,0.08)';
    this.ctx.lineWidth = 1;
    const cols = this.layout.columns;
    const rows = this.layout.rows;
    for (let x = 0; x <= cols; x++) {
      const px = x * this.cellSize + 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(px, 0);
      this.ctx.lineTo(px, rows * this.cellSize);
      this.ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      const py = y * this.cellSize + 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, py);
      this.ctx.lineTo(cols * this.cellSize, py);
      this.ctx.stroke();
    }
  }

  setMovePreview(boatId: number | null, posX?: number, posY?: number) {
    if (boatId == null || posX == null || posY == null) {
      this.movePreview = null;
    } else {
      this.movePreview = { boatId, x: Number(posX), y: Number(posY) };
    }
    this.requestRender();
  }

  private drawMovePreview() {
    if (!this.movePreview) return;
    const { x, y } = this.movePreview;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < 0 || y < 0 || x >= this.layout.columns || y >= this.layout.rows) return;
    const px = x * this.cellSize;
    const py = y * this.cellSize;
    const inset = Math.max(3, Math.floor(this.cellSize * 0.12));
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(14,165,233,0.28)';
    this.ctx.strokeStyle = 'rgba(14,165,233,0.65)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.rect(px + inset, py + inset, this.cellSize - inset * 2, this.cellSize - inset * 2);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawBoats() {
    for (const boat of this.boats) {
      const isFocus = this.focusBoatId != null && this.focusBoatId === boat.id;
      const isHighlighted = this.highlighted.has(boat.id);
      this.drawBoat(boat, isFocus, isHighlighted);
    }
  }

  private drawBoat(boat: BoatRenderState, focus: boolean, highlighted: boolean) {
    const px = boat.posX * this.cellSize;
    const py = boat.posY * this.cellSize;
    const cx = px + this.cellSize / 2;
    const cy = py + this.cellSize / 2;
    const hullW = this.cellSize * 0.65;
    const hullH = this.cellSize * 0.42;
    const baseColor = focus ? '#fbbf24' : highlighted ? '#0ea5e9' : '#fb923c';

    this.ctx.save();
    this.ctx.translate(cx, cy);

    // sombra
    this.ctx.fillStyle = 'rgba(15,23,42,0.18)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, hullH * 0.6, hullW * 0.45, hullH * 0.3, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // casco
    this.ctx.fillStyle = baseColor;
    this.ctx.beginPath();
    this.ctx.moveTo(-hullW / 2, hullH / 2);
    this.ctx.lineTo(hullW / 2, hullH / 2);
    this.ctx.lineTo(hullW / 2 - hullH / 2, -hullH / 2);
    this.ctx.lineTo(-hullW / 2 + hullH / 2, -hullH / 2);
    this.ctx.closePath();
    this.ctx.fill();

    // cubierta
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(-hullW * 0.15, -hullH * 0.8, hullW * 0.3, hullH);

    // mástil
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(-2, -hullH * 0.85, 4, hullH);

    // vela
    this.ctx.fillStyle = '#f1f5f9';
    this.ctx.beginPath();
    this.ctx.moveTo(2, -hullH * 0.85);
    this.ctx.lineTo(hullW * 0.3, -hullH * 0.1);
    this.ctx.lineTo(2, hullH * 0.1);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();

    // etiqueta
    const label = boat.label || `#${boat.id}`;
    this.ctx.fillStyle = focus ? '#0f172a' : '#0f172a';
    this.ctx.font = `${Math.max(12, this.cellSize * 0.3)}px 'Inter', sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText(label, cx, py - 4);
  }

  private onClick(ev: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const xCss = ev.clientX - rect.left;
    const yCss = ev.clientY - rect.top;
    const cellX = Math.floor(xCss / this.cellSize);
    const cellY = Math.floor(yCss / this.cellSize);

    const safeCellX = Math.min(Math.max(cellX, 0), this.layout.columns - 1);
    const safeCellY = Math.min(Math.max(cellY, 0), this.layout.rows - 1);

    const boat = this.boats.find(b => b.posX === safeCellX && b.posY === safeCellY);
    if (this.opts.onBoatClick) {
      this.opts.onBoatClick(boat ? boat.id : null, safeCellX, safeCellY);
    }
  }
}
