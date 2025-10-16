import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JugadorService, Jugador } from '../../services/jugador.service';

@Component({
  selector: 'app-jugadores',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, RouterLink],  // ← IMPORTANTE
  templateUrl: './jugadores.html',
  styleUrls: ['./jugadores.css']
})
export class JugadoresComponent implements OnInit {
  jugadores: Jugador[] = [];
  loading = true;
  error = '';

  constructor(private srv: JugadorService) {}

  ngOnInit(): void {
    this.srv.getAll().subscribe({
      next: (data) => { this.jugadores = data ?? []; this.loading = false; },
      error: () => { this.error = 'No se pudo cargar la lista.'; this.loading = false; }
    });
  }

  remove(id: number) {
    if (!confirm('¿Eliminar?')) return;
    this.srv.delete(id).subscribe({
      next: () => { this.jugadores = this.jugadores.filter(j => j.id !== id); },
      error: () => { this.error = 'No se pudo eliminar.'; }
    });
  }
}
