import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { JugadorService, Jugador } from '../../services/jugador.service';

@Component({
  selector: 'app-jugadores',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './jugadores.html',
})
export class JugadoresComponent implements OnInit {
  jugadores: Jugador[] = [];
  loading = false;
  error = '';

  constructor(
    private srv: JugadorService,
    private router: Router
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.srv.getAll().subscribe({
      next: (data) => {
        this.jugadores = data ?? [];
        this.loading = false;
      },
      error: (e) => {
        console.error('[Jugadores] getAll error', e);
        this.error = 'No se pudo cargar la lista.';
        this.loading = false;
      }
    });
  }

  onNew() {
    this.router.navigate(['/admin/jugadores/nuevo']);
  }

  onEdit(id: number) {
    this.router.navigate(['/admin/jugadores', id, 'editar']);
  }

  onDelete(id: number) {
    if (!confirm('¿Seguro de eliminar?')) return;
    this.srv.delete(id).subscribe({
      next: () => this.load(),
      error: (e) => {
        console.error('[Jugadores] delete error', e);
        this.error = 'No se pudo eliminar.';
      }
    });
  }
}
