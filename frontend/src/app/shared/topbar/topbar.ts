import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <div class="brand" (click)="go('/admin', $event)" title="Ir al Panel">
        <span class="dot"></span>
        <span class="name">Regata Online</span>
      </div>

      <nav class="menu">
        <a [class.active]="isActive('/admin')"     (click)="go('/admin', $event)">Inicio</a>
        <a [class.active]="isActive('/modelos')"   (click)="go('/modelos', $event)">Modelos</a>
        <a [class.active]="isActive('/barcos')"    (click)="go('/barcos', $event)">Barcos</a>
        <a [class.active]="isActive('/jugadores')" (click)="go('/jugadores', $event)">Participantes</a>
      </nav>

      <div class="actions">
        <button class="outline" type="button" (click)="salir()">Salir</button>
      </div>
    </header>
  `,
  styleUrls: ['./topbar.css']
})
export class TopbarComponent {
  private router = inject(Router);

  go(path: string, ev?: Event) {
    ev?.preventDefault();
    this.router.navigateByUrl(path);
  }

  isActive(prefix: string): boolean {
    const url = this.router.url || '';
    return url === prefix || url.startsWith(prefix + '/');
  }

  salir(): void {
    // En esta demo simplemente volvemos al inicio.
    this.router.navigateByUrl('/');
  }
}
