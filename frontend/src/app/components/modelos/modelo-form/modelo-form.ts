import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModeloBarcoService, ModeloBarco } from '../../../services/modelo-barco.service';

@Component({
  standalone: true,
  templateUrl: './modelo-form.html',
  styleUrls: ['./modelo-form.css'],
  imports: [CommonModule, ReactiveFormsModule, NgIf],
})
export class ModelosFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(ModeloBarcoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  titulo = 'Nuevo Modelo';
  error = '';
  saving = false;
  id: number | null = null;

  form = this.fb.nonNullable.group({
    nombreModelo: ['', [Validators.required]],
    color: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw) {
      this.id = Number(raw); this.titulo = 'Editar Modelo';
      this.srv.get(this.id).subscribe({
        next: m => this.form.patchValue(m),
        error: () => this.error = 'No se pudo cargar el modelo.'
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = '';
    const payload: ModeloBarco = this.form.getRawValue();

    const obs$ = this.id ? this.srv.update(this.id, payload) : this.srv.create(payload);
    obs$.subscribe({
      next: () => this.router.navigate(['/admin/modelos']),
      error: () => { this.error = 'No se pudo guardar.'; this.saving = false; }
    });
  }

  cancelar(): void { this.router.navigate(['/admin/modelos']); }
}
