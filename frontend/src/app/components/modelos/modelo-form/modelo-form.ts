import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModeloBarcoService, ModeloBarco } from '../../../services/modelo-barco.service';

@Component({
  selector: 'app-modelo-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modelo-form.html',
  styleUrls: ['./modelo-form.css']
})
export class ModeloFormComponent implements OnInit {
  titulo = 'Nuevo modelo';
  id?: number;
  model: ModeloBarco = { nombreModelo: '', color: '' };
  loading = false;
  error = '';

  constructor(private route: ActivatedRoute, private router: Router, private api: ModeloBarcoService) {}

  ngOnInit(): void {
    const p = this.route.snapshot.paramMap.get('id');
    if (p) {
      this.titulo = 'Editar modelo';
      this.id = Number(p);
      this.loading = true;
      this.api.getById(this.id).subscribe({
        next: m => this.model = { nombreModelo: m.nombreModelo, color: m.color },
        error: () => this.error = 'No se pudo cargar el modelo.',
        complete: () => this.loading = false
      });
    }
  }

  guardar(): void {
    if (!this.model.nombreModelo || !this.model.color) { this.error = 'Completa nombre y color.'; return; }
    this.loading = true; this.error = '';
    const op = this.id ? this.api.update(this.id, this.model) : this.api.create(this.model);
    op.subscribe({
      next: () => this.router.navigateByUrl('/modelos'),
      error: () => { this.error = 'No se pudo guardar.'; this.loading = false; }
    });
  }

  cancelar(): void { this.router.navigateByUrl('/modelos'); }
}
