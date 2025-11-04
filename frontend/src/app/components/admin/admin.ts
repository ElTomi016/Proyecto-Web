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

// Evitar errors en SSR: ejecutar solo en browser
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const adminPanel = document.querySelector('.admin-panel') || document.querySelector('#admin') || document.querySelector('.admin-controls') || document.body;
      if (!adminPanel) return;
      if (!document.getElementById('admin-open-juego')) {
        const btn = document.createElement('button');
        btn.id = 'admin-open-juego';
        btn.textContent = 'Abrir Juego';
        btn.style.marginLeft = '10px';
        btn.className = 'btn btn-secondary';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          try {
            window.location.href = '/juego';
          } catch {
            window.location.assign('/juego');
          }
        });
        adminPanel.appendChild(btn);
      }
    } catch (e) { console.warn(e); }
  });
}
