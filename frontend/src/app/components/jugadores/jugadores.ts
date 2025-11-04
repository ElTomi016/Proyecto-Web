import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { JugadorService, Jugador } from '../../services/jugador.service';

@Component({
  standalone: true,
  templateUrl: './jugadores.html',
  styleUrls: ['./jugadores.css'],
  imports: [CommonModule, NgIf, NgFor],
})
export class JugadoresComponent implements OnInit {
  private srv = inject(JugadorService);
  private router = inject(Router);

  jugadores: Jugador[] = [];
  loading = true; error = '';

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading = true;
    this.srv.getAll().subscribe({
      next: d => { this.jugadores = d ?? []; this.loading = false; },
      error: () => { this.error = 'No se pudo cargar la lista.'; this.loading = false; }
    });
  }

  goNew(): void { this.router.navigate(['/admin/jugadores', 'nuevo']); }
  goEdit(id: number): void { this.router.navigate(['/admin/jugadores', id, 'editar']); }

  onDelete(id: number): void {
    if (!confirm('¿Eliminar jugador?')) return;
    this.srv.delete(id).subscribe({
      next: () => this.load(),
      error: () => this.error = 'No se pudo eliminar.'
    });
  }
}
