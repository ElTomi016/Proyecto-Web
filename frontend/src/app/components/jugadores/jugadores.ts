import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JugadorService, Jugador } from '../../services/jugador.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-jugadores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jugadores.html',
  styleUrls: ['./jugadores.css']
})
export class JugadoresComponent implements OnInit {
  jugadores: Jugador[] = [];
  loading = false;
  error = '';

  constructor(private api: JugadorService, private router: Router) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
  this.loading = true; this.error = '';
  this.api.getAll().subscribe({
    next: d => this.jugadores = d,
    error: (err) => {
      console.error('Jugadores getAll error', err);
      this.error = 'No se pudo cargar la lista.';
      this.loading = false;              // <- aquí también
    },
    complete: () => this.loading = false
  });
}

  irNuevo(): void { this.router.navigateByUrl('/jugadores/nuevo'); }
  irEditar(id?: number): void { if (id) this.router.navigate(['/jugadores', id, 'editar']); }

  eliminar(id?: number): void {
    if (!id) return;
    if (!confirm('¿Eliminar jugador?')) return;
    this.loading = true;
    this.api.delete(id).subscribe({
      next: () => this.cargar(),
      error: () => { this.error = 'No se pudo eliminar.'; this.loading = false; }
    });
  }
}
