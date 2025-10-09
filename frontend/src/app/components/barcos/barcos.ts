import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarcoService, Barco } from '../../services/barco.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-barcos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './barcos.html',
  styleUrls: ['./barcos.css']
})
export class BarcosComponent implements OnInit {
  barcos: Barco[] = [];
  loading = false;
  error = '';

  constructor(private api: BarcoService, private router: Router) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true; this.error = '';
    this.api.getAll().subscribe({
      next: data => this.barcos = data,
      error: () => this.error = 'No se pudo cargar la lista.',
      complete: () => this.loading = false
    });
  }

  irNuevo(): void { this.router.navigateByUrl('/barcos/nuevo'); }
  irEditar(id?: number): void { if (id) this.router.navigate(['/barcos', id, 'editar']); }

  eliminar(id?: number): void {
    if (!id || !confirm('¿Eliminar barco?')) return;
    this.loading = true;
    this.api.delete(id).subscribe({
      next: () => this.cargar(),
      error: () => { this.error = 'No se pudo eliminar.'; this.loading = false; }
    });
  }
}
