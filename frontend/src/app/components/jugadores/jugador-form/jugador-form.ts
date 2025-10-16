import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JugadorService, Jugador } from '../../../services/jugador.service';

@Component({
  selector: 'app-jugador-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './jugador-form.html',
})
export class JugadorFormComponent implements OnInit {

  // Opción A: usar inject() para evitar TS2729
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private srv = inject(JugadorService);

  id?: number;

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
  });

  ngOnInit() {
    const rawId = this.route.snapshot.paramMap.get('id');
    this.id = rawId ? +rawId : undefined;

    if (this.id) {
      this.srv.get(this.id).subscribe({
        next: (j) => this.form.patchValue({
          nombre: j.nombre,
          email: j.email,
          telefono: j.telefono ?? ''
        }),
        error: (e) => console.error('[JugadorForm] get error', e)
      });
    }
  }

  submit() {
    if (this.form.invalid) return;

    const payload: Jugador = this.form.getRawValue();
    const obs$ = this.id
      ? this.srv.update(this.id, payload)
      : this.srv.create(payload);

    obs$.subscribe({
      next: () => this.router.navigate(['/admin/jugadores']),
      error: (e) => console.error('[JugadorForm] save error', e)
    });
  }
}
