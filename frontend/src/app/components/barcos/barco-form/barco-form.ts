import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BarcoService, Barco } from '../../../services/barco.service';
import { Jugador, JugadorService } from '../../../services/jugador.service';
import { ModeloBarco, ModeloBarcoService } from '../../../services/modelo-barco.service';

@Component({
  selector: 'app-barco-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <section class="card">
    <header class="card-head">
      <h1>{{ id ? 'Editar Barco' : 'Nuevo Barco' }}</h1>
    </header>

    <form [formGroup]="form" (ngSubmit)="save()">
      <div class="form-row">
        <label>Jugador</label>
        <select formControlName="jugadorId">
          <option value="" disabled>Seleccione…</option>
          <option *ngFor="let j of jugadores" [value]="j.id">{{ j.nombre }}</option>
        </select>
      </div>

      <div class="form-row">
        <label>Modelo</label>
        <select formControlName="modeloId">
          <option value="" disabled>Seleccione…</option>
          <option *ngFor="let m of modelos" [value]="m.id">{{ m.nombreModelo }}</option>
        </select>
      </div>

      <div class="grid">
        <div class="form-row">
          <label>posX</label>
          <input type="number" formControlName="posX">
        </div>
        <div class="form-row">
          <label>posY</label>
          <input type="number" formControlName="posY">
        </div>
        <div class="form-row">
          <label>velocidadX</label>
          <input type="number" formControlName="velocidadX">
        </div>
        <div class="form-row">
          <label>velocidadY</label>
          <input type="number" formControlName="velocidadY">
        </div>
      </div>

      <div class="actions">
        <button class="btn" type="button" (click)="cancel()">Cancelar</button>
        <button class="btn-primary" type="submit" [disabled]="form.invalid">Guardar</button>
      </div>
    </form>
  </section>
  `,
  styles: [`
    .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px}
    .card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
    .form-row{display:flex;flex-direction:column;margin-bottom:12px}
    label{font-weight:600;margin-bottom:6px}
    input,select{border:1px solid #d1d5db;border-radius:8px;padding:10px}
    .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
    .actions{display:flex;gap:10px;justify-content:flex-end;margin-top:12px}
    .btn{border:1px solid #d1d5db;background:#fff;border-radius:8px;padding:8px 12px;cursor:pointer}
    .btn:hover{background:#f3f4f6}
    .btn-primary{background:#1d4ed8;color:#fff;border:none;border-radius:10px;padding:10px 16px;cursor:pointer}
  `]
})
export class BarcoFormComponent implements OnInit {
  id: number | null = null;

  jugadores: Jugador[] = [];
  modelos: ModeloBarco[] = [];

  // Declaración sin inicializar aquí:
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private barcosApi: BarcoService,
    private jugadoresApi: JugadorService,
    private modelosApi: ModeloBarcoService,
  ) {
    // Inicialización en el constructor -> evita "fb usado antes de inicializar"
    this.form = this.fb.nonNullable.group({
      jugadorId: [0, Validators.required],
      modeloId:  [0, Validators.required],
      posX:      [0, Validators.required],
      posY:      [0, Validators.required],
      velocidadX:[0, Validators.required],
      velocidadY:[0, Validators.required],
    });
  }

  ngOnInit(): void {
    const p = this.route.snapshot.paramMap.get('id');
    this.id = p ? Number(p) : null;

    this.jugadoresApi.getAll().subscribe({ next: d => this.jugadores = d ?? [] });
    this.modelosApi.getAll().subscribe({ next: d => this.modelos = d ?? [] });

    if (this.id) {
      this.barcosApi.getById(this.id).subscribe({
        next: (b: Barco) => {
          // Tu API devuelve ids planos:
          this.form.setValue({
            jugadorId: b.jugadorId,
            modeloId:  b.modeloId,
            posX:      b.posX,
            posY:      b.posY,
            velocidadX:b.velocidadX,
            velocidadY:b.velocidadY,
          });
        },
        error: () => alert('No se pudo cargar el barco'),
      });
    }
  }

  save() {
    const payload = this.form.getRawValue();
    const req = this.id
      ? this.barcosApi.update(this.id, payload)
      : this.barcosApi.create(payload);

    req.subscribe({
      next: () => this.router.navigateByUrl('/admin/barcos'),
      error: () => alert('No se pudo guardar'),
    });
  }

  cancel(){ this.router.navigateByUrl('/admin/barcos'); }
}
