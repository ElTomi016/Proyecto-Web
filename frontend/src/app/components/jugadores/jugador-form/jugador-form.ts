import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JugadorService, Jugador } from '../../../services/jugador.service';

@Component({
  standalone: true,
  templateUrl: './jugador-form.html',
  styleUrls: ['./jugador-form.css'],
  imports: [CommonModule, ReactiveFormsModule, NgIf],
})
export class JugadorFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(JugadorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  titulo = 'Nuevo Jugador';
  error = '';
  saving = false;
  id: number | null = null;

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['']
  });

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw) {
      this.id = Number(raw); this.titulo = 'Editar Jugador';
      this.srv.get(this.id).subscribe({
        next: (j) => this.form.patchValue(j),
        error: () => this.error = 'No se pudo cargar el jugador.'
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = '';
    const payload: Jugador = this.form.getRawValue();

    const obs$ = this.id ? this.srv.update(this.id, payload) : this.srv.create(payload);
    obs$.subscribe({
      next: () => this.router.navigate(['/admin/jugadores']),
      error: () => { this.error = 'No se pudo guardar.'; this.saving = false; }
    });
  }

  cancelar(): void { this.router.navigate(['/admin/jugadores']); }
}
