import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="brand">Regata Online</div>
      <nav class="nav">
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Inicio</a>
        <a routerLink="/admin/modelos" routerLinkActive="active">Modelos</a>
        <a routerLink="/admin/barcos" routerLinkActive="active">Barcos</a>
        <a routerLink="/admin/jugadores" routerLinkActive="active">Jugadores</a>
      </nav>
    </header>
  `,
  styles: [`
    .topbar {
      position: sticky; top: 0; z-index: 1000;
      display: flex; align-items: center; justify-content: space-between;
      background: #ffffff; border-bottom: 1px solid #e5e7eb; padding: 12px 24px;
    }
    .brand { font-weight: 700; color: #111827; }
    .nav a { margin: 0 12px; color: #374151; text-decoration: none; }
    .nav a.active { color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 4px; }
  `]
})
export class TopbarComponent {}
