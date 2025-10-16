import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BarcoService, Barco } from '../../services/barco.service';

@Component({
  selector: 'app-barcos',
  templateUrl: './barcos.html',
  styleUrls: ['./barcos.css']
})
export class BarcosComponent implements OnInit {

  barcos: Barco[] = [];
  loading = true;
  error = '';

  constructor(
    private srv: BarcoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading = true;
    this.error = '';

    this.srv.getAll().subscribe({
      next: (data) => {
        // NO transformar; dejamos las relaciones tal cual vienen del backend
        this.barcos = data ?? [];
        this.loading = false;
      },
      error: (e) => {
        console.error('Error listando barcos', e);
        this.error = 'No se pudo cargar la lista.';
        this.loading = false;
      }
    });
  }

  goNew(): void {
    this.router.navigate(['/admin/barcos/nuevo']);
  }

  goEdit(id: number): void {
    this.router.navigate(['/admin/barcos', id, 'editar']);
  }

  onDelete(id: number): void {
    if (!confirm('¿Eliminar barco?')) { return; }
    this.srv.remove(id).subscribe({
      next: () => this.cargar(),
      error: (e) => {
        console.error('Error eliminando', e);
        this.error = 'No se pudo eliminar.';
      }
    });
  }
}
