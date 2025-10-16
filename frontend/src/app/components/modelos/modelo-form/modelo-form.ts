import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModeloBarcoService } from '../../../services/modelo-barco.service';

@Component({
  selector: 'app-modelo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <section class="card">
    <header class="card-head">
      <h1>{{ id ? 'Editar Modelo' : 'Nuevo Modelo' }}</h1>
    </header>

    <form [formGroup]="form" (ngSubmit)="save()">
      <div class="form-row">
        <label>Nombre del Modelo</label>
        <input type="text" formControlName="nombreModelo">
      </div>
      <div class="form-row">
        <label>Color</label>
        <input type="text" formControlName="color">
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
    input{border:1px solid #d1d5db;border-radius:8px;padding:10px}
    .actions{display:flex;gap:10px;justify-content:flex-end;margin-top:12px}
    .btn{border:1px solid #d1d5db;background:#fff;border-radius:8px;padding:8px 12px;cursor:pointer}
    .btn:hover{background:#f3f4f6}
    .btn-primary{background:#1d4ed8;color:#fff;border:none;border-radius:10px;padding:10px 16px;cursor:pointer}
  `]
})
export class ModelosFormComponent implements OnInit {
  id: number | null = null;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ModeloBarcoService,
    private router: Router
  ) {
    this.form = this.fb.nonNullable.group({
      nombreModelo: ['', [Validators.required, Validators.minLength(2)]],
      color: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const p = this.route.snapshot.paramMap.get('id');
    this.id = p ? Number(p) : null;

    if (this.id) {
      this.api.getById(this.id).subscribe({
        next: m => this.form.setValue({ nombreModelo: m.nombreModelo, color: m.color }),
        error: () => alert('No se pudo cargar el modelo'),
      });
    }
  }

  save(){
    const payload = this.form.getRawValue();
    const req = this.id ? this.api.update(this.id, payload) : this.api.create(payload);
    req.subscribe({
      next: () => this.router.navigateByUrl('/admin/modelos'),
      error: () => alert('No se pudo guardar'),
    });
  }

  cancel(){ this.router.navigateByUrl('/admin/modelos'); }
}
