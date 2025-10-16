import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { TopbarComponent } from '../../../shared/topbar/topbar';
import {
  ModeloBarcoService,
  ModeloBarco,
  ModeloBarcoPayload
} from '../../../services/modelo-barco.service';

@Component({
  selector: 'app-modelo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarComponent],
  templateUrl: './modelo-form.html',
  styleUrls: ['./modelo-form.css']
})
export class ModeloFormComponent implements OnInit {
  private api = inject(ModeloBarcoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // id solo si estamos editando
  id?: number;

  // El formulario usa el PAYLOAD (sin id)
  model: ModeloBarcoPayload = {
    nombreModelo: '',
    color: ''
  };

  loading = false;
  error = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = Number(idParam);
      this.cargar(this.id);
    }
  }

  cargar(id: number): void {
    this.loading = true;
    this.error = '';
    this.api.getById(id).subscribe({
      next: (m: ModeloBarco) => {
        // m sí tiene id, pero al form le pasamos solo el payload
        this.model = { nombreModelo: m.nombreModelo, color: m.color };
      },
      error: (err) => {
        console.error('getById error', err);
        this.error = 'No se pudo cargar el modelo.';
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

  guardar(): void {
    this.loading = true;
    this.error = '';

    // Crear
    if (!this.id) {
      this.api.create(this.model).subscribe({
        next: () => this.volver(),
        error: (err) => {
          console.error('create error', err);
          this.error = 'No se pudo crear el modelo.';
          this.loading = false;
        }
      });
      return;
    }

    // Editar
    this.api.update(this.id, this.model).subscribe({
      next: () => this.volver(),
      error: (err) => {
        console.error('update error', err);
        this.error = 'No se pudo actualizar el modelo.';
        this.loading = false;
      }
    });
  }

  volver(): void {
    this.router.navigateByUrl('/modelos');
  }
}
