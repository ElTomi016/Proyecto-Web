import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { BarcoService, BarcoRaw } from '../../../services/barco.service';
import { JugadorService, Jugador } from '../../../services/jugador.service';
import { ModeloBarcoService, ModeloBarco } from '../../../services/modelo-barco.service';

@Component({
  selector: 'app-barco-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './barco-form.html',
  styleUrls: ['./barco-form.css'],
})
export class BarcoFormComponent implements OnInit {
  // Inyecciones con `inject()`
  private fb      = inject(FormBuilder);
  private router  = inject(Router);
  private route   = inject(ActivatedRoute);
  private barcos  = inject(BarcoService);
  private jugadoresApi = inject(JugadorService);
  private modelosApi   = inject(ModeloBarcoService);

  titulo = 'Nuevo Barco';
  error = '';
  saving = false;

  jugadores: Jugador[] = [];
  modelos: ModeloBarco[] = [];

  // Reactive Form
  form = this.fb.nonNullable.group({
    posX:       [0,  [Validators.required]],
    posY:       [0,  [Validators.required]],
    velocidadX: [0,  [Validators.required]],
    velocidadY: [0,  [Validators.required]],
    jugadorId:  [null as number | null, [Validators.required]],
    modeloId:   [null as number | null, [Validators.required]],
  });

  private id: number | null = null;

  ngOnInit(): void {
    // combos
    this.jugadoresApi.getAll().subscribe({ next: d => this.jugadores = d ?? [] });
    this.modelosApi.getAll().subscribe({ next: d => this.modelos = d ?? [] });

    // modo edición
    const rawId = this.route.snapshot.paramMap.get('id');
    if (rawId) {
      this.id = Number(rawId);
      this.titulo = 'Editar Barco';
      this.barcos.getById(this.id).subscribe({
        next: b => {
          this.form.patchValue({
            posX: b.posX,
            posY: b.posY,
            velocidadX: b.velocidadX,
            velocidadY: b.velocidadY,
            jugadorId: b.jugador?.id ?? null,
            modeloId:  b.modelo?.id  ?? null,
          });
        },
        error: () => this.error = 'No se pudo cargar el barco.',
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true; this.error = '';

    const payload: BarcoRaw = {
      posX:       this.form.value.posX!,
      posY:       this.form.value.posY!,
      velocidadX: this.form.value.velocidadX!,
      velocidadY: this.form.value.velocidadY!,
      jugadorId:  this.form.value.jugadorId!,
      modeloId:   this.form.value.modeloId!,
    };

    const obs$ = this.id
      ? this.barcos.updateRaw(this.id, payload)
      : this.barcos.createRaw(payload);

    obs$.subscribe({
      next: () => this.router.navigate(['/admin/barcos']),
      error: () => { this.error = 'No se pudo guardar.'; this.saving = false; }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/barcos']);
  }
}
