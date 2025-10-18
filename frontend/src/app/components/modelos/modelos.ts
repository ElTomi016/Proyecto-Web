import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ModeloBarcoService, ModeloBarco } from '../../services/modelo-barco.service';

@Component({
  standalone: true,
  templateUrl: './modelos.html',
  styleUrls: ['./modelos.css'],
  imports: [CommonModule, RouterLink, NgIf, NgFor],
})
export class ModelosComponent implements OnInit {
  private srv = inject(ModeloBarcoService);
  private router = inject(Router);

  modelos: ModeloBarco[] = [];
  loading = true; error = '';

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading = true;
    this.srv.getAll().subscribe({
      next: d => { this.modelos = d ?? []; this.loading = false; },
      error: () => { this.error = 'No se pudo cargar la lista.'; this.loading = false; }
    });
  }

  goNew(): void { this.router.navigate(['/admin/modelos','nuevo']); }
  goEdit(id: number): void { this.router.navigate(['/admin/modelos', id, 'editar']); }

  onDelete(id: number): void {
    if (!confirm('¿Eliminar modelo?')) return;
    this.srv.delete(id).subscribe({
      next: () => this.load(),
      error: () => this.error = 'No se pudo eliminar.'
    });
  }
}
