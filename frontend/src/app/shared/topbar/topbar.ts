import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="brand"><a routerLink="/">Regata Online</a></div>
      <ng-container *ngIf="authState$ | async as state; else guest">
        <nav class="nav" *ngIf="state">
          <ng-container *ngIf="state.role === 'ADMIN'">
            <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Inicio</a>
            <a routerLink="/admin/modelos" routerLinkActive="active">Modelos</a>
            <a routerLink="/admin/barcos" routerLinkActive="active">Barcos</a>
            <a routerLink="/admin/jugadores" routerLinkActive="active">Jugadores</a>
          </ng-container>
          <a routerLink="/juego" routerLinkActive="active" class="game-link">Juego</a>
        </nav>
        <div class="user-info">
          <span>{{ state.username }} · {{ state.role }}</span>
          <button type="button" (click)="logout()">Salir</button>
        </div>
      </ng-container>
      <ng-template #guest>
        <a routerLink="/login" class="login-link">Iniciar sesión</a>
      </ng-template>
    </header>
  `,
  styles: [`
    .topbar {
      position: sticky; top: 0; z-index: 1000;
      display: flex; align-items: center; justify-content: space-between;
      background: #ffffff; border-bottom: 1px solid #e5e7eb; padding: 12px 24px;
    }
    .brand { font-weight: 700; color: #111827; }
    .brand a { text-decoration: none; color: inherit; }
    .nav { display: flex; align-items: center; }
    .nav a { margin: 0 12px; color: #374151; text-decoration: none; }
    .nav a.active { color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 4px; }
    .nav .game-link { color: #059669; font-weight: 600; }
    .user-info { display: flex; align-items: center; gap: 12px; font-size: 14px; }
    .user-info button { border: none; background: #ef4444; color: #fff; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
    .login-link { color: #1d4ed8; font-weight: 600; text-decoration: none; }
  `]
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  authState$ = this.auth.authStateChanges();

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
