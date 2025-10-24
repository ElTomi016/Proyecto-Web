import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-juego-setup',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="setup-page">
      <h2>Crear partida</h2>

      <div class="setup-grid">
        <section class="card">
          <h4>Seleccionar mapa</h4>
          <select [(ngModel)]="selectedMapId">
            <option *ngFor="let m of mapas" [value]="m.id">{{m.nombre || ('Mapa ' + m.id)}}</option>
          </select>
        </section>

        <section class="card">
          <h4>Seleccionar jugadores</h4>
          <div class="players-list">
            <label *ngFor="let j of jugadores">
              <input type="checkbox" [value]="j.id" (change)="toggleJugador(j.id, $event.target.checked)"/> {{ j.nombre || j.usuario || ('Jugador '+j.id) }}
            </label>
          </div>
        </section>
      </div>

      <div style="margin-top:12px">
        <button class="btn" (click)="createAndStart()">Iniciar partida</button>
      </div>
    </div>
  `,
  styles: [`
    .setup-page { padding:18px; max-width:1000px; margin:0 auto; }
    .setup-grid { display:flex; gap:18px; align-items:flex-start; }
    .card { background:#fff;padding:12px;border-radius:8px;box-shadow:0 6px 18px rgba(15,23,42,0.04); width: 100%; }
    .players-list { max-height:240px; overflow:auto; display:flex; flex-direction:column; gap:6px; margin-top:8px; }
    .btn { padding:10px 14px; background:#0b6ea6;color:white;border-radius:8px;border:none; cursor:pointer; font-weight:700; }
  `]
})
export class JuegoSetupComponent implements AfterViewInit {
  mapas: any[] = [];
  jugadores: any[] = [];
  selectedMapId: number | null = null;
  selectedPlayers = new Set<number>();
  gs = new GameService();

  constructor(private router: Router) {}

  async ngAfterViewInit() {
    // intentar cargar mapas y jugadores (si endpoints disponibles)
    try {
      const m = await fetch('/api/mapas').then(r => r.ok ? r.json() : []);
      this.mapas = Array.isArray(m) ? m : [];
      if (this.mapas.length) this.selectedMapId = this.mapas[0].id;
    } catch { this.mapas = []; }
    try {
      const j = await fetch('/api/jugadores').then(r => r.ok ? r.json() : []);
      this.jugadores = Array.isArray(j) ? j : [];
    } catch { this.jugadores = []; }
  }

  toggleJugador(id:number, checked:boolean) {
    if (checked) this.selectedPlayers.add(id);
    else this.selectedPlayers.delete(id);
  }

  async createAndStart() {
    try {
      const p = await this.gs.createPartida();
      // optionally associate map/players via backend endpoints if implemented
      // navigate to juego with partida id
      this.router.navigateByUrl(`/juego?partida=${p.id}`);
    } catch (e:any) {
      alert('No se pudo crear partida: ' + (e.message || e));
    }
  }
}
