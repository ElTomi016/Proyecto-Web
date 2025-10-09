import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModeloBarcoService, ModeloBarco } from '../../services/modelo-barco.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modelos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modelos.html',
  styleUrls: ['./modelos.css']
})
export class ModelosComponent implements OnInit {
  modelos: ModeloBarco[] = [];
  loading = false;
  error = '';

  constructor(private api: ModeloBarcoService, private router: Router) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true; this.error = '';
    this.api.getAll().subscribe({
      next: data => this.modelos = data,
      error: () => this.error = 'No se pudo cargar la lista.',
      complete: () => this.loading = false
    });
  }

  irNuevo(): void { this.router.navigateByUrl('/modelos/nuevo'); }
  irEditar(id?: number): void { if (id) this.router.navigate(['/modelos', id, 'editar']); }

  eliminar(id?: number): void {
    if (!id || !confirm('¿Eliminar modelo?')) return;
    this.loading = true;
    this.api.delete(id).subscribe({
      next: () => this.cargar(),
      error: () => { this.error = 'No se pudo eliminar.'; this.loading = false; }
    });
  }
}
