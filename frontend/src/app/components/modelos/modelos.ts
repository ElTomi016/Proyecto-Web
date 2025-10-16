import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { TopbarComponent } from '../../shared/topbar/topbar';
import { ModeloBarcoService, ModeloBarco } from '../../services/modelo-barco.service';

@Component({
  selector: 'app-modelos',
  standalone: true,
  imports: [CommonModule, TopbarComponent],
  templateUrl: './modelos.html',
  styleUrls: ['./modelos.css']
})
export class ModelosComponent implements OnInit {
  private api = inject(ModeloBarcoService);
  private router = inject(Router);

  modelos: ModeloBarco[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    this.api.getAll().subscribe({
      next: (data) => { this.modelos = data; },
      error: (err) => {
        console.error('Modelos getAll error', err);
        this.error = 'No se pudo cargar la lista.';
        this.loading = false;                 // apagar spinner en error
      },
      complete: () => { this.loading = false; }
    });
  }

  irNuevo(): void { this.router.navigateByUrl('/modelos/nuevo'); }
  irEditar(id: number): void { this.router.navigateByUrl(`/modelos/${id}/editar`); }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar modelo?')) return;
    this.loading = true;
    this.api.delete(id).subscribe({
      next: () => this.cargar(),
      error: (err) => {
        console.error('Eliminar modelo error', err);
        this.error = 'No se pudo eliminar.';
        this.loading = false;
      }
    });
  }
}
