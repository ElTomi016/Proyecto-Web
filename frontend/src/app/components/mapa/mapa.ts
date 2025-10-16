import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TopbarComponent } from '../../shared/topbar/topbar';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, TopbarComponent],
  template: `
    <app-topbar></app-topbar>

    <main class="mapa">
      <h1>Mapa (solo lectura)</h1>
      <p>Vista placeholder. Aquí luego dibujamos el tablero 10x10 y la leyenda.</p>
    </main>
  `,
  styles: `
    :host{ display:block; background:#fff; color:#111827; min-height:100vh; }
    .mapa{ max-width:960px; margin:24px auto; padding:0 16px; }
    h1{ font-size:30px; margin:0 0 12px; }
    p{ margin:0; color:#475569; }
  `
})
export class MapaComponent {}
