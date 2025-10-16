import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Barco, BarcoService } from '../../services/barco.service';

@Component({
  selector: 'app-barcos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './barcos.html',
  styleUrls: ['../jugadores/jugadores.css']
})
export class BarcosComponent implements OnInit {
  barcos: Barco[] = [];
  loading = true;
  error = '';

  constructor(private api: BarcoService, private router: Router){}

  ngOnInit(): void { this.refresh(); }

  refresh(){
    this.loading = true;
    this.api.getAll().subscribe({
      next: d => { this.barcos = d ?? []; this.loading = false; },
      error: () => { this.error = 'No se pudo cargar la lista.'; this.loading = false; }
    });
  }

  goNew(){ this.router.navigateByUrl('/admin/barcos/nuevo'); }
  goEdit(id: number){ this.router.navigateByUrl(`/admin/barcos/${id}/editar`); }

  remove(id: number){
    if(!confirm('¿Eliminar barco?')) return;
    this.api.remove(id).subscribe({
      next: () => this.refresh(),
      error: () => alert('No se pudo eliminar'),
    });
  }
}
