import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Mapa (solo lectura)</h2>
    <p>Vista placeholder. Aquí luego dibujamos el 10x10 y leyenda.</p>
  `
})
export class MapaComponent {}
