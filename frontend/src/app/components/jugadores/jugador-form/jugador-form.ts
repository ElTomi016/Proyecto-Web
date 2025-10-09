import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JugadorService, Jugador } from '../../../services/jugador.service';

@Component({
  selector: 'app-jugador-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jugador-form.html',
  styleUrls: ['./jugador-form.css']
})
export class JugadorFormComponent implements OnInit {
  titulo = 'Nuevo jugador';
  id?: number;
  model: Jugador = { nombre: '', email: '' };
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: JugadorService
  ) {}

  ngOnInit(): void {
    const p = this.route.snapshot.paramMap.get('id');
    if (p) {
      this.titulo = 'Editar jugador';
      this.id = Number(p);
      this.loading = true;
      this.api.getById(this.id).subscribe({
        next: j => this.model = { nombre: j.nombre, email: j.email },
        error: () => this.error = 'No se pudo cargar el jugador.',
        complete: () => this.loading = false
      });
    }
  }

  guardar(): void {
    if (!this.model.nombre || !this.model.email) {
      this.error = 'Completa nombre y email.'; return;
    }
    this.loading = true; this.error = '';
    const op = this.id
      ? this.api.update(this.id, this.model)
      : this.api.create(this.model);

    op.subscribe({
      next: () => this.router.navigateByUrl('/jugadores'),
      error: () => { this.error = 'No se pudo guardar.'; this.loading = false; }
    });
  }

  cancelar(): void { this.router.navigateByUrl('/jugadores'); }
}
