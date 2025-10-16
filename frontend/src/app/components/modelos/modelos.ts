import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ModeloBarco, ModeloBarcoService } from '../../services/modelo-barco.service';

@Component({
  selector: 'app-modelos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modelos.html',
  styleUrls: ['./modelos.css'],
})
export class ModelosComponent implements OnInit {
  modelos: ModeloBarco[] = [];
  loading = true;
  error = '';

  constructor(private api: ModeloBarcoService, private router: Router) {}

  ngOnInit(): void { this.refresh(); }

  refresh() {
    this.loading = true;
    this.api.getAll().subscribe({
      next: d => { this.modelos = d ?? []; this.loading = false; },
      error: () => { this.error = 'No se pudo cargar la lista.'; this.loading = false; }
    });
  }

  goNew(){ this.router.navigateByUrl('/admin/modelos/nuevo'); }
  goEdit(id: number){ this.router.navigateByUrl(`/admin/modelos/${id}/editar`); }

  remove(id: number){
    if(!confirm('¿Eliminar modelo?')) return;
    this.api.remove(id).subscribe({
      next: () => this.refresh(),
      error: () => alert('No se pudo eliminar'),
    });
  }
}
