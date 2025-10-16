import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { TopbarComponent } from '../../../shared/topbar/topbar';
import { BarcoService, Barco, BarcoPayload } from '../../../services/barco.service';
import { JugadorService, Jugador } from '../../../services/jugador.service';
import { ModeloBarcoService, ModeloBarco } from '../../../services/modelo-barco.service';

@Component({
  selector: 'app-barco-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarComponent],
  templateUrl: './barco-form.html',
  styleUrls: ['./barco-form.css']
})
export class BarcoFormComponent implements OnInit {
  titulo = 'Nuevo barco';
  id?: number;
  loading = false;
  error = '';

  jugadores: Jugador[] = [];
  modelos: ModeloBarco[] = [];

  model = {
    posX: 0, posY: 0, velocidadX: 0, velocidadY: 0,
    jugadorId: undefined as unknown as number,
    modeloId: undefined as unknown as number
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: BarcoService,
    private jugadoresApi: JugadorService,
    private modelosApi: ModeloBarcoService
  ) {}

  ngOnInit(): void {
    this.cargarCombos();

    const p = this.route.snapshot.paramMap.get('id');
    if (p) {
      this.titulo = 'Editar barco';
      this.id = Number(p);
      this.loading = true;
      this.api.getById(this.id).subscribe({
        next: (b: Barco) => {
          this.model.posX = b.posX ?? 0;
          this.model.posY = b.posY ?? 0;
          this.model.velocidadX = b.velocidadX ?? 0;
          this.model.velocidadY = b.velocidadY ?? 0;
          this.model.jugadorId = b.jugador?.id as number;
          this.model.modeloId = b.modelo?.id as number;
        },
        error: () => this.error = 'No se pudo cargar el barco.',
        complete: () => this.loading = false
      });
    }
  }

  private cargarCombos(): void {
    this.jugadoresApi.getAll().subscribe({ next: d => this.jugadores = d });
    this.modelosApi.getAll().subscribe({ next: d => this.modelos = d });
  }

  guardar(): void {
    if (this.model.jugadorId == null || this.model.modeloId == null) {
      this.error = 'Selecciona jugador y modelo.'; return;
    }
    this.loading = true; this.error = '';

    const payload: BarcoPayload = {
      posX: Number(this.model.posX),
      posY: Number(this.model.posY),
      velocidadX: Number(this.model.velocidadX),
      velocidadY: Number(this.model.velocidadY),
      jugadorId: Number(this.model.jugadorId),
      modeloId: Number(this.model.modeloId)
    };

    const op = this.id ? this.api.update(this.id, payload) : this.api.create(payload);
    op.subscribe({
      next: () => this.router.navigateByUrl('/barcos'),
      error: () => { this.error = 'No se pudo guardar.'; this.loading = false; }
    });
  }

  cancelar(): void { this.router.navigateByUrl('/barcos'); }
}
