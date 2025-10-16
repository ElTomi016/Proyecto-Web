import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section>
      <h1 class="title">Panel de administración</h1>

      <div class="grid">
        <a class="card" routerLink="/admin/modelos">
          <h3>Modelos de Barco</h3>
          <p>Gestiona los tipos de barcos.</p>
        </a>

        <a class="card" routerLink="/admin/jugadores">
          <h3>Jugadores</h3>
          <p>Administra la información de los participantes.</p>
        </a>

        <a class="card" routerLink="/admin/barcos">
          <h3>Barcos</h3>
          <p>Supervisa y gestiona los barcos.</p>
        </a>
      </div>
    </section>
  `,
  styles: [`
    .title { font-size: 28px; font-weight: 700; margin: 16px 0 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap: 16px; }
    .card { display:block; background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:16px; text-decoration:none; color:#111827; }
    .card:hover { border-color:#1d4ed8; box-shadow:0 4px 14px rgba(29,78,216,.15); }
    .card h3 { margin:0 0 6px; }
    .card p { margin:0; color:#4b5563; }
  `]
})
export class AdminComponent {}
