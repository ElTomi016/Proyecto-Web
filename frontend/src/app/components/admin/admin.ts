import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  standalone: true,
  template: `
    <nav class="navbar">
      <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Inicio</a>
      <a routerLink="/admin/modelos" routerLinkActive="active">Modelos</a>
      <a routerLink="/admin/barcos" routerLinkActive="active">Barcos</a>
      <a routerLink="/admin/jugadores" routerLinkActive="active">Jugadores</a>
    </nav>
    <div class="container">
      <div class="card">
        <h1>Panel de administración</h1>
        <p>Utiliza el menú superior para administrar.</p>
      </div>
    </div>
  `,
  imports: [RouterLink, RouterLinkActive]
})
export class AdminComponent {}
