import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JugadorService, Jugador } from '../../services/jugador.service';

@Component({
  selector: 'app-jugadores',
  standalone: true,               // << esto es clave en Angular standalone
  imports: [CommonModule],        // << aquí habilitamos *ngFor
  templateUrl: './jugadores.html',
  styleUrls: ['./jugadores.css']
})
export class JugadoresComponent implements OnInit {
  jugadores: Jugador[] = [];
  constructor(private jugadorService: JugadorService) {}
  ngOnInit(): void {
    this.jugadorService.getAll().subscribe({
      next: (data) => this.jugadores = data,
      error: (err) => console.error('Error cargando jugadores', err)
    });
  }
}
