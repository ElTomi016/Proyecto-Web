import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor, JsonPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BarcoService, Barco } from '../../services/barco.service';

@Component({
  selector: 'app-barcos',
  standalone: true,
  templateUrl: './barcos.html',
  styleUrls: ['./barcos.css'],
  imports: [CommonModule, RouterLink, NgIf, NgFor, JsonPipe],
})
export class BarcosComponent implements OnInit {
  private router = inject(Router);
  private barcosApi = inject(BarcoService);

  barcos: Barco[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.recargar();
  }

  private recargar(): void {
    this.loading = true;
    this.barcosApi.getAll().subscribe({
      next: (d) => { this.barcos = d ?? []; this.loading = false; },
      error: () => { this.error = 'No se pudo cargar la lista.'; this.loading = false; }
    });
  }

  goNew(): void { this.router.navigate(['/admin/barcos','nuevo']); }
  goEdit(id: number): void { this.router.navigate(['/admin/barcos', id, 'editar']); }

  onDelete(id: number): void {
    if (!confirm('¿Eliminar barco?')) return;
    this.barcosApi.remove(id).subscribe({
      next: () => this.recargar(),
      error: () => this.error = 'No se pudo eliminar.'
    });
  }
}
