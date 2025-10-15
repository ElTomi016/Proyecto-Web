import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent {
  constructor(private router: Router) {}

  goModelos()   { this.router.navigateByUrl('/modelos'); }
  goJugadores() { this.router.navigateByUrl('/jugadores'); }
  goBarcos()    { this.router.navigateByUrl('/barcos'); }
  goMapa()      { this.router.navigateByUrl('/mapa'); } // vista solo lectura (stub)
}
